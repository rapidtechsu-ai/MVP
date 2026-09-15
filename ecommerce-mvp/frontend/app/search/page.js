// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { getProducts } from '../../lib/api';
import { colors } from '../../lib/tokens';

export default async function SearchPage({ searchParams }) {
  const query = searchParams?.q || '';

  let results = [];
  try {
    results = query ? await getProducts({ search: query }) : [];
  } catch (e) {
    results = [];
  }

  return (
    <main>
      <Header title={`نتائج البحث${query ? `: ${query}` : ''}`} backHref="/" />

      <section style={{ padding: 16 }}>
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
              لم نجد نتائج مطابقة لـ &quot;{query}&quot;
            </p>
            <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>
              جرب كلمات أخرى أو تصفح الأقسام
            </p>
            <a
              href="/category"
              style={{
                display: 'inline-block',
                background: colors.primary,
                color: '#fff',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 13,
              }}
            >
              تصفح الأقسام
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
