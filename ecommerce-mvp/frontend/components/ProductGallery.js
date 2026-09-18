'use client';

import { useState, useRef } from 'react';
import { colors } from '../lib/tokens';

export default function ProductGallery({ images, alt }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  if (!images || images.length === 0) {
    return <div style={{ aspectRatio: '1', background: colors.canvas, borderRadius: 12, marginBottom: 12 }} />;
  }

  // Single image: no carousel machinery needed at all — just the image.
  if (images.length === 1) {
    return (
      <img
        src={images[0].url}
        alt={alt}
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12, marginBottom: 12 }}
      />
    );
  }

  // Multiple images: swipeable horizontal carousel. Uses native scroll-snap
  // (works with touch swipe on mobile out of the box, no drag library
  // needed) and tracks which slide is active from scroll position, so the
  // dot indicators stay in sync whether the user swipes or taps a dot.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }

  function scrollToIndex(index) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setActiveIndex(index);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          borderRadius: 12,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="carousel-scroll-hide"
      >
        {images.map((img) => (
          <img
            key={img.id}
            src={img.url}
            alt={alt}
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              flexShrink: 0,
              scrollSnapAlign: 'start',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {images.map((img, i) => (
          <span
            key={img.id}
            onClick={() => scrollToIndex(i)}
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i === activeIndex ? colors.primary : colors.border,
              cursor: 'pointer',
              transition: 'width 0.2s',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 8 }}>
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt=""
            onClick={() => scrollToIndex(i)}
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
    </div>
  );
}
