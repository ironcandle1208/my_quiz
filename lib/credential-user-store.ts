type CredentialUser = {
  id: string
  username: string
  password: string
}

type RegisterCredentialUserInput = {
  username: string
  password: string
}

type RegisterCredentialUserResult =
  | {
      ok: true
      user: CredentialUser
    }
  | {
      ok: false
      reason: "empty_username" | "empty_password" | "duplicate_username"
    }

declare global {
  // eslint-disable-next-line no-var
  var __credentialUserStore: Map<string, CredentialUser> | undefined
}

/**
 * ユーザー名の比較に使う正規化文字列へ変換する。
 */
function normalizeUsername(username: string): string {
  return username.trim()
}

/**
 * デフォルトログインユーザーを環境変数から生成する。
 */
function createDefaultCredentialUser(): CredentialUser {
  const username = process.env.AUTH_DEMO_USERNAME ?? "demo"
  const password = process.env.AUTH_DEMO_PASSWORD ?? "demo-pass"
  const id = process.env.AUTH_DEMO_USER_ID ?? "demo-user"

  return {
    id,
    username: normalizeUsername(username),
    password
  }
}

/**
 * 認証ユーザー保存用のメモリストアを取得し、初回のみデフォルトユーザーを投入する。
 */
function getCredentialUserStore(): Map<string, CredentialUser> {
  if (!globalThis.__credentialUserStore) {
    globalThis.__credentialUserStore = new Map<string, CredentialUser>()
    const defaultUser = createDefaultCredentialUser()
    globalThis.__credentialUserStore.set(normalizeUsername(defaultUser.username), defaultUser)
  }

  return globalThis.__credentialUserStore
}

/**
 * 入力された認証情報に一致するユーザーを返す。
 */
export function authenticateCredentialUser(username: string, password: string): CredentialUser | null {
  const normalizedUsername = normalizeUsername(username)
  const user = getCredentialUserStore().get(normalizedUsername)

  if (!user || user.password !== password) {
    return null
  }

  return user
}

/**
 * 新規ユーザーを登録し、結果を返す。
 */
export function registerCredentialUser(input: RegisterCredentialUserInput): RegisterCredentialUserResult {
  const normalizedUsername = normalizeUsername(input.username)
  const password = input.password

  if (!normalizedUsername) {
    return { ok: false, reason: "empty_username" }
  }

  if (!password) {
    return { ok: false, reason: "empty_password" }
  }

  const store = getCredentialUserStore()
  if (store.has(normalizedUsername)) {
    return { ok: false, reason: "duplicate_username" }
  }

  const createdUser: CredentialUser = {
    id: `user-${normalizedUsername}`,
    username: normalizedUsername,
    password
  }
  store.set(normalizedUsername, createdUser)

  return {
    ok: true,
    user: createdUser
  }
}
