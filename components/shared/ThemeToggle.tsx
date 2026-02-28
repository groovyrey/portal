'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-border bg-card" />
    );
  }

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shadow-sm active:scale-95"
      title={`Current: ${theme} (resolved: ${resolvedTheme})`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' && (
          <motion.div
            key="light"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5 text-amber-500" />
          </motion.div>
        )}
        {theme === 'dark' && (
          <motion.div
            key="dark"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5 text-indigo-400" />
          </motion.div>
        )}
        {theme === 'system' && (
          <motion.div
            key="system"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Monitor className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
