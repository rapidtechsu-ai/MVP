import { cookies } from 'next/headers';
import Header from '../../components/Header';
import { colors } from '../../lib/tokens';
import AccountLogoutButton from '../../components/AccountLogoutButton';

const MENU_ITEMS = [
  { icon: '👤', label: 'الملف الشخصي', href: '/account/profile' },
  { icon: '📍', label: 'العناوين المحفوظة', href: '/account/addresses' },
  { icon: '🌐', label: 'اللغة', href: '/account/language' },
  { icon: '❓', label: 'المساعدة', href: '/account/help' },
  { icon: '📄', label: 'السياسات والشروط', href: '/account/policies' },
];

export default function AccountPage() {
  const customerCookie = cookies().get('customer_user')?.value;
  let customer = null;
  if (customerCookie) {
    try {
      customer = JSON.parse(decodeURIComponent(customerCookie));
    } catch {
      customer = null;
    }
  }

  return (
    <main>
      <Header title="حسابي" />

      <section style={{ padding: 16 }}>
        {customer ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>{customer.name || customer.mobile}</p>
              <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0 }} className="ltr-isolate">{customer.mobile}</p>
            </div>
            <AccountLogoutButton />
          </div>
        ) : (
          <a
            href="/login?redirect=/account"
            style={{
              display: 'block',
              textAlign: 'center',
              background: colors.primary,
              color: '#fff',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            تسجيل الدخول
          </a>
        )}

        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {MENU_ITEMS.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                color: colors.text,
                borderBottom: i < MENU_ITEMS.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>
              <span style={{ color: colors.textMuted }}>‹</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
