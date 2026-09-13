/**
 * attachCustomerIfPresent
 * ---------------------------------------------------------------
 * Unlike requireStaffAuth, this never rejects the request — guest
 * checkout and guest order tracking (by order ID) must keep working
 * with no login at all, per confirmed design. If a valid CUSTOMER
 * JWT is present, it decorates req.customer so routes that list a
 * customer's own data (order history) can use it instead of trusting
 * a client-supplied customerId.
 * ---------------------------------------------------------------
 */

const { verifyToken } = require('../services/authService');

function attachCustomerIfPresent(req, res, next) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice('Bearer '.length));
      if (payload.role === 'CUSTOMER') {
        req.customer = payload;
      }
    } catch {
      // Invalid/expired token on a non-required route — ignore and
      // proceed as a guest rather than blocking the request.
    }
  }

  next();
}

module.exports = attachCustomerIfPresent;
