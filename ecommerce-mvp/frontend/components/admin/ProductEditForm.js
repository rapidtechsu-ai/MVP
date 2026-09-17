'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  setMarkupOverride,
  updateProductDeliverySpeed,
  updateProduct,
  getDeviceProducts,
  addProductCompatibility,
  removeProductCompatibility,
} from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

export default function ProductEditForm({ product }) {
  const router = useRouter();
  const [name, setName] = useState(product.nameAr);
  const [costAed, setCostAed] = useState(product.supplierProducts?.[0]?.costAed || '');
  const [markupPercent, setMarkupPercent] = useState('');
  const [reason, setReason] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState(product.deliverySpeed || 'STANDARD');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [status, setStatus] = useState(null);

  const [compatibleWith, setCompatibleWith] = useState(product.compatibleWith || []);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceResults, setDeviceResults] = useState([]);
  const [compatError, setCompatError] = useState('');

  async function handleSaveDeliverySpeed() {
    try {
      await updateProductDeliverySpeed(product.id, deliverySpeed);
      setDeliveryStatus({ type: 'success', text: 'تم حفظ سرعة التوصيل.' });
    } catch (e) {
      setDeliveryStatus({ type: 'error', text: 'تعذر الحفظ.' });
    }
  }

  async function handleSaveMarkup() {
    if (!markupPercent || !reason) {
      setStatus({ type: 'error', text: 'الهامش والسبب مطلوبان لحفظ التخصيص.' });
      return;
    }
    try {
      // Save both the basic fields (name, etc.) and the markup override —
      // previously the name field had no save handler wired at all, so
      // editing it silently did nothing.
      await updateProduct(product.id, { nameAr: name });
      await setMarkupOverride({
        productId: product.id,
        percent: Number(markupPercent),
        reason,
      });
      setStatus({ type: 'success', text: 'تم حفظ التغييرات.' });
      router.refresh();
    } catch (e) {
      setStatus({ type: 'error', text: 'تعذر حفظ التغييرات.' });
    }
  }

  async function handleSearchDevices(query) {
    setDeviceSearch(query);
    if (query.trim().length < 2) {
      setDeviceResults([]);
      return;
    }
    try {
      const results = await getDeviceProducts({ search: query, excludeId: product.id });
      setDeviceResults(results);
    } catch (e) {
      setDeviceResults([]);
    }
  }

  async function handleAddDevice(device) {
    setCompatError('');
    try {
      await addProductCompatibility(product.id, device.id);
      setCompatibleWith((prev) => [...prev, device]);
      setShowDevicePicker(false);
      setDeviceSearch('');
      setDeviceResults([]);
    } catch (e) {
      setCompatError(e.message);
    }
  }

  async function handleRemoveDevice(deviceId) {
    try {
      await removeProductCompatibility(product.id, deviceId);
      setCompatibleWith((prev) => prev.filter((d) => d.id !== deviceId));
    } catch (e) {
      setCompatError(e.message);
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
        <Field label="سرعة التوصيل">
          <select value={deliverySpeed} onChange={(e) => setDeliverySpeed(e.target.value)} style={inputStyle}>
            <option value="STANDARD">توصيل خلال 24 ساعة (عادي)</option>
            <option value="RAPID">توصيل سريع</option>
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button
          onClick={handleSaveDeliverySpeed}
          style={{ fontSize: 11, height: 28, padding: '0 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.surface, cursor: 'pointer' }}
        >
          حفظ سرعة التوصيل
        </button>
        {deliveryStatus && (
          <span style={{ fontSize: 11, color: deliveryStatus.type === 'error' ? colors.danger : colors.success }}>
            {deliveryStatus.text}
          </span>
        )}
      </div>

      <Field label="سبب التخصيص (مطلوب عند تعيين هامش خاص)">
        <input value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle} />
      </Field>

      <Field label="متوافق مع (أجهزة)">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {compatibleWith.map((c) => (
            <span
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.canvas, color: colors.primary, fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
            >
              {c.nameAr}
              <span onClick={() => handleRemoveDevice(c.id)} style={{ cursor: 'pointer', color: colors.danger }}>✕</span>
            </span>
          ))}
          <span
            onClick={() => setShowDevicePicker((v) => !v)}
            style={{ background: colors.surface, border: `1px dashed ${colors.border}`, color: colors.textSecondary, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
          >
            + إضافة جهاز
          </span>
        </div>

        {showDevicePicker && (
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10, background: colors.canvas }}>
            <input
              value={deviceSearch}
              onChange={(e) => handleSearchDevices(e.target.value)}
              placeholder="ابحث عن جهاز بالاسم..."
              style={{ ...inputStyle, marginBottom: 8, background: colors.surface }}
              autoFocus
            />
            {deviceResults.length > 0 && (
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {deviceResults
                  .filter((d) => !compatibleWith.some((c) => c.id === d.id))
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleAddDevice(d)}
                      style={{ padding: '6px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 6, background: colors.surface, marginBottom: 4 }}
                    >
                      {d.nameAr}
                    </div>
                  ))}
              </div>
            )}
            {deviceSearch.trim().length >= 2 && deviceResults.length === 0 && (
              <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>لا توجد نتائج.</p>
            )}
          </div>
        )}
        {compatError && <p style={{ fontSize: 11, color: colors.danger, marginTop: 6 }}>{compatError}</p>}
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
