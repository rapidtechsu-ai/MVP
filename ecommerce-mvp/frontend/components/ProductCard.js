export default function ProductCard({ product }) {
  const price = product.priceHistory?.[0]?.calculatedSdg;
  const availability = product.supplierProducts?.[0]?.availability;

  const availabilityLabel = {
    AVAILABLE: 'متوفر',
    REQUIRES_CONFIRMATION: 'يتطلب تأكيد',
    UNAVAILABLE: 'غير متوفر',
    DISCONTINUED: 'متوقف',
  }[availability];

  const availabilityColor = {
    AVAILABLE: '#0F9F6E',
    REQUIRES_CONFIRMATION: '#F59E0B',
    UNAVAILABLE: '#DC2626',
    DISCONTINUED: '#9AA1B1',
  }[availability];

  return (
    <a
      href={`/product/${product.id}`}
      style={{
        display: 'block',
        background: '#fff',
        border: '0.5px solid #E2E5EC',
        borderRadius: 12,
        padding: 10,
      }}
    >
      {product.images?.[0] ? (
        <div style={{ position: 'relative' }}>
          <img
            src={product.images[0].url}
            alt={product.nameAr}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
          />
          {product.deliverySpeed === 'RAPID' && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: '#6D28D9',
                color: '#fff',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 6,
              }}
            >
              ⚡ سريع
            </span>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              aspectRatio: '1',
              background: '#F4F6FA',
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
          {product.deliverySpeed === 'RAPID' && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: '#6D28D9',
                color: '#fff',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 6,
              }}
            >
              ⚡ سريع
            </span>
          )}
        </div>
      )}
      <p style={{ fontSize: 12, margin: '0 0 4px', lineHeight: 1.4 }}>{product.nameAr}</p>
      {price != null && (
        <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 4px' }} className="ltr-isolate">
          {Number(price).toLocaleString('en-US')} ج.س
        </p>
      )}
      {availabilityLabel && (
        <span
          style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 6,
            background: `${availabilityColor}1A`,
            color: availabilityColor,
          }}
        >
          {availabilityLabel}
        </span>
      )}
    </a>
  );
}
