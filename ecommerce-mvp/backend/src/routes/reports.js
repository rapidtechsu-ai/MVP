const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseDateRange(query) {
  const { startDate, endDate } = query;
  return {
    gte: startDate ? new Date(startDate) : new Date(0),
    lte: endDate ? new Date(endDate) : new Date(),
  };
}

// GET /admin/reports/sales — totals + breakdown by date range (FR-REP-001)
router.get('/sales', async (req, res, next) => {
  try {
    const createdAt = parseDateRange(req.query);

    const orders = await prisma.order.findMany({
      where: { createdAt, status: { notIn: ['CANCELLED'] } },
      include: { items: true, zone: true },
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;

    const byZone = {};
    for (const o of orders) {
      const zoneName = o.zone?.name || 'غير محدد';
      byZone[zoneName] = (byZone[zoneName] || 0) + Number(o.total);
    }

    res.json({ totalSales, totalOrders, byZone });
  } catch (err) {
    next(err);
  }
});

// GET /admin/reports/profitability — revenue, cost, gross profit by product (FR-REP-002)
router.get('/profitability', async (req, res, next) => {
  try {
    const createdAt = parseDateRange(req.query);

    const items = await prisma.orderItem.findMany({
      where: { order: { createdAt, status: { notIn: ['CANCELLED'] } } },
      include: { product: { include: { category: true } } },
    });

    const byProduct = {};
    for (const item of items) {
      const key = item.productId;
      const revenue = Number(item.unitPriceSdg) * item.qty;
      const cost = Number(item.costAedSnapshot) * Number(item.fxSnapshot) * item.qty;
      const grossProfit = revenue - cost;

      if (!byProduct[key]) {
        byProduct[key] = {
          productId: key,
          productName: item.product?.nameAr || key,
          category: item.product?.category?.nameAr || '—',
          qty: 0,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
        };
      }

      byProduct[key].qty += item.qty;
      byProduct[key].revenue += revenue;
      byProduct[key].cost += cost;
      byProduct[key].grossProfit += grossProfit;
    }

    const rows = Object.values(byProduct).sort((a, b) => b.grossProfit - a.grossProfit);
    const totals = rows.reduce(
      (acc, r) => ({
        revenue: acc.revenue + r.revenue,
        cost: acc.cost + r.cost,
        grossProfit: acc.grossProfit + r.grossProfit,
      }),
      { revenue: 0, cost: 0, grossProfit: 0 }
    );

    res.json({ rows, totals });
  } catch (err) {
    next(err);
  }
});

// GET /admin/reports/suppliers — purchases, payable, paid, outstanding by supplier (FR-REP-003)
router.get('/suppliers', async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { payables: true, payments: true },
    });

    const rows = suppliers.map((s) => {
      const totalPurchases = s.payables.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const outstanding = s.payables
        .filter((p) => p.status !== 'PAID')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        supplierId: s.id,
        supplierName: s.name,
        totalPurchases,
        totalPaid,
        outstanding,
      };
    });

    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

// GET /admin/reports/pricing — FX rate history + product price changes (FR-REP-004)
router.get('/pricing', async (req, res, next) => {
  try {
    const rates = await prisma.exchangeRate.findMany({ orderBy: { effectiveFrom: 'desc' }, take: 20 });
    const priceChanges = await prisma.priceHistory.findMany({
      orderBy: { effectiveAt: 'desc' },
      take: 50,
      include: { product: true },
    });

    res.json({ rates, priceChanges });
  } catch (err) {
    next(err);
  }
});

// GET /admin/reports/cancellations — reason, stage, product, zone breakdown
router.get('/cancellations', async (req, res, next) => {
  try {
    const createdAt = parseDateRange(req.query);

    const cancelledOrders = await prisma.order.findMany({
      where: { createdAt, status: 'CANCELLED' },
      include: {
        zone: true,
        statusHistory: { where: { toStatus: 'CANCELLED' }, orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });

    const byZone = {};
    const reasons = [];
    for (const o of cancelledOrders) {
      const zoneName = o.zone?.name || 'غير محدد';
      byZone[zoneName] = (byZone[zoneName] || 0) + 1;
      const reason = o.statusHistory[0]?.reason || 'غير محدد';
      reasons.push({ orderId: o.id, reason, value: Number(o.total) });
    }

    res.json({ totalCancelled: cancelledOrders.length, byZone, reasons });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
