const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');

const prisma = new PrismaClient();

// GET /admin/delivery/zones — all zones including inactive, for admin management (FR-DEL-001)
router.get('/zones', async (req, res, next) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { name: 'asc' } });
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

// POST /admin/delivery/zones — create a new delivery zone
router.post('/zones', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { name, feeSdg, slaHours } = req.body;

    if (!name || feeSdg == null) {
      return res.status(400).json({ error: 'name and feeSdg are required.' });
    }

    const zone = await prisma.deliveryZone.create({
      data: { name, feeSdg, slaHours: slaHours ?? 24 },
    });

    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
});

// PUT /admin/delivery/zones/:id — update fee, SLA, or active/inactive coverage (FR-DEL-001)
router.put('/zones/:id', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, feeSdg, slaHours, active } = req.body;

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(feeSdg !== undefined && { feeSdg }),
        ...(slaHours !== undefined && { slaHours }),
        ...(active !== undefined && { active }),
      },
    });

    res.json(zone);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
