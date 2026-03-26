/**
 * UUIDを生成する。
 * Cloudflare Workers/Node.js の両方で動くように `crypto.randomUUID` を利用する。
 */
export function createId(): string {
  return crypto.randomUUID();
}
