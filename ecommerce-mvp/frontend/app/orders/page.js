// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Header from '../../components/Header';
import { colors } from '../../lib/tokens';
import { getCustomerOrders } from '../../lib/api';

const STATUS_LABELS = {
  NEW: 'قيد المعالجة',
  VERIFICATION: 'قيد التحقق',
  RESERVED: 'تم الحجز',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التسليم',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export default async function OrdersPage() {
  const isLoggedIn = !!cookies().get('customer_token')?.value;

  let orders = [];
  if (isLoggedIn) {
    try {
      orders = await getCustomerOrders();
    } catch (e) {
      orders = [];
    }
  }

  return (
    <main>
      <Header title="طلباتي" />

      <section style={{ padding: 16 }}>
        {!isLoggedIn ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔒</p>
            <p style={{ fontSize: 14, color: colors.text, marginBottom: 14 }}>
              سجل الدخول لعرض طلباتك السابقة
            </p>
            <a
              href="/login?redirect=/orders"
              style={{
                display: 'inline-block',
                background: colors.primary,
                color: '#fff',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 13,
              }}
            >
              تسجيل الدخول
            </a>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📦</p>
            <p style={{ fontSize: 14, color: colors.text }}>لا توجد طلبات سابقة</p>
          </div>
        ) : (
          orders.map((order) => (
            <a
              key={order.id}
              href={`/order/track/${order.id}`}
              style={{
                display: 'block',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                color: colors.text,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13 }} className="ltr-isolate">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: colors.primary }}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }} className="ltr-isolate">
                {Number(order.total).toLocaleString('en-US')} ج.س
              </p>
            </a>
          ))
        )}
      </section>
    </main>
  );
}
