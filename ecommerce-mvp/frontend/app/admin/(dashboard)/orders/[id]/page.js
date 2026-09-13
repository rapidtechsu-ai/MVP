import { getAdminOrderDetail } from '../../../../../lib/adminApi';
import { colors } from '../../../../../lib/tokens';
import OrderActions from '../../../../../components/admin/OrderActions';

const STATUS_LABELS = {
  NEW: 'جديد', VERIFICATION: 'قيد التحقق', RESERVED: 'محجوز', READY: 'جاهز للتوصيل',
  OUT_FOR_DELIVERY: 'في الطريق', DELIVERED: 'تم التسليم', CANCELLED: 'ملغى',
  CASH_COLLECTED: 'تم تحصيل النقد', SUPPLIER_PAID: 'تم دفع المورد', COMPLETED: 'مكتمل',
  VERIFICATION_FAILED: 'فشل التحقق', SUPPLIER_OUT_OF_STOCK: 'نفذ لدى المورد',
  DELIVERY_FAILED: 'فشل التوصيل', RETURNED: 'مرتجع',
};

export default async function AdminOrderDetailPage({ params }) {
  const order = await getAdminOrderDetail(params.id);

  if (!order) {
    return <p style={{ fontSize: 13, color: colors.textMuted }}>لم يتم العثور على الطلب.</p>;
  }

  const OTP_THRESHOLD = 1000000;
  const isHighValue = Number(order.total) >= OTP_THRESHOLD;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/admin/orders" style={{ color: colors.textSecondary }}>→</a>
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>الطلب #{order.id.slice(0, 8)}</p>
          {isHighValue && (
            <span style={{ background: colors.dangerBg, color: colors.danger, fontSize: 10, padding: '2px 8px', borderRadius: 6 }}>
              قيمة عالية - OTP
            </span>
          )}
        </div>
        <OrderActions order={order} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, margin: '0 0 8px' }}>بيانات العميل</p>
          <p style={{ fontSize: 12, margin: '0 0 4px' }} className="ltr-isolate">{order.customer?.mobile || '—'}</p>
          <p style={{ fontSize: 12, margin: '0 0 8px', color: colors.textSecondary }}>
            {order.zone?.name || 'منطقة غير محددة'}
          </p>
          <span
            style={{
              background: order.otpRequired ? colors.successBg : colors.canvas,
              color: order.otpRequired ? colors.success : colors.textMuted,
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            {order.otpRequired ? 'تم التحقق OTP' : 'لا يتطلب OTP'}
          </span>
        </div>

        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, margin: '0 0 8px' }}>ملخص السعر (مثبت)</p>
          <Row label="المجموع الفرعي" value={order.subtotal} />
          <Row label="رسوم التوصيل" value={order.deliveryFee} />
          <Row label="الإجمالي" value={order.total} bold />
        </div>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px' }}>عناصر الطلب</p>
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              <th style={thStyle}>المنتج</th>
              <th style={thStyle}>الكمية</th>
              <th style={thStyle}>السعر</th>
              <th style={thStyle}>المورد</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={tdStyle}>{item.product?.nameAr || item.productId}</td>
                <td style={tdStyle}>{item.qty}</td>
                <td style={tdStyle} className="ltr-isolate">{Number(item.unitPriceSdg).toLocaleString('en-US')}</td>
                <td style={tdStyle}>
                  {item.supplierId ? (
                    <span style={{ color: colors.success }}>محجوز</span>
                  ) : (
                    <span style={{ background: colors.warningBg, color: colors.warning, fontSize: 10, padding: '2px 6px', borderRadius: 6 }}>
                      بانتظار الحجز
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px' }}>سجل التدقيق</p>
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '4px 12px' }}>
        {order.statusHistory.length === 0 ? (
          <p style={{ fontSize: 11, color: colors.textMuted, padding: '8px 0' }}>لا يوجد سجل بعد.</p>
        ) : (
          order.statusHistory.map((h, i) => (
            <div
              key={h.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                padding: '6px 0',
                borderBottom: i < order.statusHistory.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <span>{STATUS_LABELS[h.toStatus] || h.toStatus}{h.reason ? ` — ${h.reason}` : ''}</span>
              <span style={{ color: colors.textMuted }} className="ltr-isolate">
                {new Date(h.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {h.actor}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: bold ? 13 : 12,
        fontWeight: bold ? 600 : 400,
        marginBottom: 4,
        paddingTop: bold ? 4 : 0,
        borderTop: bold ? `1px solid ${colors.border}` : 'none',
      }}
    >
      <span style={{ color: bold ? colors.text : colors.textSecondary }}>{label}</span>
      <span className="ltr-isolate">{Number(value).toLocaleString('en-US')}</span>
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
