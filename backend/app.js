// Trigger nodemon restart for env update
const express = require('express');

const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Email Automation Service
const { startEmailAutomation } = require('./payment-verifier'); 

const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const db = require('./config/db');

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// ================= MIDDLEWARE =================
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(helmet({
    contentSecurityPolicy: false, 
}));
app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5000, 
    message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({}, db);

const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.SESSION_SECRET || 'restaurant-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: isProduction,          // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin (Vercel→Render)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000   // 24h
    }
}));

// GLOBAL LOGGER for debugging connectivity
app.use((req, res, next) => {
    // Skip logging common assets to keep console clean
    if (req.url.includes('/uploads/') || req.url.includes('.js') || req.url.includes('.css')) return next();
    
    console.log(`[GLOBAL-LOG] ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
    if (req.method === 'POST') {
        const bodyCopy = { ...req.body };
        if (bodyCopy.password) bodyCopy.password = '***';
        console.log('  Body:', JSON.stringify(bodyCopy));
    }
    next();
});

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.adminId = req.session.adminId || null;
    next();
});

// ================= STATIC FILES & UPLOADS =================
app.use(express.static(path.join(__dirname, 'public')));
// BUG FIX: Explicitly serve the uploads folder so screenshots/images are visible
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); 

app.use((req, res, next) => {
    req.io = io;
    next();
});

// ================= ROUTES =================
app.get('/api/health', (req, res) => res.json({ success: true, status: 'online' }));

// Hotel config — served to frontend so it reads hotel name from .env
const { HOTEL_NAME, HOTEL_TAGLINE, HOTEL_PHONE, HOTEL_YEAR } = require('./config/hotel');
app.get('/api/hotel-config', (req, res) => {
    res.json({ success: true, hotelName: HOTEL_NAME, name: HOTEL_NAME, tagline: HOTEL_TAGLINE, phone: HOTEL_PHONE, year: HOTEL_YEAR });
});

app.use('/', userRoutes);
app.use('/api/admin', adminRoutes);

// ================= SOCKET.IO CHAT =================[cite: 1]
const chatThreads = new Map();

function normalizeChatMessage(data, sender) {
    if (!data || !data.userId || !data.message) return null;
    return {
        id: data.id || `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        userId: String(data.userId),
        userName: data.userName || String(data.userId),
        sender,
        message: String(data.message),
        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

async function storeChatMessage(message) {
    try {
        await db.execute(
            'INSERT INTO messages (user_id, user_name, sender, message, time) VALUES (?, ?, ?, ?, ?)',
            [message.userId, message.userName, message.sender, message.message, message.time]
        );
    } catch (err) {
        console.error('[CHAT] DB Store Error:', err);
    }
}

async function getChatHistory(userId) {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 100',
            [userId]
        );
        return rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user_name,
            sender: r.sender,
            message: r.message,
            time: r.time
        }));
    } catch (err) {
        return [];
    }
}

async function getAllThreads() {
    try {
        const [rows] = await db.execute(`
            SELECT m1.*
            FROM messages m1
            INNER JOIN (
                SELECT user_id, MAX(created_at) as max_ca
                FROM messages
                GROUP BY user_id
            ) m2 ON m1.user_id = m2.user_id AND m1.created_at = m2.max_ca
            ORDER BY m1.created_at DESC
        `);

        const threads = await Promise.all(rows.map(async (r) => ({
            userId: r.user_id,
            userName: r.user_name,
            messages: await getChatHistory(r.user_id)
        })));
        return threads;
    } catch (err) {
        return [];
    }
}
const autoReplyState = new Map();

