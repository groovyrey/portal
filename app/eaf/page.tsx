'use client';

import React, { useState } from 'react';
import { FileText, Loader2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function EAFPage() {
  const [rawHtml, setRawHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchEAF = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/eaf');
      const data = await res.json();

      if (data.success) {
        // Inject a small script to the HTML to help with layout if needed
        const injectedHtml = data.html.replace('</HEAD>', `
          <style>
            body { background-color: white !important; padding: 20px !important; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          </style>
          </HEAD>
        `);
        setRawHtml(injectedHtml);
        toast.success('COM LOADED');
      } else {
        toast.error(data.error || 'Failed to fetch EAF');
      }
    } catch (err) {
      toast.error('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8"
    >
      <main className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 p-2 rounded-xl text-white">
                <FileText className="h-5 w-5" />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none">Registration Form</h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Academic Enrollment Record</p>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {rawHtml && (
              <>
                <button
                  onClick={fetchEAF}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-bold py-2 px-4 rounded-xl border border-slate-200 transition-all disabled:opacity-50 text-xs active:scale-95 shadow-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50 text-xs active:scale-95 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Print
                </button>
              </>
            )}
          </div>
        </div>

        {!rawHtml && !loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-slate-50 p-4 rounded-full mb-6 border border-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Certificate of Matriculation</h3>
            <p className="text-slate-500 text-xs max-w-xs mx-auto mt-2 mb-8 font-medium leading-relaxed">
              View your official schedule and assessment of fees securely from the portal.
            </p>
            <button
              onClick={fetchEAF}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Download className="h-4 w-4" />
              Load Record
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <Loader2 className="h-8 w-8 text-slate-900 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-900">Fetching Record</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Syncing with server...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                <p className="text-[10px] text-blue-700 font-bold text-center">
                    Official render of your Certificate of Matriculation.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
              <iframe
                srcDoc={rawHtml}
                title="Certificate of Matriculation"
                className="w-full h-[1000px] border-none"
                sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
              />
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}
