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

  let products = [];
  try {
    products = await getProducts({ categoryId: params.id });
  } catch (e) {
    products = [];
  }

  return (
    <main>
      <Header title={categoryLabel} backHref="/" />

      <section style={{ padding: '12px 16px' }}>
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
