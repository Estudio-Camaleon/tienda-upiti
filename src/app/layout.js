import "./globals.css";
import { CONFIG } from "../data/config";
import { StoreConfigProvider } from "../context/StoreConfigContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import Header from "../components/Header";
import ThemeColor from "../components/ThemeColor";

export const metadata = {
  title: {
    default: `${CONFIG.logo_image} - Compra Rapida`,
    template: `%s | ${CONFIG.logo_image}`,
  },
  description:
    "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.",
  icons: {
    icon: "/media/logo/favicon.svg",
  },
  openGraph: {
    title: `${CONFIG.logo_image} - Compra Rapida`,
    description:
      "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.",
    images: [
      {
        url: CONFIG.heroImage || "/media/portadas/portada_upiti.webp",
        width: 1200,
        height: 630,
        alt: CONFIG.logo_image,
      },
    ],
    siteName: CONFIG.logo_image,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${CONFIG.logo_image} - Compra Rapida`,
    description:
      "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.",
    images: [CONFIG.heroImage || "/media/portadas/portada_upiti.webp"],
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: CONFIG.mainColor },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
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
