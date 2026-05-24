const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { validate, schemas } = require('../middleware/validation');
const { sendBookingConfirmation, sendRegistrationEmail } = require('../services/emailService');
const { processIncomingPayment } = require('../services/paymentService');

const bcrypt = require('bcrypt');
const { spawn } = require('child_process');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const os = require('os');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const storage = multer.diskStorage({
    destination: './public/uploads/screenshots/',
    filename: (req, file, cb) => {
        cb(null, 'pay-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


function requireUser(req, res, next) {
    if (req.session?.user?.id) return next();
    return res.status(401).json({ success: false, error: 'User not logged in' });
}

function validateRegister(req, res, next) {
    const { email, password, phone, username } = req.body;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email" });
    }

    if (!validator.isLength(password, { min: 6 })) {
        return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    if (!validator.isMobilePhone(phone + '', 'any')) {
        return res.status(400).json({ success: false, error: "Invalid phone number" });
    }

    if (!validator.isAlphanumeric(username)) {
        return res.status(400).json({ success: false, error: "Username must be alphanumeric" });
    }

    next();
};

function validateBooking(req, res, next) {
    const { date, time, guests } = req.body;

    if (!date || !time) {
        return res.status(400).json({ error: "Missing date/time" });
    }

    if (isNaN(guests) || guests <= 0) {
        return res.status(400).json({ error: "Invalid guest count" });
    }

    next();
};



const { HOTEL_NAME, HOTEL_TAGLINE, HOTEL_PHONE } = require('../config/hotel');
router.get('/hotel-config', (req, res) => {
    res.json({
        success: true,
        hotelName: HOTEL_NAME,
        tagline: HOTEL_TAGLINE,
        phone: HOTEL_PHONE,
        upiId: process.env.UPI_ID || ""
    });
});

router.post('/api/recommendations', (req, res) => {
    const userId = req.session?.user?.id || 0;

    // Removed logging

    const py = spawn('python', ['python/recommendation.py', String(userId)]);

    let data = '';

    py.stdout.on('data', (chunk) => {
        data += chunk.toString();
    });

    py.stderr.on('data', (err) => {
        console.error("Python error:", err.toString());
    });

    py.on('close', () => {
        try {
            const jsonStr = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1);
            const result = JSON.parse(jsonStr);
            res.json(result);
        } catch (e) {
            console.error("Failed to parse python output:", data);
            res.status(500).json({ error: "Recommendation engine failed" });
        }
    });
});

router.get('/api/recommend/:userId', (req, res) => {
    const userId = req.params.userId || 0;
    const py = spawn('python', ['python/recommendation.py', String(userId)]);
    let data = '';
    py.stdout.on('data', (chunk) => { data += chunk.toString(); });
    py.on('close', () => {
        try {
            const jsonStr = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1);
            const result = JSON.parse(jsonStr);
            // Return spreading result to match frontend expectation of res.data.combo
            res.json({ success: true, ...result });
        } catch (e) {
            console.error("Python Output Error:", data);
            res.json({ success: false, combo: {} });
        }
    });
});


// show page (No longer needed in API, frontend handles it, but keep for compatibility)
router.get('/auth', (req, res) => {
    res.json({ success: true, message: 'Auth endpoint' });
});

router.get('/about', (req, res) => {
    res.json({ success: true, message: 'About endpoint' });
});

// login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const [users] = await db.execute(
            "SELECT * FROM users WHERE email=? OR username=? OR phone=?",
            [identifier, identifier, identifier]
        );

        if (users.length === 0) return res.status(401).json({ success: false, error: "User not found" });

        if (users[0].is_banned === 1) {
            return res.status(403).json({ success: false, error: "Your account has been suspended due to inappropriate behavior or excessive cancellations." });
        }

        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) return res.status(401).json({ success: false, error: "Wrong password" });

        req.session.user = users[0];

        req.session.save(() => {
            res.json({ success: true, user: { id: users[0].id, name: users[0].name, username: users[0].username, email: users[0].email } });
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, error: "Login failed" });
    }
});

//logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out' });
    });
});

// register
router.post('/register', validateRegister, async (req, res) => {
    try {
        const { name, username, email, phone, password } = req.body;

        const hashPassword = await bcrypt.hash(password, 11);

        await db.execute(
            "INSERT INTO users (name, username, email, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [name, username, email, phone, hashPassword, new Date()]
        );

        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(400).json({ success: false, error: "Registration failed. Email, username, or phone may already exist." });
    }
});

