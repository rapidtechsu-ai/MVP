const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');
const auditLog = require('../middleware/auditLog');

const prisma = new PrismaClient();

// GET /admin/finance/cash-collections — list, most recent first
router.get('/cash-collections', async (req, res, next) => {
  try {
    const collections = await prisma.cashCollection.findMany({
      orderBy: { collectedAt: 'desc' },
      include: { order: { include: { customer: true } } },
    });
    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// POST /admin/finance/cash-collections — record COD collection (FR-FIN-001)
router.post(
  '/cash-collections',
  requireRole('FINANCE'),
  auditLog({ entity: 'CashCollection', action: 'CREATE', getEntityId: (req, body) => body.id }),
  async (req, res, next) => {
  try {
    const { orderId, amount, collectedBy } = req.body;
    if (!orderId || amount == null || !collectedBy) {
      return res.status(400).json({ error: 'orderId, amount, and collectedBy are required.' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const collection = await prisma.cashCollection.create({
      data: { orderId, amount, collectedBy },
    });

    // Reconciliation note: amount vs order.total mismatch is flagged but not
    // blocked — a supervisor should review discrepancies (BR-012 distinguishes
    // order value, recognized sales, and cash collected as separate concepts).
    const reconciliationStatus = Number(amount) === Number(order.total) ? 'MATCHED' : 'DISCREPANCY';
    await prisma.cashCollection.update({
      where: { id: collection.id },
      data: { reconciliationStatus },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CASH_COLLECTED',
        statusHistory: {
          create: { fromStatus: order.status, toStatus: 'CASH_COLLECTED', actor: collectedBy },
        },
      },
    });

    // Creating the supplier payable at collection time is one reasonable
    // interpretation of D-004 (trigger timing is still an open business
    // decision — see requirements Section 15). Swap this for
    // delivery-based or reservation-based triggering once that's decided.
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (!item.supplierId) continue;
      const existingPayable = await prisma.supplierPayable.findFirst({ where: { orderItemId: item.id } });
      if (existingPayable) continue;

      await prisma.supplierPayable.create({
        data: {
          supplierId: item.supplierId,
          orderItemId: item.id,
          amount: Number(item.costAedSnapshot) * Number(item.fxSnapshot) * item.qty,
          currency: 'SDG',
        },
      });
    }

    res.status(201).json({ ...collection, reconciliationStatus });
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/supplier-payables — outstanding + settled payables
router.get('/supplier-payables', async (req, res, next) => {
  try {
    const { supplierId, status } = req.query;

    const payables = await prisma.supplierPayable.findMany({
      where: {
        ...(supplierId && { supplierId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, orderItem: { include: { product: true } } },
    });

    res.json(payables);
  } catch (err) {
    next(err);
  }
});

// POST /admin/finance/supplier-payments — record a settlement payment (FR-FIN-003)
router.post(
  '/supplier-payments',
  requireRole('FINANCE'),
  auditLog({ entity: 'SupplierPayment', action: 'CREATE', getEntityId: (req, body) => body.id }),
  async (req, res, next) => {
  try {
    const { supplierId, amount, reference, payableIds } = req.body;

    if (!supplierId || amount == null) {
      return res.status(400).json({ error: 'supplierId and amount are required.' });
    }

    const payment = await prisma.supplierPayment.create({
      data: { supplierId, amount, reference },
    });

    // Mark the specified payables as settled. Reversal/adjustment for
    // corrections should be a new record, not a deletion (Section 9).
    if (Array.isArray(payableIds) && payableIds.length > 0) {
      await prisma.supplierPayable.updateMany({
        where: { id: { in: payableIds } },
        data: { status: 'PAID' },
      });
    }

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

// GET /admin/finance/supplier-payments — payment history
router.get('/supplier-payments', async (req, res, next) => {
  try {
    const { supplierId } = req.query;
    const payments = await prisma.supplierPayment.findMany({
      where: supplierId ? { supplierId } : {},
      orderBy: { paidAt: 'desc' },
      include: { supplier: true },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
