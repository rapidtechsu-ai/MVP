const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_COOKIE = 'staff_token';
const USER_COOKIE = 'staff_user';

/**
 * Isomorphic staff-token reader.
 * Dashboard pages are Server Components that fetch data at request
 * time on the Node server — they cannot read localStorage (browser
 * only). Cookies work in both places: client code reads document.cookie,
 * and Server Components read the same cookie via next/headers, since
 * the browser sends it automatically on every request to this app.
 */
function getStaffToken() {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )staff_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  try {
    // Lazily required so this file stays importable from client components
    // (next/headers throws if imported outside a Server Component context).
    const { cookies } = require('next/headers');
    return cookies().get(TOKEN_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getStaffToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res, fallback) {
  if (!res.ok) {
    if (fallback !== undefined) return fallback;
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Response wasn't JSON — fall back to the generic status message.
    }
    throw new Error(message);
  }
  return res.json();
}

// ---- Staff auth (client-side only — called from the login form) ----
export async function loginStaff({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res);
  setStaffSession(data.token, data.user);
  return data;
}

export async function bootstrapStaff({ name, email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/staff/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await handle(res);
  setStaffSession(data.token, data.user);
  return data;
}

function setStaffSession(token, user) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days, matches backend JWT expiry
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}`;
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}`;
}

export function logoutStaff() {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0`;
}

export function getStoredStaffUser() {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )staff_user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

// ---- Catalog / Products ----
export async function getAdminProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/catalog/products?${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function getAdminProductDetail(id) {
  const res = await fetch(`${API_BASE_URL}/catalog/products/${id}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

// ---- Orders ----
export async function getAdminOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/orders?${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function getAdminOrderDetail(id) {
  const res = await fetch(`${API_BASE_URL}/orders/${id}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function recordAvailability({ orderId, supplierId, orderItemId }) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ supplierId, orderItemId }),
  });
  return handle(res);
}

export async function updateOrderStatus({ orderId, toStatus, reason }) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ toStatus, reason }),
  });
  return handle(res);
}

// ---- Pricing / FX ----
export async function setExchangeRate({ rate, effectiveFrom }) {
  const res = await fetch(`${API_BASE_URL}/admin/pricing/exchange-rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ rate, effectiveFrom }),
  });
  return handle(res);
}

export async function setMarkupOverride({ productId, percent, reason }) {
  const res = await fetch(`${API_BASE_URL}/admin/pricing/products/${productId}/markup-override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ percent, reason }),
  });
  return handle(res);
}

export async function updateProductDeliverySpeed(productId, deliverySpeed) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ deliverySpeed }),
  });
  return handle(res);
}

export async function updateProduct(productId, data) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function createProduct(data) {
  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function getBrands() {
  const res = await fetch(`${API_BASE_URL}/admin/products/brands`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function getCategoriesForAdmin() {
  const res = await fetch(`${API_BASE_URL}/catalog/categories`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function getDeviceProducts({ search, excludeId } = {}) {
  const query = new URLSearchParams({ ...(search && { search }), ...(excludeId && { excludeId }) }).toString();
  const res = await fetch(`${API_BASE_URL}/admin/products/devices?${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function addProductCompatibility(productId, deviceId) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/compatibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ deviceId }),
  });
  return handle(res);
}

export async function removeProductCompatibility(productId, deviceId) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/compatibility/${deviceId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handle(res);
}

