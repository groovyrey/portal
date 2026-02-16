'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Loader2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function EAFPage() {
  const [rawHtml, setRawHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [eafUrl, setEafUrl] = useState('');

  const fetchEAF = async () => {
    setLoading(true);
    const eafToast = toast.loading('Scraping Certificate of Enrollment (EAF)...');
    try {
      const res = await fetch('/api/student/eaf');
      const data = await res.json();

      if (data.success) {
        setRawHtml(data.html);
        setEafUrl(data.url);
        toast.success('EAF Scraped successfully!', { id: eafToast });
      } else {
        toast.error(data.error || 'Failed to fetch EAF', { id: eafToast });
      }
    } catch (err) {
      toast.error('Network error occurred.', { id: eafToast });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEAF();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawHtml);
    toast.success('Raw HTML copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <FileText className="h-6 w-6" />
              </div>
              Certificate of Matriculation (COM)
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Official Enrollment Assessment Form (EAF) View.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={fetchEAF}
              disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              disabled={loading || !rawHtml}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-200/50">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Syncing with Portal</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Fetching your official document...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Warning / Instruction */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-2xl">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">
                    This is an exact, unmodified render of your official Certificate of Matriculation from the school's server.
                </p>
            </div>

            {/* Document Viewer */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden min-h-[800px] relative">
              <iframe
                srcDoc={rawHtml}
                title="Official Certificate of Matriculation"
                className="w-full h-[1000px] border-none"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>

            <div className="text-center pb-12">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    La Concepcion College, Inc. Official Document
                </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
