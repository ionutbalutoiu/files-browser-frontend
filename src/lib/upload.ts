/**
 * File upload API for the files browser.
 */

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

  // Normalize path: ensure no leading slash for upload endpoint, add trailing slash
  const normalizedPath = targetPath
    .replace(/^\/+/, '')
    .replace(/\/?$/, '/');

  const response = await fetch(`/upload/${normalizedPath}`, {
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

    const normalizedPath = targetPath
      .replace(/^\/+/, '')
      .replace(/\/?$/, '/');

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

    xhr.open('POST', `/upload/${normalizedPath}`);
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
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  const response = await fetch(`/delete/${normalizedPath}`, {
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
