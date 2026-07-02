import { useRef, useEffect } from 'react';

export function useAutoScroll(deps: any[] = []) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Find the actual scrollable viewport element within ScrollArea
      const scrollable = scrollContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      
      if (scrollable) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          scrollable.scrollTop = scrollable.scrollHeight;
        });
      }
    }
  }, deps);

  return scrollContainerRef;
}
