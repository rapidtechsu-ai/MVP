'use client';

import { useState } from 'react';
import { setMarkupOverride } from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

export default function ProductEditForm({ product }) {
  const [name, setName] = useState(product.nameAr);
  const [costAed, setCostAed] = useState(product.supplierProducts?.[0]?.costAed || '');
  const [markupPercent, setMarkupPercent] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState(null);

  async function handleSaveMarkup() {
    if (!markupPercent || !reason) {
      setStatus({ type: 'error', text: 'الهامش والسبب مطلوبان لحفظ التخصيص.' });
      return;
    }
    try {
      await setMarkupOverride({
        productId: product.id,
        percent: Number(markupPercent),
        reason,
      });
      setStatus({ type: 'success', text: 'تم حفظ هامش الربح الخاص بالمنتج.' });
    } catch (e) {
      setStatus({ type: 'error', text: 'تعذر حفظ التغييرات.' });
    }
  }

  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="اسم المنتج">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="الفئة">
          <input value={product.category?.nameAr || ''} disabled style={{ ...inputStyle, background: colors.canvas }} />
        </Field>
        <Field label="تكلفة المورد (AED)">
          <input value={costAed} onChange={(e) => setCostAed(e.target.value)} style={inputStyle} className="ltr-isolate" />
        </Field>
        <Field label="هامش خاص بالمنتج (اختياري)">
          <input
            value={markupPercent}
            onChange={(e) => setMarkupPercent(e.target.value)}
            placeholder="افتراضي 5%"
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="سبب التخصيص (مطلوب عند تعيين هامش خاص)">
        <input value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle} />
      </Field>

      <Field label="متوافق مع (أجهزة)">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(product.compatibleWith || []).map((c) => (
            <span key={c.id} style={{ background: colors.canvas, color: colors.primary, fontSize: 11, padding: '4px 10px', borderRadius: 6 }}>
              {c.nameAr}
            </span>
          ))}
          <span style={{ background: colors.surface, border: `1px dashed ${colors.border}`, color: colors.textSecondary, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
            + إضافة جهاز
          </span>
        </div>
      </Field>

      {status && (
        <p style={{ fontSize: 12, color: status.type === 'error' ? colors.danger : colors.success, marginTop: 8 }}>
          {status.text}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <a href="/admin/products" style={{ fontSize: 12, height: 30, padding: '0 14px', borderRadius: 6, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', color: colors.text }}>
          إلغاء
        </a>
        <button
          onClick={handleSaveMarkup}
          style={{ fontSize: 12, height: 30, padding: '0 14px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer' }}
        >
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>{label}</p>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  fontSize: 12,
  padding: 8,
  borderRadius: 6,
  border: `1px solid ${colors.border}`,
};
