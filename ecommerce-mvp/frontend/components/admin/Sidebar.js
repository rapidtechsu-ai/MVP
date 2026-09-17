'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { colors } from '../../lib/tokens';
import { logoutStaff, getStoredStaffUser } from '../../lib/adminApi';

const NAV_ITEMS = [
  { href: '/admin', label: 'نظرة عامة', icon: '▦', exact: true },
  { href: '/admin/orders', label: 'الطلبات', icon: '☰' },
  { href: '/admin/products', label: 'المنتجات', icon: '▢' },
  { href: '/admin/suppliers', label: 'الموردون', icon: '🚚' },
  { href: '/admin/pricing', label: 'التسعير', icon: '﷼' },
  { href: '/admin/delivery', label: 'مناطق التوصيل', icon: '📍' },
  { href: '/admin/collections', label: 'التحصيل النقدي', icon: '💵' },
  { href: '/admin/settlements', label: 'تسويات الموردين', icon: '🧾' },
  { href: '/admin/reports', label: 'التقارير', icon: '📊' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredStaffUser());
  }, []);

  function handleLogout() {
    logoutStaff();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside
      style={{
        width: 190,
        flexShrink: 0,
        background: colors.surface,
        borderLeft: `1px solid ${colors.border}`,
        minHeight: '100vh',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, padding: '0 16px', margin: '0 0 16px' }}>
        لوحة التحكم
      </p>
      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                fontSize: 12.5,
                color: active ? colors.primary : colors.textSecondary,
                background: active ? colors.canvas : 'transparent',
                borderRight: active ? `2px solid ${colors.primary}` : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, marginTop: 12 }}>
        {user && (
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || user.email}
            </p>
            <p style={{ fontSize: 10, color: colors.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="ltr-isolate">
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '9px 16px',
            fontSize: 12.5,
            color: colors.danger,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'right',
          }}
        >
          <span style={{ fontSize: 15 }}>⎋</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
