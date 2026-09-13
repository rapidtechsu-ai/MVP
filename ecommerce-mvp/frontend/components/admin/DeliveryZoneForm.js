'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDeliveryZone } from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

export default function DeliveryZoneForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [feeSdg, setFeeSdg] = useState('');
  const [slaHours, setSlaHours] = useState('24');
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !feeSdg) {
      setStatus({ type: 'error', text: 'اسم المنطقة والرسوم مطلوبان.' });
      return;
    }
    try {
      await createDeliveryZone({ name, feeSdg: Number(feeSdg), slaHours: Number(slaHours) });
      setName('');
      setFeeSdg('');
      setStatus({ type: 'success', text: 'تمت إضافة المنطقة.' });
      router.refresh();
    } catch (e) {
      setStatus({ type: 'error', text: 'تعذر إضافة المنطقة.' });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>اسم المنطقة</p>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>الرسوم (SDG)</p>
        <input value={feeSdg} onChange={(e) => setFeeSdg(e.target.value)} style={{ ...inputStyle, width: 100 }} className="ltr-isolate" />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>SLA (ساعة)</p>
        <input value={slaHours} onChange={(e) => setSlaHours(e.target.value)} style={{ ...inputStyle, width: 70 }} className="ltr-isolate" />
      </div>
      <button type="submit" style={{ fontSize: 12, height: 34, padding: '0 16px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer' }}>
        إضافة
      </button>
      {status && (
        <p style={{ fontSize: 11, color: status.type === 'error' ? colors.danger : colors.success, width: '100%', margin: 0 }}>
          {status.text}
        </p>
      )}
    </form>
  );
}

const inputStyle = { fontSize: 12, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` };
