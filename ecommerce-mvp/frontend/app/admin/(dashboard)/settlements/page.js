// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { getSupplierPayables } from '../../../../lib/adminApi';
import { colors } from '../../../../lib/tokens';
import NotImplementedNotice from '../../../../components/admin/NotImplementedNotice';

export default async function AdminSettlementsPage() {
  const payables = await getSupplierPayables().catch(() => null);

  const outstanding = payables?.filter((p) => p.status !== 'PAID') || [];
  const paid = payables?.filter((p) => p.status === 'PAID') || [];

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>تسويات الموردين</p>

      {payables === null ? (
        <NotImplementedNotice
          text="مسارات المستحقات والتسويات للموردين لم يتم بناؤها في الخادم بعد."
          fields={['المورد', 'المستحق', 'المدفوع', 'تاريخ الاستحقاق', 'الحالة', 'مرجع الدفعة']}
        />
      ) : payables.length === 0 ? (
        <p style={{ fontSize: 12, color: colors.textMuted }}>لا توجد مستحقات بعد.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{ background: colors.warningBg, borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 11, color: colors.warning, margin: '0 0 6px' }}>إجمالي المستحق</p>
              <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: colors.warning }} className="ltr-isolate">
                {outstanding.reduce((s, p) => s + Number(p.amount), 0).toLocaleString('en-US')} ج.س
              </p>
            </div>
            <div style={{ background: colors.successBg, borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 11, color: colors.success, margin: '0 0 6px' }}>إجمالي المدفوع</p>
              <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: colors.success }} className="ltr-isolate">
                {paid.reduce((s, p) => s + Number(p.amount), 0).toLocaleString('en-US')} ج.س
              </p>
            </div>
          </div>

          <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={thStyle}>المورد</th>
                  <th style={thStyle}>المنتج</th>
                  <th style={thStyle}>المبلغ</th>
                  <th style={thStyle}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>{p.supplier?.name || p.supplierId}</td>
                    <td style={tdStyle}>{p.orderItem?.product?.nameAr || '—'}</td>
                    <td style={tdStyle} className="ltr-isolate">{Number(p.amount).toLocaleString('en-US')}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: p.status === 'PAID' ? colors.successBg : colors.warningBg,
                          color: p.status === 'PAID' ? colors.success : colors.warning,
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 6,
                        }}
                      >
                        {p.status === 'PAID' ? 'مدفوع' : 'مستحق'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 16 }}>
        ملاحظة: المستحقات تُنشأ حاليا عند تحصيل النقد (اختيار مؤقت للـ MVP). لحظة الاستحقاق الفعلية
        (عند الحجز / التسليم / تحصيل النقد) لا تزال قرارا عمليا مفتوحا (D-004 في وثيقة المتطلبات).
      </p>
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
