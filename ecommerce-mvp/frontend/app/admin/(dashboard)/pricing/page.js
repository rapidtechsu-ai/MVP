import PricingForm from '../../../../components/admin/PricingForm';
import { colors } from '../../../../lib/tokens';

export default function AdminPricingPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>التسعير وسعر الصرف</p>
        <a href="/admin/pricing/history" style={{ fontSize: 12, color: colors.primary }}>سجل الأسعار →</a>
      </div>
      <PricingForm />
    </div>
  );
}
