const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');
const auditLog = require('../middleware/auditLog');
const { createUploadUrl, deleteObject, isConfigured, MAX_FILE_SIZE_BYTES, ALLOWED_CONTENT_TYPES } = require('../services/storageService');
const { calculateAndRecordPrice } = require('../services/pricingEngine');

const prisma = new PrismaClient();

// GET /admin/products/brands — for the "new product" and device-picker forms.
// catalog.js only exposes /categories publicly; brands didn't have a
// dashboard-facing list endpoint at all before this.
router.get('/brands', async (req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    res.json(brands);
  } catch (err) {
    next(err);
  }
});

// GET /admin/products/devices — DEVICE-type products, for the compatible-
// accessory picker. ?search= filters by name; ?excludeId= drops a product
// from its own results (an accessory shouldn't link to itself, though in
// practice this only matters if productType is ever changed after creation).
router.get('/devices', async (req, res, next) => {
  try {
    const { search, excludeId } = req.query;
    const devices = await prisma.product.findMany({
      where: {
        productType: 'DEVICE',
        active: true,
        ...(excludeId && { id: { not: excludeId } }),
        ...(search && { nameAr: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: { nameAr: 'asc' },
      take: 30,
    });
    res.json(devices);
  } catch (err) {
    next(err);
  }
});

// POST /admin/products — create a new product. Was entirely missing
// before (the dashboard's "New Product" screen just showed a static
// "planned fields" notice with no working form behind it).
// If costAed + supplierId are provided, this also creates the initial
// SupplierProduct link and calculates the first PriceHistory entry —
// without this, a newly created product would show no price at all,
// same as any product that's never had a supplier cost recorded.
router.post(
  '/',
  requireRole('OPERATIONS'),
  auditLog({ entity: 'Product', action: 'CREATE', getEntityId: (req, body) => body.id }),
  async (req, res, next) => {
    try {
      const {
        nameAr, nameEn, sku, model, categoryId, brandId,
        productType, warranty, description,
        supplierId, costAed,
      } = req.body;

      if (!nameAr || !sku || !categoryId) {
        return res.status(400).json({ error: 'nameAr, sku, and categoryId are required.' });
      }

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        return res.status(409).json({ error: 'A product with this SKU already exists.' });
      }

      const product = await prisma.product.create({
        data: {
          nameAr,
          nameEn: nameEn || null,
          sku,
          model: model || null,
          categoryId,
          brandId: brandId || null,
          productType: productType === 'ACCESSORY' ? 'ACCESSORY' : 'DEVICE',
          warranty: warranty || null,
          description: description || null,
        },
      });

      if (supplierId && costAed) {
        await prisma.supplierProduct.create({
          data: {
            supplierId,
            productId: product.id,
            costAed: Number(costAed),
            availability: 'REQUIRES_CONFIRMATION',
          },
        });
        await calculateAndRecordPrice({
          productId: product.id,
          costAed: Number(costAed),
          actor: req.user.email,
        });
      }

      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /admin/products/:id — update basic product fields (name, description,
// warranty, model, delivery speed). Previously only deliverySpeed was
// actually wired here even though the edit form showed a name field —
// editing the name silently did nothing before this.
router.put(
  '/:id',
  requireRole('OPERATIONS'),
  auditLog({ entity: 'Product', action: 'UPDATE', getEntityId: (req) => req.params.id }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { deliverySpeed, nameAr, nameEn, model, warranty, description } = req.body;

      if (deliverySpeed && !['STANDARD', 'RAPID'].includes(deliverySpeed)) {
        return res.status(400).json({ error: 'deliverySpeed must be STANDARD or RAPID.' });
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(deliverySpeed && { deliverySpeed }),
          ...(nameAr !== undefined && { nameAr }),
          ...(nameEn !== undefined && { nameEn }),
          ...(model !== undefined && { model }),
          ...(warranty !== undefined && { warranty }),
          ...(description !== undefined && { description }),
        },
      });

      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

// POST /admin/products/:id/compatibility — link an accessory (:id) to a
// device it's compatible with. This is the actual write endpoint behind
// the "+ إضافة جهاز" button, which previously had no functionality at all.
router.post(
  '/:id/compatibility',
  requireRole('OPERATIONS'),
  auditLog({ entity: 'ProductCompatibility', action: 'CREATE', getEntityId: (req, body) => body.id }),
  async (req, res, next) => {
    try {
      const { id: accessoryProductId } = req.params;
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required.' });
      }

      const link = await prisma.productCompatibility.upsert({
        where: { accessoryProductId_compatibleProductId: { accessoryProductId, compatibleProductId: deviceId } },
        update: { active: true },
        create: { accessoryProductId, compatibleProductId: deviceId },
        include: { compatibleProduct: true },
      });

      res.status(201).json(link);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /admin/products/:id/compatibility/:deviceId — remove a link
router.delete(
  '/:id/compatibility/:deviceId',
  requireRole('OPERATIONS'),
  auditLog({ entity: 'ProductCompatibility', action: 'DELETE', getEntityId: (req) => req.params.deviceId }),
  async (req, res, next) => {
    try {
      const { id: accessoryProductId, deviceId } = req.params;
      await prisma.productCompatibility.deleteMany({
        where: { accessoryProductId, compatibleProductId: deviceId },
      });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

// GET /admin/products/:id/images/config — lets the dashboard show a clear
// "image storage not configured" state instead of a confusing failure.
router.get('/:id/images/config', (req, res) => {
  res.json({
    configured: isConfigured(),
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    allowedContentTypes: ALLOWED_CONTENT_TYPES,
  });
});

// POST /admin/products/:id/images/presign — request a one-time upload URL.
// Called once per file — the frontend loops this for multi-file upload,
// so single vs. multiple upload is purely a frontend loop, not a
// different API shape.
router.post('/:id/images/presign', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { filename, contentType, fileSize } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required.' });
    }

    if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ error: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const { uploadUrl, publicUrl } = await createUploadUrl({ productId, filename, contentType });
    res.json({ uploadUrl, publicUrl });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/images — confirm a completed upload and save it
// to the product's gallery. Called after the browser has successfully
// PUT the file to the presigned URL from the route above.
router.post(
  '/:id/images',
  requireRole('OPERATIONS'),
  auditLog({ entity: 'ProductImage', action: 'CREATE', getEntityId: (req, body) => body.id }),
  async (req, res, next) => {
    try {
      const { id: productId } = req.params;
      const { url } = req.body;

      if (!url) return res.status(400).json({ error: 'url is required.' });

      const currentMax = await prisma.productImage.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });

      const image = await prisma.productImage.create({
        data: { productId, url, sortOrder: (currentMax._max.sortOrder ?? -1) + 1 },
      });

      res.status(201).json(image);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /admin/products/:id/images/reorder — accepts an ordered array of
// image IDs; the array's position becomes the new sortOrder.
router.put('/:id/images/reorder', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'imageIds must be an array.' });
    }

    await Promise.all(
      imageIds.map((imageId, index) =>
        prisma.productImage.updateMany({
          where: { id: imageId, productId }, // scoped to this product so one product's edit can't reorder another's images
          data: { sortOrder: index },
        })
      )
    );

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(images);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/products/:id/images/:imageId — removes from both DB and storage
router.delete(
  '/:id/images/:imageId',
  requireRole('OPERATIONS'),
  auditLog({ entity: 'ProductImage', action: 'DELETE', getEntityId: (req) => req.params.imageId }),
  async (req, res, next) => {
    try {
      const { id: productId, imageId } = req.params;

      const image = await prisma.productImage.findUnique({ where: { id: imageId } });
      if (!image || image.productId !== productId) {
        return res.status(404).json({ error: 'Image not found.' });
      }

      await prisma.productImage.delete({ where: { id: imageId } });

      // Storage cleanup is best-effort — don't fail the request if the
      // object is already gone or storage is briefly unreachable; the
      // DB record (the source of truth for what's shown) is already removed.
      deleteObject(image.url).catch((err) => console.error('[storage] cleanup failed:', err.message));

      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
