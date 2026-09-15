// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { getAdminSupplierDetail } from '../../../../../lib/adminApi';
import { colors } from '../../../../../lib/tokens';

const AVAIL_LABELS = {
  AVAILABLE: 'متوفر',
  REQUIRES_CONFIRMATION: 'يتطلب تأكيد',
  UNAVAILABLE: 'غير متوفر',
  DISCONTINUED: 'متوقف',
};

export default async function AdminSupplierDetailPage({ params }) {
  const supplier = await getAdminSupplierDetail(params.id);

  if (!supplier) {
    return <p style={{ fontSize: 13, color: colors.textMuted }}>لم يتم العثور على المورد.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <a href="/admin/suppliers" style={{ color: colors.textSecondary }}>→</a>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{supplier.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>بيانات التواصل</p>
          <p style={{ fontSize: 12, margin: 0 }} className="ltr-isolate">{supplier.contacts || '—'}</p>
        </div>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>شروط الدفع</p>
          <p style={{ fontSize: 12, margin: 0 }}>{supplier.paymentTerms || '—'}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>منتجات المورد</p>
      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        {supplier.supplierProducts.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, padding: 20, margin: 0, textAlign: 'center' }}>
            لا توجد منتجات مرتبطة بهذا المورد بعد.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>المنتج</th>
                <th style={thStyle}>تكلفة AED</th>
                <th style={thStyle}>التوفر</th>
                <th style={thStyle}>آخر تأكيد</th>
              </tr>
            </thead>
            <tbody>
              {supplier.supplierProducts.map((sp) => (
                <tr key={sp.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>{sp.product?.nameAr || sp.productId}</td>
                  <td style={tdStyle} className="ltr-isolate">{Number(sp.costAed).toLocaleString('en-US')}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        background: sp.availability === 'AVAILABLE' ? colors.successBg : colors.warningBg,
                        color: sp.availability === 'AVAILABLE' ? colors.success : colors.warning,
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 6,
                      }}
                    >
                      {AVAIL_LABELS[sp.availability]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }} className="ltr-isolate">
                    {sp.lastConfirmedAt ? new Date(sp.lastConfirmedAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
