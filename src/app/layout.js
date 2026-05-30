// Archivo: src/app/layout.js
import "./globals.css";
import { CONFIG } from "../data/config"; // Importamos tu configuración

export const metadata = {
  title: `${CONFIG.storeName} - Compra Rápida`,
  description:
    "Comprá fácil y rápido, enviando tu pedido directamente por WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    /* Aquí inyectamos el color de config.js como una variable nativa de CSS */
    <html lang="es" style={{ "--theme-color": CONFIG.mainColor }}>
      <body>{children}</body>
    </html>
  );
}
