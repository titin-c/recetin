import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fuentes autoalojadas, solo los pesos usados y subconjunto latino (ARCHITECTURE.md §10.9).
const inter = localFont({
  src: [
    { path: "../ui/fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../ui/fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../ui/fonts/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

const fraunces = localFont({
  src: [{ path: "../ui/fonts/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" }],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: { default: "RECETÍN", template: "%s · RECETÍN" },
  description: "Tus recetas, tu menú y tu lista de la compra.",
  // App privada: nunca se indexa (paso 3).
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
