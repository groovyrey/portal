'use client';

import { useState } from 'react';
import { Shield, Send, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GrokTestPage() {
  const [content, setContent] = useState('');
  const [userName, setUserName] = useState('Admin Test');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testGitHubModels = async () => {
    if (!content.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/git', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          userName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to test Grok');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GitHub Models Moderation Lab</h1>
            <p className="text-sm text-muted-foreground">Test the "Aegis" community moderation engine powered by GitHub Models.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
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
                onClick={testGitHubModels}
                disabled={loading || !content.trim()}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Run Moderation Check</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl flex gap-3 text-destructive"
              >
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium">{error}</p>
              </motion.div>
            )}
          </section>

          {/* Result Section */}
          <section>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative overflow-hidden h-full p-6 rounded-3xl border shadow-xl ${
                    result.decision === 'APPROVED' 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      result.decision === 'APPROVED' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-rose-500 text-white'
                    }`}>
                      {result.decision}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-tighter">{result.topic}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground">Aegis Reasoning:</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{result.reason}"
                      </p>
                    </div>

                    <div className="p-4 bg-background/50 rounded-2xl border border-border/50 space-y-2">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Growth Tip</h3>
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {result.growth_tip}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Safety Score</span>
                        <span>{result.safety_score}%</span>
                      </div>
                      <div className="h-2 w-full bg-border/30 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.safety_score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${
                            result.safety_score > 70 ? 'bg-emerald-500' : result.safety_score > 40 ? 'bg-amber-500' : 'bg-rose-500'
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
                    Enter some content to see how GitHub Models evaluates it against LCC community standards.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}
