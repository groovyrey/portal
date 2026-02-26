import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import VersionChecker from "@/components/shared/VersionChecker";
import { Toaster } from 'sonner';
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col selection:bg-slate-900 selection:text-white`}>
        <Providers>
          <RealtimeProvider>
            <VersionChecker />
            <Suspense fallback={<main className="flex-1 bg-white" />}>
              <ClientLayoutWrapper>
                {children}
              </ClientLayoutWrapper>
            </Suspense>
            <Toaster position="top-center" richColors />
            <Analytics />
          </RealtimeProvider>
        </Providers>
      </body>
    </html>
  );
}
