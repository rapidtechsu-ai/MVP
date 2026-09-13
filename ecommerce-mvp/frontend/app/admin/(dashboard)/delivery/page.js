import { getAdminDeliveryZones } from '../../../../lib/adminApi';
import DeliveryZoneForm from '../../../../components/admin/DeliveryZoneForm';
import { colors } from '../../../../lib/tokens';

export default async function AdminDeliveryPage() {
  const zones = await getAdminDeliveryZones().catch(() => []);

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>مناطق التوصيل</p>

      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, marginBottom: 16 }}>
        {zones.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, padding: 20, margin: 0, textAlign: 'center' }}>
            لا توجد مناطق توصيل بعد.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>المنطقة</th>
                <th style={thStyle}>الرسوم (SDG)</th>
                <th style={thStyle}>SLA (ساعة)</th>
                <th style={thStyle}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>{z.name}</td>
                  <td style={tdStyle} className="ltr-isolate">{Number(z.feeSdg).toLocaleString('en-US')}</td>
                  <td style={tdStyle} className="ltr-isolate">{z.slaHours}</td>
                  <td style={tdStyle}>
                    <span style={{ color: z.active ? colors.success : colors.textMuted }}>
                      {z.active ? 'نشطة' : 'غير نشطة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>إضافة منطقة جديدة</p>
      <DeliveryZoneForm />
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
