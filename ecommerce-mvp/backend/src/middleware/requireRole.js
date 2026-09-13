/**
 * requireRole
 * ---------------------------------------------------------------
 * Must run after requireStaffAuth (needs req.user populated).
 * Restricts a route to specific roles from Section 9's RBAC list:
 * SYSTEM_ADMIN, OPERATIONS, PRICING, FINANCE, DELIVERY, READ_ONLY_MANAGEMENT.
 *
 * SYSTEM_ADMIN always passes, regardless of the allowed list, since
 * it's the superuser role.
 *
 * Usage: router.post('/exchange-rates', requireRole('PRICING'), ...)
 * ---------------------------------------------------------------
 */

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role === 'SYSTEM_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
    });
  };
}

module.exports = requireRole;
