import { getAdminOrders } from '../../../lib/adminApi';
import { colors } from '../../../lib/tokens';

const STATUS_LABELS = {
  NEW: 'جديد',
  VERIFICATION: 'قيد التحقق',
  RESERVED: 'محجوز',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغى',
};

function KpiCard({ label, value, tone }) {
  const bg = tone === 'success' ? colors.successBg : tone === 'warning' ? colors.warningBg : tone === 'danger' ? colors.dangerBg : colors.surface;
  const fg = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.text;
  return (
    <div style={{ background: bg, borderRadius: 10, padding: 12 }}>
      <p style={{ fontSize: 11, color: tone ? fg : colors.textSecondary, margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: fg }}>{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const orders = await getAdminOrders().catch(() => []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((o) => new Date(o.createdAt) >= today);

  const delivered = todaysOrders.filter((o) => o.status === 'DELIVERED').length;
  const pending = todaysOrders.filter((o) => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status)).length;
  const cancelled = todaysOrders.filter((o) => o.status === 'CANCELLED').length;
  const totalSales = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const needsAction = orders
    .filter((o) => !['DELIVERED', 'CANCELLED', 'COMPLETED', 'SUPPLIER_PAID'].includes(o.status))
    .slice(0, 6);

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>مبيعات اليوم</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 20 }}>
        <KpiCard label="إجمالي المبيعات" value={`${Math.round(totalSales).toLocaleString('en-US')} ج.س`} />
        <KpiCard label="عدد الطلبات" value={todaysOrders.length} />
        <KpiCard label="تم التسليم" value={delivered} />
        <KpiCard label="قيد الانتظار" value={pending} />
        <KpiCard label="ملغاة" value={cancelled} tone="danger" />
        <KpiCard label="الربح الإجمالي" value="—" tone="success" />
        <KpiCard label="نقد محصل" value="—" />
        <KpiCard label="مستحق للموردين" value="—" tone="warning" />
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>طلبات تحتاج إجراء</p>
      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        {needsAction.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, padding: 16, margin: 0 }}>
            لا توجد طلبات تحتاج إجراء حاليا.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: colors.textSecondary, fontWeight: 400 }}>الطلب</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: colors.textSecondary, fontWeight: 400 }}>القيمة</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: colors.textSecondary, fontWeight: 400 }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {needsAction.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '8px 10px' }}>
                    <a href={`/admin/orders/${o.id}`} style={{ color: colors.primary }}>
                      #{o.id.slice(0, 8)}
                    </a>
                  </td>
                  <td style={{ padding: '8px 10px' }} className="ltr-isolate">
                    {Number(o.total).toLocaleString('en-US')}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ background: colors.warningBg, color: colors.warning, fontSize: 10, padding: '2px 8px', borderRadius: 6 }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
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
