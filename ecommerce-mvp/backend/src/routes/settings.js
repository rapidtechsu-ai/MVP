const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { getAllSettings, setSetting } = require('../services/settingsService');
const requireRole = require('../middleware/requireRole');

const prisma = new PrismaClient();

// GET /admin/settings — all dashboard-configurable key-value settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await getAllSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// PUT /admin/settings — bulk upsert settings, e.g. { otp_threshold_sdg: "1500000" }
router.put('/', requireRole('SYSTEM_ADMIN'), async (req, res, next) => {
  try {
    const updatedBy = req.user.email;
    const entries = Object.entries(req.body);
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No settings provided.' });
    }

    await Promise.all(entries.map(([key, value]) => setSetting(key, value, updatedBy)));

    const settings = await getAllSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// GET /admin/settings/notification-providers — OTP channel configs (email, whatsapp)
router.get('/notification-providers', async (req, res, next) => {
  try {
    const existing = await prisma.notificationProvider.findMany();

    // Ensure both channels always appear in the response, even before
    // they've ever been configured, so the dashboard form has something
    // to render on first load.
    const channels = ['EMAIL', 'WHATSAPP'];
    const byChannel = Object.fromEntries(existing.map((p) => [p.channel, p]));

    const result = channels.map(
      (channel) =>
        byChannel[channel] || {
          channel,
          providerName: '',
          apiEndpoint: '',
          apiKey: '',
          fromIdentifier: '',
          active: false,
        }
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /admin/settings/notification-providers/:channel — configure a channel's provider
router.put('/notification-providers/:channel', requireRole('SYSTEM_ADMIN'), async (req, res, next) => {
  try {
    const { channel } = req.params;
    const { providerName, apiEndpoint, apiKey, fromIdentifier, active } = req.body;
    const updatedBy = req.user.email;

    if (!['EMAIL', 'WHATSAPP'].includes(channel)) {
      return res.status(400).json({ error: 'Unsupported channel.' });
    }

    const provider = await prisma.notificationProvider.upsert({
      where: { channel },
      update: { providerName, apiEndpoint, apiKey, fromIdentifier, active, updatedBy },
      create: { channel, providerName, apiEndpoint, apiKey, fromIdentifier, active, updatedBy },
    });

    res.json(provider);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
