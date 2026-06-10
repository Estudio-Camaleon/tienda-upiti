import "./globals.css";
import { CONFIG } from "../data/config";
import { StoreConfigProvider } from "../context/StoreConfigContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeColor from "../components/ThemeColor";
import GlobalImageProtection from "../components/GlobalImageProtection";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${CONFIG.storeName} - Compra Rapida`,
    template: `%s | ${CONFIG.storeName}`,
  },
  description:
    "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.",
  robots: {
    index: true,
    follow: true,
    noimageindex: true,
  },
  icons: {
    icon: "/media/logo/favicon.svg",
  },
  openGraph: {
    title: `${CONFIG.storeName} - Compra Rapida`,
    description:
      "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.",
    images: [
      {
        url: CONFIG.heroImage || "/media/portadas/portada_upiti.webp",
        width: 1200,
        height: 630,
        alt: CONFIG.storeName,
      },
    ],
    siteName: CONFIG.storeName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${CONFIG.storeName} - Compra Rapida`,
    description:
      "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.",
    images: [CONFIG.heroImage || "/media/portadas/portada_upiti.webp"],
  },
};

export const viewport = {
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
              <GlobalImageProtection />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </ConfirmProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
