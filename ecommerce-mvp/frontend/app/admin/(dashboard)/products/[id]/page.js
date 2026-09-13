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
