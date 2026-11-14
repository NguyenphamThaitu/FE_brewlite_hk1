import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [path.resolve(import.meta.dirname, "../..")],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "../../tests/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "react/jsx-dev-runtime": path.resolve(import.meta.dirname, "./node_modules/react/jsx-dev-runtime.js"),
      "react/jsx-runtime": path.resolve(import.meta.dirname, "./node_modules/react/jsx-runtime.js"),
      "react": path.resolve(import.meta.dirname, "./node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "./node_modules/react-dom"),
      "@testing-library/react": path.resolve(import.meta.dirname, "./node_modules/@testing-library/react"),
      "@testing-library/jest-dom": path.resolve(import.meta.dirname, "./node_modules/@testing-library/jest-dom"),
    },
  },
});
