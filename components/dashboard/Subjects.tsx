'use client';

import { ProspectusSubject } from '@/types';
import { useRouter } from 'next/navigation';
import { ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SubjectsProps {
  subjects: ProspectusSubject[];
}

export default function Subjects({ subjects }: SubjectsProps) {
  const router = useRouter();

  return (
    <div className="bg-card rounded-[2rem] shadow-sm border border-border p-8 mb-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            Catalog
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 ml-13">Available Course Offerings</p>
        </div>
        <Link 
          href="/subjects" 
          className="px-4 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all text-center shadow-sm shadow-primary/20"
        >
          View Full Listing
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Code</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Description</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Units</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {subjects.slice(0, 5).map((sub, idx) => (
              <tr 
                key={idx} 
                onClick={() => router.push(`/subjects/${encodeURIComponent(sub.code)}`)}
                className="hover:bg-blue-50 dark:bg-blue-950/30 transition-all cursor-pointer group"
              >
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className="text-[10px] font-black text-muted-foreground font-mono bg-accent px-2 py-1 rounded group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                    {sub.code}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-foreground leading-tight uppercase group-hover:text-primary transition-colors">{sub.description}</p>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-xs font-black text-muted-foreground">
                    {parseFloat(sub.units).toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end">
                    <div className="h-8 w-8 rounded-lg bg-accent border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-sm">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {subjects.length > 5 && (
        <Link 
          href="/subjects"
          className="mt-6 flex items-center justify-center py-4 border-2 border-dashed border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 dark:text-blue-400 transition-all group"
        >
          See all {subjects.length} subjects
          <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
