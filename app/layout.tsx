import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import VersionChecker from "@/components/shared/VersionChecker";
import Toaster from '@/components/shared/Toaster';
import { Suspense } from 'react';
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";
import RealtimeProvider from "@/components/shared/RealtimeProvider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LCC Hub",
  description: "Secure Access to Schoolista Info",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LCC Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-background min-h-screen flex flex-col selection:bg-primary selection:text-primary-foreground`}>
        <Providers>
          <RealtimeProvider>
            <VersionChecker />
            <Suspense fallback={<main className="flex-1 bg-background" />}>
              <ClientLayoutWrapper>
                {children}
              </ClientLayoutWrapper>
            </Suspense>
            <Toaster />
            <Analytics />
          </RealtimeProvider>
        </Providers>
      </body>
    </html>
  );
}
