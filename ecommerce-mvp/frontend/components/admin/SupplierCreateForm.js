'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupplier } from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

export default function SupplierCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({ type: 'error', text: 'اسم المورد مطلوب.' });
      return;
    }
    try {
      await createSupplier({ name, contacts, paymentTerms });
      setName('');
      setContacts('');
      setPaymentTerms('');
      setStatus({ type: 'success', text: 'تمت إضافة المورد.' });
      router.refresh();
    } catch (e) {
      setStatus({ type: 'error', text: 'تعذر إضافة المورد.' });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>اسم المورد</p>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>بيانات التواصل</p>
        <input value={contacts} onChange={(e) => setContacts(e.target.value)} style={inputStyle} className="ltr-isolate" />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>شروط الدفع</p>
        <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} style={{ ...inputStyle, width: 100 }} placeholder="مثال: Net 7" />
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
