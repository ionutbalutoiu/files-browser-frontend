/**
 * Validation utilities for file operations.
 * Centralized validation logic to keep components focused on UI.
 */

/**
 * Validation result type.
 * - null: No change detected, operation should be silently cancelled
 * - empty string: Valid input
 * - non-empty string: Validation error message
 */
export type ValidationResult = string | null

/**
 * Validate a file/folder rename operation.
 *
 * @param newName - The new name to validate
 * @param originalName - The original name for comparison
 * @returns ValidationResult: null if unchanged, '' if valid, error message if invalid
 *
 * @example
 * const result = validateRename('new-file.txt', 'old-file.txt')
 * if (result === null) {
 *   // No change, cancel silently
 * } else if (result === '') {
 *   // Valid, proceed with rename
 * } else {
 *   // Show error: result contains the message
 * }
 */
export function validateRename(
  newName: string,
  originalName: string,
): ValidationResult {
  const trimmed = newName.trim()

  if (!trimmed) {
    return "Name cannot be empty"
  }

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return "Name cannot contain / or \\"
  }

  if (trimmed === originalName) {
    return null // No change, silently cancel
  }

  return "" // Valid
}

/**
 * Validate a folder name for creation.
 *
 * @param name - The folder name to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateFolderName(name: string): string {
  const trimmed = name.trim()

  if (!trimmed) {
    return "Folder name cannot be empty"
  }

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return "Folder name cannot contain path separators"
  }

  if (trimmed === "." || trimmed === "..") {
    return "Invalid folder name"
  }

  return "" // Valid
}
