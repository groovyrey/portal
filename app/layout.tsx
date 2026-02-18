import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import VersionChecker from "../components/VersionChecker";
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import ClientLayoutWrapper from "../components/ClientLayoutWrapper";

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
      <body className={`${inter.variable} font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col`}>
        <Providers>
          <VersionChecker />
          <Suspense fallback={<main className="flex-1">{children}</main>}>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </Suspense>
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
