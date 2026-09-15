/**
 * Seed script — populates enough data to demo the full MVP flow end to
 * end: a few categories/products with comparable specs (for similar-
 * device suggestions), an accessory linked to a device (for compatible-
 * accessory suggestions), delivery zones, an active FX rate, and a
 * bootstrapped SYSTEM_ADMIN so the dashboard login isn't a dead end.
 *
 * Run with: node prisma/seed.js
 * (safe to re-run — uses upsert/skip-if-exists patterns throughout)
 */

require('dotenv').config(); // FIX (2026-09-13): plain `node` scripts don't
// auto-load .env the way the Prisma CLI does — without this line,
// DATABASE_URL is invisible to this script even if .env is correctly
// filled in, causing "Environment variable not found: DATABASE_URL".

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // ---- Categories ----
  const phones = await prisma.category.upsert({
    where: { id: 'cat-phones' },
    update: {},
    create: { id: 'cat-phones', nameAr: 'هواتف', nameEn: 'Phones' },
  });
  const accessories = await prisma.category.upsert({
    where: { id: 'cat-accessories' },
    update: {},
    create: { id: 'cat-accessories', nameAr: 'إكسسوارات', nameEn: 'Accessories' },
  });
  await prisma.category.upsert({
    where: { id: 'cat-wearables' },
    update: {},
    create: { id: 'cat-wearables', nameAr: 'ساعات', nameEn: 'Wearables' },
  });
  await prisma.category.upsert({
    where: { id: 'cat-appliances' },
    update: {},
    create: { id: 'cat-appliances', nameAr: 'أجهزة منزلية', nameEn: 'Home Appliances' },
  });

  // ---- Brands ----
  const samsung = await prisma.brand.upsert({ where: { id: 'brand-samsung' }, update: {}, create: { id: 'brand-samsung', name: 'Samsung' } });
  const xiaomi = await prisma.brand.upsert({ where: { id: 'brand-xiaomi' }, update: {}, create: { id: 'brand-xiaomi', name: 'Xiaomi' } });
  const apple = await prisma.brand.upsert({ where: { id: 'brand-apple' }, update: {}, create: { id: 'brand-apple', name: 'Apple' } });
  const generic = await prisma.brand.upsert({ where: { id: 'brand-generic' }, update: {}, create: { id: 'brand-generic', name: 'Generic' } });

  // ---- Specification attributes (comparable ones drive similar-product ranking) ----
  const ramAttr = await prisma.specificationAttribute.upsert({
    where: { id: 'spec-ram' },
    update: {},
    create: { id: 'spec-ram', categoryId: phones.id, name: 'الذاكرة العشوائية (RAM)', comparable: true, sortOrder: 1 },
  });
  const storageAttr = await prisma.specificationAttribute.upsert({
    where: { id: 'spec-storage' },
    update: {},
    create: { id: 'spec-storage', categoryId: phones.id, name: 'سعة التخزين', comparable: true, sortOrder: 2 },
  });
  const screenAttr = await prisma.specificationAttribute.upsert({
    where: { id: 'spec-screen' },
    update: {},
    create: { id: 'spec-screen', categoryId: phones.id, name: 'حجم الشاشة', comparable: true, sortOrder: 3 },
  });

  // ---- Products (phones) ----
  const productsData = [
    { id: 'prod-a55', sku: 'SGA55-256', brandId: samsung.id, nameAr: 'سامسونج جالكسي A55 5G', model: 'A55', warranty: 'ضمان سنة', ram: '8', storage: '256', screen: '6.6', costAed: 500 },
    { id: 'prod-a35', sku: 'SGA35-256', brandId: samsung.id, nameAr: 'سامسونج جالكسي A35 5G', model: 'A35', warranty: 'ضمان سنة', ram: '8', storage: '256', screen: '6.6', costAed: 410 },
    { id: 'prod-redmi13', sku: 'XRN13-256', brandId: xiaomi.id, nameAr: 'شاومي ريدمي نوت 13', model: 'Redmi Note 13', warranty: 'ضمان سنة', ram: '8', storage: '256', screen: '6.67', costAed: 370 },
    { id: 'prod-iphone15', sku: 'IP15-128', brandId: apple.id, nameAr: 'آيفون 15', model: 'iPhone 15', warranty: 'ضمان سنة', ram: '6', storage: '128', screen: '6.1', costAed: 720 },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        sku: p.sku,
        categoryId: phones.id,
        brandId: p.brandId,
        model: p.model,
        nameAr: p.nameAr,
        warranty: p.warranty,
        productType: 'DEVICE',
        specifications: {
          create: [
            { attributeId: ramAttr.id, value: p.ram, unit: 'GB' },
            { attributeId: storageAttr.id, value: p.storage, unit: 'GB' },
            { attributeId: screenAttr.id, value: p.screen, unit: 'inch' },
          ],
        },
      },
    });
  }

  // ---- Accessories, linked to the A55 via ProductCompatibility ----
  const caseProduct = await prisma.product.upsert({
    where: { id: 'prod-case-a55' },
    update: {},
    create: {
      id: 'prod-case-a55', sku: 'ACC-CASE-A55', categoryId: accessories.id, brandId: generic.id,
      nameAr: 'جراب حماية A55', productType: 'ACCESSORY',
    },
  });
  const chargerProduct = await prisma.product.upsert({
    where: { id: 'prod-charger-25w' },
    update: {},
    create: {
      id: 'prod-charger-25w', sku: 'ACC-CHG-25W', categoryId: accessories.id, brandId: generic.id,
      nameAr: 'شاحن سريع 25 واط', productType: 'ACCESSORY',
    },
  });

  await prisma.productCompatibility.upsert({
    where: { accessoryProductId_compatibleProductId: { accessoryProductId: caseProduct.id, compatibleProductId: 'prod-a55' } },
    update: {},
    create: { accessoryProductId: caseProduct.id, compatibleProductId: 'prod-a55' },
  });
  await prisma.productCompatibility.upsert({
    where: { accessoryProductId_compatibleProductId: { accessoryProductId: chargerProduct.id, compatibleProductId: 'prod-a55' } },
    update: {},
    create: { accessoryProductId: chargerProduct.id, compatibleProductId: 'prod-a55' },
  });

  // ---- Supplier + supplier-product costs (drives pricing) ----
  const supplier = await prisma.supplier.upsert({
    where: { id: 'supplier-gulf' },
    update: {},
    create: { id: 'supplier-gulf', name: 'مورد الخليج', contacts: '+971-50-0000000', paymentTerms: 'Net 7' },
  });

  const supplierCosts = [
    { productId: 'prod-a55', costAed: 500 },
    { productId: 'prod-a35', costAed: 410 },
    { productId: 'prod-redmi13', costAed: 370 },
    { productId: 'prod-iphone15', costAed: 720 },
    { productId: caseProduct.id, costAed: 10 },
    { productId: chargerProduct.id, costAed: 11 },
  ];

  for (const sc of supplierCosts) {
    await prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId: supplier.id, productId: sc.productId } },
      update: {},
      create: {
        supplierId: supplier.id,
        productId: sc.productId,
        costAed: sc.costAed,
        availability: 'AVAILABLE',
        lastConfirmedAt: new Date(),
      },
    });
  }

  // ---- FX rate + global markup (drives the confirmed pricing formula) ----
  const existingRate = await prisma.exchangeRate.findFirst({ where: { currencyPair: 'AED_SDG', status: 'ACTIVE' } });
  if (!existingRate) {
    await prisma.exchangeRate.create({
      data: { currencyPair: 'AED_SDG', rate: 1700, effectiveFrom: new Date(), enteredBy: 'seed-script', status: 'ACTIVE' },
    });
  }

  const existingMarkup = await prisma.markupRule.findFirst({ where: { scopeType: 'GLOBAL' } });
  if (!existingMarkup) {
    await prisma.markupRule.create({ data: { scopeType: 'GLOBAL', percent: 5 } });
  }

  // ---- Price history entries so products actually show a price ----
  const rate = await prisma.exchangeRate.findFirst({ where: { status: 'ACTIVE' } });
  for (const sc of supplierCosts) {
    const existing = await prisma.priceHistory.findFirst({ where: { productId: sc.productId } });
    if (existing) continue;

    const calculatedSdg = Number(sc.costAed) * 1.05 * Number(rate.rate);
    await prisma.priceHistory.create({
      data: {
        productId: sc.productId,
        costAed: sc.costAed,
        fxRate: rate.rate,
        markupPercent: 5,
        calculatedSdg,
        createdBy: 'seed-script',
      },
    });
  }

  // ---- Delivery zones (Khartoum State) ----
  const zones = [
    { name: 'الخرطوم', feeSdg: 2500, slaHours: 24 },
    { name: 'الخرطوم بحري', feeSdg: 3000, slaHours: 24 },
    { name: 'أم درمان', feeSdg: 4000, slaHours: 24 },
  ];
  for (const z of zones) {
    const existing = await prisma.deliveryZone.findFirst({ where: { name: z.name } });
    if (!existing) await prisma.deliveryZone.create({ data: z });
  }

  // ---- Bootstrap the superuser (SYSTEM_ADMIN) ----
  // SYSTEM_ADMIN bypasses every requireRole() check in the system (see
  // src/middleware/requireRole.js) — this one account has unrestricted
  // access to pricing, finance, suppliers, settings, and user management.
  // The Users & Roles safeguard (src/routes/users.js) guarantees at least
  // one active SYSTEM_ADMIN always exists, so this account can never be
  // locked out by accident.
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'SYSTEM_ADMIN' } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    await prisma.user.create({
      data: {
        name: 'مدير النظام',
        email: 'admin@example.com',
        passwordHash,
        role: 'SYSTEM_ADMIN',
      },
    });
    console.log('Created superuser (full access): admin@example.com / ChangeMe123! — change this password immediately.');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
