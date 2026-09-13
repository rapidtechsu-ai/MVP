'use client';

import { useState } from 'react';
import { colors } from '../lib/tokens';

export default function ProductGallery({ images, alt }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div style={{ aspectRatio: '1', background: colors.canvas, borderRadius: 12, marginBottom: 12 }} />;
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <img
        src={images[activeIndex].url}
        alt={alt}
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12, marginBottom: 8 }}
      />
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              onClick={() => setActiveIndex(i)}
              style={{
                width: 52,
                height: 52,
                objectFit: 'cover',
                borderRadius: 8,
                flexShrink: 0,
                cursor: 'pointer',
                border: i === activeIndex ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
