/**
 * requireCustomerAuth
 * ---------------------------------------------------------------
 * Unlike attachCustomerIfPresent (used on guest-friendly routes like
 * cart/checkout/order-tracking), this rejects the request outright if
 * no valid CUSTOMER JWT is present. Used for genuinely account-only
 * actions: profile editing, saved addresses.
 * ---------------------------------------------------------------
 */

const { verifyToken } = require('../services/authService');

function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required.' });
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    if (payload.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'This action requires a customer account.' });
    }
    req.customer = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = requireCustomerAuth;
