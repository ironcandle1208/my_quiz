import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  },
  test: {
    environment: "node",
    // test/unit ディレクトリ配下のテストファイル（ts/tsx）を対象にする
    include: ["test/unit/**/*.test.ts", "test/unit/**/*.test.tsx"]
  }
});
