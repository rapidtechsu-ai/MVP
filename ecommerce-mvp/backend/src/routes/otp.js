const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendOtpCode } = require('../services/notificationService');
const { getOtpExpiryMinutes, getOtpMaxAttempts } = require('../services/settingsService');

const prisma = new PrismaClient();

// POST /otp/send — dispatch OTP via every active configured channel (FR-ORD-004)
// Accepts phone and/or email; sends to whichever channels are active AND
// have a matching destination. At least one of phone/email is required.
router.post('/send', async (req, res, next) => {
  try {
    const { phone, email, orderId, customerId } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'phone or email is required.' });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');

    const { channelsSent, failures } = await sendOtpCode({ code, phone, email });

    if (channelsSent.length === 0) {
      return res.status(503).json({
        error: 'No active OTP channel could be reached. Configure a provider in Settings.',
        failures,
      });
    }

    const expiryMinutes = await getOtpExpiryMinutes();

    const otp = await prisma.oTPVerification.create({
      data: {
        orderId,
        customerId,
        destinationPhone: phone || null,
        destinationEmail: email || null,
        channelsSent,
        tokenHash,
        expiry: new Date(Date.now() + expiryMinutes * 60 * 1000),
        status: 'PENDING',
      },
    });

    res.json({
      otpId: otp.id,
      channelsSent,
      expiresInSeconds: expiryMinutes * 60,
    });
  } catch (err) {
    next(err);
  }
});

// POST /otp/verify — verify OTP (FR-ORD-004)
router.post('/verify', async (req, res, next) => {
  try {
    const { orderId, code } = req.body;

    const otp = await prisma.oTPVerification.findFirst({
      where: { orderId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(400).json({ error: 'No pending OTP found for this order.' });
    }

    if (new Date() > otp.expiry) {
      await prisma.oTPVerification.update({ where: { id: otp.id }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ error: 'OTP expired. Please request a new code.' });
    }

    const maxAttempts = await getOtpMaxAttempts();
    if (otp.attempts >= maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new code.' });
    }

    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');

    if (tokenHash !== otp.tokenHash) {
      await prisma.oTPVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ error: 'Invalid code.' });
    }

    await prisma.oTPVerification.update({ where: { id: otp.id }, data: { status: 'VERIFIED' } });

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMATION',
          statusHistory: {
            create: { fromStatus: order.status, toStatus: 'CONFIRMATION', actor: 'SYSTEM', reason: 'OTP verified' },
          },
        },
      });
    }

    res.json({ status: 'VERIFIED' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
