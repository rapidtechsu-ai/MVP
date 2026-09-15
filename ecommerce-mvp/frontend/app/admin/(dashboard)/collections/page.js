// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { getCashCollections } from '../../../../lib/adminApi';
import { colors } from '../../../../lib/tokens';
import NotImplementedNotice from '../../../../components/admin/NotImplementedNotice';

export default async function AdminCollectionsPage() {
  const collections = await getCashCollections().catch(() => null);

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>التحصيل النقدي والتسوية</p>

      {collections === null ? (
        <NotImplementedNotice
          text="مسارات المالية (Finance routes) لم يتم بناؤها في الخادم بعد."
          fields={['رقم الطلب', 'المبلغ المحصل', 'المحصّل بواسطة', 'تاريخ التحصيل', 'حالة التسوية']}
        />
      ) : collections.length === 0 ? (
        <p style={{ fontSize: 12, color: colors.textMuted }}>لا توجد تحصيلات بعد.</p>
      ) : (
        <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>الطلب</th>
                <th style={thStyle}>العميل</th>
                <th style={thStyle}>المبلغ</th>
                <th style={thStyle}>المحصّل بواسطة</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>التسوية</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>
                    <a href={`/admin/orders/${c.orderId}`} style={{ color: colors.primary }}>#{c.orderId.slice(0, 8)}</a>
                  </td>
                  <td style={tdStyle} className="ltr-isolate">{c.order?.customer?.mobile || '—'}</td>
                  <td style={tdStyle} className="ltr-isolate">{Number(c.amount).toLocaleString('en-US')}</td>
                  <td style={tdStyle}>{c.collectedBy}</td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }} className="ltr-isolate">
                    {new Date(c.collectedAt).toLocaleDateString('en-GB')}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        background: c.reconciliationStatus === 'MATCHED' ? colors.successBg : colors.dangerBg,
                        color: c.reconciliationStatus === 'MATCHED' ? colors.success : colors.danger,
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 6,
                      }}
                    >
                      {c.reconciliationStatus === 'MATCHED' ? 'مطابق' : 'يوجد فرق'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
