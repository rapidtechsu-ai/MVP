import { colors } from '../../../../../lib/tokens';
import NotImplementedNotice from '../../../../../components/admin/NotImplementedNotice';

export default function AdminNewProductPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <a href="/admin/products" style={{ color: colors.textSecondary }}>→</a>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>منتج جديد</p>
      </div>

      <NotImplementedNotice
        text="مسار إنشاء منتج جديد (POST /catalog/products) لم يتم بناؤه في الخادم بعد. الحقول التالية موجودة في نموذج البيانات وجاهزة للربط."
        fields={[
          'الاسم بالعربية / الإنجليزية، SKU، الموديل',
          'الفئة والعلامة التجارية',
          'نوع المنتج (جهاز / إكسسوار)',
          'المواصفات الديناميكية حسب الفئة',
          'الضمان والوصف',
          'ربط المورد والتكلفة (AED)',
          'متوافق مع (للإكسسوارات فقط)',
        ]}
      />
    </div>
  );
}
