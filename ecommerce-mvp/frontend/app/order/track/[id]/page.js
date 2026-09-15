// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import Header from '../../../../components/Header';
import { colors } from '../../../../lib/tokens';
import { getOrder } from '../../../../lib/api';

const STATUS_LABELS = {
  NEW: 'تم استلام الطلب',
  VERIFICATION: 'قيد التحقق',
  CONFIRMATION: 'قيد التأكيد',
  RESERVED: 'تم حجز المنتج',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق إليك',
  DELIVERED: 'تم التسليم',
  CASH_COLLECTED: 'تم استلام المبلغ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

const TIMELINE_ORDER = [
  'NEW',
  'VERIFICATION',
  'RESERVED',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default async function OrderTrackingPage({ params }) {
  let order = null;
  try {
    order = await getOrder(params.id);
  } catch (e) {
    order = null;
  }

  if (!order) {
    return (
      <main>
        <Header title="تتبع الطلب" backHref="/orders" />
        <p style={{ padding: 16, fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
          تعذر تحميل تفاصيل الطلب
        </p>
      </main>
    );
  }

  const currentIndex = TIMELINE_ORDER.indexOf(order.status);

  return (
    <main>
      <Header title={`الطلب #${params.id.slice(0, 8).toUpperCase()}`} backHref="/orders" />

      <section style={{ padding: '20px 16px' }}>
        {TIMELINE_ORDER.map((status, i) => {
          const reached = currentIndex >= 0 && i <= currentIndex;
          return (
            <div key={status} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: reached ? colors.success : colors.border,
                    flexShrink: 0,
                  }}
                />
                {i < TIMELINE_ORDER.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      background: reached ? colors.success : colors.border,
                    }}
                  />
                )}
              </div>
              <p
                style={{
                  fontSize: 13,
                  paddingBottom: 20,
                  color: reached ? colors.text : colors.textMuted,
                  fontWeight: reached && i === currentIndex ? 500 : 400,
                }}
              >
                {STATUS_LABELS[status]}
              </p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
