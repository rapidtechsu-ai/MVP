// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import Header from '../../../components/Header';
import ProductCard from '../../../components/ProductCard';
import { getProducts } from '../../../lib/api';
import { colors } from '../../../lib/tokens';

const CATEGORY_LABELS = {
  phones: 'هواتف',
  accessories: 'إكسسوارات',
  wearables: 'ساعات',
  appliances: 'أجهزة منزلية',
};

export default async function CategoryPage({ params, searchParams }) {
  const categoryLabel = CATEGORY_LABELS[params.id] || 'المنتجات';
  const deliverySpeed = searchParams?.deliverySpeed === 'RAPID' ? 'RAPID' : null;

  let products = [];
  try {
    products = await getProducts({ categoryId: params.id, ...(deliverySpeed && { deliverySpeed }) });
  } catch (e) {
    products = [];
  }

  return (
    <main>
      <Header title={categoryLabel} backHref="/" />

      <section style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <a
            href={`/category/${params.id}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              padding: '7px 0',
              borderRadius: 8,
              background: !deliverySpeed ? colors.primary : colors.canvas,
              color: !deliverySpeed ? '#fff' : colors.text,
            }}
          >
            توصيل خلال 24 ساعة
          </a>
          <a
            href={`/category/${params.id}?deliverySpeed=RAPID`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              padding: '7px 0',
              borderRadius: 8,
              background: deliverySpeed === 'RAPID' ? colors.primary : colors.canvas,
              color: deliverySpeed === 'RAPID' ? '#fff' : colors.text,
            }}
          >
            ⚡ توصيل سريع
          </a>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
          <select style={{ fontSize: 12, height: 32, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <option>كل الماركات</option>
          </select>
          <select style={{ fontSize: 12, height: 32, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <option>السعر</option>
          </select>
          <select style={{ fontSize: 12, height: 32, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <option>التوفر</option>
          </select>
          <select style={{ fontSize: 12, height: 32, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <option>الترتيب: الأحدث</option>
            <option>السعر: من الأقل</option>
            <option>السعر: من الأعلى</option>
          </select>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted }}>
            <p style={{ fontSize: 14 }}>لا توجد منتجات في هذا القسم حاليا</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
