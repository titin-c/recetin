import type { NextConfig } from "next";

/**
 * - Cache Components desactivado (ADR docs/decisiones/0002): toda la app va con sesión,
 *   así que cada página se renderiza por petición y nunca se cachea HTML privado.
 * - Cabeceras de seguridad y de no indexación (pasos 3, 10 y 13).
 */
const securityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // HTML con sesión: nunca en caché compartida (ARCHITECTURE.md §10.11).
      {
        source: "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
