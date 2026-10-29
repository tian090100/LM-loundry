import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LM Laundry — Operasional",
  description: "Kelola pesanan, progres cucian, dan pembayaran LM Laundry.",
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
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
