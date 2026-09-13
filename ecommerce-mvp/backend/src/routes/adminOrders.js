const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /admin/orders — full order queue for dashboard, optional status filter
router.get('/', async (req, res, next) => {
  try {
    const { status, zoneId } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        ...(status && { status }),
        ...(zoneId && { zoneId }),
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true, zone: true, customer: true },
    });

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
