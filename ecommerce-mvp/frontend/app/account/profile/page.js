'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { colors } from '../../../lib/tokens';
import { getCustomerProfile, updateCustomerProfile, getStoredCustomer } from '../../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getStoredCustomer()) {
      router.push('/login?redirect=/account/profile');
      return;
    }
    getCustomerProfile()
      .then((p) => {
        setName(p.name || '');
        setEmail(p.email || '');
        setMobile(p.mobile || '');
        setLoading(false);
      })
      .catch(() => {
        setStatus({ type: 'error', text: 'تعذر تحميل الملف الشخصي.' });
        setLoading(false);
      });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await updateCustomerProfile({ name, email });
      setStatus({ type: 'success', text: 'تم حفظ التغييرات.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Header title="الملف الشخصي" backHref="/account" />
      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ fontSize: 12, color: colors.textMuted }}>جارٍ التحميل...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>رقم الهاتف</p>
            <input
              value={mobile}
              disabled
              className="ltr-isolate"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 14, background: colors.canvas, color: colors.textMuted }}
            />

            <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>الاسم الكامل</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 14 }}
            />

            <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>البريد الإلكتروني (اختياري)</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ltr-isolate"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 16 }}
            />

            {status && (
              <p style={{ fontSize: 12, color: status.type === 'error' ? colors.danger : colors.success, marginBottom: 12 }}>
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
