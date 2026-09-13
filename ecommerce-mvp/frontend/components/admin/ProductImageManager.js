'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getImageUploadConfig,
  getImageUploadUrl,
  uploadFileToStorage,
  confirmImageUpload,
  deleteProductImage,
  reorderProductImages,
} from '../../lib/adminApi';
import { colors } from '../../lib/tokens';

export default function ProductImageManager({ productId, initialImages }) {
  const [images, setImages] = useState(initialImages || []);
  const [config, setConfig] = useState(null);
  const [uploading, setUploading] = useState([]); // filenames currently in flight
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    getImageUploadConfig(productId).then(setConfig);
  }, [productId]);

  // Handles any number of selected files — the browser's multi-select
  // file input already gives us an array; we just upload each one in
  // turn. Selecting a single file works exactly the same way with an
  // array of length 1, so there's no separate "single upload" code path.
  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');

    for (const file of files) {
      setUploading((prev) => [...prev, file.name]);
      try {
        const { uploadUrl, publicUrl } = await getImageUploadUrl(productId, {
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        });
        await uploadFileToStorage(uploadUrl, file);
        const saved = await confirmImageUpload(productId, publicUrl);
        setImages((prev) => [...prev, saved]);
      } catch (err) {
        setError(`فشل رفع ${file.name}: ${err.message}`);
      } finally {
        setUploading((prev) => prev.filter((name) => name !== file.name));
      }
    }

    e.target.value = ''; // allow re-selecting the same file(s) later
  }

  async function handleDelete(imageId) {
    if (!confirm('حذف هذه الصورة؟')) return;
    try {
      await deleteProductImage(productId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMove(index, direction) {
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);

    try {
      await reorderProductImages(productId, newImages.map((img) => img.id));
    } catch (err) {
      setError('تعذر حفظ الترتيب.');
    }
  }

  if (config && !config.configured) {
    return (
      <div style={{ background: colors.warningBg, borderRadius: 8, padding: 12 }}>
        <p style={{ fontSize: 12, color: colors.warning, margin: 0 }}>
          ⚠ رفع الصور غير مفعّل — يتطلب إعداد متغيرات تخزين الصور (S3) على الخادم. راجع ملف .env.example.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {images.map((img, i) => (
          <div key={img.id} style={{ position: 'relative', width: 90 }}>
            <img
              src={img.url}
              alt=""
              style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: `1px solid ${colors.border}` }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => handleMove(i, -1)}
                disabled={i === 0}
                style={arrowBtnStyle}
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                style={{ ...arrowBtnStyle, color: colors.danger }}
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => handleMove(i, 1)}
                disabled={i === images.length - 1}
                style={arrowBtnStyle}
              >
                ‹
              </button>
            </div>
            {i === 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, background: colors.primary, color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 4 }}>
                رئيسية
              </span>
            )}
          </div>
        ))}

        {uploading.map((name) => (
          <div
            key={name}
            style={{ width: 90, height: 90, borderRadius: 8, border: `1px dashed ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: colors.textMuted, textAlign: 'center', padding: 4 }}
          >
            جارٍ الرفع...
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{ fontSize: 12, height: 32, padding: '0 14px', borderRadius: 6, border: `1px dashed ${colors.border}`, background: 'none', cursor: 'pointer' }}
      >
        + إضافة صور (يمكن اختيار أكثر من صورة)
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />

      {error && <p style={{ fontSize: 11, color: colors.danger, marginTop: 8 }}>{error}</p>}
    </div>
  );
}

const arrowBtnStyle = {
  fontSize: 12,
  width: 24,
  height: 20,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#5B6473',
};
