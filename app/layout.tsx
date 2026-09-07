import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "珠序 Bead Atelier · 珠饰设计工作台",
  description: "米珠图案设计、真实材质 3D 预览、制作图纸与艺术家作品集。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
