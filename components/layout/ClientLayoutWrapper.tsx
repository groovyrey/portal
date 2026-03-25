'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import PageHeader from '@/components/shared/PageHeader';
import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isRestricted, setIsRestricted] = useState(false);
  const pathname = usePathname();
  const isStudyMode = pathname === '/study-mode';

  useEffect(() => {
    // Check if the restricted cookie exists
    const checkRestricted = () => {
      const isRestrictedCookie = document.cookie.includes('is_restricted=1');
      setIsRestricted(isRestrictedCookie);
    };

    checkRestricted();
    
    // Periodically check or listen for changes if needed
    const interval = setInterval(checkRestricted, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isStudyMode) {
    return (
      <main className="flex-1">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      {!isRestricted && <PageHeader />}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
