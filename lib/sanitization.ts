/**
 * Sanitization utilities to prevent prompt injection and XSS attacks
 */

/**
 * Escape special characters that could be used for prompt injection
 * Prevents users from injecting instructions into AI prompts
 */
export function escapePromptString(text: string): string {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\')           // Escape backslashes
    .replace(/"/g, '\\"')             // Escape quotes
    .replace(/\n/g, '\\n')            // Escape newlines
    .replace(/\r/g, '\\r')            // Escape carriage returns
    .replace(/\t/g, '\\t')            // Escape tabs
    .replace(/`/g, '\\`');            // Escape backticks
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] ?? char);
}

const PROFANE_WORDS = new Set([
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'crap',
  'dick',
  'damn',
  'fuck',
  'fucker',
  'fucking',
  'hell',
  'shit',
  'shitty',
  'slut',
  'whore',
]);

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  '$': 's',
  '7': 't',
  '+': 't',
};

function normalizeForWordFilter(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9!@#$%*+_-]/g, (char) => LEET_MAP[char] || '')
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Replace blocked words with a masked version while preserving readability.
 */
export function filterProfanity(text: string): string {
  if (!text) return '';

  return text.replace(/\b[\w!@#$%*+_-]+\b/g, (word) => {
    const normalized = normalizeForWordFilter(word);
    if (!normalized || !PROFANE_WORDS.has(normalized)) return word;
    return '*'.repeat(word.length);
  });
}

/**
 * Normalize markdown and other formatting into speech-friendly plain text.
 *
 * Produces a single run of text with natural sentence/word boundaries so the
 * TTS model reads the content correctly regardless of the original format
 * (headings, lists, tables, code, links, emphasis, HTML, hex/emoji, etc.).
 */
export function normalizeTextForSpeech(text: string): string {
  if (!text) return '';

  // Remove hidden reasoning tags and their content entirely.
  let out = text.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, ' ');

  // Decode common HTML entities so the model doesn't read the literal codes.
  out = out.replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&hellip;/gi, '...');

  // Speak the peso sign as a word. TTS engines misread the '₱' character
  // (they output the peso sign as "P" + a garbled segment, e.g. "P.0"), so
  // expand it (and common PHP/Php/Peso alternatives) to "pesos".
  out = out
    .replace(/\u20b1\s*/g, 'pesos ')
    .replace(/\bphp\.?\s*(?=\d)/gi, 'pesos ')
    .replace(/\bPeso\b/g, 'peso')
    .replace(/\bPesos\b/g, 'pesos');

  // Keep code fences, reading their content as a sentence.
  out = out.replace(/```(?:\w+)?\s*([\s\S]*?)```/g, (_, code: string) => {
    return ' ' + code.replace(/[|\n]/g, ' ').trim() + ' ';
  });

  // Remove images (keep alt text) and links (keep display text), including
  // reference-style links like [text][ref] / [text] and footnote markers.
  out = out.replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, ' $1 ')
    .replace(/^\[\^[^\]]+\]:\s*/gm, ' ')
    .replace(/\[\^[^\]]+\]/g, ' ');

  // Drop raw URLs so the model doesn't spell them out character by character.
  out = out.replace(/https?:\/\/[^\s]+/gi, ' link ');

  // Turn math delimiters into plain text.
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$\n]+)\$/g, ' $1 ');

  // Strip any remaining HTML tags (opening, closing, self-closing).
  out = out.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');

  // Headings: "## Introduction" -> "Introduction. " so each heading reads as a
  // separate, natural pause instead of running into surrounding text.
  out = out.replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/(^|\s)#{1,6}(?=\s)/gm, '$1');

  // Blockquotes: strip the marker but keep the copy.
  out = out.replace(/^>\s?/gm, '');

  // Task lists / bullet lists / ordered lists: strip markers and place a
  // separator so items don't run together.
  out = out.replace(/^\s*[-+*]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/^\s*\d{1,4}[.)]\s+/gm, '');

  // Turn single newlines into a space (soft break) and blank lines into a
  // sentence boundary, in one pass over the full run of text.
  out = out.replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]*(?:\n[ \t]*)+/g, '. ')
    .replace(/\n/g, ' ');

  // Tables: convert cell boundaries (pipes + surrounding spaces) to a pause
  // and collapse the divider row of dashes.
  out = out.replace(/^\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*$/gm, '. ')
    .replace(/\s*\|\s*/g, ', ');

  // Remove remaining emphasis markers and other formatting characters.
  out = out.replace(/[*_~`]/g, '');

  // Remove stray horizontal rules and common non-speakable punctuation runs.
  out = out.replace(/^\s*-{3,}\s*$/gm, '. ')
    .replace(/\s*[-–—]\s*/g, ' ')
    .replace(/[(){}\[\]<>]/g, ' ')
    .replace(/\s*\.{3,}\s*/g, '. ')
    .replace(/[#*|]+/g, ' ');

  // Strip emoji, symbols, and non-speakable Unicode ranges while preserving
  // normal punctuation and letters (including Latin-1 accents).
  out = out.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{FE00}-\u{FE0F}\u{E000}-\u{F8FF}]/gu, ' ');

  // Normalize whitespace and punctuation so the final text is clean.
  return out
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/**
 * Validate and clean student names for use in prompts
 */
export function sanitizeStudentName(name: string): string {
  // Get first name only
  const firstName = name.split(' ')[0];

  // Escape for prompt injection
  const escaped = escapePromptString(firstName);

  // Limit length
  return escaped.substring(0, 50);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate student ID format
 */
export function isValidStudentId(id: string): boolean {
  // Assuming format like "2024-0001"
  return /^\d{4}-\d{4}$/.test(id) || id.length <= 20;
}
