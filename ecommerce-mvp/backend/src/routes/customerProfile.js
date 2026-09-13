const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireCustomerAuth = require('../middleware/requireCustomerAuth');

const prisma = new PrismaClient();

router.use(requireCustomerAuth);

// GET /customer/me — current profile
router.get('/me', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.customer.customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// PUT /customer/me — update name/email (mobile is fixed — it's the login identity)
router.put('/me', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.customer.customerId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
    });
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// GET /customer/addresses — saved addresses for the logged-in customer
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { customerId: req.customer.customerId },
      include: { zone: true },
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

// POST /customer/addresses — save a new address
router.post('/addresses', async (req, res, next) => {
  try {
    const { zoneId, addressText, landmark } = req.body;
    if (!zoneId || !addressText) {
      return res.status(400).json({ error: 'zoneId and addressText are required.' });
    }

    const address = await prisma.address.create({
      data: { customerId: req.customer.customerId, zoneId, addressText, landmark },
    });

    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
});

// PUT /customer/addresses/:id — update a saved address (only if it belongs to this customer)
router.put('/addresses/:id', async (req, res, next) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.customerId !== req.customer.customerId) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    const { zoneId, addressText, landmark } = req.body;
    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        ...(zoneId !== undefined && { zoneId }),
        ...(addressText !== undefined && { addressText }),
        ...(landmark !== undefined && { landmark }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /customer/addresses/:id — remove a saved address (only if it belongs to this customer)
router.delete('/addresses/:id', async (req, res, next) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.customerId !== req.customer.customerId) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
