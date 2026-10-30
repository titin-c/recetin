import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // ARCHITECTURE.md §4: un módulo solo se usa a través de su contrato (index / schemas / server).
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/domain/*", "@/modules/*/application/*", "@/modules/*/infrastructure/*", "@/modules/*/ui/*"],
              message: "Importa el módulo por su contrato: @/modules/<modulo>, /schemas o /server.",
            },
            { group: ["@/generated/*"], importNames: ["PrismaClient"], message: "Usa el cliente único de @/server/db." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
