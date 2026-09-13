'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, resetUserPassword } from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

const ROLE_LABELS = {
  SYSTEM_ADMIN: 'مدير النظام (صلاحية كاملة)',
  OPERATIONS: 'التشغيل',
  PRICING: 'التسعير',
  FINANCE: 'المالية',
  DELIVERY: 'التوصيل',
  READ_ONLY_MANAGEMENT: 'إدارة - قراءة فقط',
};

const ROLES = Object.keys(ROLE_LABELS);

export default function UsersManagement() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  function reload() {
    getUsers()
      .then(setUsers)
      .catch(() => setError('تعذر تحميل قائمة المستخدمين.'));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleRoleChange(user, newRole) {
    try {
      await updateUser(user.id, { role: newRole });
      reload();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleActive(user) {
    try {
      await updateUser(user.id, { active: !user.active });
      reload();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleResetPassword(user) {
    const newPassword = prompt(`كلمة مرور جديدة لـ ${user.email} (8 أحرف على الأقل):`);
    if (!newPassword) return;
    try {
      await resetUserPassword(user.id, newPassword);
      alert('تم تحديث كلمة المرور.');
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <p style={{ fontSize: 12, color: colors.danger }}>{error}</p>;
  if (!users) return <p style={{ fontSize: 12, color: colors.textMuted }}>جارٍ التحميل...</p>;

  return (
    <div>
      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              <th style={thStyle}>الاسم</th>
              <th style={thStyle}>البريد الإلكتروني</th>
              <th style={thStyle}>الدور</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={tdStyle}>
                  {u.name}
                  {u.role === 'SYSTEM_ADMIN' && (
                    <span style={{ marginRight: 6, fontSize: 10, background: colors.canvas, color: colors.primary, padding: '2px 6px', borderRadius: 6 }}>
                      المستخدم الخارق
                    </span>
                  )}
                </td>
                <td style={tdStyle} className="ltr-isolate">{u.email}</td>
                <td style={tdStyle}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    style={{ fontSize: 11, padding: 4, borderRadius: 6, border: `1px solid ${colors.border}` }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleToggleActive(u)}
                    style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: u.active ? colors.successBg : colors.dangerBg,
                      color: u.active ? colors.success : colors.danger,
                    }}
                  >
                    {u.active ? 'نشط' : 'موقوف'}
                  </button>
                </td>
                <td style={tdStyle}>
                  <span onClick={() => handleResetPassword(u)} style={{ color: colors.primary, cursor: 'pointer', fontSize: 11 }}>
                    إعادة تعيين كلمة المرور
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateForm ? (
        <CreateUserForm onDone={() => { setShowCreateForm(false); reload(); }} onCancel={() => setShowCreateForm(false)} />
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{ fontSize: 12, height: 32, padding: '0 16px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer' }}
        >
          + مستخدم جديد
        </button>
      )}
    </div>
  );
}

function CreateUserForm({ onDone, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('READ_ONLY_MANAGEMENT');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('جميع الحقول مطلوبة.');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور 8 أحرف على الأقل.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createUser({ name, email, password, role });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>الاسم</p>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>البريد الإلكتروني</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} className="ltr-isolate" />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>كلمة المرور</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>الدور</p>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={submitting} style={{ fontSize: 12, height: 34, padding: '0 16px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer' }}>
        {submitting ? '...' : 'إنشاء'}
      </button>
      <button type="button" onClick={onCancel} style={{ fontSize: 12, height: 34, padding: '0 16px', borderRadius: 6, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer' }}>
        إلغاء
      </button>
      {error && <p style={{ fontSize: 11, color: colors.danger, width: '100%', margin: 0 }}>{error}</p>}
    </form>
  );
}

const inputStyle = { fontSize: 12, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` };
const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
