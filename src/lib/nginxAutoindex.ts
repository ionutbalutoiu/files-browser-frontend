/**
 * Nginx autoindex JSON response parser.
 */

import type { NginxEntry } from './types';

/**
 * Parse and validate nginx autoindex JSON response.
 * Resilient to extra or missing fields.
 */
export function parseNginxResponse(data: unknown): NginxEntry[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid response: expected array');
  }

  return data.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Invalid entry at index ${index}`);
    }

    const entry = item as Record<string, unknown>;

    if (typeof entry.name !== 'string') {
      throw new Error(`Missing or invalid 'name' at index ${index}`);
    }

    if (entry.type !== 'file' && entry.type !== 'directory') {
      throw new Error(`Invalid 'type' at index ${index}: ${entry.type}`);
    }

    const result: NginxEntry = {
      name: entry.name,
      type: entry.type,
    };

    // Optional fields
    if (typeof entry.size === 'number') {
      result.size = entry.size;
    }

    if (typeof entry.mtime === 'string') {
      result.mtime = entry.mtime;
    }

    return result;
  });
}
