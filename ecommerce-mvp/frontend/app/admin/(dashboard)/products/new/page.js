'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '../../../../../lib/tokens';
import {
  createProduct,
  getBrands,
  getCategoriesForAdmin,
  getAdminSuppliers,
  importProductFromUrl,
  confirmImageUpload,
} from '../../../../../lib/adminApi';

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [sku, setSku] = useState('');
  const [model, setModel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [productType, setProductType] = useState('DEVICE');
  const [deliverySpeed, setDeliverySpeed] = useState('STANDARD');
  const [warranty, setWarranty] = useState('');
  const [description, setDescription] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [costAed, setCostAed] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedImageUrl, setImportedImageUrl] = useState(null);
  const [importedImageWarning, setImportedImageWarning] = useState(null);

  useEffect(() => {
    Promise.all([getCategoriesForAdmin(), getBrands(), getAdminSuppliers()]).then(
      ([cats, brs, sups]) => {
        setCategories(cats);
        setBrands(brs);
        setSuppliers(sups || []);
        if (cats[0]) setCategoryId(cats[0].id);
      }
    );
  }, []);

  async function handleImport() {
    if (!importUrl.trim()) {
      setImportError('يرجى لصق رابط صفحة المنتج.');
      return;
    }
    setImporting(true);
    setImportError('');
    setImportedImageWarning(null);
    try {
      const result = await importProductFromUrl(importUrl.trim());
      if (result.nameSuggestion) setNameAr(result.nameSuggestion);
      if (result.descriptionSuggestion) setDescription(result.descriptionSuggestion);
      if (result.imageUrl) setImportedImageUrl(result.imageUrl);
      if (result.imageWarning) setImportedImageWarning(result.imageWarning);
      if (!result.nameSuggestion && !result.descriptionSuggestion && !result.imageUrl) {
        setImportError('لم يتم العثور على بيانات قابلة للاستيراد في هذا الرابط. يمكنك تعبئة الحقول يدويا.');
      }
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!nameAr.trim() || !sku.trim() || !categoryId) {
      setError('الاسم بالعربية، SKU، والفئة كلها مطلوبة.');
      return;
    }

    setSubmitting(true);
    try {
      const product = await createProduct({
        nameAr,
        nameEn: nameEn || undefined,
        sku,
        model: model || undefined,
        categoryId,
        brandId: brandId || undefined,
        productType,
        deliverySpeed,
        warranty: warranty || undefined,
        description: description || undefined,
        supplierId: supplierId || undefined,
        costAed: costAed || undefined,
      });

      // The imported image was already uploaded to storage during import
      // (it has no home until a product exists) — now that the product is
      // created, attach it to the new product's gallery as the first photo.
      if (importedImageUrl) {
        try {
          await confirmImageUpload(product.id, importedImageUrl);
        } catch {
          // Non-fatal — the product itself was created successfully;
          // the image can still be added manually from the edit page.
        }
      }

      router.push(`/admin/products/${product.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <a href="/admin/products" style={{ color: colors.textSecondary }}>→</a>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>منتج جديد</p>
      </div>

      <div style={{ background: colors.canvas, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>استيراد من رابط منتج (اختياري)</p>
        <p style={{ fontSize: 11, color: colors.textMuted, margin: '0 0 10px' }}>
          يقوم هذا فقط باستيراد العنوان والوصف وصورة واحدة تمثيلية من الرابط — المواصفات التفصيلية تبقى يدوية.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://example.com/product/..."
            style={{ ...inputStyle, flex: 1 }}
            className="ltr-isolate"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            style={{ fontSize: 12, height: 32, padding: '0 16px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer', opacity: importing ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {importing ? 'جارٍ الاستيراد...' : 'استيراد'}
          </button>
        </div>
        {importError && <p style={{ fontSize: 11, color: colors.danger, marginTop: 8 }}>{importError}</p>}
        {importedImageWarning && <p style={{ fontSize: 11, color: colors.warning, marginTop: 8 }}>{importedImageWarning}</p>}
        {importedImageUrl && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={importedImageUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: `1px solid ${colors.border}` }} />
            <span style={{ fontSize: 11, color: colors.success }}>تم استيراد الصورة — ستُضاف عند إنشاء المنتج.</span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="الاسم بالعربية *">
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="الاسم بالإنجليزية (اختياري)">
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} style={inputStyle} className="ltr-isolate" />
          </Field>
          <Field label="SKU *">
            <input value={sku} onChange={(e) => setSku(e.target.value)} style={inputStyle} className="ltr-isolate" />
          </Field>
          <Field label="الموديل (اختياري)">
            <input value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="الفئة *">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameAr}</option>
              ))}
            </select>
          </Field>
          <Field label="العلامة التجارية (اختياري)">
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={inputStyle}>
              <option value="">—</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="نوع المنتج">
            <select value={productType} onChange={(e) => setProductType(e.target.value)} style={inputStyle}>
              <option value="DEVICE">جهاز</option>
              <option value="ACCESSORY">إكسسوار</option>
            </select>
          </Field>
          <Field label="سرعة التوصيل">
            <select value={deliverySpeed} onChange={(e) => setDeliverySpeed(e.target.value)} style={inputStyle}>
              <option value="STANDARD">توصيل خلال 24 ساعة (عادي)</option>
              <option value="RAPID">توصيل سريع</option>
            </select>
          </Field>
          <Field label="الضمان (اختياري)">
            <input value={warranty} onChange={(e) => setWarranty(e.target.value)} style={inputStyle} placeholder="مثال: ضمان سنة" />
          </Field>
        </div>

        <Field label="الوصف (اختياري)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, height: 60, fontFamily: 'inherit' }}
          />
        </Field>

        <p style={{ fontSize: 12, fontWeight: 600, margin: '16px 0 8px' }}>
          ربط المورد والتكلفة (اختياري — بدون هذا لن يظهر سعر للمنتج)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="المورد">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inputStyle}>
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="تكلفة المورد (AED)">
            <input value={costAed} onChange={(e) => setCostAed(e.target.value)} style={inputStyle} className="ltr-isolate" />
          </Field>
        </div>

        {error && <p style={{ fontSize: 12, color: colors.danger, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <a href="/admin/products" style={{ fontSize: 12, height: 30, padding: '0 14px', borderRadius: 6, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', color: colors.text }}>
            إلغاء
          </a>
          <button
            type="submit"
            disabled={submitting}
            style={{ fontSize: 12, height: 30, padding: '0 14px', borderRadius: 6, border: 'none', background: colors.primary, color: '#fff', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? '...' : 'إنشاء المنتج'}
          </button>
        </div>
      </form>
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
  boxSizing: 'border-box',
};
