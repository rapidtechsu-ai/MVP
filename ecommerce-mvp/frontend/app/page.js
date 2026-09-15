// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../lib/api';
import { colors } from '../lib/tokens';

const CATEGORIES = [
  { id: 'phones', label: 'هواتف', icon: '📱' },
  { id: 'accessories', label: 'إكسسوارات', icon: '🎧' },
  { id: 'wearables', label: 'ساعات', icon: '⌚' },
  { id: 'appliances', label: 'أجهزة منزلية', icon: '🏠' },
];

export default async function HomePage() {
  let products = [];
  try {
    products = await getProducts();
  } catch (e) {
    products = [];
  }

  const bestSellers = products.slice(0, 6);

  return (
    <main>
      <Header />

      <section style={{ padding: '16px 16px 8px' }}>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>الأقسام</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`/category/${cat.id}`}
              style={{ textAlign: 'center', color: colors.text }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: colors.canvas,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 4px',
                  fontSize: 22,
                }}
              >
                {cat.icon}
              </div>
              <p style={{ fontSize: 11, margin: 0, color: colors.textSecondary }}>{cat.label}</p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ padding: '8px 16px 16px' }}>
        <div
          style={{
            background: '#EDE6FB',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: colors.primary }}>
              توصيل خلال 24 ساعة
            </p>
            <p style={{ fontSize: 12, margin: 0, color: colors.textSecondary }}>
              الدفع عند الاستلام متاح
            </p>
          </div>
          <span style={{ fontSize: 28 }}>🚚</span>
        </div>
      </section>

      <section style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>الأكثر مبيعا</p>
          <a href="/category" style={{ fontSize: 12, color: colors.primary }}>
            عرض الكل
          </a>
        </div>

        {bestSellers.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted }}>لا توجد منتجات بعد.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