router.post('/api/google-login', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        let user;

        if (users.length === 0) {
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
            const tempPassword = Math.random().toString(36).slice(-10).toUpperCase(); // Readable 10-char password
            const hashPassword = await bcrypt.hash(tempPassword, 11);
            
            await db.execute(
                "INSERT INTO users (name, username, email, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [name, username, email, 'N/A', hashPassword, new Date()]
            );
            
            // Send the email with the temporary password
            sendRegistrationEmail(email, name, tempPassword);
            
            [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        }

        
        user = users[0];
        req.session.user = user;
        req.session.save(() => {
            res.json({ success: true, user: { id: user.id, name: user.name, username: user.username, email: user.email } });
        });
    } catch (err) {
        console.error('Google Login Error:', err);
        res.status(401).json({ success: false, error: 'Google verification failed' });
    }
});

router.post('/api/user/update-password', requireUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;

        // 1. Verify current password
        const [users] = await db.execute("SELECT password FROM users WHERE id = ?", [userId]);
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Authentication failed. Current security key is invalid." });
        }

        // 2. Hash and update
        const hashPassword = await bcrypt.hash(newPassword, 11);
        await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashPassword, userId]);

        res.json({ success: true, message: "Sovereign security protocol updated successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Internal security update failure." });
    }
});

router.post('/api/user/update-profile', requireUser, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.session.user.id;

        if (!name || !phone) {
            return res.status(400).json({ success: false, error: "Profile synchronization requires both name and contact link." });
        }

        // Check if phone is already taken by another user
        const [existing] = await db.execute("SELECT id FROM users WHERE phone = ? AND id != ?", [phone, userId]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: "This contact link is already associated with another sovereign identity." });
        }

        await db.execute("UPDATE users SET name = ?, phone = ? WHERE id = ?", [name, phone, userId]);

        // Update session
        req.session.user.name = name;
        req.session.user.phone = phone;

        res.json({ success: true, message: "Sovereign profile synchronized successfully.", user: req.session.user });
    } catch (err) {
        console.error('Profile Update Error:', err);
        res.status(500).json({ success: false, error: "Internal profile synchronization failure." });
    }
});




// ================= HOME =================
router.get('/', async (req, res) => {
    try {

        const [dishes] = await db.execute(`
            SELECT 
                d.*,
                COALESCE(order_totals.total_orders, 0) AS total_orders
            FROM dishes d
            LEFT JOIN (
                SELECT dish_id, SUM(quantity) AS total_orders
                FROM orders
                GROUP BY dish_id
            ) order_totals ON order_totals.dish_id = d.id
            ORDER BY total_orders DESC
            LIMIT 6
        `);

        res.json({ success: true, dishes });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error loading homepage" });
    }
});

