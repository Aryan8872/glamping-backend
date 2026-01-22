import {
  uploadToLocal,
  uploadMultipleToLocal,
  deleteFromLocal,
  deleteMultipleFromLocal,
} from "./localStorage.js";
import {
  uploadToSupabase,
  uploadMultipleToSupabase,
  deleteFromSupabase,
  deleteMultipleFromSupabase,
} from "./supabaseStorage.js";

// Determine storage driver from environment
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";

console.log(`📦 Storage driver initialized: ${STORAGE_DRIVER}`);

/**
 * Upload a single file to the configured storage
 * @param {Object} params - File parameters
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.mimetype - File MIME type
 * @param {string} params.originalname - Original filename
 * @param {string} params.module - Module name (e.g., 'camp', 'gallery')
 * @returns {Promise<string>} - File URL or path
 */
export async function uploadFile({ buffer, mimetype, originalname, module }) {
  if (STORAGE_DRIVER === "supabase") {
    return uploadToSupabase({ buffer, mimetype, originalname, module });
  }
  return uploadToLocal({ buffer, mimetype, originalname, module });
}

/**
 * Upload multiple files to the configured storage in parallel
 * @param {Array<Object>} files - Array of file objects
 * @returns {Promise<Array<string>>} - Array of file URLs or paths
 */
export async function uploadFiles(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  if (STORAGE_DRIVER === "supabase") {
    return uploadMultipleToSupabase(files);
  }
  return uploadMultipleToLocal(files);
}

/**
 * Delete a single file from the configured storage
 * @param {string} filePathOrUrl - File path or URL
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export async function deleteFile(filePathOrUrl) {
  if (!filePathOrUrl) {
    return false;
  }

  if (STORAGE_DRIVER === "supabase") {
    return deleteFromSupabase(filePathOrUrl);
  }
  return deleteFromLocal(filePathOrUrl);
}

/**
 * Delete multiple files from the configured storage in parallel
 * @param {Array<string>} filePathsOrUrls - Array of file paths or URLs
 * @returns {Promise<Object>} - Deletion results
 */
export async function deleteFiles(filePathsOrUrls) {
  if (
    !filePathsOrUrls ||
    !Array.isArray(filePathsOrUrls) ||
    filePathsOrUrls.length === 0
  ) {
    return { success: 0, failed: 0, results: [] };
  }

  if (STORAGE_DRIVER === "supabase") {
    return deleteMultipleFromSupabase(filePathsOrUrls);
  }
  return deleteMultipleFromLocal(filePathsOrUrls);
}

/**
 * Get current storage driver
 * @returns {string} - 'local' or 'supabase'
 */
export function getStorageDriver() {
  return STORAGE_DRIVER;
}
