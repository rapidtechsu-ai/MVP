require('dotenv').config(); // Loads .env locally. On Render/Railway this
// is a harmless no-op since those platforms inject env vars directly —
// but without this line, `npm run dev` / `node src/app.js` run locally
// never sees DATABASE_URL, JWT_SECRET, etc. even if .env is filled in
// correctly, since plain `node` doesn't auto-load .env the way the
// Prisma CLI does.

const express = require('express');
const cors = require('cors');

const catalogRoutes = require('./routes/catalog');
const pricingRoutes = require('./routes/pricing');
const orderRoutes = require('./routes/orders');
const otpRoutes = require('./routes/otp');
const deliveryRoutes = require('./routes/delivery');
const adminOrdersRoutes = require('./routes/adminOrders');
const settingsRoutes = require('./routes/settings');
const authStaffRoutes = require('./routes/authStaff');
const authCustomerRoutes = require('./routes/authCustomer');
const suppliersRoutes = require('./routes/suppliers');
const financeRoutes = require('./routes/finance');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const customerProfileRoutes = require('./routes/customerProfile');
const productImagesRoutes = require('./routes/productImages');
const requireStaffAuth = require('./middleware/requireStaffAuth');

const app = express();

// CORS_ORIGIN can be set to your deployed frontend URL to lock this down
// (e.g. "https://your-app.vercel.app"). Left unset, it allows any origin —
// fine for an internal MVP demo, not recommended once real customer data
// is involved. Since auth uses Bearer tokens (not cookies) across origins,
// this doesn't need `credentials: true`.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Public
app.use('/catalog', catalogRoutes);
app.use('/orders', orderRoutes); // mixed: customer routes are public, staff-only sub-routes protect themselves
app.use('/otp', otpRoutes);
app.use('/auth/staff', authStaffRoutes);
app.use('/auth/customer', authCustomerRoutes);
app.use('/customer', customerProfileRoutes); // login-required (enforced inside the router itself)

// Staff-only (dashboard) — every route below requires a valid staff JWT
app.use('/admin/pricing', requireStaffAuth, pricingRoutes);
app.use('/admin/delivery', requireStaffAuth, deliveryRoutes);
app.use('/admin/orders', requireStaffAuth, adminOrdersRoutes);
app.use('/admin/settings', requireStaffAuth, settingsRoutes);
app.use('/admin/suppliers', requireStaffAuth, suppliersRoutes);
app.use('/admin/finance', requireStaffAuth, financeRoutes);
app.use('/admin/reports', requireStaffAuth, reportsRoutes);
app.use('/admin/users', requireStaffAuth, usersRoutes);
app.use('/admin/products', requireStaffAuth, productImagesRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

module.exports = app;
