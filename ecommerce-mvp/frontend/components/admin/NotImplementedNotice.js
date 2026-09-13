import { colors } from '../../lib/tokens';

export default function NotImplementedNotice({ text, fields }) {
  return (
    <div
      style={{
        background: colors.warningBg,
        border: `1px solid ${colors.warning}33`,
        borderRadius: 10,
        padding: 16,
      }}
    >
      <p style={{ fontSize: 12, color: colors.warning, fontWeight: 600, margin: '0 0 6px' }}>
        ⚠ قيد الإنشاء
      </p>
      <p style={{ fontSize: 12, color: colors.text, margin: '0 0 10px' }}>{text}</p>
      {fields && (
        <>
          <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 4px' }}>
            الحقول المخطط لها في هذه الشاشة:
          </p>
          <ul style={{ margin: 0, paddingRight: 18, fontSize: 11, color: colors.textSecondary }}>
            {fields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
