// FIX (2026-09-13): without this, Next.js tries to statically
// pre-render this page at BUILD time by fetching from the live
// backend. If the backend is asleep (e.g. Render free-tier cold
// start) or briefly unreachable, the build itself times out and
// fails entirely. force-dynamic makes this page render fresh on
// every request instead, which is correct anyway since it shows
// live inventory/price/order data that must never be stale.
export const dynamic = 'force-dynamic';

import { getAdminProducts } from '../../../../lib/adminApi';
import { colors } from '../../../../lib/tokens';

const AVAIL_LABELS = {
  AVAILABLE: 'متوفر',
  REQUIRES_CONFIRMATION: 'يتطلب تأكيد',
  UNAVAILABLE: 'غير متوفر',
  DISCONTINUED: 'متوقف',
};

export default async function AdminProductsPage({ searchParams }) {
  const search = searchParams?.search;
  const products = await getAdminProducts(search ? { search } : {}).catch(() => []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>المنتجات</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <form style={{ display: 'flex' }}>
            <input
              name="search"
              defaultValue={search || ''}
              placeholder="بحث بالاسم أو SKU"
              style={{ fontSize: 12, height: 32, padding: '0 10px', borderRadius: 6, border: `1px solid ${colors.border}`, width: 160 }}
            />
          </form>
          <a
            href="/admin/products/new"
            style={{ fontSize: 12, height: 32, padding: '0 12px', borderRadius: 6, background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center' }}
          >
            + منتج جديد
          </a>
        </div>
      </div>

      <div style={{ background: colors.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        {products.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, padding: 20, margin: 0, textAlign: 'center' }}>
            لا توجد منتجات مطابقة.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>المنتج</th>
                <th style={thStyle}>الفئة</th>
                <th style={thStyle}>السعر SDG</th>
                <th style={thStyle}>التوفر</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const price = p.priceHistory?.[0]?.calculatedSdg;
                const availability = p.supplierProducts?.[0]?.availability;
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>{p.nameAr}</td>
                    <td style={tdStyle}>{p.category?.nameAr || '—'}</td>
                    <td style={tdStyle} className="ltr-isolate">
                      {price != null ? Number(price).toLocaleString('en-US') : '—'}
                    </td>
                    <td style={tdStyle}>
                      {availability ? (
                        <span
                          style={{
                            background: availability === 'AVAILABLE' ? colors.successBg : colors.warningBg,
                            color: availability === 'AVAILABLE' ? colors.success : colors.warning,
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 6,
                          }}
                        >
                          {AVAIL_LABELS[availability]}
                        </span>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <a href={`/admin/products/${p.id}`} style={{ color: colors.primary }}>تعديل</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'right', color: '#5B6473', fontWeight: 400 };
const tdStyle = { padding: '8px 10px' };
