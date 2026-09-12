import type { Metadata } from "next";
import "./globals.css";
import "./atelier-theme.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
