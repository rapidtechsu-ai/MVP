/**
 * requireStaffAuth
 * ---------------------------------------------------------------
 * Verifies the Authorization: Bearer <token> header and attaches
 * req.user = { userId, email, role }. Rejects with 401 if missing
 * or invalid. This is authentication only — it does not yet check
 * per-role permissions (that's the separate RBAC/audit-logging
 * backlog item; this middleware is the foundation it will build on).
 * ---------------------------------------------------------------
 */

const { verifyToken } = require('../services/authService');

function requireStaffAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    if (payload.role === 'CUSTOMER') {
      // Customer tokens should never reach staff-only routes.
      return res.status(403).json({ error: 'Staff access required.' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = requireStaffAuth;
