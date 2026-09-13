const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');

const prisma = new PrismaClient();

// GET /admin/suppliers — list all suppliers with their product count
router.get('/', async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: { supplierProducts: true },
    });
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
});

// GET /admin/suppliers/:id — supplier detail with full product list
router.get('/:id', async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { supplierProducts: { include: { product: true } } },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
    res.json(supplier);
  } catch (err) {
    next(err);
  }
});

// POST /admin/suppliers — create a supplier (FR-SUP-001)
router.post('/', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { name, contacts, paymentTerms } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const supplier = await prisma.supplier.create({
      data: { name, contacts, paymentTerms },
    });
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
});

// PUT /admin/suppliers/:id — update supplier details or active status
router.put('/:id', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { name, contacts, paymentTerms, active } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(contacts !== undefined && { contacts }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(supplier);
  } catch (err) {
    next(err);
  }
});

// POST /admin/suppliers/:id/products — link a product to this supplier with cost/availability (FR-SUP-002)
router.post('/:id/products', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, supplierSku, costAed, availability, warranty } = req.body;

    if (!productId || costAed == null) {
      return res.status(400).json({ error: 'productId and costAed are required.' });
    }

    const supplierProduct = await prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId: id, productId } },
      update: { supplierSku, costAed, availability, warranty, lastConfirmedAt: new Date() },
      create: { supplierId: id, productId, supplierSku, costAed, availability, warranty, lastConfirmedAt: new Date() },
    });

    res.json(supplierProduct);
  } catch (err) {
    next(err);
  }
});

// PUT /admin/suppliers/:id/products/:supplierProductId — update cost/availability confirmation
router.put('/:id/products/:supplierProductId', requireRole('OPERATIONS'), async (req, res, next) => {
  try {
    const { supplierProductId } = req.params;
    const { costAed, availability, warranty } = req.body;

    const supplierProduct = await prisma.supplierProduct.update({
      where: { id: supplierProductId },
      data: {
        ...(costAed !== undefined && { costAed }),
        ...(availability !== undefined && { availability }),
        ...(warranty !== undefined && { warranty }),
        lastConfirmedAt: new Date(),
      },
    });

    res.json(supplierProduct);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
