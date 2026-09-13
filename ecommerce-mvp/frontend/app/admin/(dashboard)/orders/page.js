import { getAdminOrders } from '../../../../lib/adminApi';
import { colors } from '../../../../lib/tokens';

const STATUS_LABELS = {
  NEW: 'جديد',
  VERIFICATION: 'قيد التحقق',
  RESERVED: 'محجوز',
  READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغى',
  SUPPLIER_OUT_OF_STOCK: 'نفذ لدى المورد',
  DELIVERY_FAILED: 'فشل التوصيل',
  RETURNED: 'مرتجع',
};

const OTP_THRESHOLD = 1000000;

export default async function AdminOrdersPage({ searchParams }) {
  const status = searchParams?.status;
  const orders = await getAdminOrders(status ? { status } : {}).catch(() => []);

  const highValueCount = orders.filter((o) => Number(o.total) >= OTP_THRESHOLD).length;
  const pendingSupplierCount = orders.filter((o) => o.status === 'VERIFICATION' || o.status === 'NEW').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>الطلبات</p>
        <form style={{ display: 'flex', gap: 8 }}>
          <select name="status" defaultValue={status || ''} style={{ fontSize: 12, height: 32, borderRadius: 6, border: `1px solid ${colors.border}` }}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button style={{ fontSize: 12, height: 32, padding: '0 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surface, cursor: 'pointer' }}>
            تصفية
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {highValueCount > 0 && (
          <span style={{ background: colors.dangerBg, color: colors.danger, fontSize: 11, padding: '4px 10px', borderRadius: 8 }}>
            {highValueCount} طلبات عالية القيمة
          </span>
        )}
        {pendingSupplierCount > 0 && (
          <span style={{ background: colors.warningBg, color: colors.warning, fontSize: 11, padding: '4px 10px', borderRadius: 8 }}>
            {pendingSupplierCount} بانتظار تأكيد المورد
          </span>
        )}
      </div>

      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        {orders.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, padding: 20, margin: 0, textAlign: 'center' }}>
            لا توجد طلبات مطابقة.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>الطلب</th>
                <th style={thStyle}>القيمة</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>OTP</th>
                <th style={thStyle}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>
                    <a href={`/admin/orders/${o.id}`} style={{ color: colors.primary }}>#{o.id.slice(0, 8)}</a>
                  </td>
                  <td style={tdStyle} className="ltr-isolate">{Number(o.total).toLocaleString('en-US')}</td>
                  <td style={tdStyle}>
                    <span style={{ background: colors.warningBg, color: colors.warning, fontSize: 10, padding: '2px 8px', borderRadius: 6 }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {o.otpRequired ? (
                      <span style={{ color: colors.danger, fontSize: 11 }}>مطلوب</span>
                    ) : (
                      <span style={{ color: colors.textMuted, fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: colors.textSecondary }} className="ltr-isolate">
                    {new Date(o.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
