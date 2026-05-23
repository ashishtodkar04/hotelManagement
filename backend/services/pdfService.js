const PDFDocument = require('pdfkit');
const { HOTEL_NAME, HOTEL_PHONE, HOTEL_YEAR } = require('../config/hotel');

/**
 * Generates an automated PDF invoice in memory.
 * @param {Object} booking 
 * @param {Array} orders 
 * @returns {Promise<Buffer>}
 */
function generateBillPDF(booking, orders) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // ─── Header ───
            doc.font('Helvetica-Bold')
               .fontSize(24)
               .text(HOTEL_NAME.toUpperCase(), { align: 'center' });
            
            doc.font('Helvetica')
               .fontSize(10)
               .text(`Phone: ${HOTEL_PHONE} | Email: info@${HOTEL_NAME.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`, { align: 'center' })
               .text('GSTIN: 27AABCU9603R1ZX', { align: 'center' })
               .moveDown(2);
            
            // ─── Booking Info ───
            const top = doc.y;
            
            // Left Column
            doc.font('Helvetica-Bold').text('Bill No:', 50, top)
               .font('Helvetica').text(booking.id.toString(), 120, top);
            doc.font('Helvetica-Bold').text('Ref No:', 50, top + 15)
               .font('Helvetica').text(booking.booking_ref, 120, top + 15);
            doc.font('Helvetica-Bold').text('Date:', 50, top + 30)
               .font('Helvetica').text(`${new Date(booking.booking_date).toLocaleDateString()} ${booking.time_slot}`, 120, top + 30);
            
            // Right Column
            doc.font('Helvetica-Bold').text('Customer:', 350, top)
               .font('Helvetica').text(booking.user_name || booking.email || 'Guest', 420, top);
            doc.font('Helvetica-Bold').text('Table:', 350, top + 15)
               .font('Helvetica').text(booking.table_number.toString(), 420, top + 15);
            doc.font('Helvetica-Bold').text('Guests:', 350, top + 30)
               .font('Helvetica').text(booking.guests.toString(), 420, top + 30);

            doc.moveDown(3);

            // ─── Table Header ───
            let currentY = doc.y;
            doc.rect(50, currentY, 500, 20).fill('#f1f5f9');
            doc.fillColor('#000000').font('Helvetica-Bold');
            doc.text('Item Description', 60, currentY + 5);
            doc.text('Qty', 300, currentY + 5, { width: 50, align: 'center' });
            doc.text('Rate', 360, currentY + 5, { width: 80, align: 'right' });
            doc.text('Amount', 450, currentY + 5, { width: 80, align: 'right' });
            currentY += 25;

            // ─── Table Rows ───
            doc.font('Helvetica');
            let subtotal = 0;
            orders.forEach(item => {
                subtotal += Number(item.total_price);
                doc.text(item.name || item.dish_name, 60, currentY);
                doc.text(item.quantity.toString(), 300, currentY, { width: 50, align: 'center' });
                doc.text(`Rs. ${Number(item.price).toFixed(2)}`, 360, currentY, { width: 80, align: 'right' });
                doc.text(`Rs. ${Number(item.total_price).toFixed(2)}`, 450, currentY, { width: 80, align: 'right' });
                currentY += 20;
            });

            // ─── Totals ───
            currentY += 10;
            doc.moveTo(350, currentY).lineTo(540, currentY).stroke();
            currentY += 10;

            const tax = subtotal * 0.18;
            const discount = Number(booking.discount || 0);
            const paperlessDiscount = (booking.user_id && booking.user_id !== 0) ? (subtotal * 0.001) : 0;
            const totalBill = Number(booking.bill_amount) || Math.max(0, subtotal + tax - discount - paperlessDiscount);
            
            const printLine = (label, value, y, isBold = false) => {
                doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
                doc.text(label, 350, y);
                doc.text(`Rs. ${value.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
            };

            printLine('Subtotal:', subtotal, currentY); currentY += 15;
            printLine('GST (18%):', tax, currentY); currentY += 15;
            
            if (discount > 0) {
                printLine('Discount:', -discount, currentY); currentY += 15;
            }
            if (paperlessDiscount > 0) {
                printLine('Digital Rebate:', -paperlessDiscount, currentY); currentY += 15;
            }

            currentY += 5;
            doc.moveTo(350, currentY).lineTo(540, currentY).stroke();
            currentY += 10;

            printLine('Grand Total:', totalBill, currentY, true); currentY += 20;

            const advPaid = Number(booking.adv_paid || 0);
            const paidAmount = Number(booking.paid_amount || 0);
            const totalPaid = advPaid + paidAmount;

            printLine('Amount Paid:', -totalPaid, currentY); currentY += 15;

            currentY += 5;
            doc.moveTo(350, currentY).lineTo(540, currentY).stroke();
            currentY += 10;

            const dueAmount = Math.max(0, totalBill - totalPaid);
            if (dueAmount > 0) {
                doc.fillColor('#ef4444');
                printLine('Amount Due:', dueAmount, currentY, true);
            } else {
                doc.fillColor('#10b981');
                doc.font('Helvetica-Bold');
                doc.text('STATUS: PAID IN FULL', 350, currentY, { width: 180, align: 'right' });
            }

            // ─── Footer ───
            doc.fillColor('#94a3b8').font('Helvetica');
            doc.text('Thank You for Dining With Us!', 50, 700, { align: 'center' });
            doc.text('This is an automated system generated invoice.', 50, 715, { align: 'center' });
            doc.text(`© ${HOTEL_YEAR} ${HOTEL_NAME}. All rights reserved.`, 50, 730, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateBillPDF };
