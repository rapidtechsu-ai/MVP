'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

const NEXT_STATUS_LABEL = {
  NEW: 'بدء التحقق',
  VERIFICATION: 'تأكيد التوفر',
  RESERVED: 'وضع علامة جاهز',
  READY: 'خارج للتوصيل',
  OUT_FOR_DELIVERY: 'تم التسليم',
};

const NEXT_STATUS_VALUE = {
  NEW: 'VERIFICATION',
  VERIFICATION: 'RESERVED',
  RESERVED: 'READY',
  READY: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

export default function OrderActions({ order }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextLabel = NEXT_STATUS_LABEL[order.status];
  const nextValue = NEXT_STATUS_VALUE[order.status];

  async function advance() {
    if (!nextValue) return;
    setLoading(true);
    try {
      await updateOrderStatus({ orderId: order.id, toStatus: nextValue });
      router.refresh();
    } catch (e) {
      alert('تعذر تحديث حالة الطلب.');
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    const reason = prompt('سبب الإلغاء:');
    if (!reason) return;
    setLoading(true);
    try {
      await updateOrderStatus({ orderId: order.id, toStatus: 'CANCELLED', reason });
      router.refresh();
    } catch (e) {
      alert('تعذر إلغاء الطلب.');
    } finally {
      setLoading(false);
    }
  }

  if (['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(order.status)) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={cancel}
        disabled={loading}
        style={{ fontSize: 12, height: 30, padding: '0 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surface, cursor: 'pointer' }}
      >
        إلغاء
      </button>
      {nextLabel && (
        <button
          onClick={advance}
          disabled={loading}
          style={{ fontSize: 12, height: 30, padding: '0 12px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer' }}
        >
          {loading ? '...' : nextLabel}
        </button>
      )}
    </div>
  );
}
