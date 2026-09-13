import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '../../../components/admin/Sidebar';
import { colors } from '../../../lib/tokens';

export const metadata = {
  title: 'لوحة التحكم - المتجر',
};

export default function AdminLayout({ children }) {
  // Presence check only — the real verification (signature + expiry) happens
  // on every backend request via requireStaffAuth. This just avoids
  // rendering a dashboard shell for someone with no session at all.
  const token = cookies().get('staff_token')?.value;
  if (!token) {
    redirect('/admin/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.canvas }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: 18 }}>{children}</main>
    </div>
  );
}
