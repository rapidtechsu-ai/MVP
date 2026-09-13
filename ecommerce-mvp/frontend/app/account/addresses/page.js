'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { colors } from '../../../lib/tokens';
import {
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getDeliveryZones,
  getStoredCustomer,
} from '../../../lib/api';

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(null);
  const [zones, setZones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function reload() {
    Promise.all([getCustomerAddresses(), getDeliveryZones()])
      .then(([addr, z]) => {
        setAddresses(addr);
        setZones(z);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getStoredCustomer()) {
      router.push('/login?redirect=/account/addresses');
      return;
    }
    reload();
  }, [router]);

  async function handleDelete(id) {
    if (!confirm('حذف هذا العنوان؟')) return;
    try {
      await deleteCustomerAddress(id);
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  const editingAddress = addresses?.find((a) => a.id === editingId);

  return (
    <main>
      <Header title="العناوين المحفوظة" backHref="/account" />
      <div style={{ padding: 16 }}>
        {error && <p style={{ fontSize: 12, color: colors.danger, marginBottom: 12 }}>{error}</p>}

        {!addresses ? (
          <p style={{ fontSize: 12, color: colors.textMuted }}>جارٍ التحميل...</p>
        ) : addresses.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📍</p>
            <p style={{ fontSize: 14, color: colors.text }}>لا توجد عناوين محفوظة</p>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <p style={{ fontSize: 13, margin: '0 0 4px' }}>{addr.zone?.name}</p>
                <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 4px' }}>{addr.addressText}</p>
                {addr.landmark && (
                  <p style={{ fontSize: 11, color: colors.textMuted, margin: '0 0 8px' }}>أقرب معلم: {addr.landmark}</p>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <span
                    onClick={() => { setEditingId(addr.id); setShowForm(true); }}
                    style={{ fontSize: 11, color: colors.primary, cursor: 'pointer' }}
                  >
                    تعديل
                  </span>
                  <span
                    onClick={() => handleDelete(addr.id)}
                    style={{ fontSize: 11, color: colors.danger, cursor: 'pointer' }}
                  >
                    حذف
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <AddressForm
            zones={zones}
            existing={editingAddress}
            onDone={() => { setShowForm(false); setEditingId(null); reload(); }}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            style={{ width: '100%', background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 13 }}
          >
            + إضافة عنوان جديد
          </button>
        )}
      </div>
    </main>
  );
}

function AddressForm({ zones, existing, onDone, onCancel }) {
  const [zoneId, setZoneId] = useState(existing?.zoneId || zones[0]?.id || '');
  const [addressText, setAddressText] = useState(existing?.addressText || '');
  const [landmark, setLandmark] = useState(existing?.landmark || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!zoneId || !addressText.trim()) {
      setError('المنطقة والعنوان مطلوبان.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (existing) {
        await updateCustomerAddress(existing.id, { zoneId, addressText, landmark });
      } else {
        await createCustomerAddress({ zoneId, addressText, landmark });
      }
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
      style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}
    >
      <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>المنطقة</p>
      <select
        value={zoneId}
        onChange={(e) => setZoneId(e.target.value)}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 12, fontSize: 13 }}
      >
        {zones.map((z) => (
          <option key={z.id} value={z.id}>{z.name}</option>
        ))}
      </select>

      <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>العنوان بالتفصيل</p>
      <textarea
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
        placeholder="اسم الحي، رقم المنزل..."
        style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 12, fontSize: 13, height: 60 }}
      />

      <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 6px' }}>أقرب معلم (اختياري)</p>
      <input
        value={landmark}
        onChange={(e) => setLandmark(e.target.value)}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 14, fontSize: 13 }}
      />

      {error && <p style={{ fontSize: 12, color: colors.danger, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, background: colors.canvas, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 11, fontSize: 13 }}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{ flex: 1, background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? '...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
}
