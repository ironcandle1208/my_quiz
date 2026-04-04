import type { Metadata } from "next";
import { AppHeader } from "@/app/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Quiz",
  description: "自作クイズを作成・回答できるアプリ"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

/**
 * 画面全体の共通レイアウトを定義する。
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
