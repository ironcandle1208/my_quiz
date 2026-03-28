import { describe, expect, test } from "vitest";
import { createId } from "@/lib/id";

describe("createId", () => {
  test("UUID形式のIDを返す", () => {
    const id = createId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test("連続呼び出しで異なるIDを返す", () => {
    const id1 = createId();
    const id2 = createId();
    expect(id1).not.toBe(id2);
  });
});
