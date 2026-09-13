const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');
const auditLog = require('../middleware/auditLog');
const { createUploadUrl, deleteObject, isConfigured, MAX_FILE_SIZE_BYTES, ALLOWED_CONTENT_TYPES } = require('../services/storageService');

const prisma = new PrismaClient();

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
