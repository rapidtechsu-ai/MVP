import { getAdminSuppliers } from '../../../../lib/adminApi';
import { colors } from '../../../../lib/tokens';
import NotImplementedNotice from '../../../../components/admin/NotImplementedNotice';
import SupplierCreateForm from '../../../../components/admin/SupplierCreateForm';

export default async function AdminSuppliersPage() {
  const suppliers = await getAdminSuppliers().catch(() => null);

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>الموردون</p>

      {suppliers === null ? (
        <NotImplementedNotice
          text="مسارات إدارة الموردين (Suppliers routes) لم يتم بناؤها في الخادم بعد."
          fields={['اسم المورد', 'بيانات التواصل', 'شروط الدفع', 'منتجات المورد وأسعارها', 'حالة التوفر', 'آخر تأكيد']}
        />
      ) : (
        <>
          <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, marginBottom: 16 }}>
            {suppliers.length === 0 ? (
              <p style={{ fontSize: 12, color: colors.textMuted, padding: 20, margin: 0, textAlign: 'center' }}>
                لا يوجد موردون بعد.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th style={thStyle}>المورد</th>
                    <th style={thStyle}>عدد المنتجات</th>
                    <th style={thStyle}>شروط الدفع</th>
                    <th style={thStyle}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={tdStyle}>
                        <a href={`/admin/suppliers/${s.id}`} style={{ color: colors.primary }}>{s.name}</a>
                      </td>
                      <td style={tdStyle}>{s.supplierProducts?.length || 0}</td>
                      <td style={tdStyle}>{s.paymentTerms || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ color: s.active ? colors.success : colors.textMuted }}>
                          {s.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>إضافة مورد جديد</p>
          <SupplierCreateForm />
        </>
      )}
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
