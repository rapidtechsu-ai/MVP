import Header from '../../../components/Header';
import { colors } from '../../../lib/tokens';

export default function LanguagePage() {
  return (
    <main>
      <Header title="اللغة" backHref="/account" />
      <div style={{ padding: 16 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
            <span style={{ fontSize: 13 }}>العربية</span>
            <span style={{ color: colors.success, fontSize: 16 }}>✓</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>English</span>
            <span style={{ fontSize: 11, color: colors.textMuted }}>قريبا</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: colors.textMuted }}>
          المتجر يعمل حاليا باللغة العربية فقط. دعم اللغة الإنجليزية مخطط له لاحقا.
        </p>
      </div>
    </main>
  );
}
