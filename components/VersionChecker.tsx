'use client';

import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/version';
import { toast } from 'sonner';
import { RefreshCcw, Download } from 'lucide-react';

export default function VersionChecker() {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Initial check after 5 seconds
    const initialTimer = setTimeout(() => {
      checkVersion();
    }, 5000);

    // Periodic check every 30 minutes
    const interval = setInterval(() => {
      checkVersion();
    }, 1000 * 60 * 30);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const checkVersion = async () => {
    if (checking) return;
    setChecking(true);
    
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const latestVersion = data.version;

        if (latestVersion && latestVersion !== APP_VERSION) {
          console.log(`Version mismatch: Local ${APP_VERSION} vs Server ${latestVersion}`);
          
          toast.info("A new version is available", {
            description: "Please refresh the app to get the latest features and fixes.",
            duration: Infinity,
            action: {
              label: "Refresh Now",
              onClick: () => window.location.reload(),
            },
            icon: <RefreshCcw className="h-4 w-4 text-blue-600 animate-spin-slow" />,
          });
        }
      }
    } catch (error) {
      console.error('Failed to check version:', error);
    } finally {
      setChecking(false);
    }
  };

  return null; // This component doesn't render anything UI-wise
}
