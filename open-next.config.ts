import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Cloudflare 向け OpenNext 設定を定義する。
// 増分キャッシュは R2 バックエンドを利用する。
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
