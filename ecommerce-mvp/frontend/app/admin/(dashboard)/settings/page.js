import OtpSettingsForm from '../../../../components/admin/OtpSettingsForm';
import UsersManagement from '../../../../components/admin/UsersManagement';

export default function AdminSettingsPage() {
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>الإعدادات</p>

      <OtpSettingsForm />

      <p style={{ fontSize: 12, fontWeight: 600, margin: '20px 0 8px' }}>المستخدمون والصلاحيات</p>
      <p style={{ fontSize: 11, color: '#9AA2B1', margin: '-4px 0 10px' }}>
        هذا القسم مقتصر على مدير النظام (المستخدم الخارق) فقط.
      </p>
      <UsersManagement />
    </div>
  );
}
