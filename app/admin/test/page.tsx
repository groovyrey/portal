'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Database, 
  Code, 
  FileJson,
  GraduationCap,
  Calendar,
  WalletCards,
  User as UserIcon,
  Clock,
  Terminal,
  Cpu,
  Search,
  Braces
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TestMode = 'moderation' | 'scraper';

export default function AIAdminLab() {
  const [mode, setMode] = useState<TestMode>('scraper');
  const [sourceView, setSourceView] = useState<'raw' | 'cleaned'>('cleaned');
  
  // Moderation State
  const [content, setContent] = useState('');
  const [userName, setUserName] = useState('Admin Test');
  const [modLoading, setModLoading] = useState(false);
  const [modResult, setModResult] = useState<any>(null);
  const [modError, setModError] = useState<string | null>(null);

  // Scraper State
  const [scraperTask, setScraperTask] = useState<'student_info' | 'schedule' | 'financials' | 'grades'>('student_info');
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperResult, setScraperResult] = useState<any>(null);
  const [scraperError, setScraperError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scraperLoading && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [scraperLoading, startTime]);

  const testModeration = async () => {
    if (!content.trim()) return;
    setModLoading(true);
    setModResult(null);
    setModError(null);
    try {
      const response = await fetch('/api/ai/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to test Aegis');
      setModResult(data);
    } catch (err: any) {
      setModError(err.message);
    } finally {
      setModLoading(false);
    }
  };

  const testScraper = async () => {
    setScraperLoading(true);
    setScraperResult(null);
    setScraperError(null);
    setStartTime(Date.now());
    setElapsed(0);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch('/api/admin/test-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: scraperTask }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to test Scraper');
      setScraperResult(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setScraperError('Request timed out after 60 seconds.');
      } else {
        setScraperError(err.message);
      }
    } finally {
      setScraperLoading(false);
      setStartTime(null);
    }
  };

  const tasks = [
    { id: 'student_info', name: 'Student Profile', icon: UserIcon, desc: 'Basic info & account' },
    { id: 'schedule', name: 'Class Schedule', icon: Calendar, desc: 'Subjects & timings' },
    { id: 'financials', name: 'Financials', icon: WalletCards, desc: 'Balance & installments' },
    { id: 'grades', name: 'Academic Grades', icon: GraduationCap, desc: 'Report card extraction' },
  ] as const;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Intelligence Lab</h1>
              <p className="text-sm text-muted-foreground">Internal diagnostics for LCC Hub AI engines.</p>
            </div>
          </div>

          <div className="flex p-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setMode('scraper')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                mode === 'scraper' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              AI Scraper
            </button>
            <button
              onClick={() => setMode('moderation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                mode === 'moderation' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Aegis Mod
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'scraper' ? (
            <motion.div
              key="scraper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Controls */}
                <section className="lg:col-span-1 space-y-6">
                  <div className="surface-neutral p-6 rounded-3xl border border-border/50 space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Extraction Task</h2>
                      <div className="grid grid-cols-1 gap-2">
                        {tasks.map((task) => (
                          <button
                            key={task.id}
                            disabled={scraperLoading}
                            onClick={() => setScraperTask(task.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                              scraperTask === task.id
                                ? 'bg-primary/5 border-primary text-primary shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                            } disabled:opacity-50`}
                          >
                            <div className={`p-2 rounded-xl ${scraperTask === task.id ? 'bg-primary text-white' : 'bg-muted'}`}>
                              <task.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{task.name}</p>
                              <p className="text-[10px] opacity-70">{task.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={testScraper}
                      disabled={scraperLoading}
                      className="w-full h-14 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {scraperLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{elapsed}s</span>
                        </div>
                      ) : (
                        <>
                          <Database className="h-5 w-5" />
                          <span>Start Extraction</span>
                        </>
                      )}
                    </button>

                    {scraperError && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-500">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium">{scraperError}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-4">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      Intelligence Note
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      LCC Hub uses <strong>Cheerio</strong> for ultra-fast traditional parsing and <strong>Gemma 3</strong> (Google) as a fallback when the portal DOM changes.
                    </p>
                  </div>
                </section>

                {/* Results Section */}
                <section className="lg:col-span-3 space-y-6">
                  {scraperResult ? (
                    <div className="space-y-6">
                      {/* HTML Source Preview with Tabs */}
                      <div className="surface-neutral rounded-3xl border border-border/50 overflow-hidden flex flex-col h-[300px]">
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Code className="h-4 w-4 text-muted-foreground" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Explorer</h3>
                            </div>
                            <div className="flex p-0.5 bg-background/50 rounded-lg border border-border">
                              <button
                                onClick={() => setSourceView('cleaned')}
                                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter transition-all ${
                                  sourceView === 'cleaned' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                                }`}
                              >
                                AI Optimized
                              </button>
                              <button
                                onClick={() => setSourceView('raw')}
                                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter transition-all ${
                                  sourceView === 'raw' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                                }`}
                              >
                                Truly Raw
                              </button>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/60 truncate max-w-[200px]">{scraperResult.url}</span>
                        </div>
                        <div className="flex-1 p-6 overflow-auto custom-scrollbar font-mono text-[10px] leading-relaxed bg-black/[0.02] dark:bg-white/[0.02]">
                          <pre className="whitespace-pre-wrap text-muted-foreground/80">
                            {sourceView === 'cleaned' ? scraperResult.cleanedForAi : scraperResult.rawSnippet}
                            {sourceView === 'raw' && "..." /* indicate truncation */}
                          </pre>
                        </div>
                        <div className="px-4 py-2 bg-muted/20 border-t border-border flex justify-between items-center">
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                                {sourceView === 'cleaned' ? 'Cleaned for AI (No Scripts/Styles/SVG)' : 'Original Portal Response (Truncated)'}
                            </p>
                            <p className="text-[8px] font-mono text-muted-foreground">
                                {sourceView === 'cleaned' ? `${scraperResult.cleanedForAi.length} chars` : `${scraperResult.rawSnippet.length} chars`}
                            </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Traditional Result */}
                        <div className="surface-neutral rounded-3xl border border-border overflow-hidden flex flex-col h-[500px]">
                          <div className="px-6 py-4 border-b border-border bg-blue-500/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-blue-500" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Traditional (Cheerio)</h3>
                            </div>
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">Static Parser</span>
                          </div>
                          <div className="flex-1 p-6 overflow-auto custom-scrollbar font-mono text-xs bg-card">
                            <pre className="text-foreground leading-relaxed">
                              {JSON.stringify(scraperResult.traditionalData, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {/* AI Result */}
                        <div className="surface-neutral rounded-3xl border border-border shadow-xl overflow-hidden flex flex-col h-[500px]">
                          <div className="px-6 py-4 border-b border-border bg-emerald-500/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-emerald-500" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI (Gemma 3)</h3>
                            </div>
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">LLM Fallback</span>
                          </div>
                          <div className="flex-1 p-6 overflow-auto custom-scrollbar font-mono text-xs bg-card">
                            <pre className="text-foreground leading-relaxed">
                              {JSON.stringify(scraperResult.aiData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : scraperLoading ? (
                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-3xl bg-muted/10">
                      <div className="relative h-16 w-16 mb-6">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="absolute inset-0 bg-primary/10 rounded-full flex items-center justify-center">
                          <Database className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">Analyzing Intelligence Flow...</h3>
                      <div className="mt-6 flex flex-col gap-3 max-w-[300px] mx-auto">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className={`h-2 w-2 rounded-full ${elapsed > 0 ? 'bg-emerald-500' : 'bg-muted'}`} />
                          <span className={elapsed > 0 ? 'text-foreground font-bold' : ''}>1. Requesting Legacy Portal Data</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className={`h-2 w-2 rounded-full ${elapsed > 4 ? 'bg-emerald-500' : 'bg-muted'}`} />
                          <span className={elapsed > 4 ? 'text-foreground font-bold' : ''}>2. Running Traditional DOM Scraper</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className={`h-2 w-2 rounded-full ${elapsed > 8 ? 'bg-emerald-500' : 'bg-muted'}`} />
                          <span className={elapsed > 8 ? 'text-foreground font-bold' : ''}>3. Invoking Gemma 3 Fallback</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-12 italic">
                        Real-time comparison helps identify DOM drift in the school's legacy system.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-3xl bg-muted/10">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
                        <Database className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-lg font-bold text-muted-foreground">Intelligence Lab Standby</h3>
                      <p className="text-xs text-muted-foreground max-w-[300px] mx-auto mt-2 leading-relaxed">
                        Select a target system to verify extraction accuracy across both static and generative engines.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="moderation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <section className="space-y-4">
                <div className="surface-neutral p-6 rounded-3xl border border-border/50 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Simulated User</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Student Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Post Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-40 bg-background border border-border p-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none custom-scrollbar"
                      placeholder="Paste a student post here to test moderation rules..."
                    />
                  </div>

                  <button
                    onClick={testModeration}
                    disabled={modLoading || !content.trim()}
                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
                  >
                    {modLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Run Moderation Check</span>
                      </>
                    )}
                  </button>
                </div>

                {modError && (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl flex gap-3 text-destructive">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">{modError}</p>
                  </div>
                )}
              </section>

              <section>
                <AnimatePresence mode="wait">
                  {modResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative overflow-hidden h-full p-6 rounded-3xl border shadow-xl ${
                        modResult.decision === 'APPROVED' 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-rose-500/5 border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          modResult.decision === 'APPROVED' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-rose-500 text-white'
                        }`}>
                          {modResult.decision}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-tighter">{modResult.topic}</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-foreground">Aegis Reasoning:</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed italic">
                            "{modResult.reason}"
                          </p>
                        </div>

                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 space-y-2">
                          <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Growth Tip</h3>
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {modResult.growth_tip}
                          </p>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>Safety Score</span>
                            <span>{modResult.safety_score}%</span>
                          </div>
                          <div className="h-2 w-full bg-border/30 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${modResult.safety_score}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full ${
                                modResult.safety_score > 70 ? 'bg-emerald-500' : modResult.safety_score > 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div key="empty" className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-3xl bg-muted/20">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-lg font-bold text-muted-foreground">Ready to Analyze</h3>
                      <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-2 leading-relaxed">
                        Enter some content to test the Aegis moderation engine.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
