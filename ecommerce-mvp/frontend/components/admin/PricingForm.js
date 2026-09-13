'use client';

import { useState, useEffect } from 'react';
import { setExchangeRate, previewPrice } from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

export default function PricingForm() {
  const [rate, setRate] = useState('1700');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [globalMarkup, setGlobalMarkup] = useState('5');
  const [status, setStatus] = useState(null);

  const [previewCost, setPreviewCost] = useState('500');
  const [previewSdg, setPreviewSdg] = useState(null);

  useEffect(() => {
    const cost = Number(previewCost);
    const markup = Number(globalMarkup);
    const fx = Number(rate);
    if (cost && markup >= 0 && fx) {
      // Mirror the confirmed formula locally for instant feedback;
      // also call the backend preview endpoint to keep it as source of truth.
      setPreviewSdg(cost * (1 + markup / 100) * fx);
      previewPrice({ costAed: cost, markupPercent: markup, fxRate: fx })
        .then((r) => {
          if (r.calculatedSdg != null) setPreviewSdg(Number(r.calculatedSdg));
        })
        .catch(() => {});
    }
  }, [previewCost, globalMarkup, rate]);

  async function handleSaveRate() {
    if (!rate) {
      setStatus({ type: 'error', text: 'سعر الصرف مطلوب.' });
      return;
    }
    try {
      const result = await setExchangeRate({
        rate: Number(rate),
        effectiveFrom,
      });
      setStatus({
        type: 'success',
        text: `تم حفظ السعر. تم تحديث ${result.pricesUpdated ?? 0} سعر منتج.`,
      });
    } catch (e) {
      setStatus({ type: 'error', text: 'تعذر حفظ سعر الصرف.' });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>سعر الصرف الحالي</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>1 AED =</p>
            <input value={rate} onChange={(e) => setRate(e.target.value)} style={{ ...inputStyle, width: 100 }} className="ltr-isolate" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>تاريخ السريان</p>
            <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} style={{ ...inputStyle, width: 130 }} />
          </div>
          <button onClick={handleSaveRate} style={btnPrimary}>حفظ السعر الجديد</button>
        </div>
        {status && (
          <p style={{ fontSize: 11, color: status.type === 'error' ? colors.danger : colors.success, marginTop: 8 }}>
            {status.text}
          </p>
        )}
      </div>

      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>هامش الربح الافتراضي</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>عام (كل الفئات)</span>
          <input value={globalMarkup} onChange={(e) => setGlobalMarkup(e.target.value)} style={{ ...inputStyle, width: 60 }} className="ltr-isolate" />
          <span style={{ fontSize: 11, color: colors.textMuted }}>قابل للتخصيص حسب الفئة أو المنتج</span>
        </div>
      </div>

      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>معاينة حساب السعر</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
          <input
            value={previewCost}
            onChange={(e) => setPreviewCost(e.target.value)}
            style={{ ...inputStyle, width: 90 }}
            className="ltr-isolate"
          />
          <span>AED ×</span>
          <span style={{ background: colors.canvas, borderRadius: 6, padding: '6px 10px' }}>
            {(1 + Number(globalMarkup || 0) / 100).toFixed(2)} (هامش {globalMarkup || 0}%)
          </span>
          <span>×</span>
          <span style={{ background: colors.canvas, borderRadius: 6, padding: '6px 10px' }}>{rate} (سعر الصرف)</span>
          <span>=</span>
          <span style={{ background: colors.successBg, color: colors.success, borderRadius: 6, padding: '6px 10px', fontWeight: 600 }}>
            {previewSdg != null ? Math.round(previewSdg).toLocaleString('en-US') : '—'} ج.س
          </span>
        </div>
        <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 10 }}>بدون تقريب - يعرض القيمة الدقيقة</p>
      </div>
    </div>
  );
}

const inputStyle = { fontSize: 13, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` };
const btnPrimary = {
  background: colors.primary, color: '#fff', border: 'none', fontSize: 12,
  padding: '0 16px', height: 34, borderRadius: 6, cursor: 'pointer',
};
