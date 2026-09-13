import Header from '../../../components/Header';
import { colors } from '../../../lib/tokens';

export default function PoliciesPage() {
  return (
    <main>
      <Header title="السياسات والشروط" backHref="/account" />
      <div style={{ padding: 16 }}>
        <Section title="الدفع والتوصيل">
          <p style={pStyle}>الدفع عند الاستلام هو طريقة الدفع الوحيدة المتاحة حاليا.</p>
          <p style={pStyle}>يتم عرض رسوم التوصيل والمدة المتوقعة بوضوح قبل تأكيد الطلب، بحسب منطقة التوصيل المختارة.</p>
        </Section>

        <Section title="توفر المنتجات">
          <p style={pStyle}>
            بعض المنتجات يتم تأكيد توفرها من المورد بعد إتمام الطلب. لن يتم تأكيد الطلب نهائيا قبل التأكد من توفر المنتج فعليا.
          </p>
        </Section>

        <Section title="الإرجاع والاستبدال والضمان">
          <div style={{ background: colors.warningBg, borderRadius: 8, padding: 12 }}>
            <p style={{ ...pStyle, color: colors.warning, margin: 0 }}>
              سياسة الإرجاع والاستبدال، وتحديد الجهة المسؤولة عن الضمان (المتجر أو المورد)، لا تزالان قيد المراجعة
              النهائية من الإدارة. سيتم تحديث هذه الصفحة فور اعتمادها رسميا.
            </p>
          </div>
        </Section>

        <Section title="الشروط والأحكام والخصوصية">
          <div style={{ background: colors.warningBg, borderRadius: 8, padding: 12 }}>
            <p style={{ ...pStyle, color: colors.warning, margin: 0 }}>
              الشروط والأحكام الكاملة وسياسة الخصوصية قيد المراجعة القانونية قبل الإطلاق الرسمي.
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>{title}</p>
      {children}
    </div>
  );
}

const pStyle = { fontSize: 12, color: '#5B6473', lineHeight: 1.7, margin: '0 0 8px' };
