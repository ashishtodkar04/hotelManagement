const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { validate, schemas } = require('../middleware/validation');
const { sendBookingConfirmation } = require('../services/emailService');

// ── Single source of truth for tax rate (18% GST) ──
const TAX_RATE = 0.18;
const PAPERLESS_RATE = 0.001;

function requireAdmin(req, res, next) {
    if (req.session?.adminId) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin access required' });
}

function requireStaffOrAdmin(req, res, next) {
    if (req.session?.adminId || req.session?.staffId) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized: Staff or Admin access required' });
}

// Staff Login (ID Only)
router.post('/staff-login', async (req, res) => {
    try {
        const { staffId } = req.body;
        const [staff] = await db.execute('SELECT * FROM staff WHERE staff_id = ?', [staffId]);
        
        if (staff.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid Staff ID' });
        }

        req.session.staffId = staff[0].staff_id;
        req.session.staffName = staff[0].name;
        req.session.role = 'staff';

        return req.session.save(() => {
            res.json({ success: true, staff: { id: staff[0].staff_id, name: staff[0].name } });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Admin: Manage Staff
router.get('/staff', requireAdmin, async (req, res) => {
    try {
        const [staff] = await db.execute('SELECT * FROM staff ORDER BY id DESC');
        res.json({ success: true, staff });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/staff', requireAdmin, async (req, res) => {
    try {
        const { name, salary } = req.body;
        // Generate next ID: ST11001, ST11002...
        const [lastStaff] = await db.execute('SELECT staff_id FROM staff WHERE staff_id LIKE "ST%" ORDER BY id DESC LIMIT 1');
        let nextId = 'ST11001';
        if (lastStaff.length > 0 && lastStaff[0].staff_id) {
            const lastId = lastStaff[0].staff_id;
            const lastNum = parseInt(lastId.replace('ST', ''));
            if (!isNaN(lastNum)) {
                nextId = `ST${lastNum + 1}`;
            }
        }

        await db.execute('INSERT INTO staff (staff_id, name, salary) VALUES (?, ?, ?)', [nextId, name, Number(salary) || 0]);
        res.json({ success: true, staffId: nextId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.delete('/staff/:id', requireAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM staff WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/login', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({ 
        loggedIn: !!req.session?.adminId,
        isStaff: !!req.session?.staffId,
        staffName: req.session?.staffName || null,
        role: req.session?.role || (req.session?.adminId ? 'admin' : null)
    });
});

// Dedicated auth check — used by frontend's checkAdminAuth()
router.get('/check-auth', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({
        loggedIn: !!req.session?.adminId,
        isStaff:  !!req.session?.staffId,
        staffName: req.session?.staffName || null,
        role: req.session?.role || (req.session?.adminId ? 'admin' : null)
    });
});


router.post('/login', validate(schemas.adminLogin), (req, res) => {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    if (username === adminUser && password === adminPass) {
        req.session.adminId = username;
        req.session.role = 'admin';
        return req.session.save(() => {
            res.json({ success: true });
        });
    }

    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});

router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.adminId = null;
        req.session.staffId = null;
        req.session.role = null;
        req.session.save(() => {
            res.json({ success: true });
        });
    } else {
        res.json({ success: true });
    }
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        const [tables] = await db.execute('SELECT * FROM restaurant_tables ORDER BY id ASC');
        res.json({ success: true, tables });
    } catch (err) {
        console.error('Admin Page Error:', err);
        res.status(500).json({ success: false, error: 'Error loading admin panel' });
    }
});

router.get('/bookings', requireAdmin, async (req, res) => {
    try {
        const [bookings] = await db.execute(`
            SELECT
                b.id, b.guests, b.table_number, b.time_slot, b.booking_date, b.duration,
                b.status AS booking_status, b.utr_number, b.adv_paid, b.payment_verified,
                b.expected_amount, b.final_bill_expected,
                COALESCE(b.discount, 0) AS discount,
                COALESCE(orders.items, 'No orders') AS items,
                COALESCE(orders.subtotal, 0) AS subtotal,
                (COALESCE(orders.subtotal, 0) * ${TAX_RATE}) AS tax,
                IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * ${PAPERLESS_RATE}, 0) AS paperless_discount,
                (
                    COALESCE(orders.subtotal, 0) 
                    + (COALESCE(orders.subtotal, 0) * ${TAX_RATE}) 
                    - IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * ${PAPERLESS_RATE}, 0)
                    - COALESCE(b.discount, 0)
                ) AS total_payable,
                GREATEST(0, (
                    COALESCE(orders.subtotal, 0) 
                    + (COALESCE(orders.subtotal, 0) * ${TAX_RATE}) 
                    - IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * ${PAPERLESS_RATE}, 0)
                    - COALESCE(b.discount, 0) 
                    - COALESCE(b.adv_paid, 0)
                    - COALESCE(b.paid_amount, 0)
                )) AS remaining_due,
                CASE WHEN b.user_id = 0 OR b.user_id IS NULL THEN 'Walk-In Guest'
                     ELSE COALESCE(u.name, u.username, 'Guest') END AS user_name,
                COALESCE(pay.method, 'Pending') AS payment_method,
                COALESCE(orders.latest_order_status, 
                    CASE WHEN b.status = 'completed' THEN 'served' 
                         WHEN b.status = 'seated' THEN 'preparing' 
                         ELSE 'ordered' END) AS status,
                b.paid_amount, b.user_id
            FROM bookings b
            LEFT JOIN users u ON u.id = b.user_id AND b.user_id != 0
            LEFT JOIN (
                SELECT o.booking_id, 
                    GROUP_CONCAT(CONCAT(d.name, ' (x', o.quantity, ')') SEPARATOR '<br>') AS items,
                    SUM(o.total_price) AS subtotal,
                    SUBSTRING_INDEX(GROUP_CONCAT(o.order_status ORDER BY o.id DESC), ',', 1) AS latest_order_status
                FROM orders o LEFT JOIN dishes d ON o.dish_id = d.id GROUP BY o.booking_id
            ) orders ON orders.booking_id = b.id
            LEFT JOIN (
                SELECT booking_id, method FROM payments
                WHERE id IN (SELECT MAX(id) FROM payments GROUP BY booking_id)
            ) pay ON pay.booking_id = b.id
            WHERE DATE(b.booking_date) = CURDATE()
            ORDER BY b.time_slot ASC
        `);
        res.json({ success: true, bookings });
    } catch (err) {
        console.error('Admin Bookings Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


router.post('/add-table', requireAdmin, async (req, res) => {
    try {
        const { table_name, capacity } = req.body;
        if (!table_name) return res.status(400).json({ error: 'Table name required' });
        const [result] = await db.execute(
            'INSERT INTO restaurant_tables (table_name, capacity, status) VALUES (?, ?, ?)',
            [table_name, Number(capacity) || 4, 'available']
        );
        if (req.io) req.io.emit('table_update', { action: 'add' });
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Alias: frontend calls POST /api/admin/tables
router.post('/tables', requireAdmin, async (req, res) => {
    try {
        const { table_name, capacity } = req.body;
        if (!table_name) return res.status(400).json({ error: 'Table name required' });
        const [result] = await db.execute(
            'INSERT INTO restaurant_tables (table_name, capacity, status) VALUES (?, ?, ?)',
            [table_name, Number(capacity) || 4, 'available']
        );
        if (req.io) req.io.emit('table_update', { action: 'add' });
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.put('/tables/:id', requireAdmin, async (req, res) => {
    try {
        const { table_name, capacity } = req.body;
        if (!table_name) return res.status(400).json({ error: 'Table name required' });
        await db.execute(
            'UPDATE restaurant_tables SET table_name=?, capacity=? WHERE id=?',
            [table_name, Number(capacity) || 4, req.params.id]
        );
        if (req.io) req.io.emit('table_update', { action: 'edit', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/tables/:id', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT status FROM restaurant_tables WHERE id=?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Table not found' });
        if (rows[0].status === 'occupied') return res.status(400).json({ error: 'Cannot delete an occupied table' });
        await db.execute('DELETE FROM restaurant_tables WHERE id=?', [req.params.id]);
        if (req.io) req.io.emit('table_update', { action: 'delete', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/tables', requireStaffOrAdmin, async (req, res) => {
    try {
        const [tables] = await db.execute('SELECT * FROM restaurant_tables ORDER BY id ASC');
        res.json({ success: true, tables });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// All dishes for Walk-in POS menu picker (only available dishes)
router.get('/menu-items', requireStaffOrAdmin, async (req, res) => {
    try {
        const [dishes] = await db.execute(
            'SELECT id, name, price, category, image, type FROM dishes WHERE is_available = 1 ORDER BY category, name'
        );
        res.json({ success: true, dishes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/walk-in', requireStaffOrAdmin, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { table, guests, cart, staff_name } = req.body;
        
        const subtotal = (cart || []).reduce((sum, item) => sum + (item.price * item.qty), 0);
        const tax = subtotal * TAX_RATE; // Using 18% GST like everywhere else
        const totalBill = subtotal + tax;

        await conn.beginTransaction();

        // Check if there is an existing ACTIVE booking for this table today
        const [existing] = await conn.execute(
            `SELECT id, bill_amount, expected_amount FROM bookings 
             WHERE table_number = ? AND status IN ('seated', 'confirmed') AND DATE(booking_date) = CURDATE()`,
            [table]
        );

        let bookingId;
        let bookingRef;

        if (existing.length > 0) {
            // Append to existing booking
            bookingId = existing[0].id;
            bookingRef = `WALK-APPEND-${bookingId}`;
            
            await conn.execute(
                `UPDATE bookings SET bill_amount = bill_amount + ?, expected_amount = expected_amount + ?, status = 'seated' WHERE id = ?`,
                [totalBill, totalBill, bookingId]
            );
        } else {
            // Create new booking
            bookingRef = 'WALK-' + Math.floor(1000 + Math.random() * 9000);
            const [bRes] = await conn.execute(
                `INSERT INTO bookings 
                (booking_ref, user_id, booking_date, time_slot, duration, guests, table_number, status, adv_paid, payment_verified, expected_amount, bill_amount, staff_name) 
                VALUES (?, 0, CURDATE(), CURTIME(), 2, ?, ?, 'seated', 0, 0, ?, ?, ?)`,
                [bookingRef, Number(guests) || 2, table, totalBill, totalBill, staff_name || 'ADMIN']
            );
            bookingId = bRes.insertId;

            // Mark table as occupied
            await conn.execute('UPDATE restaurant_tables SET status="occupied" WHERE table_name=?', [table]);
        }

        if (cart && cart.length > 0) {
            // Verify all ordered dishes are available
            const dishIds = cart.map(i => Number(i.id)).filter(Boolean);
            if (dishIds.length > 0) {
                const [dishesCheck] = await conn.query("SELECT id, name, is_available FROM dishes WHERE id IN (?)", [dishIds]);
                for (const d of dishesCheck) {
                    if (d.is_available === 0) {
                        await conn.rollback();
                        return res.status(400).json({ success: false, error: `Dish "${d.name}" is currently out of stock / unavailable.` });
                    }
                }
            }

            const orderValues = cart.map(item => [
                bookingId, item.id, item.qty, item.price, item.qty * item.price, 'ordered'
            ]);
            await conn.query(
                "INSERT INTO orders (booking_id, dish_id, quantity, price_at_order, total_price, order_status) VALUES ?",
                [orderValues]
            );

            const { deductInventoryForOrders } = require('../services/inventoryService');
            await deductInventoryForOrders(cart.map(i => ({ dishId: i.id, quantity: i.qty })), conn);
        }

        // 💰 Record as 'pending' for manual admin verification
        await conn.execute(
            `INSERT INTO payments (booking_id, amount, method, status, transaction_id, created_at)
             VALUES (?, ?, 'Hard Cash', 'pending', ?, NOW())`,
            [bookingId, totalBill, `CASH-${bookingRef}-${Date.now().toString().slice(-4)}`]
        );

        await conn.commit();

        req.io.emit('order_update', { bookingId, status: 'ordered' });
        res.json({ success: true, bookingId, bookingRef, appended: existing.length > 0 });
    } catch (err) {
        await conn.rollback();
        console.error("Walk-in Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        conn.release();
    }
});


// ✅ 4. CHEF DASHBOARD ROUTES (Only shows today's active tickets)
router.get('/chef', requireStaffOrAdmin, (req, res) => {
    res.json({ success: true, message: 'Chef dashboard endpoint' });
});

router.get('/chef/data', requireStaffOrAdmin, async (req, res) => {
    try {
        const [orders] = await db.execute(`
            SELECT
                b.id AS booking_id,
                b.table_number,
                b.time_slot,
                b.status AS booking_status,
                COALESCE(u.name, b.staff_name, 'Walk-in Guest') AS user_name,
                o.id AS order_id,
                d.name AS dish_name,
                COALESCE(d.type, 'veg') AS dish_type,
                o.quantity,
                o.order_status,
                o.prep_start_time,
                o.prep_end_time
            FROM bookings b
            JOIN orders o ON b.id = o.booking_id
            JOIN dishes d ON o.dish_id = d.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE DATE(b.booking_date) = CURDATE()
              AND b.status IN ('confirmed', 'seated', 'awaiting_final_payment')
              AND o.order_status IN ('ordered', 'preparing', 'ready')
            ORDER BY b.time_slot ASC, o.id ASC
        `);

        // Group individual dishes by Table/Booking
        const kitchenTickets = {};
        orders.forEach(row => {
            if (!kitchenTickets[row.booking_id]) {
                kitchenTickets[row.booking_id] = {
                    id: row.booking_id,
                    booking_id: row.booking_id,
                    table_number: row.table_number,
                    time_slot: row.time_slot,
                    user_name: row.user_name,
                    status: row.order_status,
                    items: []
                };
            }
            // Update overall ticket status: if any item is 'ordered', ticket is 'pending'
            const ticket = kitchenTickets[row.booking_id];
            if (row.order_status === 'ordered') ticket.status = 'pending';
            else if (row.order_status === 'preparing' && ticket.status !== 'pending') ticket.status = 'preparing';

            ticket.items.push({
                order_id: row.order_id,
                name: row.dish_name,
                quantity: row.quantity,
                type: row.dish_type,
                status: row.order_status,
                prep_start_time: row.prep_start_time,
                prep_end_time: row.prep_end_time
            });
        });

        res.json({ success: true, tickets: Object.values(kitchenTickets) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/chef/update-order', requireStaffOrAdmin, async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) return res.status(400).json({ success: false, error: 'orderId and status required' });
        const validStatuses = ['ordered', 'preparing', 'ready', 'served'];
        if (!validStatuses.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
        
        if (status === 'preparing') {
            await db.execute('UPDATE orders SET order_status=?, prep_start_time=NOW() WHERE id=?', [status, orderId]);
        } else if (status === 'ready') {
            await db.execute('UPDATE orders SET order_status=?, prep_end_time=NOW() WHERE id=?', [status, orderId]);
        } else {
            await db.execute('UPDATE orders SET order_status=? WHERE id=?', [status, orderId]);
        }
        
        if (req.io) req.io.emit('order_update', { orderId, status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ 5. STANDARD UPDATE/DELETE ROUTES
router.post('/update-status', requireAdmin, validate(schemas.updateBookingStatus), async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { bookingId, status } = req.body;
        await conn.beginTransaction();

        if (status === 'completed') {
            const [check] = await conn.execute('SELECT payment_verified, final_payment_verified, final_bill_expected, paid_amount, user_id FROM bookings WHERE id = ?', [bookingId]);
            if (!check[0]) {
                await conn.rollback();
                return res.status(404).json({ error: "Booking not found" });
            }

            if (check[0].payment_verified === 0) {
                await conn.rollback();
                return res.status(400).json({ error: "Cannot mark completed. Advance payment is not verified!" });
            }

            const userId = check[0].user_id;

            const [data] = await conn.execute(`
                SELECT 
                    COALESCE(SUM(o.total_price), 0) as subtotal,
                    COALESCE(MAX(b.discount), 0) as special_discount,
                    COALESCE(MAX(b.adv_paid), 0) as adv_paid
                FROM bookings b
                LEFT JOIN orders o ON b.id = o.booking_id
                WHERE b.id = ?`,
                [bookingId]
            );

            const subtotal = parseFloat(Number(data[0].subtotal).toFixed(2));
            const specialDiscount = parseFloat(Number(data[0].special_discount).toFixed(2));
            const advPaid = parseFloat(Number(data[0].adv_paid).toFixed(2));
            
            // Calculate loyalty discount dynamically
            let loyaltyDiscount = 0;
            if (userId && userId !== 0) {
                const [countRes] = await conn.execute(`
                    SELECT (
                        SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'completed'
                    ) + (
                        SELECT COUNT(*) FROM booking_history WHERE user_id = ? AND status = 'completed'
                    ) AS completed_count
                `, [userId, userId]);
                const completedCount = countRes[0]?.completed_count || 0;

                const [historyData] = await conn.execute(`
                    SELECT CAST(COALESCE(SUM(bill_amount), 0) AS DECIMAL(10,2)) as total_spent
                    FROM booking_history
                    WHERE user_id = ? AND status = 'completed'`,
                    [userId]
                );
                const totalSpent = parseFloat(historyData[0]?.total_spent || 0);

                let spentPercent = 0;
                if (totalSpent > 50000) spentPercent = 0.10;
                else if (totalSpent > 15000) spentPercent = 0.05;
                else if (totalSpent > 5000) spentPercent = 0.02;

                let countPercent = completedCount > 10 ? 0.05 : 0.00;
                let maxPercent = Math.max(spentPercent, countPercent);
                loyaltyDiscount = parseFloat((subtotal * maxPercent).toFixed(2));
            }

            const finalDiscount = Math.max(specialDiscount, loyaltyDiscount);

            // Tax: 18% GST, Paperless: 0.1% for registered users
            const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
            const paperlessDiscount = (userId && userId !== 0) ? parseFloat((subtotal * PAPERLESS_RATE).toFixed(2)) : 0;
            const finalPaidPart = parseFloat(Number(check[0].paid_amount || 0).toFixed(2));
            const totalPaidOverall = parseFloat((advPaid + finalPaidPart).toFixed(2));
            const totalToPay = parseFloat(Math.max(0, (subtotal + tax) - finalDiscount - paperlessDiscount).toFixed(2));

            if (totalPaidOverall < (totalToPay - 1)) { 
                await conn.rollback();
                return res.status(400).json({ error: `Cannot mark completed. Total paid (₹${totalPaidOverall.toFixed(2)}) is less than total due (₹${totalToPay.toFixed(2)}).` });
            }

            await conn.execute(
                'UPDATE bookings SET status = ?, bill_amount = ?, discount = ?, final_payment_verified = 1 WHERE id = ?',
                [status, totalToPay, finalDiscount, bookingId]
            );
        } else {
            // If it is being cancelled, fetch previous status to check if we need to refund stock
            if (status === 'cancelled') {
                const [check] = await conn.execute("SELECT status FROM bookings WHERE id = ?", [bookingId]);
                const prevStatus = check[0]?.status;
                if (prevStatus && prevStatus !== 'cancelled' && prevStatus !== 'completed') {
                    const { cancelBookingsAndRestoreStock } = require('../services/inventoryService');
                    await cancelBookingsAndRestoreStock([bookingId], conn);
                }
            }
            await conn.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
        }

        if (status === 'cancelled') {
            const [bRow] = await conn.execute('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
            if (bRow[0] && bRow[0].user_id && bRow[0].user_id !== 0) {
                const userId = bRow[0].user_id;
                const [countRes] = await conn.execute(`
                    SELECT (
                        SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'cancelled'
                    ) + (
                        SELECT COUNT(*) FROM booking_history WHERE user_id = ? AND status = 'cancelled'
                    ) AS cancel_count
                `, [userId, userId]);

                const cancelCount = countRes[0]?.cancel_count || 0;
                if (cancelCount >= 3) {
                    await conn.execute('UPDATE users SET is_banned = 1 WHERE id = ?', [userId]);
                    
                    // Fetch bookings to cancel for this user (auto-cancel)
                    const [bookingsToCancel] = await conn.execute(
                        "SELECT id FROM bookings WHERE user_id = ? AND id != ? AND status NOT IN ('completed', 'cancelled')",
                        [userId, bookingId]
                    );
                    const bIds = bookingsToCancel.map(b => b.id);
                    if (bIds.length > 0) {
                        const { cancelBookingsAndRestoreStock } = require('../services/inventoryService');
                        await cancelBookingsAndRestoreStock(bIds, conn);
                        await conn.query(
                            "UPDATE bookings SET status = 'cancelled' WHERE id IN (?)",
                            [bIds]
                        );
                    }
                    console.log(`[AUTO-BAN] User ${userId} banned due to ${cancelCount} cancellations.`);
                }
            }
        }

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

router.post('/checkout', requireAdmin, async (req, res) => {
    const { bookingId, discount } = req.body;
    try {
        const [data] = await db.execute(`
            SELECT b.id, b.adv_paid, b.user_id, CAST(COALESCE(SUM(o.total_price), 0) AS DECIMAL(10,2)) as subtotal
            FROM bookings b
            LEFT JOIN orders o ON b.id = o.booking_id
            WHERE b.id = ?
            GROUP BY b.id`, [bookingId]
        );

        if (data.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const subtotal        = parseFloat(data[0].subtotal)          || 0;
        const advPaid         = parseFloat(data[0].adv_paid)          || 0;
        const userId          = data[0].user_id;
        const gst             = parseFloat((subtotal * TAX_RATE).toFixed(2));
        const paperlessDiscount = (userId && userId !== 0)
                                  ? parseFloat((subtotal * PAPERLESS_RATE).toFixed(2))
                                  : 0;

        // --- Loyalty & Retention Engine ---
        let loyaltyDiscount = 0;
        let loyaltyTier = 'None';
        let loyaltyBadge = false;
        if (userId && userId !== 0) {
            // Get completed bookings count from both active and historical tables
            const [countRes] = await db.execute(`
                SELECT (
                    SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'completed'
                ) + (
                    SELECT COUNT(*) FROM booking_history WHERE user_id = ? AND status = 'completed'
                ) AS completed_count
            `, [userId, userId]);
            
            const completedCount = countRes[0]?.completed_count || 0;
            if (completedCount > 10) {
                loyaltyBadge = true;
            }

            // Get all historical completed bookings spent for this user
            const [historyData] = await db.execute(`
                SELECT CAST(COALESCE(SUM(bill_amount), 0) AS DECIMAL(10,2)) as total_spent
                FROM booking_history
                WHERE user_id = ? AND status = 'completed'`,
                [userId]
            );
            const totalSpent = parseFloat(historyData[0]?.total_spent || 0);

            // Tier thresholds (adjust as needed)
            // Silver: > ₹5000 (2% off)
            // Gold: > ₹15000 (5% off)
            // Platinum: > ₹50000 (10% off)
            let spentPercent = 0;
            if (totalSpent > 50000) {
                spentPercent = 0.10;
            } else if (totalSpent > 15000) {
                spentPercent = 0.05;
            } else if (totalSpent > 5000) {
                spentPercent = 0.02;
            }

            // Count-based loyalty: > 10 completed bookings gives automatic 5% off
            let countPercent = completedCount > 10 ? 0.05 : 0.00;

            // Choose the max percentage
            let maxPercent = Math.max(spentPercent, countPercent);

            if (maxPercent === 0.10) {
                loyaltyTier = 'Platinum (10%)';
            } else if (maxPercent === 0.05) {
                loyaltyTier = completedCount > 10 ? 'Loyalty Tier (5%)' : 'Gold (5%)';
            } else if (maxPercent === 0.02) {
                loyaltyTier = 'Silver (2%)';
            }

            loyaltyDiscount = parseFloat((subtotal * maxPercent).toFixed(2));
        }
        // ----------------------------------

        const customDiscount  = parseFloat(Number(discount) || 0);
        const totalPayable    = parseFloat(
                                  Math.max(0, subtotal + gst - customDiscount - paperlessDiscount - loyaltyDiscount).toFixed(2)
                                );
        const finalBillDue    = parseFloat(Math.max(0, totalPayable - advPaid).toFixed(2));

        await db.execute(
            `UPDATE bookings
             SET status = 'awaiting_final_payment',
                 bill_amount      = ?,
                 final_bill_expected = ?,
                 discount         = ?
             WHERE id = ?`,
            [totalPayable, finalBillDue, customDiscount + loyaltyDiscount, bookingId]
        );

        res.json({
            success: true,
            breakdown: {
                subtotal,
                gst,
                paperlessDiscount,
                loyaltyDiscount,
                loyaltyTier,
                loyaltyBadge,
                customDiscount,
                totalPayable,
                advPaid,
                finalBillDue
            },
            finalBill: finalBillDue
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/checkout-preview/:id', requireAdmin, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const [data] = await db.execute(`
            SELECT b.id, b.adv_paid, b.user_id, CAST(COALESCE(SUM(o.total_price), 0) AS DECIMAL(10,2)) as subtotal
            FROM bookings b
            LEFT JOIN orders o ON b.id = o.booking_id
            WHERE b.id = ?
            GROUP BY b.id`, [bookingId]
        );

        if (data.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const subtotal        = parseFloat(data[0].subtotal)          || 0;
        const advPaid         = parseFloat(data[0].adv_paid)          || 0;
        const userId          = data[0].user_id;
        const gst             = parseFloat((subtotal * TAX_RATE).toFixed(2));
        const paperlessDiscount = (userId && userId !== 0)
                                  ? parseFloat((subtotal * PAPERLESS_RATE).toFixed(2))
                                  : 0;

        let loyaltyDiscount = 0;
        let loyaltyTier = 'None';
        let loyaltyBadge = false;
        if (userId && userId !== 0) {
            const [countRes] = await db.execute(`
                SELECT (
                    SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'completed'
                ) + (
                    SELECT COUNT(*) FROM booking_history WHERE user_id = ? AND status = 'completed'
                ) AS completed_count
            `, [userId, userId]);
            
            const completedCount = countRes[0]?.completed_count || 0;
            if (completedCount > 10) {
                loyaltyBadge = true;
            }

            const [historyData] = await db.execute(`
                SELECT CAST(COALESCE(SUM(bill_amount), 0) AS DECIMAL(10,2)) as total_spent
                FROM booking_history
                WHERE user_id = ? AND status = 'completed'`,
                [userId]
            );
            const totalSpent = parseFloat(historyData[0]?.total_spent || 0);

            let spentPercent = 0;
            if (totalSpent > 50000) {
                spentPercent = 0.10;
            } else if (totalSpent > 15000) {
                spentPercent = 0.05;
            } else if (totalSpent > 5000) {
                spentPercent = 0.02;
            }

            let countPercent = completedCount > 10 ? 0.05 : 0.00;
            let maxPercent = Math.max(spentPercent, countPercent);

            if (maxPercent === 0.10) {
                loyaltyTier = 'Platinum (10%)';
            } else if (maxPercent === 0.05) {
                loyaltyTier = completedCount > 10 ? 'Loyalty Tier (5%)' : 'Gold (5%)';
            } else if (maxPercent === 0.02) {
                loyaltyTier = 'Silver (2%)';
            }

            loyaltyDiscount = parseFloat((subtotal * maxPercent).toFixed(2));
        }

        res.json({
            success: true,
            subtotal,
            gst,
            paperlessDiscount,
            loyaltyDiscount,
            loyaltyTier,
            loyaltyBadge,
            advPaid
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/pay-at-counter', requireAdmin, async (req, res) => {
    const { bookingId } = req.body;
    try {
        const [rows] = await db.execute(`
            SELECT b.bill_amount, b.adv_paid, b.booking_ref, b.booking_date, b.time_slot, b.table_number, b.guests, u.email
            FROM bookings b 
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id=?`, [Number(bookingId)]
        );
        
        if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
        const booking = rows[0];

        // Calculate total target for this booking (including tax and discounts)
        const [billing] = await db.execute(`
            SELECT 
                COALESCE(SUM(o.total_price), 0) as subtotal,
                COALESCE(MAX(b.discount), 0) as discount,
                COALESCE(MAX(b.adv_paid), 0) as adv_paid,
                b.user_id
            FROM bookings b
            LEFT JOIN orders o ON b.id = o.booking_id
            WHERE b.id = ?`, [bookingId]);
        
        const b = billing[0];
        const subtotal = parseFloat(Number(b.subtotal).toFixed(2));
        const userId = b.user_id;

        // Calculate loyalty discount dynamically
        let loyaltyDiscount = 0;
        if (userId && userId !== 0) {
            const [countRes] = await db.execute(`
                SELECT (
                    SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'completed'
                ) + (
                    SELECT COUNT(*) FROM booking_history WHERE user_id = ? AND status = 'completed'
                ) AS completed_count
            `, [userId, userId]);
            const completedCount = countRes[0]?.completed_count || 0;

            const [historyData] = await db.execute(`
                SELECT CAST(COALESCE(SUM(bill_amount), 0) AS DECIMAL(10,2)) as total_spent
                FROM booking_history
                WHERE user_id = ? AND status = 'completed'`,
                [userId]
            );
            const totalSpent = parseFloat(historyData[0]?.total_spent || 0);

            let spentPercent = 0;
            if (totalSpent > 50000) spentPercent = 0.10;
            else if (totalSpent > 15000) spentPercent = 0.05;
            else if (totalSpent > 5000) spentPercent = 0.02;

            let countPercent = completedCount > 10 ? 0.05 : 0.00;
            let maxPercent = Math.max(spentPercent, countPercent);
            loyaltyDiscount = parseFloat((subtotal * maxPercent).toFixed(2));
        }

        const specialDiscount = Math.max(parseFloat(b.discount || 0), loyaltyDiscount);
        const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
        const paperlessDiscount = (userId && userId !== 0) ? parseFloat((subtotal * PAPERLESS_RATE).toFixed(2)) : 0;
        const totalToPay = parseFloat(Math.max(0, (subtotal + tax) - specialDiscount - paperlessDiscount).toFixed(2));
        
        // When paying at counter, the remaining balance is paid as cash
        const remainingBalance = Math.max(0, totalToPay - Number(b.adv_paid));

        await db.execute(
            'UPDATE bookings SET status = "completed", final_payment_verified = 1, paid_amount = ?, bill_amount = ?, discount = ? WHERE id = ?',
            [remainingBalance, totalToPay, specialDiscount, bookingId]
        );

        // ✅ Free the table
        await db.execute('UPDATE restaurant_tables SET status="available" WHERE table_name=?', [booking.table_number]);

        if (booking.email) {
            let pdfBuffer = null;
            try {
                const { generateBillPDF } = require('../services/pdfService');
                const [orders] = await db.execute(`
                    SELECT o.id, d.name, d.price, o.quantity, o.total_price 
                    FROM orders o JOIN dishes d ON o.dish_id = d.id 
                    WHERE o.booking_id = ?
                `, [bookingId]);
                
                const updatedBooking = { ...booking, paid_amount: remainingBalance, bill_amount: totalToPay };
                pdfBuffer = await generateBillPDF(updatedBooking, orders);
            } catch (pdfErr) {
                console.error("[PAYMENT-SERVICE] PDF Generation failed:", pdfErr.message);
            }

            sendBookingConfirmation(booking.email, {
                bookingRef: booking.booking_ref,
                date: new Date(booking.booking_date).toLocaleDateString(),
                time: booking.time_slot,
                table: booking.table_number,
                guests: booking.guests,
                amount: totalToPay,
                type: 'final'
            }, pdfBuffer).catch(e => console.error("[EMAIL-SERVICE] Pay at counter email failure:", e.message));
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/update-table', requireAdmin, async (req, res) => {
    try {
        const { id, table_name, status } = req.body;
        if (id) {
            await db.execute('UPDATE restaurant_tables SET status=? WHERE id=?', [status, Number(id)]);
        } else {
            await db.execute('UPDATE restaurant_tables SET status=? WHERE table_name=?', [status, table_name]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const bookingId = Number(req.params.id);
        await conn.beginTransaction();

        const [bRow] = await conn.execute("SELECT status FROM bookings WHERE id = ?", [bookingId]);
        const bookingStatus = bRow[0]?.status;
        if (bookingStatus && bookingStatus !== 'completed' && bookingStatus !== 'cancelled') {
            const { cancelBookingsAndRestoreStock } = require('../services/inventoryService');
            await cancelBookingsAndRestoreStock([bookingId], conn);
        }

        await conn.execute('DELETE FROM orders WHERE booking_id=?', [bookingId]);
        await conn.execute('DELETE FROM bookings WHERE id=?', [bookingId]);
        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, error: err.message });
    } finally {
        conn.release();
    }
});

router.get('/print-bill/:bookingId', requireAdmin, async (req, res) => {
    try {
        const { bookingId } = req.params;
        // Search in both bookings and booking_history
        const [bookings] = await db.execute(`
            SELECT b.id, b.user_id, b.booking_ref, b.booking_date, b.time_slot, b.guests, b.table_number, 
                   b.status, b.adv_paid, b.bill_amount, b.paid_amount, b.discount, b.staff_name,
                   u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?
            UNION ALL
            SELECT bh.id, bh.user_id, bh.booking_ref, bh.booking_date, bh.time_slot, bh.guests, bh.table_number, 
                   bh.status, bh.adv_paid, bh.bill_amount, bh.paid_amount, bh.discount, bh.staff_name,
                   u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM booking_history bh LEFT JOIN users u ON bh.user_id = u.id WHERE bh.id = ?
        `, [bookingId, bookingId]);

        if (bookings.length === 0) return res.status(404).json({ success: false, error: 'Booking not found' });
        const booking = bookings[0];

        const [orders] = await db.execute(`
            SELECT o.id, d.name, d.price, o.quantity, o.total_price 
            FROM orders o JOIN dishes d ON o.dish_id = d.id 
            WHERE o.booking_id = ?
        `, [bookingId]);

        res.json({ success: true, booking, orders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/verify-payment', requireAdmin, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { bookingId, status } = req.body;
        const [rows] = await conn.execute(`
            SELECT b.status, b.adv_paid, b.expected_amount, b.final_bill_expected, b.booking_ref, b.booking_date, b.time_slot, b.table_number, b.guests, u.email
            FROM bookings b 
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id=?`, [Number(bookingId)]
        );
        
        if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = rows[0];
        const isApproved = status === 'approve';
        const amt = Number(booking.expected_amount || 0);
        const isFinalMode = booking.status === 'awaiting_final_payment' || booking.status === 'seated';

        await conn.beginTransaction();

        if (isFinalMode) {
            // Manual verification of Final Payment
            await conn.execute(
                `UPDATE bookings SET final_payment_verified=?, status=?, paid_amount=? WHERE id=?`,
                [isApproved ? 1 : 0, isApproved ? 'completed' : booking.status, isApproved ? (booking.final_bill_expected || 0) : 0, Number(bookingId)]
            );
            if (isApproved) {
                await conn.execute('UPDATE restaurant_tables SET status="available" WHERE table_name=?', [booking.table_number]);
            }
        } else {
            // Manual verification of Advance Payment
            await conn.execute(
                `UPDATE bookings SET payment_verified=?, status=?, adv_paid=? WHERE id=?`,
                [isApproved ? 1 : 0, isApproved ? 'confirmed' : 'pending', isApproved ? amt : 0, Number(bookingId)]
            );
        }

        await conn.execute(
            `UPDATE payments SET status=? WHERE booking_id=? AND status='pending'`,
            [isApproved ? 'approved' : 'rejected', Number(bookingId)]
        );

        await conn.commit();

        if (isApproved && booking.email) {
            let pdfBuffer = null;
            try {
                if (isFinalMode) {
                    const { generateBillPDF } = require('../services/pdfService');
                    const [orders] = await conn.execute(`
                        SELECT o.id, d.name, d.price, o.quantity, o.total_price 
                        FROM orders o JOIN dishes d ON o.dish_id = d.id 
                        WHERE o.booking_id = ?
                    `, [bookingId]);
                    
                    const totalPaid = (booking.final_bill_expected || 0) + (booking.adv_paid || 0);
                    const updatedBooking = { ...booking, paid_amount: (booking.final_bill_expected || 0), bill_amount: totalPaid, id: bookingId };
                    pdfBuffer = await generateBillPDF(updatedBooking, orders);
                }
            } catch (pdfErr) {
                console.error("[PAYMENT-SERVICE] PDF Generation failed:", pdfErr.message);
            }

            sendBookingConfirmation(booking.email, {
                bookingRef: booking.booking_ref,
                date: new Date(booking.booking_date).toLocaleDateString(),
                time: booking.time_slot,
                table: booking.table_number,
                guests: booking.guests,
                amount: isFinalMode ? (booking.final_bill_expected || 0) : amt,
                type: isFinalMode ? 'final' : 'advance'
            }, pdfBuffer).catch(e => console.error("[EMAIL-SERVICE] Manual verification email failure:", e.message));
        }

        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, error: err.message });
    } finally {
        conn.release();
    }
});

// ✅ 6. HISTORICAL DATA & STATS
router.get('/history', requireAdmin, async (req, res) => {
    try {
        const [bookings] = await db.execute(`
            SELECT b.id, b.user_id, b.booking_ref, b.booking_date, b.time_slot, b.duration, b.guests, b.table_number, b.status, b.adv_paid, b.payment_verified, b.final_payment_verified, b.expected_amount, b.bill_amount, b.final_bill_expected, b.paid_amount, b.discount, b.utr_number, b.payment_method, b.staff_name, b.created_at, u.username as user_name 
            FROM bookings b 
            LEFT JOIN users u ON b.user_id = u.id 
            UNION ALL
            SELECT bh.id, bh.user_id, bh.booking_ref, bh.booking_date, bh.time_slot, bh.duration, bh.guests, bh.table_number, bh.status, bh.adv_paid, bh.payment_verified, bh.final_payment_verified, bh.expected_amount, bh.bill_amount, bh.final_bill_expected, bh.paid_amount, bh.discount, bh.utr_number, bh.payment_method, bh.staff_name, bh.created_at, u.username as user_name 
            FROM booking_history bh 
            LEFT JOIN users u ON bh.user_id = u.id 
            ORDER BY booking_date DESC, time_slot DESC 
            LIMIT 500
        `);
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const [dailyRevenue] = await db.execute(`
            SELECT booking_date, CAST(SUM(bill_amount) AS DECIMAL(10,2)) as revenue 
            FROM (
                SELECT booking_date, bill_amount, status FROM bookings
                UNION ALL
                SELECT booking_date, bill_amount, status FROM booking_history
            ) all_bookings
            WHERE status = 'completed' AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY booking_date 
            ORDER BY booking_date ASC
        `);
        
        const [popularDishes] = await db.execute(`
            SELECT d.name, SUM(o.quantity) as count 
            FROM orders o 
            JOIN dishes d ON o.dish_id = d.id 
            GROUP BY d.id 
            ORDER BY count DESC 
            LIMIT 5
        `);

        // Today's detailed financial breakdown
        const [todayRevenue] = await db.execute(`
            SELECT 
                SUM(CASE WHEN method = 'UPI' AND status = 'approved' THEN amount ELSE 0 END) as online,
                SUM(CASE WHEN method = 'Hard Cash' AND status = 'approved' THEN amount ELSE 0 END) as cash
            FROM payments 
            WHERE DATE(created_at) = CURDATE()
        `);

        const [todayBookings] = await db.execute(`
            SELECT 
                SUM(CASE WHEN user_id = 0 OR user_id IS NULL THEN 1 ELSE 0 END) as walkin,
                SUM(CASE WHEN user_id > 0 THEN 1 ELSE 0 END) as online
            FROM bookings 
            WHERE DATE(booking_date) = CURDATE()
        `);

        const [busiestHours] = await db.execute(`
            SELECT HOUR(time_slot) as hour, COUNT(*) as count 
            FROM (
                SELECT time_slot FROM bookings
                UNION ALL
                SELECT time_slot FROM booking_history
            ) all_slots
            WHERE time_slot IS NOT NULL
            GROUP BY HOUR(time_slot) 
            ORDER BY count DESC 
            LIMIT 5
        `);

        res.json({ 
            success: true, 
            dailyRevenue, 
            popularDishes,
            busiestHours,
            todayStats: {
                onlineRevenue: todayRevenue[0].online || 0,
                cashRevenue: todayRevenue[0].cash || 0,
                walkInCount: todayBookings[0].walkin || 0,
                onlineBookingCount: todayBookings[0].online || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/payments', requireAdmin, async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT p.*, b.booking_ref, b.status as booking_status, u.name as user_name
            FROM payments p
            LEFT JOIN (
                SELECT id, booking_ref, status, user_id FROM bookings
                UNION ALL
                SELECT id, booking_ref, status, user_id FROM booking_history
            ) b ON p.booking_id = b.id
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 100
        `);
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/search-customer', requireAdmin, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ success: false, error: 'Search query required' });

        // 1. Search for Users
        const [users] = await db.execute(`
            SELECT id, name, username, email, phone, is_banned, created_at 
            FROM users 
            WHERE id = ? OR email LIKE ? OR phone LIKE ? OR name LIKE ? OR username LIKE ?
        `, [query, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);

        // 2. Search for Bookings
        const [bookings] = await db.execute(`
            SELECT b.id, b.user_id, b.booking_ref, b.booking_date, b.time_slot, b.duration, b.guests, b.table_number, b.status, b.adv_paid, b.payment_verified, b.final_payment_verified, b.expected_amount, b.bill_amount, b.final_bill_expected, b.paid_amount, b.discount, b.utr_number, b.payment_method, b.staff_name, b.created_at, u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = ? OR b.booking_ref LIKE ? OR b.user_id = ?
            UNION ALL
            SELECT bh.id, bh.user_id, bh.booking_ref, bh.booking_date, bh.time_slot, bh.duration, bh.guests, bh.table_number, bh.status, bh.adv_paid, bh.payment_verified, bh.final_payment_verified, bh.expected_amount, bh.bill_amount, bh.final_bill_expected, bh.paid_amount, bh.discount, bh.utr_number, bh.payment_method, bh.staff_name, bh.created_at, u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM booking_history bh
            LEFT JOIN users u ON bh.user_id = u.id
            WHERE bh.id = ? OR bh.booking_ref LIKE ? OR bh.user_id = ?
            ORDER BY booking_date DESC
        `, [query, `%${query}%`, query, query, `%${query}%`, query]);

        // 3. Get Orders for results
        let orders = [];
        const bIds = bookings.map(b => b.id);
        if (bIds.length > 0) {
            const [orderRows] = await db.execute(`
                SELECT o.*, d.name as dish_name
                FROM orders o
                JOIN dishes d ON o.dish_id = d.id
                WHERE o.booking_id IN (${bIds.join(',')})
            `);
            orders = orderRows;
        }

        res.json({ success: true, users, bookings, orders });
    } catch (err) {
        console.error('Admin Search Error:', err);
        res.status(500).json({ success: false, error: 'Search sequence interrupted.' });
    }
});

router.post('/users/:id/toggle-ban', requireAdmin, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const userId = Number(req.params.id);
        await conn.beginTransaction();

        const [user] = await conn.execute('SELECT is_banned FROM users WHERE id = ?', [userId]);
        if (!user[0]) {
            await conn.rollback();
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const nextBanStatus = user[0].is_banned ? 0 : 1;
        await conn.execute('UPDATE users SET is_banned = ? WHERE id = ?', [nextBanStatus, userId]);

        if (nextBanStatus === 1) {
            // Find all active bookings for this user
            const [activeBookings] = await conn.execute(
                "SELECT id FROM bookings WHERE user_id = ? AND status NOT IN ('completed', 'cancelled')",
                [userId]
            );
            const bIds = activeBookings.map(b => b.id);
            if (bIds.length > 0) {
                const { cancelBookingsAndRestoreStock } = require('../services/inventoryService');
                await cancelBookingsAndRestoreStock(bIds, conn);
                await conn.query(
                    "UPDATE bookings SET status = 'cancelled' WHERE id IN (?)",
                    [bIds]
                );
            }
        }

        await conn.commit();
        res.json({ success: true, is_banned: nextBanStatus });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, error: err.message });
    } finally {
        conn.release();
    }
});


// ✅ 7. DISH MANAGEMENT (CRUD)
router.get('/dishes', requireAdmin, async (req, res) => {
    try {
        const [dishes] = await db.execute('SELECT * FROM dishes ORDER BY category ASC, name ASC');
        res.json({ success: true, dishes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/dishes', requireAdmin, validate(schemas.dish), async (req, res) => {
    try {
        const { name, price, category, image, description, type } = req.body;
        const [result] = await db.execute(
            'INSERT INTO dishes (name, price, category, image, description, type, is_available) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [name, price, category, image || '', description || '', type || 'veg']
        );
        if (req.io) req.io.emit('dish_update', { action: 'add', id: result.insertId });
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/dishes/:id', requireAdmin, validate(schemas.dish), async (req, res) => {
    try {
        const { name, price, category, image, description, type } = req.body;
        await db.execute(
            'UPDATE dishes SET name=?, price=?, category=?, image=?, description=?, type=? WHERE id=?',
            [name, price, category, image || '', description || '', type || 'veg', req.params.id]
        );
        if (req.io) req.io.emit('dish_update', { action: 'edit', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ Toggle dish availability (admin only)
router.patch('/dishes/:id/availability', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT is_available FROM dishes WHERE id=?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Dish not found' });
        const newStatus = rows[0].is_available ? 0 : 1;
        await db.execute('UPDATE dishes SET is_available=? WHERE id=?', [newStatus, req.params.id]);
        if (req.io) req.io.emit('dish_update', { action: 'availability', id: req.params.id, is_available: newStatus });
        res.json({ success: true, is_available: newStatus });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/dishes/:id', requireAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM dishes WHERE id=?', [req.params.id]);
        if (req.io) req.io.emit('dish_update', { action: 'delete', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ 8. WAREHOUSE MANAGEMENT (CRUD + Stock Status)
router.get('/warehouse', requireStaffOrAdmin, async (req, res) => {
    try {
        const [items] = await db.execute('SELECT * FROM warehouse ORDER BY date DESC, id DESC');
        res.json({ success: true, items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/warehouse', requireAdmin, validate(schemas.warehouse), async (req, res) => {
    try {
        const { name, type, quantity, unit, cost, date, added_by } = req.body;
        const [result] = await db.execute(
            'INSERT INTO warehouse (name, type, quantity, unit, cost, date, added_by, stock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, type, quantity || 0, unit || '', cost, date, added_by || req.session.adminId, 'in_stock']
        );
        if (req.io) req.io.emit('warehouse_update', { action: 'add', id: result.insertId });
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/warehouse/:id', requireAdmin, validate(schemas.warehouse), async (req, res) => {
    try {
        const { name, type, quantity, unit, cost, date, added_by } = req.body;
        await db.execute(
            'UPDATE warehouse SET name=?, type=?, quantity=?, unit=?, cost=?, date=?, added_by=? WHERE id=?',
            [name, type, quantity || 0, unit || '', cost, date, added_by || req.session.adminId, req.params.id]
        );
        if (req.io) req.io.emit('warehouse_update', { action: 'edit', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ Cycle stock status: in_stock → low_stock → out_of_stock → in_stock
router.patch('/warehouse/:id/stock-status', requireAdmin, async (req, res) => {
    try {
        const { stock_status } = req.body;
        const valid = ['in_stock', 'low_stock', 'out_of_stock'];
        if (!valid.includes(stock_status)) return res.status(400).json({ error: 'Invalid stock status' });
        await db.execute('UPDATE warehouse SET stock_status=? WHERE id=?', [stock_status, req.params.id]);
        if (req.io) req.io.emit('warehouse_update', { action: 'stock', id: req.params.id, stock_status });
        res.json({ success: true, stock_status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/warehouse/:id', requireAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM warehouse WHERE id=?', [req.params.id]);
        if (req.io) req.io.emit('warehouse_update', { action: 'delete', id: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ 9. MONTHLY AUDIT STATS
router.get('/stats/monthly-audit', requireAdmin, async (req, res) => {
    try {
        // Detailed Monthly Revenue
        const [revenue] = await db.execute(`
            SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') as month,
                CAST(SUM(bill_amount) AS DECIMAL(10,2)) as total_revenue,
                CAST(SUM(CASE WHEN user_id = 0 OR user_id IS NULL THEN bill_amount ELSE 0 END) AS DECIMAL(10,2)) as walkin_revenue,
                CAST(SUM(CASE WHEN user_id > 0 THEN bill_amount ELSE 0 END) AS DECIMAL(10,2)) as online_revenue,
                COUNT(*) as total_bookings
            FROM (
                SELECT booking_date, bill_amount, user_id, status FROM bookings
                UNION ALL
                SELECT booking_date, bill_amount, user_id, status FROM booking_history
            ) all_bookings
            WHERE status = 'completed'
            GROUP BY month
            ORDER BY month ASC
        `);

        // Detailed Monthly Costs (Warehouse + Staff Salaries)
        const [[staffSalarySum]] = await db.execute('SELECT SUM(salary) as total_salary FROM staff');
        const monthlyStaffSalary = Number(staffSalarySum.total_salary || 0);

        const [costs] = await db.execute(`
            SELECT 
                DATE_FORMAT(date, '%Y-%m') as month,
                SUM(cost) + ? as total_cost,
                SUM(CASE WHEN type = 'grocery' THEN cost ELSE 0 END) as grocery_cost,
                SUM(CASE WHEN type = 'commodity' THEN cost ELSE 0 END) as commodity_cost,
                SUM(CASE WHEN type = 'utility' THEN cost ELSE 0 END) as utility_cost,
                ? as staff_cost
            FROM warehouse
            GROUP BY month
            ORDER BY month ASC
        `, [monthlyStaffSalary, monthlyStaffSalary]);


        res.json({ success: true, revenue, costs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ 12. OUTGOING SMS GATEWAY (For Android App)
router.get('/outgoing-sms', requireStaffOrAdmin, async (req, res) => {
    try {
        const [smsList] = await db.execute('SELECT * FROM outgoing_sms WHERE status = "pending" ORDER BY created_at ASC LIMIT 10');
        res.json({ success: true, sms: smsList });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/outgoing-sms/:id/sent', requireStaffOrAdmin, async (req, res) => {
    try {
        await db.execute('UPDATE outgoing_sms SET status = "sent" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/send-sms', requireStaffOrAdmin, async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });
        
        const { queueOutgoingSms } = require('../services/smsGatewayService');
        const queued = await queueOutgoingSms(phone, message);
        
        if (queued) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Failed to queue SMS' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
