'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { colors } from '../lib/tokens';

export default function ProductActions({ product, price }) {
  const { addItem } = useCart();
  const router = useRouter();

  function handleAddToCart() {
    addItem({
      productId: product.id,
      nameAr: product.nameAr,
      unitPriceSdg: Number(price) || 0,
    });
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push('/cart');
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
      <button
        onClick={handleAddToCart}
        style={{
          flex: 1,
          background: colors.canvas,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 13,
          fontSize: 13,
        }}
      >
        أضف للسلة
      </button>
      <button
        onClick={handleBuyNow}
        style={{
          flex: 1,
          background: colors.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: 13,
          fontSize: 13,
        }}
      >
        اشترِ الآن
      </button>
    </div>
  );
}