async function sendAutoReply(userId, userName) {
    const replies = [
        `Namaste! Thank you for contacting ${HOTEL_NAME} Guest Support. We've received your inquiry and our executive concierge will be with you shortly.`,
        "Our staff is currently attending to other guests with high priority. Please expect a slight delay; we appreciate your patience."
    ];

    for (let i = 0; i < replies.length; i++) {
        setTimeout(async () => {
            const autoMsg = {
                userId,
                userName: userName || 'Guest',
                sender: 'admin',
                message: replies[i],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            await storeChatMessage(autoMsg);
            io.to(`user_${userId}`).emit('receive_message', autoMsg);
            io.to('admin_room').emit('receive_message', autoMsg);
        }, (i + 1) * 2500);
    }
}

io.on('connection', (socket) => {
    socket.on('join_user', async (payload) => {
        const userId = String(payload?.userId || payload || '');
        if (!userId) return;
        socket.join(`user_${userId}`);
        const history = await getChatHistory(userId);
        socket.emit('user_chat_history', history);
    });

    socket.on('join_admin', async () => {
        socket.join('admin_room');
        const threads = await getAllThreads();
        socket.emit('chat_history', threads);
    });

    socket.on('user_message', async (data) => {
        const message = normalizeChatMessage(data, 'user');
        if (!message) return;
        await storeChatMessage(message);
        io.to('admin_room').emit('receive_message', message);
        io.to(`user_${message.userId}`).emit('receive_message', message);

        // Auto-reply logic
        const lastTime = autoReplyState.get(message.userId) || 0;
        const now = Date.now();
        if (now - lastTime > 30 * 60 * 1000) {
            autoReplyState.set(message.userId, now);
            sendAutoReply(message.userId, message.userName);
        }
    });

    socket.on('admin_message', async (data) => {
        const message = normalizeChatMessage(data, 'admin');
        if (!message) return;
        await storeChatMessage(message);
        io.to(`user_${message.userId}`).emit('receive_message', message);
        io.to('admin_room').emit('receive_message', message);
    });

    socket.on('disconnect', () => { });
});

// ================= ERROR HANDLER =================
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong on our end' 
        : err.message;

    res.status(statusCode).json({ 
        success: false, 
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ================= SERVER START =================[cite: 1]
// ================= DATABASE DAY-CHANGE AUTOMATION =================
async function initializeDayChangeAutomation() {
    try {
        console.log('⚙️ Executing automated daily database cleanup...');
        // Run the deletion immediately on startup to clear any lingering completed bookings from past days
        // Move completed/cancelled to history before deleting (simulating the trigger)
        try {
            await db.query("INSERT IGNORE INTO booking_history (id, user_id, booking_ref, booking_date, time_slot, duration, guests, table_number, status, adv_paid, payment_verified, final_payment_verified, expected_amount, bill_amount, final_bill_expected, paid_amount, discount, utr_number, payment_method, staff_name, created_at) SELECT id, user_id, booking_ref, booking_date, time_slot, duration, guests, table_number, status, adv_paid, payment_verified, final_payment_verified, expected_amount, bill_amount, final_bill_expected, paid_amount, discount, utr_number, payment_method, staff_name, created_at FROM bookings WHERE status IN ('completed', 'cancelled') AND booking_date < CURDATE()");
            const [delRes] = await db.query("DELETE FROM bookings WHERE status IN ('completed', 'cancelled') AND booking_date < CURDATE()");
            console.log('🧹 Initial day-change clean completed.', delRes?.affectedRows || '');
        } catch(e) {
            console.error('❌ Failed to execute initial day-change clean:', e.message);
        }

        // Set up a daily execution checker at a regular interval (every 15 minutes)
        let lastCheckedDate = new Date().toDateString();
        setInterval(async () => {
            const currentDate = new Date().toDateString();
            if (currentDate !== lastCheckedDate) {
                console.log(`🌅 Day change detected! Running queries to archive completed/cancelled bookings...`);
                try {
                    await db.query("INSERT IGNORE INTO booking_history (id, user_id, booking_ref, booking_date, time_slot, duration, guests, table_number, status, adv_paid, payment_verified, final_payment_verified, expected_amount, bill_amount, final_bill_expected, paid_amount, discount, utr_number, payment_method, staff_name, created_at) SELECT id, user_id, booking_ref, booking_date, time_slot, duration, guests, table_number, status, adv_paid, payment_verified, final_payment_verified, expected_amount, bill_amount, final_bill_expected, paid_amount, discount, utr_number, payment_method, staff_name, created_at FROM bookings WHERE status IN ('completed', 'cancelled') AND booking_date < CURDATE()");
                    await db.query("DELETE FROM bookings WHERE status IN ('completed', 'cancelled') AND booking_date < CURDATE()");
                    console.log('✅ Day-change auto-clean completed successfully.');
                    lastCheckedDate = currentDate;
                } catch (err) {
                    console.error('❌ Failed to run day-change queries:', err);
                }
            }
        }, 15 * 60 * 1000); // Check every 15 minutes
    } catch (err) {
        console.error('❌ Database Day-Change Automation failed to initialize:', err);
    }
}

// ================= SERVER START =================
const startPort = Number(process.env.PORT) || 3000;
let currentPort = startPort;

function startServer(port) {
    currentPort = port;
    server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 ${HOTEL_NAME} Server running at http://0.0.0.0:${port}`);

        // Initialize Day-Change database clean and stored procedures
        initializeDayChangeAutomation();

        // Start the Email Auto-Verification background task
        if (typeof startEmailAutomation === 'function') {
            startEmailAutomation(io);
            console.log('📬 Email Auto-Verification Service Started.');
        }
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const nextPort = currentPort + 1;
        currentPort = nextPort;
        return startServer(nextPort);
    }
    process.exit(1);
});

startServer(startPort);
