import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "public/**",
      "coverage/**",
      ".github/**",
      ".vscode/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      // Prettier rules
      "prettier/prettier": "error", // This will use .prettierrc config

      // Tailwind v4 specific checks
      "no-restricted-syntax": [
        "warn",
        {
          // Check for arbitrary values that might need updating in Tailwind v4
          selector: "JSXAttribute[name.name='className'][value.value=/\\[.*?\\]/]",
          message: "Check Tailwind arbitrary values for v4 compatibility",
        },
      ],
    },
  },
  prettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
  },
];

export default eslintConfig;
