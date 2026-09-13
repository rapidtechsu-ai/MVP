const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CUSTOMER_TOKEN_COOKIE = 'customer_token';
const CUSTOMER_COOKIE = 'customer_user';

/**
 * Isomorphic customer-token reader — same pattern as adminApi.js's
 * staff-token reader. Order history is a Server Component fetch, so
 * this needs to work both in the browser and during server rendering.
 */
function getCustomerToken() {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )customer_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  try {
    const { cookies } = require('next/headers');
    return cookies().get(CUSTOMER_TOKEN_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

function customerAuthHeaders() {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setCustomerSession(token, customer) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days, matches backend JWT expiry
  document.cookie = `${CUSTOMER_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}`;
  document.cookie = `${CUSTOMER_COOKIE}=${encodeURIComponent(JSON.stringify(customer))}; path=/; max-age=${maxAge}`;
}

export function logoutCustomer() {
  if (typeof document === 'undefined') return;
  document.cookie = `${CUSTOMER_TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${CUSTOMER_COOKIE}=; path=/; max-age=0`;
}

export function getStoredCustomer() {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )customer_user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

// Request an account-login OTP (separate from the checkout high-value
// verification OTP, though both share the same multi-channel backend).
export async function requestCustomerLoginOtp({ mobile, email }) {
  const res = await fetch(`${API_BASE_URL}/auth/customer/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, email }),
  });
  if (!res.ok) throw new Error('Failed to send login code');
  return res.json();
}

export async function verifyCustomerLoginOtp({ mobile, code }) {
  const res = await fetch(`${API_BASE_URL}/auth/customer/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, code }),
  });
  if (!res.ok) throw new Error('Invalid or expired code');
  const data = await res.json();
  setCustomerSession(data.token, data.customer);
  return data;
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/catalog/products?${query}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getProductDetail(id) {
  const res = await fetch(`${API_BASE_URL}/catalog/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function getCartQuote({ items, zoneId }) {
  const res = await fetch(`${API_BASE_URL}/orders/cart/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, zoneId }),
  });
  if (!res.ok) throw new Error('Failed to get cart quote');
  return res.json();
}

export async function createOrder({ customerId, zoneId, items }) {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, zoneId, items }),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${API_BASE_URL}/catalog/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getDeliveryZones() {
  const res = await fetch(`${API_BASE_URL}/catalog/delivery-zones`);
  if (!res.ok) throw new Error('Failed to fetch delivery zones');
  return res.json();
}

// Sends an OTP via every active configured channel (email and/or WhatsApp
// for now — more channels can be added on the backend without changing
// this call shape). At least one of phone/email must be provided.
export async function sendOtp({ orderId, customerId, phone, email }) {
  const res = await fetch(`${API_BASE_URL}/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, customerId, phone, email }),
  });
  if (!res.ok) throw new Error('Failed to send OTP');
  return res.json(); // { otpId, channelsSent, expiresInSeconds }
}

export async function verifyOtp({ orderId, code }) {
  const res = await fetch(`${API_BASE_URL}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, code }),
  });
  if (!res.ok) throw new Error('Invalid or expired code');
  return res.json();
}

export async function getOrder(id) {
  const res = await fetch(`${API_BASE_URL}/orders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}

export async function getCustomerOrders() {
  const res = await fetch(`${API_BASE_URL}/orders`, { headers: customerAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

// ---- Customer profile & saved addresses (genuinely login-required) ----
async function handleCustomer(res) {
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Response wasn't JSON — keep the generic message.
    }
    throw new Error(message);
  }
  return res.json();
}

export async function getCustomerProfile() {
  const res = await fetch(`${API_BASE_URL}/customer/me`, { headers: customerAuthHeaders(), cache: 'no-store' });
  return handleCustomer(res);
}

export async function updateCustomerProfile({ name, email }) {
  const res = await fetch(`${API_BASE_URL}/customer/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...customerAuthHeaders() },
    body: JSON.stringify({ name, email }),
  });
  return handleCustomer(res);
}

export async function getCustomerAddresses() {
  const res = await fetch(`${API_BASE_URL}/customer/addresses`, { headers: customerAuthHeaders(), cache: 'no-store' });
  return handleCustomer(res);
}

export async function createCustomerAddress({ zoneId, addressText, landmark }) {
  const res = await fetch(`${API_BASE_URL}/customer/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...customerAuthHeaders() },
    body: JSON.stringify({ zoneId, addressText, landmark }),
  });
  return handleCustomer(res);
}

export async function updateCustomerAddress(id, data) {
  const res = await fetch(`${API_BASE_URL}/customer/addresses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...customerAuthHeaders() },
    body: JSON.stringify(data),
  });
  return handleCustomer(res);
}

export async function deleteCustomerAddress(id) {
  const res = await fetch(`${API_BASE_URL}/customer/addresses/${id}`, {
    method: 'DELETE',
    headers: customerAuthHeaders(),
  });
  return handleCustomer(res);
}
