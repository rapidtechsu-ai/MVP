'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { colors } from '../../lib/tokens';
import { createOrder } from '../../lib/api';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoneId = searchParams.get('zoneId') || '';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const deliveryFee = 3000; // resolved from selected zone in a full implementation
  const total = subtotal + deliveryFee;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !mobile.trim() || !address.trim()) {
      setError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        customerId: mobile, // MVP placeholder — real flow resolves/creates Customer by mobile
        zoneId,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });

      clearCart();

      if (order.otpRequired) {
        const params = new URLSearchParams({ orderId: order.id, mobile });
        if (email.trim()) params.set('email', email.trim());
        router.push(`/checkout/otp?${params.toString()}`);
      } else {
        router.push(`/order/confirmation/${order.id}`);
      }
    } catch (err) {
      setError('تعذر إتمام الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Header title="إتمام الطلب" backHref="/cart" />

      <form onSubmit={handleSubmit} style={{ padding: '14px 16px' }}>
        <Field label="الاسم الكامل" value={name} onChange={setName} />
        <Field label="رقم الهاتف" value={mobile} onChange={setMobile} type="tel" />
        <Field label="البريد الإلكتروني (اختياري - لاستلام رمز التحقق أيضا)" value={email} onChange={setEmail} type="email" />

        <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>
          العنوان بالتفصيل
        </p>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="اسم الحي، أقرب معلم..."
          style={{
            width: '100%',
            height: 64,
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#EDE6FB',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14,
          }}
        >
          <span>💵</span>
          <span style={{ fontSize: 12, color: colors.primary }}>
            الدفع عند الاستلام - طريقة الدفع الوحيدة حاليا
          </span>
        </div>

        <div style={{ background: colors.canvas, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <Row label="المجموع الفرعي" value={subtotal} />
          <Row label="رسوم التوصيل" value={deliveryFee} />
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

        {error && (
          <p style={{ color: colors.danger, fontSize: 12, marginBottom: 12 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: 13,
            fontSize: 14,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'جارٍ الإرسال...' : 'تأكيد الطلب'}
        </button>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          fontSize: 13,
        }}
      />
    </div>
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
