import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoxTrack - Box Inventory Management",
  description:
    "Track storage boxes during moves with QR codes and location management",
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
