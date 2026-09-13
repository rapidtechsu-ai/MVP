import { getPriceHistory } from '../../../../../lib/adminApi';
import { colors } from '../../../../../lib/tokens';

export default async function AdminPriceHistoryPage() {
  const history = await getPriceHistory().catch(() => []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <a href="/admin/pricing" style={{ color: colors.textSecondary }}>→</a>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>سجل الأسعار</p>
      </div>
      <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>
        سجل غير قابل للحذف — كل تغيير في التكلفة أو الهامش أو سعر الصرف ينشئ سجلا جديدا.
      </p>

      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        {history.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, padding: 20, margin: 0, textAlign: 'center' }}>
            لا يوجد سجل أسعار بعد.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>المنتج</th>
                <th style={thStyle}>التكلفة AED</th>
                <th style={thStyle}>سعر الصرف</th>
                <th style={thStyle}>الهامش</th>
                <th style={thStyle}>السعر SDG</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>{h.product?.nameAr || h.productId}</td>
                  <td style={tdStyle} className="ltr-isolate">{Number(h.costAed).toLocaleString('en-US')}</td>
                  <td style={tdStyle} className="ltr-isolate">{Number(h.fxRate).toLocaleString('en-US')}</td>
                  <td style={tdStyle} className="ltr-isolate">{Number(h.markupPercent)}%</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }} className="ltr-isolate">
                    {Number(h.calculatedSdg).toLocaleString('en-US')}
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }} className="ltr-isolate">
                    {new Date(h.effectiveAt).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }}>{h.createdBy}</td>
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
