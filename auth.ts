import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateCredentialUser } from "@/lib/credential-user-store";

type AuthorizedUser = {
  id: string;
  name: string;
};

/**
 * next-auth が利用する secret を環境変数から解決する。
 * `AUTH_SECRET` と `NEXTAUTH_SECRET` のどちらでも設定できるようにする。
 */
function resolveAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

/**
 * 認証情報の値を文字列として安全に取り出す。
 */
function toCredentialString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * 入力された認証情報を検証し、許可ユーザー情報を返す。
 */
function authorizeWithCredentialValues(credentials: Record<string, unknown> | undefined): AuthorizedUser | null {
  const username = toCredentialString(credentials?.username).trim();
  const password = toCredentialString(credentials?.password);
  const user = authenticateCredentialUser(username, password);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.username,
  };
}

export const authOptions: NextAuthOptions = {
  secret: resolveAuthSecret(),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "ユーザー名", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      /**
       * ログインフォームの認証情報を検証し、セッション化するユーザーを返す。
       */
      authorize(credentials) {
        return authorizeWithCredentialValues(credentials);
      },
    }),
  ],
  callbacks: {
    /**
     * 認証済みユーザーの ID を JWT へ保存する。
     */
    jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },

    /**
     * JWT セッションから `user.id` を復元してアプリ側で参照しやすくする。
     */
    session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};

/**
 * サーバー側で利用する現在のセッション情報を返す。
 */
export async function getAppSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    // セッション取得に失敗しても画面を継続表示できるように未ログイン扱いへフォールバックする。
    console.error("セッション取得に失敗しました。未ログインとして処理を継続します。", error);
    return null;
  }
}
