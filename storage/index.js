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
 * Extract filename from URL or path for deletion
 * Handles both local paths and Supabase URLs
 * @param {string} urlOrPath - File URL or path
 * @returns {string} - Extracted filename or original input
 */
export function extractFileName(urlOrPath) {
  if (!urlOrPath) return "";

  try {
    // For Supabase URLs
    if (urlOrPath.startsWith("http")) {
      const urlPattern = /\/([^/]+)$/;
      const match = urlOrPath.match(urlPattern);
      return match ? match[1] : urlOrPath;
    }

    // For local paths
    const parts = urlOrPath.split("/");
    return parts[parts.length - 1];
  } catch (error) {
    console.error("❌ Failed to extract filename:", error);
    return urlOrPath;
  }
}

/**
 * Normalize URL for frontend compatibility
 * Ensures consistent format regardless of storage driver
 * @param {string} urlOrPath - File URL or path
 * @returns {string} - Normalized URL
 */
export function normalizeUrl(urlOrPath) {
  if (!urlOrPath) return "";

  // Supabase URLs are already in correct format
  if (urlOrPath.startsWith("http")) {
    return urlOrPath;
  }

  // Local paths should start with /
  if (!urlOrPath.startsWith("/")) {
    return `/${urlOrPath}`;
  }

  return urlOrPath;
}

/**
 * Get current storage driver
 * @returns {string} - 'local' or 'supabase'
 */
export function getStorageDriver() {
  return STORAGE_DRIVER;
}

/**
 * Check if a URL is from Supabase storage
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isSupabaseUrl(url) {
  return url && typeof url === "string" && url.includes("supabase.co/storage");
}

/**
 * Check if a path is from local storage
 * @param {string} path - Path to check
 * @returns {boolean}
 */
export function isLocalPath(path) {
  return path && typeof path === "string" && path.startsWith("/uploads/");
}
