import Header from '../../components/Header';
import { colors } from '../../lib/tokens';

const CATEGORIES = [
  { id: 'phones', label: 'هواتف', icon: '📱' },
  { id: 'accessories', label: 'إكسسوارات', icon: '🎧' },
  { id: 'wearables', label: 'ساعات', icon: '⌚' },
  { id: 'appliances', label: 'أجهزة منزلية', icon: '🏠' },
];

export default function CategoryIndexPage() {
  return (
    <main>
      <Header title="الأقسام" backHref="/" />
      <section style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`/category/${cat.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 20,
                color: colors.text,
              }}
            >
              <span style={{ fontSize: 32 }}>{cat.icon}</span>
              <span style={{ fontSize: 13 }}>{cat.label}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
