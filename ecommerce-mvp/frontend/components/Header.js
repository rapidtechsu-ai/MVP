'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors } from '../lib/tokens';

export default function Header({ backHref, title }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  if (title) {
    return (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {backHref ? (
          <Link href={backHref} style={{ fontSize: 18, width: 44 }}>
            ←
          </Link>
        ) : (
          <span style={{ width: 44 }} />
        )}
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{title}</p>
        <span style={{ width: 44 }} />
      </header>
    );
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <form onSubmit={handleSearch} style={{ flex: 1 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن منتج..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.canvas,
            fontSize: 14,
          }}
        />
      </form>
    </header>
  );
}
