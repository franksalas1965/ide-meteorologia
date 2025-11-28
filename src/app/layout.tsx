import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} font-sans`}>
      <head>
        {/* Script de configuración runtime - se carga asíncronamente */}
        <Script src="/runtime-config.js" strategy="afterInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
