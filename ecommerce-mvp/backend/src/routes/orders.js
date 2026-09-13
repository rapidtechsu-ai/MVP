const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { getOtpThresholdSdg } = require('../services/settingsService');
const requireStaffAuth = require('../middleware/requireStaffAuth');
const requireRole = require('../middleware/requireRole');
const auditLog = require('../middleware/auditLog');
const attachCustomerIfPresent = require('../middleware/attachCustomerIfPresent');

const prisma = new PrismaClient();

router.use(attachCustomerIfPresent);

// POST /cart/quote — subtotal, delivery, total (NOT a price lock)
router.post('/cart/quote', async (req, res, next) => {
  try {
    const { items, zoneId } = req.body; // items: [{ productId, qty }]

    const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
    if (!zone) return res.status(400).json({ error: 'Invalid delivery zone.' });

    let subtotal = 0;
    const lineItems = [];

    for (const item of items) {
      const priceRecord = await prisma.priceHistory.findFirst({
        where: { productId: item.productId },
        orderBy: { effectiveAt: 'desc' },
      });

      if (!priceRecord) {
        return res.status(400).json({ error: `No price set for product ${item.productId}` });
      }

      const lineTotal = Number(priceRecord.calculatedSdg) * item.qty;
      subtotal += lineTotal;

      lineItems.push({
        productId: item.productId,
        qty: item.qty,
        unitPriceSdg: priceRecord.calculatedSdg,
        lineTotal,
      });
    }

    const deliveryFee = Number(zone.feeSdg);
    const total = subtotal + deliveryFee;
    const otpThreshold = await getOtpThresholdSdg();

    res.json({
      lineItems,
      subtotal,
      deliveryFee,
      total,
      otpRequired: total >= otpThreshold,
    });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id — order detail with items and status history
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        statusHistory: { orderBy: { timestamp: 'asc' } },
        zone: true,
        delivery: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// GET /orders — order history for the logged-in customer.
// Falls back to ?customerId= only if no session is present (kept for
// backward compatibility during development; a customer's own orders
// should normally come from their verified session, not a query param
// anyone could tamper with).
router.get('/', async (req, res, next) => {
  try {
    const customerId = req.customer?.customerId || req.query.customerId;
    if (!customerId) return res.status(400).json({ error: 'Login required or customerId must be provided.' });

    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// POST /orders — create checkout/order request (UC-01)
// Accepts either an existing customerId (logged-in customer) or a mobile
// number (guest checkout) — guest checkout finds-or-creates the Customer
// record, matching the confirmed "no login required to buy" MVP design.
router.post('/', async (req, res, next) => {
  try {
    const { customerId, mobile, name, zoneId, items } = req.body;

    if (!customerId && !mobile) {
      return res.status(400).json({ error: 'customerId or mobile is required.' });
    }

    const customer = customerId
      ? await prisma.customer.findUnique({ where: { id: customerId } })
      : await prisma.customer.upsert({
          where: { mobile },
          update: {},
          create: { mobile, name: name || mobile },
        });

    if (!customer) {
      return res.status(400).json({ error: 'Customer not found.' });
    }

    const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
    if (!zone) return res.status(400).json({ error: 'Invalid delivery zone.' });

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const priceRecord = await prisma.priceHistory.findFirst({
        where: { productId: item.productId },
        orderBy: { effectiveAt: 'desc' },
      });

      if (!priceRecord) {
        return res.status(400).json({ error: `No price set for product ${item.productId}` });
      }

      const unitPriceSdg = Number(priceRecord.calculatedSdg);
      subtotal += unitPriceSdg * item.qty;

      orderItemsData.push({
        productId: item.productId,
        qty: item.qty,
        unitPriceSdg,
        costAedSnapshot: priceRecord.costAed,
        fxSnapshot: priceRecord.fxRate,
        markupSnapshot: priceRecord.markupPercent,
      });
    }

    const deliveryFee = Number(zone.feeSdg);
    const total = subtotal + deliveryFee;
    const otpThreshold = await getOtpThresholdSdg();
    const otpRequired = total >= otpThreshold;

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        zoneId,
        subtotal,
        deliveryFee,
        total,
        otpRequired,
        status: otpRequired ? 'VERIFICATION' : 'NEW',
        items: { create: orderItemsData },
        statusHistory: {
          create: {
            toStatus: otpRequired ? 'VERIFICATION' : 'NEW',
            actor: 'CUSTOMER',
          },
        },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// POST /admin/orders/:id/availability — record supplier availability (FR-ORD-005)
router.post('/:id/availability', requireStaffAuth, requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplierId, orderItemId } = req.body;

    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { supplierId },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        toStatus: 'RESERVED',
        actor: req.user.email,
        reason: 'Supplier availability confirmed',
      },
    });

    res.json({ status: 'RESERVED' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/orders/:id/status — controlled lifecycle transition (FR-ORD-007/008)
router.post(
  '/:id/status',
  requireStaffAuth,
  requireRole('OPERATIONS', 'DELIVERY'),
  auditLog({
    entity: 'Order',
    action: 'STATUS_CHANGE',
    getEntityId: (req) => req.params.id,
    getBefore: async (req) => prisma.order.findUnique({ where: { id: req.params.id } }),
  }),
  async (req, res, next) => {
  try {
    const { id } = req.params;
    const { toStatus, reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: toStatus,
        statusHistory: {
          create: { fromStatus: order.status, toStatus, actor: req.user.email, reason },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
