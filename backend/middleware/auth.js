/**
 * Auth middleware — shared session-based guards.
 * Re-exports the helpers so route files outside admin.routes can use them.
 */

function requireAdmin(req, res, next) {
    if (req.session?.adminId) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin access required' });
}

function requireStaffOrAdmin(req, res, next) {
    if (req.session?.adminId || req.session?.staffId) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized: Staff or Admin access required' });
}

const MONITOR_TOKEN = 'Bearer veripay-secure-handshake-token-2026';

function requireMonitorToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader === MONITOR_TOKEN) {
        return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Monitor token required' });
}

module.exports = { requireAdmin, requireStaffOrAdmin, requireMonitorToken };

