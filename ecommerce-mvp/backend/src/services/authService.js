/**
 * Auth Service
 * ---------------------------------------------------------------
 * Two distinct actor types, per confirmed design:
 *   - Customers: mobile number + OTP, no password (JWT role CUSTOMER)
 *   - Dashboard staff: email + password, optional MFA later (JWT role = User.role)
 * ---------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRY = '7d';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET); // throws if invalid/expired
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
};
