// Archivo: src/app/layout.js
import "./globals.css";
import { CONFIG } from "../data/config";
import { CartProvider } from "../context/CartContext";
import Header from "../components/Header";
import CartModal from "../components/CartModal";

export const metadata = {
  title: `${CONFIG.storeName} - Compra Rápida`,
  description:
    "Comprá fácil y rápido, enviando tu pedido directamente por WhatsApp.",
  icons: {
    icon: "/media/logo/favicon.svg", // o '/icon.png'
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" style={{ "--theme-color": CONFIG.mainColor }}>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-20 min-h-screen flex flex-col">
        {/* Envolvemos toda la aplicación en el Provider del Carrito */}
        <CartProvider>
          <Header />
          {children}
          <CartModal />
        </CartProvider>
      </body>
    </html>
  );
}
