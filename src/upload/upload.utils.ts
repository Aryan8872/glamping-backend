import * as path from 'path';
import * as fs from 'fs';

/**
 * Processes a single uploaded Express/Multer file into a URL path string.
 */
export const processSingleFile = async (
  file: Express.Multer.File | undefined,
  folder: string,
): Promise<string | null> => {
  if (!file) return null;
  return `/uploads/${folder}/${path.basename(file.path)}`;
};

/**
 * Processes multiple uploaded files into URL path strings.
 */
export const processUploadedFiles = async (
  files: Express.Multer.File[],
  folder: string,
): Promise<string[]> => {
  if (!files || files.length === 0) return [];
  return files.map((f) => `/uploads/${folder}/${path.basename(f.path)}`);
};

/**
 * Safely deletes one or more files from the local filesystem.
 */
export const safeDelete = async (
  filePaths: string | string[],
): Promise<void> => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

  for (const filePath of paths) {
    try {
      // Handle URL paths like /uploads/camp/filename.jpg
      const cleanPath = filePath.startsWith('/uploads/')
        ? path.join(process.cwd(), filePath)
        : filePath;

      if (fs.existsSync(cleanPath)) {
        fs.unlinkSync(cleanPath);
      }
    } catch (err) {
      console.error(`Failed to delete file: ${filePath}`, err);
    }
  }
};

/**
 * Safe array parser — handles JSON-stringified arrays or returns the value if already an array.
 */
export const safeParseArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
