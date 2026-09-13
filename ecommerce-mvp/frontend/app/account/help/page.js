import Header from '../../../components/Header';
import { colors } from '../../../lib/tokens';

const FAQS = [
  { q: 'كيف أتتبع طلبي؟', a: 'يمكنك متابعة حالة طلبك من صفحة "طلباتي" في حسابك، أو عبر رابط التتبع المرسل بعد تأكيد الطلب.' },
  { q: 'ما هي طريقة الدفع المتاحة؟', a: 'الدفع عند الاستلام (نقدا) هو الطريقة الوحيدة المتاحة حاليا.' },
  { q: 'متى يصل طلبي؟', a: 'التوصيل عادة خلال 24 ساعة داخل مناطق التغطية بولاية الخرطوم، حسب توفر المنتج لدى المورد.' },
  { q: 'هل يمكنني إلغاء طلبي؟', a: 'يمكنك التواصل معنا لإلغاء الطلب قبل خروجه للتوصيل. سياسة الإلغاء والاسترجاع الكاملة قيد التحديد.' },
  { q: 'ماذا لو لم يتوفر المنتج بعد الطلب؟', a: 'سيتم التواصل معك فورا إذا تعذر تأكيد توفر المنتج لدى المورد، مع خيار الانتظار أو الإلغاء.' },
];

export default function HelpPage() {
  return (
    <main>
      <Header title="المساعدة" backHref="/account" />
      <div style={{ padding: 16 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {FAQS.map((item, i) => (
            <div
              key={item.q}
              style={{ padding: '14px 16px', borderBottom: i < FAQS.length - 1 ? `1px solid ${colors.border}` : 'none' }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 6px' }}>{item.q}</p>
              <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>

        <div style={{ background: colors.canvas, borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 4px' }}>لم تجد إجابة سؤالك؟</p>
          <p style={{ fontSize: 13, color: colors.primary, margin: 0 }}>تواصل معنا عبر واتساب</p>
        </div>
      </div>
    </main>
  );
}
