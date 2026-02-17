'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Github, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 rounded-lg p-1.5 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">LCC Hub</span>
            </Link>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              A modern, unofficial interface for accessing student information with ease and security. Optimized for the best academic experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/school" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">School Info</Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Documentation</Link>
              </li>
              <li>
                <Link href="/docs/deep" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">System Architecture</Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Disclaimer</Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/community" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Portal Feed</Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Your Profile</Link>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400">
            &copy; {currentYear} LCC Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
