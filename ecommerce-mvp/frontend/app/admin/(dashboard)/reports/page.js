// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { getReportsSummary } from '../../../../lib/adminApi';
import { colors } from '../../../../lib/tokens';
import NotImplementedNotice from '../../../../components/admin/NotImplementedNotice';

export default async function AdminReportsPage() {
  const [sales, profitability, suppliers] = await Promise.all([
    getReportsSummary('sales').catch(() => null),
    getReportsSummary('profitability').catch(() => null),
    getReportsSummary('suppliers').catch(() => null),
  ]);

  if (sales === null) {
    return (
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>التقارير</p>
        <NotImplementedNotice
          text="مسارات التقارير لم يتم بناؤها في الخادم بعد."
          fields={[
            'تقرير المبيعات (يومي/أسبوعي/شهري)',
            'تقرير الربحية حسب المنتج/الفئة',
            'تقرير الموردين (مشتريات، مستحق، مدفوع)',
            'تقرير سعر الصرف والتسعير',
            'تقرير الإلغاءات',
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>التقارير</p>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>ملخص المبيعات</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 6px' }}>إجمالي المبيعات</p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }} className="ltr-isolate">
            {Math.round(sales.totalSales).toLocaleString('en-US')} ج.س
          </p>
        </div>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 6px' }}>عدد الطلبات</p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{sales.totalOrders}</p>
        </div>
      </div>

      {profitability && profitability.rows.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>الربحية حسب المنتج</p>
          <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={thStyle}>المنتج</th>
                  <th style={thStyle}>الكمية</th>
                  <th style={thStyle}>الإيراد</th>
                  <th style={thStyle}>الربح الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {profitability.rows.slice(0, 10).map((r) => (
                  <tr key={r.productId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>{r.productName}</td>
                    <td style={tdStyle}>{r.qty}</td>
                    <td style={tdStyle} className="ltr-isolate">{Math.round(r.revenue).toLocaleString('en-US')}</td>
                    <td style={{ ...tdStyle, color: colors.success }} className="ltr-isolate">
                      {Math.round(r.grossProfit).toLocaleString('en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {suppliers && suppliers.rows.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>تقرير الموردين</p>
          <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={thStyle}>المورد</th>
                  <th style={thStyle}>إجمالي المشتريات</th>
                  <th style={thStyle}>المدفوع</th>
                  <th style={thStyle}>المستحق</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.rows.map((r) => (
                  <tr key={r.supplierId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>{r.supplierName}</td>
                    <td style={tdStyle} className="ltr-isolate">{Math.round(r.totalPurchases).toLocaleString('en-US')}</td>
                    <td style={tdStyle} className="ltr-isolate">{Math.round(r.totalPaid).toLocaleString('en-US')}</td>
                    <td style={{ ...tdStyle, color: colors.warning }} className="ltr-isolate">
                      {Math.round(r.outstanding).toLocaleString('en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
