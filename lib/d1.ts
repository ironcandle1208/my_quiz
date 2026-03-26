type GlobalWithD1 = typeof globalThis & {
  DB?: D1Database;
  __env?: {
    DB?: D1Database;
  };
};

/**
 * Cloudflare の D1 バインディングを解決して返す。
 * OpenNext 実行時の `globalThis.DB` と、互換用の `globalThis.__env.DB` を順に参照する。
 */
export function getD1Database(): D1Database {
  const globalWithD1 = globalThis as GlobalWithD1;
  const db = globalWithD1.DB ?? globalWithD1.__env?.DB;

  if (!db) {
    throw new Error(
      "D1 バインディング `DB` が見つかりません。wrangler の d1_databases 設定を確認してください。"
    );
  }

  return db;
}
