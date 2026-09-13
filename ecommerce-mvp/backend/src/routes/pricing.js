const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');
const auditLog = require('../middleware/auditLog');
const {
  calculateSellingPrice,
  recalculateAllActivePrices,
} = require('../services/pricingEngine');

const prisma = new PrismaClient();

// POST /admin/exchange-rates — create effective FX rate (UC-02)
router.post(
  '/exchange-rates',
  requireRole('PRICING'),
  auditLog({ entity: 'ExchangeRate', action: 'CREATE', getEntityId: (req, body) => body.exchangeRate?.id }),
  async (req, res, next) => {
  try {
    const { rate, effectiveFrom } = req.body;
    const enteredBy = req.user.email;

    if (!rate) {
      return res.status(400).json({ error: 'rate is required.' });
    }

    // Deactivate previous active rate
    await prisma.exchangeRate.updateMany({
      where: { currencyPair: 'AED_SDG', status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    const newRate = await prisma.exchangeRate.create({
      data: {
        currencyPair: 'AED_SDG',
        rate,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        enteredBy,
        status: 'ACTIVE',
      },
    });

    // Recalculate all active product prices per business rule (UC-02 step 4)
    const updated = await recalculateAllActivePrices({ actor: enteredBy });

    res.json({ exchangeRate: newRate, pricesUpdated: updated.length });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/markup-override — product-level override with mandatory reason (UC-03)
router.post(
  '/products/:id/markup-override',
  requireRole('PRICING'),
  auditLog({ entity: 'ProductMarkupOverride', action: 'CREATE', getEntityId: (req) => req.params.id }),
  async (req, res, next) => {
  try {
    const { id } = req.params;
    const { percent, reason } = req.body;
    const approvedBy = req.user.email;

    if (!percent || !reason) {
      return res.status(400).json({
        error: 'percent and reason are required for a markup override.',
      });
    }

    const override = await prisma.productMarkupOverride.upsert({
      where: { productId: id },
      update: { percent, reason, approvedBy, effectiveFrom: new Date() },
      create: { productId: id, percent, reason, approvedBy },
    });

    res.json(override);
  } catch (err) {
    next(err);
  }
});

// GET /admin/pricing/preview — preview calculation without persisting
router.get('/preview', (req, res) => {
  const { costAed, markupPercent, fxRate } = req.query;

  if (!costAed || !markupPercent || !fxRate) {
    return res.status(400).json({ error: 'costAed, markupPercent, and fxRate are required.' });
  }

  const calculatedSdg = calculateSellingPrice({
    costAed: Number(costAed),
    markupPercent: Number(markupPercent),
    fxRate: Number(fxRate),
  });

  res.json({ calculatedSdg }); // exact value, no rounding
});

// GET /admin/pricing/history — immutable price history log (BR-005, US-010)
router.get('/history', async (req, res, next) => {
  try {
    const { productId } = req.query;

    const history = await prisma.priceHistory.findMany({
      where: productId ? { productId } : {},
      orderBy: { effectiveAt: 'desc' },
      take: 100,
      include: { product: true },
    });

    res.json(history);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
