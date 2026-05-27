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

module.exports = { requireAdmin, requireStaffOrAdmin };
