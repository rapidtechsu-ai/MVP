'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff, bootstrapStaff } from '../../../lib/adminApi';
import { colors } from '../../../lib/tokens';

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'bootstrap'

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password || (mode === 'bootstrap' && !name)) {
      setError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'bootstrap') {
        await bootstrapStaff({ name, email, password });
      } else {
        await loginStaff({ email, password });
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(mode === 'bootstrap'
        ? 'تعذر إنشاء الحساب — قد يكون هناك مسؤول مسجل بالفعل.'
        : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.canvas,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>لوحة التحكم</p>
        <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 20px' }}>
          {mode === 'bootstrap' ? 'إعداد أول حساب مسؤول' : 'تسجيل الدخول للموظفين'}
        </p>

        {mode === 'bootstrap' && (
          <>
            <label style={{ fontSize: 12, color: colors.textSecondary }}>الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <label style={{ fontSize: 12, color: colors.textSecondary }}>البريد الإلكتروني</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ fontSize: 12, color: colors.textSecondary }}>كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        {error && <p style={{ fontSize: 12, color: colors.danger, marginBottom: 12 }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            background: colors.primary,
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '...' : mode === 'bootstrap' ? 'إنشاء الحساب والدخول' : 'دخول'}
        </button>

        <p
          onClick={() => { setMode(mode === 'login' ? 'bootstrap' : 'login'); setError(''); }}
          style={{ fontSize: 11, color: colors.primary, marginTop: 14, textAlign: 'center', cursor: 'pointer' }}
        >
          {mode === 'login' ? 'أول استخدام؟ إنشاء حساب المسؤول الأول' : 'لدي حساب بالفعل — تسجيل الدخول'}
        </p>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: 10,
  marginTop: 4,
  marginBottom: 12,
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  fontSize: 13,
};
