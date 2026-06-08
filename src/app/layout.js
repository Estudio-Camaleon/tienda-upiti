import "./globals.css";
import { CONFIG } from "../data/config";
import { StoreConfigProvider } from "../context/StoreConfigContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import Header from "../components/Header";
import ThemeColor from "../components/ThemeColor";

export const metadata = {
  title: `${CONFIG.storeName} - Compra Rápida`,
  description:
    "Comprá fácil y rápido, enviando tu pedido directamente por WhatsApp.",
  icons: {
    icon: "/media/logo/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased selection:bg-emerald-500 selection:text-white min-h-screen flex flex-col">
        <StoreConfigProvider>
          <ConfirmProvider>
            <ToastProvider>
              <ThemeColor />
              <Header />
              {children}
            </ToastProvider>
          </ConfirmProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
