const db = require('../config/db');
const { sendBookingConfirmation } = require('./emailService');

/**
 * Unified Payment Service to handle both Advance and Final Bill verifications.
 * Uses strict transactions and ROW-LOCKING (FOR UPDATE) to prevent concurrency/double-verification bugs.
 */
async function processIncomingPayment({ amount, transactionId, source, rawText, io }) {
    console.log(`[PAYMENT-SERVICE] Processing ₹${amount} from ${source} (TXN: ${transactionId})`);

    // 0. Strict Keyword Check (Security)
    if (rawText) {
        const isCredit = /credited|received|deposited|added|transfer|Paid to|Success|Done|Confirmed|Received/i.test(rawText);
        if (!isCredit) {
            console.log(`[PAYMENT-SERVICE] ❌ Rejected: Text does not indicate a credit/deposit.`);
            return { matched: false, reason: 'Transaction text does not indicate a credit/deposit' };
        }
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Double Verification / UTR Duplicate check (Locked)
        if (transactionId) {
            const [dup1] = await conn.execute(
                'SELECT id FROM payments WHERE transaction_id = ? LIMIT 1 FOR UPDATE',
                [transactionId]
            );
            const [dup2] = await conn.execute(
                'SELECT id FROM bookings WHERE utr_number = ? LIMIT 1 FOR UPDATE',
                [transactionId]
            );

            if (dup1.length > 0 || dup2.length > 0) {
                console.log(`[PAYMENT-SERVICE] ⚠️ Duplicate transaction detected: ${transactionId}`);
                await conn.rollback();
                return { matched: false, reason: 'Duplicate transaction (UTR already used)' };
            }
        }

        // 2. Try to match as Advance Payment (Locked via FOR UPDATE)
        const [advanceMatches] = await conn.execute(`
            SELECT b.*, u.email as user_email, u.phone as user_phone
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.payment_verified = 0
              AND b.status = 'pending'
              AND b.expected_amount IS NOT NULL
              AND ABS(b.expected_amount - ?) < 1.1
            ORDER BY ABS(b.expected_amount - ?) ASC
            LIMIT 1
            FOR UPDATE
        `, [amount, amount]);

        if (advanceMatches.length > 0) {
            const booking = advanceMatches[0];
            const result = await handleMatch(conn, booking, amount, transactionId, 'advance', io);
            await conn.commit();
            return result;
        }

        // 3. Try to match as Final Bill (Locked via FOR UPDATE)
        const [finalMatches] = await conn.execute(`
            SELECT b.*, u.email as user_email, u.phone as user_phone
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.final_payment_verified = 0
              AND b.status IN ('confirmed', 'awaiting_final_payment', 'seated')
              AND b.final_bill_expected IS NOT NULL
              AND ABS(b.final_bill_expected - ?) < 1.1
            ORDER BY ABS(b.final_bill_expected - ?) ASC
            LIMIT 1
            FOR UPDATE
        `, [amount, amount]);

        if (finalMatches.length > 0) {
            const booking = finalMatches[0];
            const result = await handleMatch(conn, booking, amount, transactionId, 'final', io);
            await conn.commit();
            return result;
        }

        // 4. No match found -> Log unmatched record
        const fallbackTxnId = transactionId || `UNMATCHED-${Date.now()}`;
        await conn.execute(
            `INSERT INTO payments (booking_id, amount, method, status, transaction_id, created_at)
             VALUES (0, ?, ?, 'unmatched', ?, NOW())`,
            [amount, source === 'EMAIL' ? 'EMAIL' : 'UPI', fallbackTxnId]
        );

        await conn.commit();
        console.log(`[PAYMENT-SERVICE] ❓ Unmatched: ₹${amount} logged for review.`);
        return { matched: false, reason: 'No matching booking found for this amount' };

    } catch (err) {
        await conn.rollback();
        console.error('[PAYMENT-SERVICE] Transaction error:', err);
        throw err;
    } finally {
        conn.release();
    }
}

