'use client';

import { useState, useEffect } from 'react';
import {
  getSettings,
  updateSettings,
  getNotificationProviders,
  updateNotificationProvider,
} from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

const CHANNEL_LABELS = { EMAIL: 'البريد الإلكتروني', WHATSAPP: 'واتساب' };

export default function OtpSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [thresholdStatus, setThresholdStatus] = useState(null);

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    Promise.all([getSettings(), getNotificationProviders()]).then(([settings, provs]) => {
      setThreshold(settings.otp_threshold_sdg || '1000000');
      setExpiryMinutes(settings.otp_expiry_minutes || '5');
      setMaxAttempts(settings.otp_max_attempts || '3');
      setProviders(provs);
      setLoading(false);
    });
  }, []);

  async function saveThresholdSettings() {
    try {
      await updateSettings({
        otp_threshold_sdg: threshold,
        otp_expiry_minutes: expiryMinutes,
        otp_max_attempts: maxAttempts,
      });
      setThresholdStatus({ type: 'success', text: 'تم حفظ الإعدادات.' });
    } catch (e) {
      setThresholdStatus({ type: 'error', text: 'تعذر حفظ الإعدادات.' });
    }
  }

  function updateProviderField(channel, field, value) {
    setProviders((prev) =>
      prev.map((p) => (p.channel === channel ? { ...p, [field]: value } : p))
    );
  }

  async function saveProvider(channel) {
    const provider = providers.find((p) => p.channel === channel);
    try {
      const saved = await updateNotificationProvider(channel, {
        providerName: provider.providerName,
        apiEndpoint: provider.apiEndpoint,
        apiKey: provider.apiKey,
        fromIdentifier: provider.fromIdentifier,
        active: provider.active,
      });
      setProviders((prev) => prev.map((p) => (p.channel === channel ? { ...saved, _status: 'saved' } : p)));
      setTimeout(() => {
        setProviders((prev) => prev.map((p) => (p.channel === channel ? { ...p, _status: null } : p)));
      }, 2000);
    } catch (e) {
      setProviders((prev) => prev.map((p) => (p.channel === channel ? { ...p, _status: 'error' } : p)));
    }
  }

  if (loading) {
    return <p style={{ fontSize: 12, color: colors.textMuted }}>جارٍ التحميل...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* OTP threshold / expiry / attempts */}
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>إعدادات رمز التحقق (OTP)</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Field label="حد قيمة الطلب لتفعيل OTP (SDG)">
            <input value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ ...inputStyle, width: 130 }} className="ltr-isolate" />
          </Field>
          <Field label="مدة صلاحية الرمز (دقائق)">
            <input value={expiryMinutes} onChange={(e) => setExpiryMinutes(e.target.value)} style={{ ...inputStyle, width: 80 }} className="ltr-isolate" />
          </Field>
          <Field label="عدد المحاولات المسموح بها">
            <input value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} style={{ ...inputStyle, width: 80 }} className="ltr-isolate" />
          </Field>
        </div>
        <button onClick={saveThresholdSettings} style={{ ...btnPrimary, marginTop: 10 }}>حفظ</button>
        {thresholdStatus && (
          <p style={{ fontSize: 11, color: thresholdStatus.type === 'error' ? colors.danger : colors.success, marginTop: 8 }}>
            {thresholdStatus.text}
          </p>
        )}
      </div>

      {/* Per-channel provider config */}
      <p style={{ fontSize: 12, fontWeight: 600, margin: '4px 0 0' }}>قنوات إرسال رمز التحقق</p>
      <p style={{ fontSize: 11, color: colors.textMuted, margin: '-8px 0 0' }}>
        يمكن تفعيل قناة أو أكثر في نفس الوقت — سيتم إرسال الرمز عبر كل قناة مفعّلة لها وجهة مطابقة (هاتف أو بريد إلكتروني).
      </p>

      {providers.map((provider) => (
        <div key={provider.channel} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{CHANNEL_LABELS[provider.channel]}</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!provider.active}
                onChange={(e) => updateProviderField(provider.channel, 'active', e.target.checked)}
              />
              مفعّلة
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="اسم المزود">
              <input
                value={provider.providerName || ''}
                onChange={(e) => updateProviderField(provider.channel, 'providerName', e.target.value)}
                style={inputStyle}
                placeholder={provider.channel === 'EMAIL' ? 'مثال: SendGrid' : 'مثال: Twilio / Meta BSP'}
              />
            </Field>
            <Field label={provider.channel === 'EMAIL' ? 'البريد المرسل (From)' : 'رقم/معرّف المرسل'}>
              <input
                value={provider.fromIdentifier || ''}
                onChange={(e) => updateProviderField(provider.channel, 'fromIdentifier', e.target.value)}
                style={inputStyle}
                className="ltr-isolate"
              />
            </Field>
            <Field label="نقطة النهاية (Endpoint URL)">
              <input
                value={provider.apiEndpoint || ''}
                onChange={(e) => updateProviderField(provider.channel, 'apiEndpoint', e.target.value)}
                style={inputStyle}
                className="ltr-isolate"
                placeholder="https://..."
              />
            </Field>
            <Field label="مفتاح API">
              <input
                type="password"
                value={provider.apiKey || ''}
                onChange={(e) => updateProviderField(provider.channel, 'apiKey', e.target.value)}
                style={inputStyle}
                className="ltr-isolate"
              />
            </Field>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <button onClick={() => saveProvider(provider.channel)} style={btnPrimary}>حفظ</button>
            {provider._status === 'saved' && <span style={{ fontSize: 11, color: colors.success }}>تم الحفظ</span>}
            {provider._status === 'error' && <span style={{ fontSize: 11, color: colors.danger }}>تعذر الحفظ</span>}
            {!provider.apiEndpoint && (
              <span style={{ fontSize: 11, color: colors.textMuted }}>
                بدون نقطة نهاية، سيتم تسجيل الرمز في سجلات الخادم فقط (وضع تطوير)
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>{label}</p>
      {children}
    </div>
  );
}

const inputStyle = { fontSize: 12, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}`, width: '100%' };
const btnPrimary = {
  fontSize: 12, height: 32, padding: '0 16px', borderRadius: 6, border: 'none',
  background: colors.primary, color: '#fff', cursor: 'pointer',
};
