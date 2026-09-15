import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "タイピングゲーム",
  description: "JavaScriptキーワードタイピング練習ゲーム",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <NavBar session={session} />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
