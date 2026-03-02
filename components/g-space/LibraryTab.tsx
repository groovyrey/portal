'use client';

import { 
  Library, 
  Search, 
  ChevronRight, 
  Book 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleBook } from '@/types/g-space';

interface LibraryTabProps {
  bookQuery: string;
  setBookQuery: (val: string) => void;
  fetchBooks: (query: string) => void;
  books: GoogleBook[];
  setActiveBookId: (id: string | null) => void;
}

export default function LibraryTab({
  bookQuery,
  setBookQuery,
  fetchBooks,
  books,
  setActiveBookId
}: LibraryTabProps) {
  return (
    <motion.div 
      key="library-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1">Global Library</h2>
          <p className="text-sm text-muted-foreground font-medium">Direct access to millions of academic publications.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <input 
            type="text" 
            placeholder="Title, author, or ISBN..."
            value={bookQuery}
            onChange={(e) => setBookQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBooks(bookQuery)}
            className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          <Search className="h-5 w-5 text-muted-foreground absolute left-4 top-3.5" />
          <button 
            onClick={() => fetchBooks(bookQuery)}
            className="absolute right-2 top-2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {books.length > 0 ? (
          books.map((book) => (
            <div 
              key={book.id}
              onClick={() => setActiveBookId(book.id)}
              className="group bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer hover:-translate-y-1"
            >
              <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden relative shadow-md group-hover:shadow-xl transition-all border border-border/50">
                {book.volumeInfo.imageLinks?.thumbnail ? (
                  <img 
                    src={book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')} 
                    alt={book.volumeInfo.title}
                    className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-accent/30 text-muted-foreground">
                    <Book className="h-10 w-10 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <button className="px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg">Preview</button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {book.volumeInfo.title}
                </h4>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wider truncate">
                  {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-muted/10 border-2 border-dashed border-border/50 rounded-2xl">
            <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Library className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-base font-black mb-2 uppercase tracking-widest">Library Empty</h3>
            <p className="text-xs text-muted-foreground font-medium">Enter a search query to browse our massive index of books.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
