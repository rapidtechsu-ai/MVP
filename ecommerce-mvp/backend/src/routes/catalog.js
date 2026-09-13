const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { getSimilarProducts, getCompatibleAccessories } = require('../services/productSuggestions');

const prisma = new PrismaClient();

// GET /catalog/categories — active categories for nav/filters
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { nameAr: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET /catalog/delivery-zones — active delivery zones for checkout
router.get('/delivery-zones', async (req, res, next) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ where: { active: true } });
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

// GET /catalog/products — search/filter/list active products (FR-CAT-003)
router.get('/products', async (req, res, next) => {
  try {
    const { categoryId, brandId, search } = req.query;

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(categoryId && { categoryId }),
        ...(brandId && { brandId }),
        ...(search && {
          OR: [
            { nameAr: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        brand: true,
        priceHistory: { orderBy: { effectiveAt: 'desc' }, take: 1 },
        supplierProducts: { orderBy: { costAed: 'asc' }, take: 1 },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /catalog/products/:id — product detail + specs + price (FR-CAT-004)
// Includes similar devices (FR-CAT-005) and compatible accessories (FR-CAT-006)
router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        specifications: { include: { attribute: true } },
        supplierProducts: true,
        priceHistory: { orderBy: { effectiveAt: 'desc' }, take: 1 },
        compatibleWith: { include: { compatibleProduct: true } }, // accessory -> linked devices
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [similarProducts, compatibleAccessories] = await Promise.all([
      product.productType === 'DEVICE' ? getSimilarProducts(id) : [],
      product.productType === 'DEVICE' ? getCompatibleAccessories(id) : [],
    ]);

    res.json({
      ...product,
      compatibleWith: product.compatibleWith.map((link) => link.compatibleProduct),
      similarProducts,
      compatibleAccessories,
    });
  } catch (err) {
    next(err);
  }
});

// POST /compare — normalized comparison dataset (FR-CMP-001), max 3 products
router.post('/compare', async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 3) {
      return res.status(400).json({ error: 'Provide 2–3 product IDs to compare.' });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { specifications: { include: { attribute: true } }, category: true, images: { orderBy: { sortOrder: 'asc' } } },
    });

    const categoryIds = new Set(products.map((p) => p.categoryId));
    if (categoryIds.size > 1) {
      return res.status(400).json({ error: 'Products must be from the same category to compare.' });
    }

    res.json({ products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