export async function previewPrice({ costAed, markupPercent, fxRate }) {
  const query = new URLSearchParams({ costAed, markupPercent, fxRate }).toString();
  const res = await fetch(`${API_BASE_URL}/admin/pricing/preview?${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, { calculatedSdg: null });
}

export async function getPriceHistory(productId) {
  const query = productId ? `?productId=${productId}` : '';
  const res = await fetch(`${API_BASE_URL}/admin/pricing/history${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

// ---- Delivery zones ----
export async function getAdminDeliveryZones() {
  const res = await fetch(`${API_BASE_URL}/admin/delivery/zones`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function createDeliveryZone({ name, feeSdg, slaHours }) {
  const res = await fetch(`${API_BASE_URL}/admin/delivery/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, feeSdg, slaHours }),
  });
  return handle(res);
}

export async function updateDeliveryZone(id, data) {
  const res = await fetch(`${API_BASE_URL}/admin/delivery/zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

// ---- Suppliers ----
export async function getAdminSuppliers() {
  const res = await fetch(`${API_BASE_URL}/admin/suppliers`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function getAdminSupplierDetail(id) {
  const res = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function createSupplier({ name, contacts, paymentTerms }) {
  const res = await fetch(`${API_BASE_URL}/admin/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, contacts, paymentTerms }),
  });
  return handle(res);
}

// ---- Finance: cash collection & supplier settlements ----
export async function getCashCollections() {
  const res = await fetch(`${API_BASE_URL}/admin/finance/cash-collections`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function recordCashCollection({ orderId, amount, collectedBy }) {
  const res = await fetch(`${API_BASE_URL}/admin/finance/cash-collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ orderId, amount, collectedBy }),
  });
  return handle(res);
}

export async function getSupplierPayables(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/finance/supplier-payables?${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function getSupplierPayments(supplierId) {
  const query = supplierId ? `?supplierId=${supplierId}` : '';
  const res = await fetch(`${API_BASE_URL}/admin/finance/supplier-payments${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function recordSupplierPayment({ supplierId, amount, reference, payableIds }) {
  const res = await fetch(`${API_BASE_URL}/admin/finance/supplier-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ supplierId, amount, reference, payableIds }),
  });
  return handle(res);
}

// ---- Reports ----
export async function getReportsSummary(reportType, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/admin/reports/${reportType}?${query}`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

// ---- Not yet built on the backend (users/RBAC management UI) ----
export async function getUsers() {
  const res = await fetch(`${API_BASE_URL}/admin/users`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, null);
}

export async function createUser({ name, email, password, role, mfaEnabled }) {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, email, password, role, mfaEnabled }),
  });
  return handle(res);
}

export async function updateUser(id, data) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function resetUserPassword(id, newPassword) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ newPassword }),
  });
  return handle(res);
}

// ---- Dashboard-configurable settings (OTP threshold/expiry, etc.) ----
export async function getSettings() {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, {});
}

export async function updateSettings(values) {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(values),
  });
  return handle(res);
}

// ---- OTP channel / provider configuration (email, WhatsApp) ----
export async function getNotificationProviders() {
  const res = await fetch(`${API_BASE_URL}/admin/settings/notification-providers`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, []);
}

export async function updateNotificationProvider(channel, data) {
  const res = await fetch(`${API_BASE_URL}/admin/settings/notification-providers/${channel}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

// ---- Product images ----
export async function getImageUploadConfig(productId) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/images/config`, { cache: 'no-store', headers: authHeaders() });
  return handle(res, { configured: false });
}

// Step 1: ask the backend for a one-time signed URL for this exact file.
export async function getImageUploadUrl(productId, { filename, contentType, fileSize }) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/images/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ filename, contentType, fileSize }),
  });
  return handle(res); // { uploadUrl, publicUrl }
}

// Step 2: upload the actual file bytes directly to storage (not through
// our backend) using the signed URL from step 1.
export async function uploadFileToStorage(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload to storage failed.');
}

// Step 3: tell our backend the upload succeeded so it saves the image
// record. Call steps 1-3 once per file — looping this is what makes
// multi-file upload work, no separate "bulk" endpoint needed.
export async function confirmImageUpload(productId, publicUrl) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url: publicUrl }),
  });
  return handle(res);
}

export async function deleteProductImage(productId, imageId) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handle(res);
}

export async function reorderProductImages(productId, imageIds) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/images/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ imageIds }),
  });
  return handle(res);
}
