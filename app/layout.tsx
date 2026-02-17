import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Footer from "../components/Footer";
import { Toaster } from 'sonner';

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
        <Navbar />
        <PageHeader />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
