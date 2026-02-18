'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Loader2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function EAFPage() {
  const [rawHtml, setRawHtml] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'data' | 'document'>('data');
  const [debugLog, setDebugLog] = useState<string>('');
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eafUrl, setEafUrl] = useState('');

  const fetchEAF = async () => {
    setLoading(true);
    const eafToast = toast.loading('Scraping Certificate of Enrollment (EAF)...');
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
        setExtractedData(data.data);
        setDebugLog(data.debugLog || '');
        setEafUrl(data.url);
        toast.success('EAF Scraped successfully!', { id: eafToast });
      } else {
        setDebugLog(data.debugLog || '');
        toast.error(data.error || 'Failed to fetch EAF', { id: eafToast });
      }
    } catch (err) {
      toast.error('Network error occurred.', { id: eafToast });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatic fetch removed as per user request
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(debugLog);
    toast.success('Scrap Diagnosis copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
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
            {extractedData && (
              <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1 mr-2 shadow-sm">
                <button
                  onClick={() => setViewMode('data')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'data' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Parsed Data
                </button>
                <button
                  onClick={() => setViewMode('document')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === 'document' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Document View
                </button>
              </div>
            )}

            {(rawHtml || debugLog) && (
              <button
                onClick={() => setShowDiagnosis(!showDiagnosis)}
                className={`flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-lg border transition-colors text-sm ${
                    showDiagnosis 
                    ? 'bg-amber-50 border-amber-200 text-amber-700' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Diagnosis
              </button>
            )}
            {rawHtml && (
              <button
                onClick={fetchEAF}
                disabled={loading}
                className="hidden md:flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            <button
              onClick={() => window.print()}
              disabled={loading || !rawHtml}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <Download className="h-4 w-4" />
              {viewMode === 'document' ? 'Print Document' : 'Print Data'}
            </button>
          </div>
        </div>

        {showDiagnosis && debugLog && (
          <div className="mb-8 bg-white rounded-2xl border border-amber-200 p-6 shadow-sm animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                     Scrap Diagnosis
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">RAW DEBUG LOGS FROM SCHOOL SERVER SYNC</p>
               </div>
               <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
               >
                  <Copy className="h-3 w-3" />
                  Copy Logs
               </button>
            </div>
            <textarea 
              readOnly 
              value={debugLog}
              className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-600 focus:outline-none"
            />
          </div>
        )}

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
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95 group"
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
            {viewMode === 'document' ? (
              <>
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
              </>
            ) : extractedData && (
              <div className="space-y-6">
                {/* Student Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                      <div className="flex items-start justify-between mb-8">
                         <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{extractedData.profile.name}</h2>
                            <p className="text-sm font-bold text-blue-600 mt-1">{extractedData.profile.studentId}</p>
                         </div>
                         <div className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {extractedData.profile.status}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Degree Program</p>
                            <p className="text-sm font-bold text-slate-700">{extractedData.profile.course}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year & Section</p>
                            <p className="text-sm font-bold text-slate-700">{extractedData.profile.yearLevel} / {extractedData.profile.section}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrollment Date</p>
                            <p className="text-sm font-bold text-slate-700">{extractedData.profile.enrollmentDate}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                            <p className="text-sm font-bold text-slate-700">{extractedData.profile.mobile}</p>
                         </div>
                         <div className="col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Home Address</p>
                            <p className="text-sm font-bold text-slate-700">{extractedData.profile.address}</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Financial Overview</h3>
                      <div className="space-y-6">
                         {extractedData.assessment.slice(-1).map((total: any, i: number) => (
                           <div key={i}>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Net Assessment</p>
                              <p className="text-3xl font-black text-white">₱{total.amount.replace('Total: ', '')}</p>
                           </div>
                         ))}
                         <div className="pt-6 border-t border-white/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Installment Plan</p>
                            <div className="space-y-3">
                               {extractedData.installments.slice(0, 4).map((inst: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-300">{inst.description}</span>
                                    <span className={`text-[10px] font-black ${inst.outstanding === '0.00' ? 'text-emerald-400' : 'text-white'}`}>
                                       {inst.outstanding === '0.00' ? 'PAID' : `₱${inst.outstanding}`}
                                    </span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Schedule Table */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Enrolled Subjects</h3>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                        {extractedData.schedule.length} Subjects
                      </span>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <th className="px-6 py-4">Code</th>
                               <th className="px-6 py-4">Description</th>
                               <th className="px-6 py-4">Units</th>
                               <th className="px-6 py-4">Schedule</th>
                               <th className="px-6 py-4">Room</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {extractedData.schedule.map((sub: any, i: number) => (
                               <tr key={i} className="text-sm hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-900">{sub.code}</td>
                                  <td className="px-6 py-4 font-bold text-slate-700">{sub.description}</td>
                                  <td className="px-6 py-4 text-slate-500 font-mono">{sub.units}</td>
                                  <td className="px-6 py-4 text-slate-600 font-medium">{sub.schedule}</td>
                                  <td className="px-6 py-4 font-bold text-blue-600">{sub.room}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Assessment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                   <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Fee Breakdown</h3>
                      <div className="space-y-4">
                         {extractedData.assessment.map((fee: any, i: number) => {
                            if (fee.description.toLowerCase().includes('total')) return null;
                            return (
                               <div key={i} className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-600">{fee.description}</span>
                                  <span className="text-xs font-bold text-slate-900 font-mono">₱{fee.amount}</span>
                               </div>
                            );
                         })}
                      </div>
                   </div>

                   <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Payment Schedule Details</h3>
                      <div className="space-y-4">
                         {extractedData.installments.map((inst: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                               <div>
                                  <p className="text-xs font-bold text-slate-900">{inst.description}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inst.dueDate}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-bold text-slate-900 font-mono">₱{inst.assessed}</p>
                                  <p className={`text-[10px] font-black uppercase tracking-widest ${inst.outstanding === '0.00' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                     {inst.outstanding === '0.00' ? 'Paid' : `₱${inst.outstanding} due`}
                                  </p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="text-center pb-12">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Official Document System
                </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
