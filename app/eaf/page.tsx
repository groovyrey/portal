'use client';

import React, { useState } from 'react';
import { FileText, Loader2, Download, RefreshCw, Sparkles } from 'lucide-react';
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
        const injectedHtml = data.html.replace('</HEAD>', `
          <style>
            body { background-color: white !important; padding: 20px !important; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          </style>
          </HEAD>
        `);
        setRawHtml(injectedHtml);
        toast.success('Registration Data Fetched');
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
      className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8"
    >
      <main className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-primary p-2.5 rounded-lg text-primary-foreground border border-primary/20">
                <FileText className="h-5 w-5" />
             </div>
             <div>
                <h1 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">Matriculation Form</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Official Enrollment Registry</p>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {rawHtml && (
              <>
                <button
                  onClick={fetchEAF}
                  disabled={loading}
                  className="flex items-center justify-center gap-2.5 bg-card hover:bg-accent text-muted-foreground font-black py-2.5 px-5 rounded-lg border border-border transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest active:scale-95 shadow-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={loading}
                  className="flex items-center justify-center gap-2.5 bg-foreground hover:opacity-90 text-background font-black py-2.5 px-5 rounded-lg transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest active:scale-95 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Print
                </button>
              </>
            )}
          </div>
        </div>

        {!rawHtml && !loading ? (
          <div className="surface-neutral rounded-xl border border-border/50 p-12 flex flex-col items-center justify-center text-center shadow-sm ring-1 ring-black/5">
            <div className="bg-primary/10 p-5 rounded-xl mb-6 border border-primary/10">
              <FileText className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Certification Access</h3>
            <p className="text-muted-foreground text-[10px] max-w-xs mx-auto mt-2 mb-8 font-black uppercase tracking-widest leading-relaxed">
              Retrieve your official schedule and assessment of fees securely from the portal.
            </p>
            <button
              onClick={fetchEAF}
              className="bg-foreground hover:opacity-90 text-background font-black py-3 px-10 rounded-lg transition-all shadow-xl flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
            >
              <Download className="h-4 w-4" />
              Load Record
            </button>
          </div>
        ) : loading ? (
          <div className="surface-neutral rounded-xl border border-border/50 p-12 flex flex-col items-center justify-center text-center shadow-sm ring-1 ring-black/5">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Retrieving Archives</h3>
            <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-1.5">Synchronizing Secure Session...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-center flex items-center justify-center gap-2">
                <Sparkles size={12} className="text-primary animate-pulse" />
                <p className="text-[9px] text-primary font-black uppercase tracking-widest">
                    Digital render of your Certificate of Matriculation.
                </p>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-2xl overflow-hidden min-h-[600px] ring-1 ring-black/10">
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
