import "./globals.css";

export const metadata = {
  title: "ExpressShop - Compra Rápida",
  description:
    "Comprá fácil y rápido, enviando tu pedido directamente por WhatsApp sin intermediarios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
