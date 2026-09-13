'use client';

import { useRouter } from 'next/navigation';
import { logoutCustomer } from '../lib/api';
import { colors } from '../lib/tokens';

export default function AccountLogoutButton() {
  const router = useRouter();

  function handleLogout() {
    logoutCustomer();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'none',
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: '6px 14px',
        fontSize: 12,
        color: colors.textSecondary,
        cursor: 'pointer',
      }}
    >
      تسجيل الخروج
    </button>
  );
}
