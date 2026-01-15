/**
 * Path utilities for file path manipulation.
 * Provides consistent path parsing functions.
 */

/**
 * Extract the filename from a file path.
 *
 * @param filePath - The full file path
 * @returns The filename portion of the path
 *
 * @example
 * getFileName("photos/2026/image.jpg") => "image.jpg"
 * getFileName("/path/to/file.txt") => "file.txt"
 * getFileName("file.txt") => "file.txt"
 */
export function getFileName(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/")
  return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath
}

/**
 * Extract the directory path from a file path.
 *
 * @param filePath - The full file path
 * @returns The directory portion of the path (with trailing slash)
 *
 * @example
 * getDirectoryPath("photos/2026/image.jpg") => "photos/2026/"
 * getDirectoryPath("/path/to/file.txt") => "/path/to/"
 * getDirectoryPath("file.txt") => "/"
 */
export function getDirectoryPath(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/")
  return lastSlash > 0 ? filePath.substring(0, lastSlash + 1) : "/"
}
