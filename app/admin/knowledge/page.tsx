'use client';

import React, { useState, useEffect } from 'react';
import { DatabaseZap, Save, Loader2, Plus, Info, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

interface KnowledgeEntry {
  id: number;
  content: string;
  metadata: any;
}

export default function KnowledgeAdminPage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newContent, setNewContent] = useState('');
  const [category, setCategory] = useState('General');

  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.badges?.includes('staff')) {
      fetchEntries();
    }
  }, [currentUser]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/knowledge');
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (err) {
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newContent,
          metadata: { category }
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Knowledge added to vector store');
        setNewContent('');
        fetchEntries();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this knowledge?')) return;

    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Knowledge removed');
        fetchEntries();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentUser || !currentUser.badges?.includes('staff')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl max-w-md w-full text-center space-y-6">
          <div className="bg-red-50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-red-500">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Access Denied</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Staff permissions required</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <DatabaseZap className="h-6 w-6 text-primary" />
              Assistant Knowledge
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Vector Store Management</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-xl text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Persistent AI Memory</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Side */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Add Knowledge</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option>General</option>
                    <option>Policies</option>
                    <option>Buildings</option>
                    <option>Events</option>
                    <option>Requirements</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Information / Context</label>
                  <textarea
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Describe context or policies for the assistant..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium leading-relaxed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || !newContent.trim()}
                  className="w-full bg-primary text-primary-foreground font-black py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Embedding...' : 'Store Knowledge'}
                </button>
              </form>
            </div>
          </div>

          {/* List Side */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Existing Knowledge ({entries.length})</h2>
            
            {loading ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reading Vector Store...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border border-dashed p-12 text-center">
                <div className="bg-accent h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No custom knowledge found</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-1 italic">Start adding context for the Assistant to remember.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group shadow-sm">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-accent text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {entry.metadata?.category || 'General'}
                      </span>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                      >
                        {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