async function handleMatch(conn, booking, amount, transactionId, type, io) {
    const isAdvance = type === 'advance';
    const txnId = transactionId || `${isAdvance ? 'SMS' : 'FINAL'}-${Date.now()}`;
    // Ensure exact decimal precision — no floating-point rounding
    const exactAmount = parseFloat(Number(amount).toFixed(2));

    // Update Booking
    if (isAdvance) {
        await conn.execute(
            `UPDATE bookings SET payment_verified = 1, status = 'confirmed', utr_number = ?, adv_paid = ? WHERE id = ?`,
            [txnId, exactAmount, booking.id]
        );
    } else {
        // Final payment match — exact paisa precision
        const newFinalPaid = parseFloat((Number(booking.paid_amount || 0) + exactAmount).toFixed(2));
        
        // We calculate totalPaidOverall just for reference, but we DO NOT overwrite bill_amount. 
        // bill_amount was calculated at checkout and MUST represent the true cost of the meal.
        const totalPaidOverall = parseFloat((Number(booking.adv_paid || 0) + newFinalPaid).toFixed(2));

        console.log(`[PAYMENT-SERVICE] Updating Final Payment for #${booking.id}: newFinalPaid=₹${newFinalPaid} (Total Paid: ₹${totalPaidOverall}, True Bill: ₹${booking.bill_amount})`);

        await conn.execute(
            `UPDATE bookings SET final_payment_verified = 1, status = 'completed', paid_amount = ? WHERE id = ?`,
            [newFinalPaid, booking.id]
        );

        // Set table to available
        await conn.execute(
            'UPDATE restaurant_tables SET status = "available" WHERE table_name = ?',
            [booking.table_number]
        );
    }

    // Record Payment
    await conn.execute(
        `INSERT INTO payments (booking_id, amount, method, status, transaction_id, created_at)
         VALUES (?, ?, 'UPI', 'approved', ?, NOW())`,
        [booking.id, amount, txnId]
    );

    console.log(`[PAYMENT-SERVICE] ✅ Matched ${type.toUpperCase()} for Booking #${booking.id} (Ref: ${booking.booking_ref})`);

    // Notify Frontend
    if (io) {
        io.emit('booking_update', { 
            bookingId: booking.id, 
            status: isAdvance ? 'confirmed' : 'completed', 
            bookingRef: booking.booking_ref 
        });
        if (booking.user_id) {
            io.to(`user_${booking.user_id}`).emit('notification', {
                title: 'Payment Verified',
                message: `Your payment for ${booking.booking_ref} has been confirmed!`
            });
        }
    }

    // Send Email
    if (booking.user_email || booking.email) {
        const targetEmail = booking.user_email || booking.email;
        let pdfBuffer = null;

        try {
            if (!isAdvance) {
                const { generateBillPDF } = require('./pdfService');
                const [orders] = await conn.execute(`
                    SELECT o.id, d.name, d.price, o.quantity, o.total_price 
                    FROM orders o JOIN dishes d ON o.dish_id = d.id 
                    WHERE o.booking_id = ?
                `, [booking.id]);
                
                // In handleMatch, we update paid_amount in DB but `booking` object is the OLD snapshot.
                // We must update the `booking` object with the new final paid value.
                // We leave bill_amount intact since it reflects the true calculated cost.
                const newFinalPaid = parseFloat((Number(booking.paid_amount || 0) + exactAmount).toFixed(2));
                
                const updatedBooking = { ...booking, paid_amount: newFinalPaid };
                
                pdfBuffer = await generateBillPDF(updatedBooking, orders);
            }
        } catch (pdfErr) {
            console.error("[PAYMENT-SERVICE] PDF Generation failed:", pdfErr.message);
        }

        sendBookingConfirmation(targetEmail, {
            bookingRef: booking.booking_ref,
            date: new Date(booking.booking_date).toLocaleDateString(),
            time: booking.time_slot,
            table: booking.table_number,
            guests: booking.guests,
            amount: amount,
            type: type
        }, pdfBuffer).catch(e => console.error("[PAYMENT-SERVICE] Email failed:", e.message));
    }

    // Queue SMS via Android Gateway
    if (booking.user_phone || booking.phone) {
        const phone = booking.user_phone || booking.phone;
        const msg = isAdvance 
            ? `Hello! Your advance payment of ₹${amount} for Booking ${booking.booking_ref} at ${process.env.HOTEL_NAME || 'our restaurant'} is confirmed.`
            : `Hello! Your final payment of ₹${amount} for Booking ${booking.booking_ref} at ${process.env.HOTEL_NAME || 'our restaurant'} is confirmed. Thank you for dining with us!`;
        
        const { queueOutgoingSms } = require('./smsGatewayService');
        queueOutgoingSms(phone, msg).catch(e => console.error("[PAYMENT-SERVICE] SMS Queue failed:", e.message));
    }

    return { 
        matched: true, 
        bookingId: booking.id, 
        bookingRef: booking.booking_ref,
        type: type,
        amount: amount 
    };
}

module.exports = { processIncomingPayment };
