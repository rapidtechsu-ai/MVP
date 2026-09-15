// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { getAdminProductDetail } from '../../../../../lib/adminApi';
import ProductEditForm from '../../../../../components/admin/ProductEditForm';
import ProductImageManager from '../../../../../components/admin/ProductImageManager';
import { colors } from '../../../../../lib/tokens';

export default async function AdminProductEditPage({ params }) {
  const product = await getAdminProductDetail(params.id);

  if (!product) {
    return <p style={{ fontSize: 13, color: colors.textMuted }}>لم يتم العثور على المنتج.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <a href="/admin/products" style={{ color: colors.textSecondary }}>→</a>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>تعديل المنتج - {product.nameAr}</p>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>صور المنتج</p>
      <div style={{ marginBottom: 20 }}>
        <ProductImageManager productId={product.id} initialImages={product.images || []} />
      </div>

      <ProductEditForm product={product} />
    </div>
  );
}
