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
      className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <main className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                <FileText className="h-5 w-5" />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">EAF Document</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Enrollment Records</p>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {rawHtml && (
              <>
                <button
                  onClick={fetchEAF}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Print Document
                </button>
              </>
            )}
          </div>
        </div>

        {!rawHtml && !loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-blue-50 p-4 rounded-full mb-6 border border-blue-100">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Enrollment Assessment Form</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 mb-8 font-medium">
              Your EAF contains your official schedule and assessment of fees. Click the button below to load it securely.
            </p>
            <button
              onClick={fetchEAF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:opacity-70 group"
            >
              <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
              Load Document
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Syncing with Portal</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">Fetching official document...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                    Unmodified render of your official Certificate of Matriculation.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[800px]">
              <iframe
                srcDoc={rawHtml}
                title="Official Certificate of Matriculation"
                className="w-full h-[1100px] border-none"
                sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
              />
            </div>

            <div className="text-center pb-12">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Official Document System
                </p>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}
