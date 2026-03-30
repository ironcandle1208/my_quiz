const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

type GlobalWithD1 = typeof globalThis & {
  DB?: D1Database;
  __env?: {
    DB?: D1Database;
  };
  [cloudflareContextSymbol]?: {
    env?: {
      DB?: D1Database;
    };
  };
};

/**
 * Cloudflare の D1 バインディングを解決して返す。
 * OpenNext 実行時の `globalThis.DB` と `globalThis.__env.DB`、
 * および `globalThis[Symbol.for("__cloudflare-context__")].env.DB` を順に参照する。
 */
export function getD1Database(): D1Database {
  const globalWithD1 = globalThis as GlobalWithD1;
  const db = globalWithD1.DB ?? globalWithD1.__env?.DB ?? globalWithD1[cloudflareContextSymbol]?.env?.DB;

  if (!db) {
    throw new Error(
      "D1 バインディング `DB` が見つかりません。wrangler の d1_databases 設定を確認してください。"
    );
  }

  return db;
}
