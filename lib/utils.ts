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

  // Check if name follows "LastName, FirstName ..." format
  if (name.includes(',')) {
    // Filter out empty parts in case of trailing commas
    const parts = name.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length >= 1) {
      result.lastName = parts[0];
    }

    if (parts.length >= 2) {
      const rest = parts[1].split(/\s+/).filter(p => p.length > 0);
      
      if (rest.length === 1) {
        // Format: "LastName, FirstName"
        result.firstName = rest[0];
      } else if (rest.length > 1) {
        // Check if the last part is a middle initial or name
        const lastPart = rest[rest.length - 1];
        // Usually MI is one char or ends with .
        const isInitial = lastPart.length <= 2 || lastPart.endsWith('.');
        
        result.middleName = lastPart;
        result.firstName = rest.slice(0, rest.length - 1).join(' ');
      }
    }
  } else {
    // Fallback for names without commas "FirstName MiddleName LastName"
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      result.firstName = parts[0];
    } else if (parts.length === 2) {
      result.firstName = parts[0];
      result.lastName = parts[1];
    } else {
      result.firstName = parts[0];
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