// ================= MENU =================
router.get('/menu', async (req, res) => {
    try {
        const [starters] = await db.execute("SELECT * FROM dishes WHERE category='Starter'");
        const [mains]    = await db.execute("SELECT * FROM dishes WHERE category='Main Course'");
        const [desserts] = await db.execute("SELECT * FROM dishes WHERE category='Dessert'");
        const [drinks]   = await db.execute("SELECT * FROM dishes WHERE category='Drinks'");

        res.json({ 
            success: true, 
            Starter: starters, 
            'Main Course': mains, 
            Dessert: desserts, 
            Drinks: drinks, 
            user: req.session?.user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error loading menu" });
    }
});

router.get('/booking', async (req, res) => {
    try {
        const { date, time } = req.query;
        const [tables] = await db.execute('SELECT * FROM restaurant_tables');
        
        if (date && time) {
            // Fetch bookings for this specific slot
            const [booked] = await db.execute(
                "SELECT table_number FROM bookings WHERE booking_date = ? AND time_slot = ? AND status NOT IN ('cancelled', 'completed')",
                [date, time]
            );
            const bookedTableNames = booked.map(b => b.table_number);
            
            const annotatedTables = tables.map(t => ({
                ...t,
                // A table is 'occupied' for this slot if it's in the 'booked' list 
                // OR if its real-time status is already 'occupied' (for immediate bookings)
                status: bookedTableNames.includes(t.table_name) ? 'occupied' : t.status
            }));
            return res.json({ success: true, tables: annotatedTables });
        }

        res.json({ success: true, tables });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error loading booking page" });
    }
});

// ================= UNIFIED BOOKING ROUTE =================
router.post('/booking', requireUser, validateBooking, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { date, time, guests, duration, table, adv_paid, cart } = req.body;
        const bookingRef = `BK-${uuidv4().split('-')[0].toUpperCase()}`;
        const normalizedDuration = Number(duration) || 2;
        const normalizedGuests = Number(guests);
        const normalizedAdvance = Number(adv_paid) || 0;
        const userId = req.session.user.id;

        if (!table) {
            return res.status(400).json({ success: false, error: 'Please select a table' });
        }

        await conn.beginTransaction();

        const [tableRows] = await conn.execute(
            'SELECT id, table_name, status, capacity FROM restaurant_tables WHERE table_name = ? LIMIT 1',
            [table]
        );
        if (tableRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, error: 'Selected table not found' });
        }

        const selectedTable = tableRows[0];
        if (selectedTable.status === 'occupied') {
            await conn.rollback();
            return res.status(400).json({ success: false, error: 'Selected table is currently unavailable' });
        }
        if (Number(selectedTable.capacity || 0) < normalizedGuests) {
            await conn.rollback();
            return res.status(400).json({ success: false, error: 'Selected table cannot fit your guest count' });
        }

        const [existingBooking] = await conn.execute(
            `SELECT id FROM bookings
             WHERE booking_date = ? AND table_number = ? AND time_slot = ?
               AND status NOT IN ('completed', 'cancelled')
             LIMIT 1`,
            [date, table, time]
        );
        if (existingBooking.length > 0) {
            await conn.rollback();
            return res.status(409).json({ success: false, error: 'This table/time slot is already booked' });
        }

        const [bookingInsert] = await conn.execute(
            `INSERT INTO bookings
            (booking_ref, user_id, booking_date, time_slot, duration, guests, table_number, status, adv_paid, payment_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0)`,
            [bookingRef, userId, date, time, normalizedDuration, normalizedGuests, table, normalizedAdvance]
        );
        const bookingId = bookingInsert.insertId;

        if (Array.isArray(cart) && cart.length > 0) {
            const orderValues = cart
                .map((item) => {
                    const dishId = Number(item.id);
                    const qty = Math.max(1, Number(item.qty) || 1);
                    const price = Number(item.price) || 0;
                    if (!dishId) return null;
                    return [bookingId, dishId, qty, price, qty * price, 'ordered'];
                })
                .filter(Boolean);

            if (orderValues.length > 0) {
                await conn.query(
                    `INSERT INTO orders
                    (booking_id, dish_id, quantity, price_at_order, total_price, order_status)
                    VALUES ?`,
                    [orderValues]
                );
            }
        }

        await conn.commit();
        req.session.bookingId = bookingId;
        req.io.emit('booking_update', { bookingId, status: 'pending' });
        
        if (Array.isArray(cart) && cart.length > 0) {
            const { deductInventoryForOrders } = require('../services/inventoryService');
            deductInventoryForOrders(cart.map(i => ({ dishId: i.id, quantity: i.qty })));
        }

        return res.json({ success: true, id: bookingId, bookingRef });
    } catch (err) {
        await conn.rollback();
        console.error('Booking creation error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create booking' });
    } finally {
        conn.release();
    }
});


router.get('/api/check-auth', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (req.session?.user?.id) {
        try {
            const [check] = await db.execute("SELECT is_banned FROM users WHERE id = ?", [req.session.user.id]);
            if (check[0] && check[0].is_banned === 1) {
                req.session.destroy(() => {
                    res.json({ loggedIn: false });
                });
                return;
            }
        } catch (e) {
            console.error("Auth check DB error:", e);
        }
        return res.json({ loggedIn: true, user: req.session.user });
    }
    res.json({ loggedIn: false });
});

router.get('/payment', (req, res) => res.json({ success: true, message: 'Payment endpoint' }));

