'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { colors } from '../lib/tokens';

const NAV_ITEMS = [
  { href: '/', label: 'الرئيسية', icon: '⌂' },
  { href: '/category', label: 'الأقسام', icon: '▤' },
  { href: '/cart', label: 'السلة', icon: '🛒' },
  { href: '/orders', label: 'طلباتي', icon: '☰' },
  { href: '/account', label: 'حسابي', icon: '☺' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        padding: '8px 0',
        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textAlign: 'center',
              color: active ? colors.primary : colors.textMuted,
              position: 'relative',
              minWidth: 44,
            }}
          >
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>{item.label}</div>
            {item.href === '/cart' && cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  left: '50%',
                  marginLeft: 4,
                  background: colors.danger,
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 9,
                  padding: '0 5px',
                  lineHeight: '14px',
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
