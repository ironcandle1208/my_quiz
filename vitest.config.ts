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
    // test ディレクトリ配下のテストファイルを対象にする
    include: ["test/**/*.test.ts"]
  }
});