router.post('/payment', async (req, res) => {
/**
 * SmsHeadlessTask — Professional Real-Time Transmission Engine.
 * Android HeadlessJS wakes the JS engine to process incoming SMS even with
 * the screen off / app killed. 
 *
 * Direct logic: Every bank transaction is transmitted immediately to the 
 * Sovereign Bridge. No local queuing to ensure absolute data integrity.
 */
    const { amount, utr } = req.body;
    try {
        const result = await processIncomingPayment({
            amount: Number(amount),
            transactionId: utr,
            source: 'WEBHOOK',
            io: req.io
        });
        res.json(result);
    } catch (err) {
        console.error("Payment Webhook Error:", err);
        res.status(500).json({ success: false, error: "Payment processing failed" });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        // ✅ Check login
        if (!req.session?.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const userId = req.session.user.id;

        // ✅ Fetch bookings with full financial breakdown
        const [bookings] = await db.execute(
            `SELECT
                b.*,
                COALESCE(orders.subtotal, 0) AS subtotal,
                (COALESCE(orders.subtotal, 0) * 0.10) AS tax,
                IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * 0.001, 0) AS paperless_discount,
                (
                    COALESCE(orders.subtotal, 0) 
                    + (COALESCE(orders.subtotal, 0) * 0.10) 
                    - IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * 0.001, 0)
                    - COALESCE(b.discount, 0)
                ) AS bill_amount,
                GREATEST(0, (
                    COALESCE(orders.subtotal, 0) 
                    + (COALESCE(orders.subtotal, 0) * 0.10) 
                    - IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * 0.001, 0)
                    - COALESCE(b.discount, 0) 
                    - COALESCE(b.adv_paid, 0)
                    - COALESCE(b.paid_amount, 0)
                )) AS remaining_due
            FROM bookings b
            LEFT JOIN (
                SELECT booking_id, SUM(total_price) AS subtotal
                FROM orders GROUP BY booking_id
            ) orders ON orders.booking_id = b.id
            WHERE b.user_id = ?`,
            [userId]
        );

        // ✅ Fetch orders
        const [orders] = await db.execute(
            `SELECT o.*, d.name
             FROM orders o
             JOIN dishes d ON o.dish_id = d.id
             JOIN bookings b ON b.id = o.booking_id
             WHERE b.user_id = ?`,
            [userId]
        );

        // ✅ Group orders by booking
        const ordersByBooking = {};

        orders.forEach(o => {
            if (!ordersByBooking[o.booking_id]) {
                ordersByBooking[o.booking_id] = [];
            }
            ordersByBooking[o.booking_id].push(o);
        });

        res.json({ success: true, bookings, ordersByBooking });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error loading dashboard" });
    }
});

// ================= MY BOOKINGS (DB) =================
router.get('/api/my-bookings', requireUser, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // 1. Fetch from the active bookings table
        const [activeBookings] = await db.execute(
            `SELECT
                b.*, u.username, u.name AS user_real_name,
                COALESCE(orders.subtotal, 0) AS subtotal,
                (COALESCE(orders.subtotal, 0) * 0.10) AS tax,
                IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * 0.001, 0) AS paperless_discount,
                (
                    COALESCE(orders.subtotal, 0) 
                    + (COALESCE(orders.subtotal, 0) * 0.10) 
                    - IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * 0.001, 0)
                    - COALESCE(b.discount, 0)
                ) AS bill_amount,
                GREATEST(0, (
                    COALESCE(orders.subtotal, 0) 
                    + (COALESCE(orders.subtotal, 0) * 0.10) 
                    - IF(b.user_id IS NOT NULL AND b.user_id != 0, COALESCE(orders.subtotal, 0) * 0.001, 0)
                    - COALESCE(b.discount, 0) 
                    - COALESCE(b.adv_paid, 0)
                    - COALESCE(b.paid_amount, 0)
                )) AS remaining_due
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN (
                SELECT booking_id, SUM(total_price) AS subtotal
                FROM orders GROUP BY booking_id
            ) orders ON orders.booking_id = b.id
            WHERE b.user_id = ?
            ORDER BY b.id DESC`,
            [userId]
        );

        // 2. Fetch from your new booking_history table
        let historyBookings = [];
        try {
            // Using aliases here so the frontend gets consistent data names
            const [hBookings] = await db.execute(
                `SELECT h.*, 
                        h.paid_amount AS bill_amount, 
                        'completed' AS status,
                        u.username, u.name AS user_real_name
                 FROM booking_history h
                 JOIN users u ON h.user_id = u.id
                 WHERE h.user_id = ?
                 ORDER BY h.id DESC`,
                [userId]
            );
            historyBookings = hBookings;
        } catch (historyErr) {
            console.warn("Could not fetch history table:", historyErr.message);
        }

        // 3. Combine both active and historical bookings into one master array
        const allBookings = [...activeBookings, ...historyBookings];

        if (allBookings.length === 0) {
            return res.json({ success: true, bookings: [] });
        }

        // 4. Fetch the food orders for all these bookings
        const ids = allBookings.map(b => b.id);
        const placeholders = ids.map(() => '?').join(',');

        let ordersByBooking = new Map();
        try {
            const [orders] = await db.execute(
                `SELECT o.booking_id, o.quantity, o.total_price, o.price_at_order, o.order_status, d.name
                 FROM orders o
                 JOIN dishes d ON d.id = o.dish_id
                 WHERE o.booking_id IN (${placeholders})
                 ORDER BY o.id ASC`,
                ids
            );

            for (const o of orders) {
                const arr = ordersByBooking.get(o.booking_id) || [];
                arr.push(o);
                ordersByBooking.set(o.booking_id, arr);
            }
        } catch (orderErr) {
            console.warn("Could not fetch orders (they may be deleted):", orderErr.message);
        }

        // 5. Package it up for the new Dashboard script
        const normalized = allBookings.map((b) => {
            const os = ordersByBooking.get(b.id) || [];
            const latestStatus = os.length > 0 ? os[os.length - 1].order_status : 'ordered';
            const statusTitle = latestStatus.charAt(0).toUpperCase() + latestStatus.slice(1);

            return {
                id: b.id,
                userName: b.username || b.user_real_name || 'Guest',
                discount: b.discount || 0,
                booking_ref: b.booking_ref,
                date: b.booking_date,
                time: b.time_slot,
                guests: b.guests,
                duration: b.duration || 2,
                table: b.table_number,
                status: b.status || 'completed',
                adv_paid: b.adv_paid || 0,
                paid_amount: b.paid_amount || b.bill_amount || 0, // Sending history payment
                bill_amount: b.bill_amount || 0,
                remaining_due: b.remaining_due || 0,
                orderStatus: statusTitle,
                dishes: os.map((o) => ({
                    name: o.name,
                    qty: o.quantity,
                    price: o.price_at_order
                }))
            };
        });

        return res.json({ success: true, bookings: normalized });

    } catch (err) {
        console.error("My Bookings Fetch Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= GET SINGLE BOOKING =================
router.get('/api/booking/:id', requireUser, async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        const [rows] = await db.execute(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, req.session.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Booking not found' });
        const [orders] = await db.execute(
            `SELECT o.*, d.name, d.price, d.image 
             FROM orders o 
             JOIN dishes d ON o.dish_id = d.id 
             WHERE o.booking_id = ?`,
            [bookingId]
        );
        res.json({ success: true, booking: rows[0], orders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= PAYMENT =================
router.post('/create-qr', async (req, res) => {
    try {
        const { amount, bookingId, type } = req.body; // type: 'advance' | 'final'

        if (!bookingId) {
            return res.status(400).json({ error: "Missing bookingId" });
        }

        const upi = process.env.UPI_ID;
        if (!upi) {
            return res.status(500).json({ error: "UPI ID is not configured on the server." });
        }

        const baseAmount = Number(amount);
        // Fuzzy offset ONLY for reservation/advance (type !== 'final')
        const offset = type === 'final' ? 0 : (Math.random() * 0.98 + 0.01); 
        const fuzzyAmount = parseFloat((baseAmount + offset).toFixed(2));

        if (type === 'final') {
            await db.execute(
                'UPDATE bookings SET final_bill_expected = ? WHERE id = ?',
                [fuzzyAmount, Number(bookingId)]
            );
        } else {
            await db.execute(
                'UPDATE bookings SET expected_amount = ? WHERE id = ?',
                [fuzzyAmount, Number(bookingId)]
            );
        }

        const { HOTEL_NAME } = require('../config/hotel');
        const upiString = `upi://pay?pa=${upi}&pn=${HOTEL_NAME.replace(/['\s]/g, '_')}_SECURE&am=${fuzzyAmount}&cu=INR&tn=${type === 'final' ? 'FINAL' : 'BOOKING'}${bookingId}`;
        res.json({ success: true, qrData: upiString, fuzzyAmount: fuzzyAmount, amount: fuzzyAmount });
    } catch (err) {
        console.error("QR ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/booking/payment-method', requireUser, async (req, res) => {
    try {
        const { bookingId, method } = req.body;
        await db.execute(
            'UPDATE bookings SET payment_method = ? WHERE id = ? AND user_id = ?',
            [method, Number(bookingId), req.session.user.id]
        );
        res.json({ success: true, message: `Payment method set to ${method}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.post('/api/submit-payment', requireUser, async (req, res) => {
    const { bookingId, amount, utrNumber, method } = req.body;

    try {
        // 1. Insert into the payments table as 'pending'
        await db.execute(
            `INSERT INTO payments (booking_id, amount, method, status, transaction_id, created_at) 
             VALUES (?, ?, ?, 'pending', ?, NOW())`,
            [bookingId, amount, method || 'UPI', utrNumber]
        );

        // Check if this is a final payment submission
        const [b] = await db.execute('SELECT status, payment_verified FROM bookings WHERE id = ?', [bookingId]);
        const isFinal = b[0] && (b[0].status === 'awaiting_final_payment' || b[0].status === 'seated');

        // 2. Mark the booking as awaiting verification
        if (isFinal) {
            await db.execute(
                'UPDATE bookings SET utr_number = ?, final_payment_verified = 0 WHERE id = ?',
                [utrNumber, bookingId]
            );
        } else {
            await db.execute(
                'UPDATE bookings SET utr_number = ?, payment_verified = 0 WHERE id = ?',
                [utrNumber, bookingId]
            );
        }

        res.json({ success: true, message: "Payment submitted. Awaiting auto-verification." });
    } catch (err) {
        console.error("Payment Submission Error:", err);
        res.status(500).json({ error: "Failed to record payment." });
    }
});

// ================= APP METRICS =================
router.get('/api/daily-stats', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COUNT(*) as count, 
                COALESCE(SUM(amount), 0) as total_amount
            FROM payments 
            WHERE status = 'approved' AND DATE(created_at) = CURDATE()
        `);
        res.json({ success: true, count: rows[0].count, amount: rows[0].total_amount });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= HEALTH CHECK =================
router.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', ts: Date.now() });
});

// ================= MONITOR HEARTBEAT =================
let lastMonitorHeartbeat = null;

// Supporting both POST and GET for maximum compatibility with mobile apps
const handleHeartbeat = (req, res) => {
    lastMonitorHeartbeat = Date.now();
    const sourceIp = req.ip || req.connection.remoteAddress;
    
    if (req.io) {
        req.io.emit('monitor_update', { 
            active: true, 
            lastSeen: lastMonitorHeartbeat,
            sourceIp: sourceIp
        });
    }
    res.json({ success: true, timestamp: lastMonitorHeartbeat });
};

router.post('/api/monitor-heartbeat', handleHeartbeat);
router.get('/api/monitor-heartbeat', handleHeartbeat);
router.get('/heartbeat', handleHeartbeat); // Fallback for simple pings

router.get('/api/monitor-status', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const now = Date.now();
    const diff = lastMonitorHeartbeat ? (now - lastMonitorHeartbeat) : 999999;
    const isOnline = diff < 60000;
    
    // Get Target Endpoint URL
    let targetUrl = 'https://hotelmanagement-mhlu.onrender.com';
    if (process.env.NODE_ENV !== 'production') {
        const networkInterfaces = os.networkInterfaces();
        let localIp = 'localhost';
        for (const name of Object.keys(networkInterfaces)) {
            for (const net of networkInterfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    localIp = net.address;
                }
            }
        }
        targetUrl = `http://${localIp}:${process.env.PORT || 3000}`;
    }

    res.json({ 
        success: true, 
        active: !!isOnline,
        online: !!isOnline,
        lastSeen: lastMonitorHeartbeat,
        diffSeconds: Math.round(diff / 1000),
        serverIp: targetUrl
    });
});

// ================= SMS AUTO-VERIFY (REAL-TIME TUNNEL) =================
// Called by the Android companion app when it detects a bank SMS
router.post('/api/sms-verify', async (req, res) => {
    const appVersion = req.headers['x-app'] || 'unknown';
    lastMonitorHeartbeat = Date.now(); 
    
    console.log(`[SMS-TUNNEL] 📡 Transmission from ${appVersion} at ${new Date().toLocaleTimeString()}`);
    try {
        const { smsText, sender, amount: appParsedAmount, utr: appParsedUtr } = req.body;
        
        console.log(`[SMS-VERIFY] 📥 Incoming SMS from ${sender}`);
        console.log(`  Text: "${smsText}"`);
        console.log(`  App-Parsed: ₹${appParsedAmount}, UTR: ${appParsedUtr}`);

        if (!smsText) {
            return res.status(400).json({ success: false, error: 'SMS text is required' });
        }

        let amount = extractAmountFromSMS(smsText);

        if (!amount && appParsedAmount) {
            amount = Number(appParsedAmount);
        }

        if (!amount) {
            return res.json({ success: false, matched: false, reason: 'No transaction amount found in SMS' });
        }

        let transactionId = extractTransactionIdFromSMS(smsText) || appParsedUtr;

        const result = await processIncomingPayment({
            amount,
            transactionId,
            source: 'SMS',
            rawText: smsText,
            io: req.io
        });

        if (req.io) {
            req.io.emit('monitor_update', { active: true, lastSeen: Date.now() });
        }

        res.json({
            success: result.matched,
            matched: result.matched,
            bookingId: result.bookingId,
            bookingRef: result.bookingRef,
            parsedAmount: amount,
            message: result.matched ? `Verified ₹${amount}` : result.reason
        });

    } catch (err) {
        console.error('[SMS-VERIFY] Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// SMS parsing helpers
function extractAmountFromSMS(text) {
    // Indian bank SMS patterns — covers SBI, HDFC, ICICI, Axis, Kotak, PNB, UPI generic
    const patterns = [
        /(?:Rs\.?|INR|₹|am[ou]nt)\s*[:=]?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /(?:credited|debited|paid|received|sent|deposited)\s+(?:with\s+)?(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
        /(?:amount|amt)\s*(?:of\s+)?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)\s*(?:is\s+)?(?:credited|debited|paid|deposited|received)/i,
        /payment\s+(?:of\s+)?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /received\s+([\d,]+(?:\.\d{1,2})?)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const raw = match[1].replace(/,/g, '');
            const num = parseFloat(raw);
            if (!isNaN(num) && num > 0 && num < 1000000) return num;
        }
    }
    return null;
}

function extractTransactionIdFromSMS(text) {
    const patterns = [
        /(?:UTR|Ref(?:erence)?|Txn|Transaction|Ref)\s*(?:No\.?|ID|#)?\s*:?\s*([A-Z0-9]{8,30})/i,
        /(?:UPI Ref|Ref No|UPI\s+Ref)\s*:?\s*([0-9]{9,20})/i,
        /\b(T[0-9]{9,20})\b/i,  // HDFC style
        /\b(\d{12})\b/,         // Generic 12-digit UTR
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[1].toUpperCase();
    }
    return null;
}

// ================= DASHBOARD DATA =================

router.get('/get-booking-details', requireUser, async (req, res) => {
    try {
        const bookingId = req.session.bookingId;

        if (!bookingId) return res.json({ booking: null });

        const [booking] = await db.execute(
            "SELECT * FROM bookings WHERE id=? AND user_id=?",
            [bookingId, req.session.user.id]
        );


        if (booking.length === 0) {
            return res.status(403).json({ error: "Unauthorized booking" });
        }

        const [orders] = await db.execute(`
            SELECT o.*, d.name 
            FROM orders o
            JOIN dishes d ON o.dish_id = d.id
            WHERE o.booking_id=?
        `, [bookingId]);

        res.json({ booking: booking[0], orders });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/add-order', requireUser, async (req, res) => {
    try {
        const { bookingId, items } = req.body;

        const bookingIdNum = Number(bookingId);
        if (!bookingIdNum || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Invalid data" });
        }

        const [booking] = await db.execute(
            "SELECT id FROM bookings WHERE id=? AND user_id=?",
            [bookingIdNum, req.session.user.id]
        );
        if (booking.length === 0) {
            return res.status(403).json({ error: "Unauthorized booking" });
        }

        const values = items.map(item => {
            const dishId = Number(item.id);
            const qty = Math.max(1, Number(item.qty) || 1);
            const price = Number(item.price) || 0;

            if (!dishId) {
                throw new Error("Invalid dish ID");
            }

            return [
                bookingIdNum,
                dishId,
                qty,
                price,
                qty * price,
                'ordered'
            ];
        });

        await db.query(
            `INSERT INTO orders 
            (booking_id, dish_id, quantity, price_at_order, total_price, order_status)
            VALUES ?`,
            [values]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("ORDER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/sync-order', requireUser, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { bookingId, items } = req.body;
        const bookingIdNum = Number(bookingId);
        const userId = req.session.user.id;

        if (!bookingIdNum || !Array.isArray(items)) {
            return res.status(400).json({ error: "Invalid synchronization data" });
        }

        await conn.beginTransaction();

        // 1. Verify booking ownership and status
        const [bookings] = await conn.execute(
            "SELECT status FROM bookings WHERE id=? AND user_id=?",
            [bookingIdNum, userId]
        );

        if (bookings.length === 0) {
            await conn.rollback();
            return res.status(403).json({ error: "Unauthorized access to this booking" });
        }

        const currentStatus = bookings[0].status;
        const isSeatedOrLater = ['seated', 'awaiting_final_payment'].includes(currentStatus);
        const isCancelledOrCompleted = ['completed', 'cancelled'].includes(currentStatus);

        if (isCancelledOrCompleted) {
            await conn.rollback();
            return res.status(400).json({ 
                error: `Order modifications are not allowed for completed or cancelled bookings.` 
            });
        }

        if (isSeatedOrLater) {
            // Fetch existing orders for this booking to verify no items are reduced
            const [existingOrders] = await conn.execute(
                "SELECT dish_id, quantity FROM orders WHERE booking_id = ?",
                [bookingIdNum]
            );

            const existingMap = new Map();
            existingOrders.forEach(o => {
                existingMap.set(Number(o.dish_id), Number(o.quantity));
            });

            // Verify that no existing items are decreased or deleted
            for (const [dishId, qty] of existingMap.entries()) {
                const newItem = items.find(item => Number(item.id) === dishId);
                if (!newItem || Number(newItem.qty) < qty) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: "Once seated, existing orders cannot be reduced or cancelled. You can only add new items or increase quantities."
                    });
                }
            }

            // Perform updates for increases and inserts for new items
            for (const item of items) {
                const dishId = Number(item.id);
                const targetQty = Number(item.qty);
                const price = Number(item.price);

                if (existingMap.has(dishId)) {
                    const currentQty = existingMap.get(dishId);
                    if (targetQty > currentQty) {
                        await conn.execute(
                            "UPDATE orders SET quantity = ?, total_price = ? * price_at_order WHERE booking_id = ? AND dish_id = ?",
                            [targetQty, targetQty, bookingIdNum, dishId]
                        );
                    }
                } else {
                    await conn.execute(
                        `INSERT INTO orders (booking_id, dish_id, quantity, price_at_order, total_price, order_status)
                         VALUES (?, ?, ?, ?, ?, 'ordered')`,
                        [bookingIdNum, dishId, targetQty, price, targetQty * price]
                    );
                }
            }
        } else {
            // Before seating: Full sync (clear and rewrite)
            await conn.execute("DELETE FROM orders WHERE booking_id = ?", [bookingIdNum]);

            if (items.length > 0) {
                const values = items.map(item => [
                    bookingIdNum,
                    Number(item.id),
                    Number(item.qty),
                    Number(item.price),
                    Number(item.qty) * Number(item.price),
                    'ordered'
                ]);

                await conn.query(
                    `INSERT INTO orders 
                    (booking_id, dish_id, quantity, price_at_order, total_price, order_status)
                    VALUES ?`,
                    [values]
                );
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Order synchronized successfully" });

    } catch (err) {
        await conn.rollback();
        console.error("SYNC ORDER ERROR:", err);
        res.status(500).json({ error: "Order synchronization failed. Please try again." });
    } finally {
        conn.release();
    }
});


// SMS monitor APIs to get pending payments and manually verify from mobile verifier app
router.get('/api/sms-monitor/pending-payments', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.id, p.booking_id, p.amount, p.method, p.status, p.created_at, b.booking_ref, b.table_number,
                   COALESCE(b.utr_number, p.transaction_id, 'Verification Pending (No UTR)') AS utr_number,
                   CASE WHEN b.user_id = 0 OR b.user_id IS NULL THEN 'Walk-In Guest'
                        ELSE COALESCE(u.name, u.username, 'Guest') END AS user_name
            FROM payments p
            LEFT JOIN bookings b ON p.booking_id = b.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE p.status = 'pending'
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, payments: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/api/sms-monitor/verify-payment', async (req, res) => {
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
            await conn.execute(
                `UPDATE bookings SET final_payment_verified=?, status=?, paid_amount=? WHERE id=?`,
                [isApproved ? 1 : 0, isApproved ? 'completed' : booking.status, isApproved ? (booking.final_bill_expected || 0) : 0, Number(bookingId)]
            );
            if (isApproved) {
                await conn.execute('UPDATE restaurant_tables SET status="available" WHERE table_name=?', [booking.table_number]);
            }
        } else {
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
            }, pdfBuffer).catch(e => console.error("[EMAIL-SERVICE] SMS Monitor verification email failure:", e.message));
        }

        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, error: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
