/**
 * File upload API for the files browser.
 */

import { buildApiUrl } from './url';

export interface UploadResult {
  uploaded: string[];
  skipped: string[];
  errors?: string[];
}

export interface UploadError {
  message: string;
}

/**
 * Upload files to the server.
 * @param files - Files to upload
 * @param targetPath - Target directory path (e.g., "/photos/2026/")
 */
export async function uploadFiles(
  files: FileList | File[],
  targetPath: string
): Promise<UploadResult> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  // Build upload URL with proper path normalization
  const uploadUrl = buildApiUrl('/upload', targetPath, true);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - browser sets it with boundary
  });

  let result: UploadResult | { error: string };
  try {
    result = await response.json();
  } catch {
    throw { message: 'Invalid server response' } as UploadError;
  }

  if ('error' in result) {
    throw { message: result.error } as UploadError;
  }

  if (!response.ok && !result.uploaded?.length) {
    throw { message: `Upload failed: ${response.status}` } as UploadError;
  }

  return result;
}

/**
 * Upload files with progress tracking.
 * @param files - Files to upload
 * @param targetPath - Target directory path
 * @param onProgress - Progress callback (0-100)
 */
export function uploadFilesWithProgress(
  files: FileList | File[],
  targetPath: string,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    // Build upload URL with proper path normalization
    const uploadUrl = buildApiUrl('/upload', targetPath, true);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if ('error' in result && !result.uploaded?.length) {
          reject({ message: result.error } as UploadError);
        } else if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result);
        } else if (result.uploaded?.length) {
          // Partial success
          resolve(result);
        } else {
          reject({ message: `Upload failed: ${xhr.status}` } as UploadError);
        }
      } catch {
        reject({ message: 'Invalid server response' } as UploadError);
      }
    });

    xhr.addEventListener('error', () => {
      reject({ message: 'Network error' } as UploadError);
    });

    xhr.addEventListener('abort', () => {
      reject({ message: 'Upload cancelled' } as UploadError);
    });

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Validate files before upload (client-side).
 */
export function validateFiles(files: FileList | File[]): string[] {
  const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > maxSize) {
      errors.push(`${file.name}: exceeds 2GB limit`);
    }
    if (file.name.startsWith('.')) {
      errors.push(`${file.name}: hidden files not allowed`);
    }
  }

  return errors;
}

/**
 * Format total size of files for display.
 */
export function formatTotalSize(files: FileList | File[]): string {
  const total = Array.from(files).reduce((sum, f) => sum + f.size, 0);
  
  if (total === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(total) / Math.log(1024)),
    units.length - 1
  );
  
  const size = total / Math.pow(1024, exponent);
  const formatted = exponent === 0 ? size.toString() : size.toFixed(1);
  
  return `${formatted} ${units[exponent]}`;
}

export interface DeleteError {
  message: string;
  status?: number;
}

/**
 * Delete a file or empty directory.
 * @param path - Full path to file or directory (e.g., "/photos/2026/image.jpg")
 */
export async function deleteFile(path: string): Promise<void> {
  // Build delete URL with proper path normalization
  const deleteUrl = buildApiUrl('/delete', path, false);

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage: string;
    
    try {
      const result = await response.json();
      errorMessage = result.error || `Delete failed: ${response.status}`;
    } catch {
      errorMessage = `Delete failed: ${response.status}`;
    }

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: 'File not found', status: 404 } as DeleteError;
      case 409:
        throw { message: 'Directory is not empty', status: 409 } as DeleteError;
      case 403:
        throw { message: 'Cannot delete this path', status: 403 } as DeleteError;
      default:
        throw { message: errorMessage, status: response.status } as DeleteError;
    }
  }
}

/**
 * Build full path for deletion from directory path and file name.
 */
export function getDeletePath(directoryPath: string, fileName: string): string {
  const normalizedDir = directoryPath.replace(/^\/+|\/+$/g, '');
  if (normalizedDir) {
    return `${normalizedDir}/${fileName}`;
  }
  return fileName;
}

export interface RenameError {
  message: string;
  status?: number;
}

/**
 * Rename a file or directory.
 * @param oldPath - Full path to file or directory (e.g., "/photos/2026/image.jpg")
 * @param newName - New name for the file or directory (just the name, not full path)
 */
export async function renameFile(oldPath: string, newName: string): Promise<void> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = oldPath.replace(/^\/+|\/+$/g, '');

  // Encode the new name for the query parameter
  const encodedNewName = encodeURIComponent(newName.trim());

  const response = await fetch(`/rename/${normalizedPath}?newName=${encodedNewName}`, {
    method: 'POST',
  });

  if (!response.ok) {
    let errorMessage: string;

    try {
      const result = await response.json();
      errorMessage = result.error || `Rename failed: ${response.status}`;
    } catch {
      errorMessage = `Rename failed: ${response.status}`;
    }

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: 'File not found', status: 404 } as RenameError;
      case 409:
        throw { message: 'A file with that name already exists', status: 409 } as RenameError;
      case 400:
        throw { message: 'Invalid name', status: 400 } as RenameError;
      case 403:
        throw { message: 'Cannot rename this path', status: 403 } as RenameError;
      default:
        throw { message: errorMessage, status: response.status } as RenameError;
    }
  }
}

export interface CreateDirectoryResult {
  created: string;
}

export interface CreateDirectoryError {
  message: string;
  status?: number;
}

/**
 * Create a new directory.
 * @param parentPath - Parent directory path (e.g., "/photos/2026")
 * @param dirName - Name of the new directory
 */
export async function createDirectory(
  parentPath: string,
  dirName: string
): Promise<CreateDirectoryResult> {
  // Validate directory name client-side
  if (!dirName || dirName.trim() === '') {
    throw { message: 'Directory name cannot be empty' } as CreateDirectoryError;
  }

  if (dirName.includes('/') || dirName.includes('\\')) {
    throw { message: 'Directory name cannot contain path separators' } as CreateDirectoryError;
  }

  if (dirName === '.' || dirName === '..') {
    throw { message: 'Invalid directory name' } as CreateDirectoryError;
  }

  // Build the full path
  const normalizedParent = parentPath.replace(/^\/+|\/+$/g, '');
  const fullPath = normalizedParent
    ? `${normalizedParent}/${dirName}`
    : dirName;

  // Build mkdir URL with proper path normalization
  const mkdirUrl = buildApiUrl('/mkdir', fullPath, true);

  const response = await fetch(mkdirUrl, {
    method: 'POST',
  });

  let result: CreateDirectoryResult | { error: string };
  try {
    result = await response.json();
  } catch {
    if (response.ok) {
      return { created: fullPath };
    }
    throw { message: `Create directory failed: ${response.status}` } as CreateDirectoryError;
  }

  if (!response.ok) {
    const errorMessage = 'error' in result ? result.error : `Create directory failed: ${response.status}`;

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: 'Parent directory does not exist', status: 404 } as CreateDirectoryError;
      case 409:
        throw { message: 'Directory already exists', status: 409 } as CreateDirectoryError;
      case 403:
        throw { message: 'Cannot create directory here', status: 403 } as CreateDirectoryError;
      case 400:
        throw { message: 'Invalid directory name', status: 400 } as CreateDirectoryError;
      default:
        throw { message: errorMessage, status: response.status } as CreateDirectoryError;
    }
  }

  return result as CreateDirectoryResult;
}
