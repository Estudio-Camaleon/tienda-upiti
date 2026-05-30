// Archivo: src/app/layout.js
import "./globals.css";

export const metadata = {
  title: "ExpressShop - Compra Rápida",
  description:
    "Comprá fácil y rápido, enviando tu pedido directamente por WhatsApp sin intermediarios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Next.js inyectará automáticamente tu page.js 
        y todos tus componentes dentro de {children} 
      */}
      <body>{children}</body>
    </html>
  );
}
