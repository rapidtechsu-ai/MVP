/**
 * Pricing Engine
 * ---------------------------------------------------------------
 * Business rule (BRULE-001, confirmed):
 *
 *   Selling Price (SDG) = Supplier Cost (AED) x (1 + Markup%) x AED->SDG FX Rate
 *
 * - No rounding applied. Exact calculated value is stored and shown.
 * - Markup precedence: Product override > Category default > Global default.
 * - Every calculation must be persisted to PriceHistory (immutable, append-only).
 *
 * Example (confirmed with business owner):
 *   Cost = 500 AED, Markup = 5%, FX = 1700
 *   -> 500 * 1.05 * 1700 = 892,500 SDG
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Resolve the effective markup percent for a product.
 * Precedence: ProductMarkupOverride > MarkupRule(CATEGORY) > MarkupRule(GLOBAL)
 */
async function resolveMarkupPercent(product) {
  const override = await prisma.productMarkupOverride.findUnique({
    where: { productId: product.id },
  });

  const isActive = (rule) =>
    rule &&
    (!rule.effectiveTo || new Date(rule.effectiveTo) > new Date());

  if (isActive(override)) {
    return { percent: Number(override.percent), source: 'PRODUCT_OVERRIDE' };
  }

  const categoryRule = await prisma.markupRule.findFirst({
    where: { scopeType: 'CATEGORY', categoryId: product.categoryId },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (isActive(categoryRule)) {
    return { percent: Number(categoryRule.percent), source: 'CATEGORY_DEFAULT' };
  }

  const globalRule = await prisma.markupRule.findFirst({
    where: { scopeType: 'GLOBAL' },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (isActive(globalRule)) {
    return { percent: Number(globalRule.percent), source: 'GLOBAL_DEFAULT' };
  }

  // Fallback placeholder default, per MVP decision (configurable, default 5%)
  return { percent: 5, source: 'HARDCODED_FALLBACK' };
}

/**
 * Get the currently active AED -> SDG exchange rate.
 */
async function getActiveExchangeRate() {
  const rate = await prisma.exchangeRate.findFirst({
    where: { currencyPair: 'AED_SDG', status: 'ACTIVE' },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!rate) {
    throw new Error('No active AED_SDG exchange rate configured.');
  }

  return rate;
}

/**
 * Core calculation — pure function, no side effects, no rounding.
 */
function calculateSellingPrice({ costAed, markupPercent, fxRate }) {
  const cost = Number(costAed);
  const markupMultiplier = 1 + Number(markupPercent) / 100;
  const fx = Number(fxRate);

  const sellingPriceSdg = cost * markupMultiplier * fx;

  return sellingPriceSdg; // exact value — do not round
}

/**
 * Calculate and persist price for a given product + supplier cost.
 * Creates an immutable PriceHistory record.
 */
async function calculateAndRecordPrice({ productId, costAed, actor }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Product ${productId} not found`);

  const { percent: markupPercent } = await resolveMarkupPercent(product);
  const exchangeRate = await getActiveExchangeRate();

  const calculatedSdg = calculateSellingPrice({
    costAed,
    markupPercent,
    fxRate: exchangeRate.rate,
  });

  const priceHistory = await prisma.priceHistory.create({
    data: {
      productId,
      costAed,
      fxRate: exchangeRate.rate,
      markupPercent,
      calculatedSdg,
      createdBy: actor,
    },
  });

  return priceHistory;
}

/**
 * Recalculate prices for all active products when FX rate changes (UC-02).
 */
async function recalculateAllActivePrices({ actor }) {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { supplierProducts: { where: { availability: { not: 'DISCONTINUED' } } } },
  });

  const results = [];
  for (const product of products) {
    // Use the lowest supplier cost as the basis, per typical sourcing logic
    const cheapestSupplierProduct = product.supplierProducts.sort(
      (a, b) => Number(a.costAed) - Number(b.costAed)
    )[0];

    if (!cheapestSupplierProduct) continue;

    const record = await calculateAndRecordPrice({
      productId: product.id,
      costAed: cheapestSupplierProduct.costAed,
      actor,
    });

    results.push(record);
  }

  return results;
}

module.exports = {
  resolveMarkupPercent,
  getActiveExchangeRate,
  calculateSellingPrice,
  calculateAndRecordPrice,
  recalculateAllActivePrices,
};
