'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import { colors } from '../../../lib/tokens';
import { verifyOtp, sendOtp } from '../../../lib/api';

const CHANNEL_LABELS = {
  WHATSAPP: 'واتساب',
  EMAIL: 'البريد الإلكتروني',
};

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const mobile = searchParams.get('mobile') || '';
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [channelsSent, setChannelsSent] = useState([]);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    sendOtp({ orderId, phone: mobile, email: email || undefined })
      .then((r) => setChannelsSent(r.channelsSent || []))
      .catch(() => setSendError('تعذر إرسال رمز التحقق. يرجى إعادة المحاولة.'));
  }, [orderId, mobile, email]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  function handleDigitChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  async function handleConfirm() {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('يرجى إدخال الرمز كاملا');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await verifyOtp({ orderId, code: fullCode });
      router.push(`/order/confirmation/${orderId}`);
    } catch (err) {
      setError('رمز غير صحيح أو منتهي الصلاحية');
    } finally {
      setSubmitting(false);
    }
  }

  function handleResend() {
    sendOtp({ orderId, phone: mobile, email: email || undefined })
      .then((r) => setChannelsSent(r.channelsSent || []))
      .catch(() => setSendError('تعذر إعادة إرسال الرمز.'));
    setSecondsLeft(45);
  }

  const channelText = channelsSent.length > 0
    ? channelsSent.map((c) => CHANNEL_LABELS[c] || c).join(' و ')
    : null;

  return (
    <main>
      <Header title="تأكيد الطلب" backHref="/checkout" />

      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>🔐</div>
        <p style={{ fontSize: 14, fontWeight: 500, margin: '12px 0 4px' }}>
          {channelText ? `تأكيد عبر ${channelText}` : 'جارٍ إرسال رمز التحقق...'}
        </p>
        <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 18px' }}>
          طلبك يتجاوز الحد المسموح ويتطلب تأكيد إضافي
          {mobile && <span className="ltr-isolate" style={{ display: 'block', marginTop: 4 }}>{mobile}</span>}
          {email && <span className="ltr-isolate" style={{ display: 'block' }}>{email}</span>}
        </p>

        {sendError && <p style={{ color: colors.danger, fontSize: 12, marginBottom: 12 }}>{sendError}</p>}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {code.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              style={{
                width: 42,
                height: 48,
                textAlign: 'center',
                fontSize: 16,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
              }}
            />
          ))}
        </div>

        {error && <p style={{ color: colors.danger, fontSize: 12, marginBottom: 12 }}>{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={submitting}
          style={{
            width: '100%',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            marginBottom: 8,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'جارٍ التحقق...' : 'تأكيد'}
        </button>

        {secondsLeft > 0 ? (
          <p style={{ fontSize: 12, color: colors.primary, margin: 0 }}>
            إعادة إرسال الرمز خلال 00:{String(secondsLeft).padStart(2, '0')}
          </p>
        ) : (
          <button
            onClick={handleResend}
            style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 12 }}
          >
            إعادة إرسال الرمز
          </button>
        )}
      </div>
    </main>
  );
}
