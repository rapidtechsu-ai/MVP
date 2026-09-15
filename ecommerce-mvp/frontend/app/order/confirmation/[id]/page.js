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

export default async function OrderConfirmationPage({ params }) {
  let order = null;
  try {
    order = await getOrder(params.id);
  } catch (e) {
    order = null;
  }

  return (
    <main>
      <Header title="تأكيد الطلب" backHref="/" />

      <div style={{ padding: '28px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: colors.successBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 28,
          }}
        >
          ✓
        </div>
        <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>تم استلام طلبك</p>
        <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 18px' }}>
          بانتظار تأكيد التوفر من المورد
        </p>

        <div
          style={{
            background: colors.canvas,
            borderRadius: 12,
            padding: 14,
            textAlign: 'right',
            marginBottom: 16,
          }}
        >
          <SummaryRow label="رقم الطلب" value={`#${params.id.slice(0, 8).toUpperCase()}`} />
          <SummaryRow
            label="السعر النهائي (مثبت)"
            value={order ? `${Number(order.total).toLocaleString('en-US')} ج.س` : '—'}
          />
          <SummaryRow label="طريقة الدفع" value="عند الاستلام" last />
        </div>

        <a
          href={`/order/track/${params.id}`}
          style={{
            display: 'block',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            color: colors.text,
          }}
        >
          تتبع الطلب
        </a>
      </div>
    </main>
  );
}

function SummaryRow({ label, value, last }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: last ? 0 : 8,
      }}
    >
      <span>{label}</span>
      <span style={{ color: colors.text }} className="ltr-isolate">
        {value}
      </span>
    </div>
  );
}
