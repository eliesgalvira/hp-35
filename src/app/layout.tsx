import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HP-35",
  description: "A faithful browser recreation of the classic HP-35 scientific RPN calculator.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "apple-mobile-web-app-title": "HP-35",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1816",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
