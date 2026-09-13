/**
 * Product Suggestions Service
 * ---------------------------------------------------------------
 * FR-CAT-005: Similar devices — same category, CROSS-BRAND,
 *             ranked by closeness on `comparable` spec attributes
 *             (e.g. RAM, storage, screen size). Brand is NOT a
 *             ranking factor (confirmed decision).
 *
 * FR-CAT-006: Compatible accessories — manually linked by admin
 *             via ProductCompatibility, not automatically derived.
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Attempt to parse a spec value as a number for distance comparison.
 * Falls back to exact string match (distance 0 or 1) for non-numeric specs.
 */
function specDistance(valueA, valueB) {
  const numA = parseFloat(valueA);
  const numB = parseFloat(valueB);

  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA === 0 && numB === 0) return 0;
    const maxVal = Math.max(Math.abs(numA), Math.abs(numB), 1);
    return Math.abs(numA - numB) / maxVal; // normalized 0..1+
  }

  return valueA === valueB ? 0 : 1;
}

/**
 * Get similar products: same category, cross-brand, ranked by
 * comparable spec attribute closeness. Excludes the product itself
 * and inactive / out-of-stock / discontinued items.
 */
async function getSimilarProducts(productId, limit = 8) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      specifications: { include: { attribute: true } },
    },
  });

  if (!product) throw new Error(`Product ${productId} not found`);

  const comparableSpecs = product.specifications.filter(
    (s) => s.attribute.comparable
  );

  const candidates = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      active: true,
      productType: 'DEVICE',
      supplierProducts: {
        some: { availability: { in: ['AVAILABLE', 'REQUIRES_CONFIRMATION'] } },
      },
    },
    include: {
      specifications: { include: { attribute: true } },
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  const ranked = candidates
    .map((candidate) => {
      let totalDistance = 0;
      let comparedCount = 0;

      for (const spec of comparableSpecs) {
        const match = candidate.specifications.find(
          (s) => s.attributeId === spec.attributeId
        );
        if (match) {
          totalDistance += specDistance(spec.value, match.value);
          comparedCount += 1;
        }
      }

      // Products with no comparable overlap rank last
      const avgDistance = comparedCount > 0 ? totalDistance / comparedCount : Infinity;

      return { product: candidate, avgDistance };
    })
    .sort((a, b) => a.avgDistance - b.avgDistance)
    .slice(0, limit)
    .map((r) => r.product);

  return ranked;
}

/**
 * Get compatible accessories for a given device product.
 * Purely relational lookup via ProductCompatibility — no spec matching.
 */
async function getCompatibleAccessories(deviceProductId) {
  const links = await prisma.productCompatibility.findMany({
    where: {
      compatibleProductId: deviceProductId,
      active: true,
      accessoryProduct: { active: true },
    },
    include: { accessoryProduct: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
  });

  return links
    .map((l) => l.accessoryProduct)
    .filter((p) => p.active);
}

module.exports = {
  getSimilarProducts,
  getCompatibleAccessories,
};
