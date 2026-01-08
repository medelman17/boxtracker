import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <GluestackUIProvider mode="system">
          <AuthProvider>{children}</AuthProvider>
        </GluestackUIProvider>
      </body>
    </html>
  );
}
