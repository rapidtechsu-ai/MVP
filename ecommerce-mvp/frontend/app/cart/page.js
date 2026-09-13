'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { colors } from '../../lib/tokens';
import { getDeliveryZones } from '../../lib/api';

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');

  useEffect(() => {
    getDeliveryZones()
      .then((z) => {
        setZones(z);
        if (z.length > 0) setZoneId(z[0].id);
      })
      .catch(() => setZones([]));
  }, []);

  const selectedZone = zones.find((z) => z.id === zoneId);
  const deliveryFee = selectedZone ? Number(selectedZone.feeSdg) : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <main>
        <Header title="السلة" backHref="/" />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🛒</p>
          <p style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>سلتك فارغة</p>
          <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>
            أضف منتجات لتبدأ التسوق
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              background: colors.primary,
              color: '#fff',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 13,
            }}
          >
            تصفح المنتجات
          </a>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header title={`السلة (${items.length})`} backHref="/" />

      <section style={{ padding: '12px 16px' }}>
        {items.map((item) => (
          <div
            key={item.productId}
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 0',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: colors.canvas,
                borderRadius: 8,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, margin: '0 0 4px' }}>{item.nameAr}</p>
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 6px' }} className="ltr-isolate">
                {item.unitPriceSdg.toLocaleString('en-US')} ج.س
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                  }}
                >
                  <button
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    style={{ border: 'none', background: 'none', padding: '2px 10px', fontSize: 14 }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      padding: '2px 10px',
                      fontSize: 12,
                      borderRight: `1px solid ${colors.border}`,
                      borderLeft: `1px solid ${colors.border}`,
                    }}
                  >
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    style={{ border: 'none', background: 'none', padding: '2px 10px', fontSize: 14 }}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  style={{ border: 'none', background: 'none', color: colors.textMuted, fontSize: 16 }}
                  aria-label="حذف"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {zones.length > 0 && (
        <section style={{ padding: '0 16px 12px' }}>
          <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>
            منطقة التوصيل
          </p>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              fontSize: 13,
            }}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <section style={{ padding: '0 16px 16px' }}>
        <div style={{ background: colors.canvas, borderRadius: 12, padding: '12px 14px' }}>
          <Row label="المجموع الفرعي" value={subtotal} />
          <Row label="رسوم التوصيل (تقديري)" value={deliveryFee} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              fontWeight: 500,
              paddingTop: 8,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <span>الإجمالي</span>
            <span className="ltr-isolate">{total.toLocaleString('en-US')} ج.س</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 16px 16px' }}>
        <button
          onClick={() => router.push(`/checkout?zoneId=${zoneId}`)}
          disabled={!zoneId}
          style={{
            width: '100%',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: 13,
            fontSize: 14,
            opacity: zoneId ? 1 : 0.5,
          }}
        >
          إتمام الطلب
        </button>
      </section>
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 6,
      }}
    >
      <span>{label}</span>
      <span className="ltr-isolate">{value.toLocaleString('en-US')} ج.س</span>
    </div>
  );
}
