// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import Header from '../../../components/Header';
import ProductActions from '../../../components/ProductActions';
import ProductGallery from '../../../components/ProductGallery';
import { getProductDetail } from '../../../lib/api';
import { colors } from '../../../lib/tokens';

const AVAILABILITY_LABELS = {
  AVAILABLE: 'متوفر',
  REQUIRES_CONFIRMATION: 'متوفر لدى المورد - يتطلب تأكيد التوفر',
  UNAVAILABLE: 'غير متوفر حاليا',
  DISCONTINUED: 'تم إيقاف هذا المنتج',
};

export default async function ProductPage({ params }) {
  const product = await getProductDetail(params.id);
  const price = product.priceHistory?.[0]?.calculatedSdg;
  const availability = product.supplierProducts?.[0]?.availability;

  return (
    <main>
      <Header title="تفاصيل المنتج" backHref="/" />

      <div style={{ padding: 16 }}>
        {/* Gallery */}
        <ProductGallery images={product.images} alt={product.nameAr} />

        <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 4px' }}>
          {product.brand?.name || ''}
        </p>
        <h1 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px' }}>{product.nameAr}</h1>

        {price != null && (
          <p style={{ fontSize: 22, fontWeight: 500, margin: '0 0 10px' }} className="ltr-isolate">
            {Number(price).toLocaleString('en-US')} <span style={{ fontSize: 14 }}>ج.س</span>
          </p>
        )}

        {/* Availability — never overstates stock (BRULE-012) */}
        {availability && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: availability === 'AVAILABLE' ? colors.successBg : colors.warningBg,
              borderRadius: 8,
              padding: '8px 10px',
              marginBottom: 10,
            }}
          >
            <span style={{ color: availability === 'AVAILABLE' ? colors.success : colors.warning, fontSize: 12 }}>
              {AVAILABILITY_LABELS[availability]}
            </span>
          </div>
        )}

        {/* Delivery / COD / warranty badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <Badge icon="🚚" label="توصيل 24 ساعة" />
          <Badge icon="💵" label="الدفع عند الاستلام" />
          <Badge icon="🛡" label={product.warranty || 'ضمان'} />
        </div>

        {/* Specifications */}
        <h2 style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px' }}>المواصفات</h2>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 14 }}>
          <tbody>
            {product.specifications.map((spec) => (
              <tr key={spec.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ color: colors.textSecondary, padding: '6px 0' }}>{spec.attribute.name}</td>
                <td style={{ textAlign: 'left', padding: '6px 0' }} className="ltr-isolate">
                  {spec.value} {spec.unit || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FR-CAT-005: Similar devices — same category, cross-brand, ranked by comparable specs */}
        {product.similarProducts?.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>منتجات مشابهة</h2>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {product.similarProducts.map((p) => (
                <SuggestionCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* FR-CAT-006: Compatible accessories — manually linked by admin */}
        {product.compatibleAccessories?.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>إكسسوارات متوافقة</h2>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {product.compatibleAccessories.map((a) => (
                <SuggestionCard key={a.id} product={a} />
              ))}
            </div>
          </section>
        )}

        <ProductActions product={product} price={price} />
      </div>
    </main>
  );
}

function Badge({ icon, label }) {
  return (
    <div style={{ textAlign: 'center', background: colors.canvas, borderRadius: 8, padding: '8px 4px' }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <p style={{ fontSize: 10, margin: '4px 0 0', color: colors.textSecondary }}>{label}</p>
    </div>
  );
}

function SuggestionCard({ product }) {
  const thumb = product.images?.[0]?.url;
  return (
    <a
      href={`/product/${product.id}`}
      style={{
        flex: '0 0 120px',
        background: colors.canvas,
        borderRadius: 12,
        padding: 10,
        color: colors.text,
      }}
    >
      {thumb ? (
        <img src={thumb} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
      ) : (
        <div style={{ aspectRatio: '1', background: colors.surface, borderRadius: 8, marginBottom: 8 }} />
      )}
      <p style={{ fontSize: 11, margin: 0, lineHeight: 1.4 }}>{product.nameAr}</p>
    </a>
  );
}
