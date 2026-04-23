import { ParsedName } from "@/types";

/**
 * Parses a student name string into components.
 * Expected format: "LastName, FirstName MiddleName/Initial"
 * Example: "Centeno, Reymart P."
 */
export function parseStudentName(name: string): ParsedName {
  const result: ParsedName = {
    firstName: "",
    lastName: "",
    middleName: "",
    full: name,
  };

  if (!name) return result;

  // Clean the name of common prefixes
  const cleanName = name
    .replace(/^(Welcome|Student|User):\s*/i, '')
    .trim();

  // Check if name follows "LastName, FirstName ..." format
  if (cleanName.includes(',')) {
    const parts = cleanName.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length >= 1) {
      result.lastName = parts[0];
    }

    if (parts.length >= 2) {
      const rest = parts[1].split(/\s+/).filter(p => p.length > 0);
      
      if (rest.length === 1) {
        result.firstName = rest[0];
      } else {
        // Last part might be MI or Jr/Sr/III
        const suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V'];
        const lastPart = rest[rest.length - 1];
        const secondToLast = rest[rest.length - 2];
        
        if (suffixes.includes(lastPart.toUpperCase().replace(/\./g, ''))) {
          // It's a suffix, move it to lastName or just ignore for first/middle
          result.lastName += ` ${lastPart}`;
          if (rest.length > 2) {
            const isInitial = secondToLast.length <= 2 || secondToLast.endsWith('.');
            if (isInitial) {
              result.middleName = secondToLast;
              result.firstName = rest.slice(0, rest.length - 2).join(' ');
            } else {
              result.firstName = rest.slice(0, rest.length - 1).join(' ');
            }
          } else {
            result.firstName = rest[0];
          }
        } else {
          // Normal case: check for middle initial/name at the end
          const isInitial = lastPart.length <= 2 || lastPart.endsWith('.');
          if (isInitial) {
            result.middleName = lastPart;
            result.firstName = rest.slice(0, rest.length - 1).join(' ');
          } else {
            result.firstName = rest.join(' ');
          }
        }
      }
    }
  } else {
    // Fallback for names without commas "FirstName MiddleName LastName"
    const parts = cleanName.split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 1) {
      result.firstName = parts[0];
    } else if (parts.length === 2) {
      result.firstName = parts[0];
      result.lastName = parts[1];
    } else {
      result.firstName = parts[0];
      // Assume middle name is in the middle, and last part is last name
      result.middleName = parts[1];
      result.lastName = parts.slice(2).join(' ');
    }
  }

  return result;
}

/**
 * Obfuscates a string (userId) for use in URLs.
 * Not cryptographically secure, just prevents casual reading.
 */
export function obfuscateId(id: string): string {
  if (!id) return "";
  // Simple Base64 + some character swapping
  try {
    const b64 = btoa(id);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (e) {
    return id;
  }
}

/**
 * De-obfuscates a string back to the original ID.
 */
export function deobfuscateId(obfuscated: string): string {
  if (!obfuscated) return "";
  try {
    // Restore Base64 padding and chars
    let b64 = obfuscated.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return atob(b64);
  } catch (e) {
    return obfuscated;
  }
}
