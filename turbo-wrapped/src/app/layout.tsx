import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import Footer from "./components/Footer";

const inter = Inter({ 
  subsets: ["latin"],
  preload: true,
  display: 'swap',  // Ensures text remains visible during webfont load
  adjustFontFallback: true  // Automatically adjusts the font metrics to prevent layout shift
});

export const metadata: Metadata = {
  title: "TurboWrapped",
  description: "Track your listening history and get insights on your music preferences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
        <Footer />
      </body>
    </html>
  );
}