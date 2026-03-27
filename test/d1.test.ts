import { afterEach, describe, expect, test } from "vitest";
import { getD1Database } from "@/lib/d1";

const originalDB = (globalThis as { DB?: D1Database }).DB;
const originalEnv = (globalThis as { __env?: { DB?: D1Database } }).__env;

afterEach(() => {
  (globalThis as { DB?: D1Database }).DB = originalDB;
  (globalThis as { __env?: { DB?: D1Database } }).__env = originalEnv;
});

describe("getD1Database", () => {
  test("globalThis.DB がある場合はそれを返す", () => {
    const mockDb = {} as D1Database;
    (globalThis as { DB?: D1Database }).DB = mockDb;
    (globalThis as { __env?: { DB?: D1Database } }).__env = undefined;

    expect(getD1Database()).toBe(mockDb);
  });

  test("globalThis.DB がない場合は globalThis.__env.DB を返す", () => {
    const mockDb = {} as D1Database;
    (globalThis as { DB?: D1Database }).DB = undefined;
    (globalThis as { __env?: { DB?: D1Database } }).__env = { DB: mockDb };

    expect(getD1Database()).toBe(mockDb);
  });

  test("どちらにもDBがない場合はエラーを投げる", () => {
    (globalThis as { DB?: D1Database }).DB = undefined;
    (globalThis as { __env?: { DB?: D1Database } }).__env = undefined;

    expect(() => getD1Database()).toThrowError("D1 バインディング `DB` が見つかりません。");
  });
});
