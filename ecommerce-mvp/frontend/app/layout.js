import './globals.css';
import { CartProvider } from '../context/CartContext';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'المتجر - هواتف وإكسسوارات وأجهزة',
  description: 'تسوق الهواتف والإكسسوارات والأجهزة المنزلية - توصيل خلال 24 ساعة - الدفع عند الاستلام',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CartProvider>
          <div style={{ paddingBottom: 64 }}>{children}</div>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
