const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, signToken } = require('../services/authService');

const prisma = new PrismaClient();

// POST /auth/staff/bootstrap — create the first SYSTEM_ADMIN account.
// Only works when no admin exists yet; disabled after that (use the
// dashboard's Users & Roles screen for further staff accounts once built).
router.post('/bootstrap', async (req, res, next) => {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'SYSTEM_ADMIN' } });
    if (existingAdmin) {
      return res.status(403).json({ error: 'An admin account already exists. Use the login form instead.' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'SYSTEM_ADMIN' },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    next(err);
  }
});

// POST /auth/staff/login — email + password (MFA is a future addition;
// User.mfaEnabled already exists in the schema for when that's built).
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
