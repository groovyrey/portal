'use client';

import React, { useEffect, useRef, useState } from 'react';
import AssistantMarkdown from '@/components/community/AssistantMarkdown';

interface TypewriterTextProps {
  content: string;
  /** True while the assistant is still streaming this message. */
  isStreaming?: boolean;
  charsPerTick?: number;
  tickMs?: number;
}

/**
 * Progressively reveals markdown content with a blinking caret, producing a
 * typewriter effect. Reveals are computed on top of the existing (streamed)
 * content, so if `content` keeps growing the effect just keeps typing. Rendering
 * advances at word boundaries through AssistantMarkdown so inline markdown
 * tokens (bold, code, links) stay intact instead of flashing their raw syntax.
 *
 * The component is mounted fresh per assistant message (message list is keyed by
 * id), so each new response restarts the reveal automatically.
 */
export default function TypewriterText({
  content,
  isStreaming = false,
  charsPerTick = 3,
  tickMs = 18,
}: TypewriterTextProps) {
  const [revealed, setRevealed] = useState(0);

  // Always read the latest content from a ref so the interval never restarts
  // as the stream appends more text.
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const id = setInterval(() => {
      setRevealed((current) => {
        const limit = contentRef.current.length;
        return current >= limit ? current : Math.min(limit, current + charsPerTick);
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [charsPerTick, tickMs]);

  const fullyShown = revealed >= content.length;

  // Snap the reveal to the next word boundary so markdown tokens stay intact.
  const safeChars = (() => {
    if (fullyShown) return content.length;
    const nextSpace = content.indexOf(' ', revealed);
    return nextSpace === -1 ? content.length : Math.min(nextSpace + 1, content.length);
  })();

  const shown = content.slice(0, safeChars);
  const showCaret = isStreaming || !fullyShown;

  return (
    <div className="min-w-0 w-full overflow-hidden">
      <AssistantMarkdown content={shown} isLoading={isStreaming} />
      {showCaret && (
        <span className="inline-block align-baseline ml-0.5 h-[1em] w-[2px] bg-primary animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}
