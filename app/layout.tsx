
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPR Sekolah",
  description: "Sistem Penjanaan One Page Report Sekolah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
