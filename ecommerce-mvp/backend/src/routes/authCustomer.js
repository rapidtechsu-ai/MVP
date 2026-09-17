const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendOtpCode } = require('../services/notificationService');
const { getOtpExpiryMinutes, getOtpMaxAttempts, isOtpTestBypassEnabled } = require('../services/settingsService');
const { signToken } = require('../services/authService');

const prisma = new PrismaClient();

// POST /auth/customer/request-otp — mobile number login, no password (confirmed design).
// Email is optional and only used as a second delivery channel if provided.
router.post('/request-otp', async (req, res, next) => {
  try {
    const { mobile, email } = req.body;
    if (!mobile) {
      return res.status(400).json({ error: 'mobile is required.' });
    }

    // Find or create the customer record — login itself is how a first-time
    // visitor becomes a known Customer, matching guest-checkout-first design.
    const customer = await prisma.customer.upsert({
      where: { mobile },
      update: {},
      create: { mobile, name: mobile },
    });

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');

    const { channelsSent, failures } = await sendOtpCode({ code, phone: mobile, email });

    if (channelsSent.length === 0) {
      return res.status(503).json({
        error: 'No active OTP channel could be reached. Configure a provider in Settings.',
        failures,
      });
    }

    const expiryMinutes = await getOtpExpiryMinutes();

    const otp = await prisma.oTPVerification.create({
      data: {
        customerId: customer.id,
        destinationPhone: mobile,
        destinationEmail: email || null,
        channelsSent,
        tokenHash,
        expiry: new Date(Date.now() + expiryMinutes * 60 * 1000),
        status: 'PENDING',
      },
    });

    res.json({ otpId: otp.id, channelsSent, expiresInSeconds: expiryMinutes * 60 });
  } catch (err) {
    next(err);
  }
});

// POST /auth/customer/verify-otp — verify code, issue a customer JWT.
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { mobile, code } = req.body;
    if (!mobile || !code) {
      return res.status(400).json({ error: 'mobile and code are required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      return res.status(400).json({ error: 'No login request found for this number.' });
    }

    const otp = await prisma.oTPVerification.findFirst({
      where: { customerId: customer.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(400).json({ error: 'No pending code found. Please request a new one.' });
    }

    if (new Date() > otp.expiry) {
      await prisma.oTPVerification.update({ where: { id: otp.id }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }

    const maxAttempts = await getOtpMaxAttempts();
    if (otp.attempts >= maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new code.' });
    }

    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');

    // Testing convenience (dashboard-toggleable, OFF by default) — see
    // src/routes/otp.js for the matching order-verification version.
    const testBypassEnabled = await isOtpTestBypassEnabled();
    const isTestBypass = testBypassEnabled && code === '0000';

    if (!isTestBypass && tokenHash !== otp.tokenHash) {
      await prisma.oTPVerification.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ error: 'Invalid code.' });
    }

    await prisma.oTPVerification.update({ where: { id: otp.id }, data: { status: 'VERIFIED' } });

    const token = signToken({ customerId: customer.id, mobile: customer.mobile, role: 'CUSTOMER' });

    res.json({ token, customer: { id: customer.id, mobile: customer.mobile, name: customer.name } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
