// Lighthouse CI (ARCHITECTURE.md §10.14): móvil con «4G lenta» simulada, app y panel admin.
// Si no se cumplen los objetivos del paso 10, el control FALLA y bloquea el despliegue.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- archivo CommonJS que exige Lighthouse CI
const { readFileSync, existsSync } = require("node:fs");

const base = process.env.LHCI_BASE_URL ?? "http://localhost:3000";
// Dos pasadas (ver «pnpm lhci»): páginas públicas SIN sesión y páginas de la app CON sesión de admin.
const privado = process.env.LHCI_SET === "privado";
const cookie = privado && existsSync(".lighthouseci/cookie.txt") ? readFileSync(".lighthouseci/cookie.txt", "utf8") : "";
const paginas = privado ? ["/perfil/hogares", "/admin/usuarios", "/admin/auditoria"] : ["/entrar", "/registro"];

module.exports = {
  ci: {
    collect: {
      url: paginas.map((p) => base + p),
      numberOfRuns: 3, // se evalúa la mediana: una sola pasada es demasiado ruidosa
      settings: {
        // Perfil móvil por defecto de Lighthouse (simula un móvil de gama media con 4G lenta).
        extraHeaders: cookie ? JSON.stringify({ Cookie: cookie }) : undefined,
        skipAudits: ["is-crawlable"], // la app NO se indexa a propósito (paso 3)
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { aggregationMethod: "median", minScore: 0.9 }],
        "categories:accessibility": ["error", { aggregationMethod: "median", minScore: 0.95 }],
        "categories:best-practices": ["error", { aggregationMethod: "median", minScore: 0.9 }],
        "largest-contentful-paint": ["error", { aggregationMethod: "median", maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { aggregationMethod: "median", maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { aggregationMethod: "median", maxNumericValue: 200 }], // aproximación de laboratorio al INP
        "server-response-time": ["warn", { maxNumericValue: 800 }],
      },
    },
    upload: { target: "filesystem", outputDir: `.lighthouseci/informes-${privado ? "privado" : "publico"}` },
  },
};
