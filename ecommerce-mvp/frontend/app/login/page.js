'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import { colors } from '../../lib/tokens';
import { requestCustomerLoginOtp, verifyCustomerLoginOtp } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const [step, setStep] = useState('mobile'); // 'mobile' | 'code'
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [channelsSent, setChannelsSent] = useState([]);

  async function handleRequestOtp(e) {
    e.preventDefault();
    if (!mobile.trim()) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await requestCustomerLoginOtp({ mobile: mobile.trim() });
      setChannelsSent(result.channelsSent || []);
      setStep('code');
    } catch (err) {
      setError('تعذر إرسال رمز الدخول. تحقق من الرقم وحاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!code.trim()) {
      setError('يرجى إدخال الرمز');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await verifyCustomerLoginOtp({ mobile: mobile.trim(), code: code.trim() });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError('رمز غير صحيح أو منتهي الصلاحية');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Header title="تسجيل الدخول" />

      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>👤</div>

        {step === 'mobile' ? (
          <form onSubmit={handleRequestOtp}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '12px 0 4px' }}>
              الدخول برقم الهاتف
            </p>
            <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 18px' }}>
              سنرسل لك رمز تحقق لتأكيد رقمك
            </p>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="09XXXXXXXX"
              className="ltr-isolate"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, marginBottom: 14, textAlign: 'center' }}
            />
            {error && <p style={{ color: colors.danger, fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'جارٍ الإرسال...' : 'إرسال رمز الدخول'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '12px 0 4px' }}>أدخل رمز التحقق</p>
            <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 18px' }}>
              تم إرسال الرمز إلى <span className="ltr-isolate">{mobile}</span>
              {channelsSent.length > 0 && (
                <span> عبر {channelsSent.map((c) => (c === 'WHATSAPP' ? 'واتساب' : 'البريد الإلكتروني')).join(' و ')}</span>
              )}
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="0000"
              className="ltr-isolate"
              maxLength={4}
              style={{ width: 120, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 18, marginBottom: 14, textAlign: 'center' }}
            />
            {error && <p style={{ color: colors.danger, fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'جارٍ التحقق...' : 'تأكيد الدخول'}
            </button>
            <p
              onClick={() => { setStep('mobile'); setError(''); }}
              style={{ fontSize: 11, color: colors.primary, marginTop: 14, cursor: 'pointer' }}
            >
              تغيير رقم الهاتف
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
