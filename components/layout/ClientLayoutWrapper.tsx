'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import PageHeader from '@/components/shared/PageHeader';
import Footer from '@/components/layout/Footer';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    // Check if the restricted cookie exists
    const checkRestricted = () => {
      const isRestrictedCookie = document.cookie.includes('is_restricted=1');
      setIsRestricted(isRestrictedCookie);
    };

    checkRestricted();
    
    // Periodically check or listen for changes if needed
    const interval = setInterval(checkRestricted, 500);
    return () => clearInterval(interval);
  }, []);

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
