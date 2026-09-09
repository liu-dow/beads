import type { Metadata } from "next";
import "./globals.css";
import { I18nRuntime } from "@/components/i18n-runtime";

export const metadata: Metadata = {
  title: "Bead Atelier · Beadwork design studio",
  description: "Design bead patterns, preview real materials in 3D, and create production-ready charts.",
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
    <html lang="en">
      <body className="antialiased"><I18nRuntime />{children}</body>
    </html>
  );
}
