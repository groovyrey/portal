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
 */
export function normalizeTextForSpeech(text: string): string {
  if (!text) return '';

  return text
    .replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, ' ')
    .replace(/```(?:\w+)?\s*([\s\S]*?)```/g, ' $1 ')
    .replace(/`([^`]+)`/g, ' $1 ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^(\s*[-*+]\s+)/gm, '')
    .replace(/^(\s*\d+[.)]\s+)/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
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
