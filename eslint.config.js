import globals from "globals";
import js from "@eslint/js";
import stylisticJs from '@stylistic/eslint-plugin'

export default [
  {
    "ignores": ["dist/*", "webpack/*"],
    "languageOptions": {
      globals: {
        ...globals.browser,
        Phaser: false,
      },
    },
    "plugins": {
      '@stylistic/js': stylisticJs,
    },
    "rules": {
      ...js.configs.recommended.rules,
      '@stylistic/js/no-multiple-empty-lines': ["error", {max: 1}],
      '@stylistic/js/indent': ['error', 2],

      'max-lines': ['error', 300],
      "no-console": ["error", { allow: ["warn", "error", "time", "timeEnd"] }],
      "no-unused-vars": "error",
    },
  },
];