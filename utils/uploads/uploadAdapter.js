import { uploadFiles, getStorageDriver } from "../../storage/index.js";

/**
 * Process uploaded files from Multer and upload to configured storage
 * This adapter bridges Multer's file handling with our storage abstraction
 *
 * @param {Array<Object>} multerFiles - Files from req.files (Multer format)
 * @param {string} module - Module name (e.g., 'camp', 'gallery')
 * @returns {Promise<Array<string>>} - Array of file URLs/paths
 *
 * @example
 * // In controller
 * const imageUrls = await processUploadedFiles(req.files?.campImages, 'camp');
 */
export async function processUploadedFiles(multerFiles, module) {
  if (!multerFiles || !Array.isArray(multerFiles) || multerFiles.length === 0) {
    return [];
  }

  const storageDriver = getStorageDriver();

  try {
    // For local storage, files are already on disk - just return paths
    if (storageDriver === "local") {
      return multerFiles.map((file) => {
        // Convert absolute path to public path
        const publicPath = file.path
          .replace(/\\/g, "/") // Normalize Windows paths
          .replace(/^.*\/uploads\//, "/uploads/"); // Extract public path
        return publicPath;
      });
    }

    // For Supabase, upload from memory buffer
    if (storageDriver === "supabase") {
      const fileObjects = multerFiles.map((file) => ({
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        module,
      }));

      return await uploadFiles(fileObjects);
    }

    throw new Error(`Unknown storage driver: ${storageDriver}`);
  } catch (error) {
    console.error("❌ Failed to process uploaded files:", error);
    throw new Error(`File processing failed: ${error.message}`);
  }
}

/**
 * Process a single uploaded file from Multer
 *
 * @param {Object} multerFile - Single file from req.file or req.files.fieldName[0]
 * @param {string} module - Module name
 * @returns {Promise<string|null>} - File URL/path or null
 */
export async function processSingleFile(multerFile, module) {
  if (!multerFile) {
    return null;
  }

  const result = await processUploadedFiles([multerFile], module);
  return result[0] || null;
}

/**
 * Convert Multer files object to array format
 * Handles both single field and multiple fields
 *
 * @param {Object} filesObject - req.files object from Multer
 * @param {string} fieldName - Field name to extract (optional)
 * @returns {Array<Object>} - Array of Multer file objects
 *
 * @example
 * const files = extractFilesFromMulter(req.files, 'campImages');
 */
export function extractFilesFromMulter(filesObject, fieldName = null) {
  if (!filesObject) {
    return [];
  }

  // If fieldName specified, return that field's files
  if (fieldName && filesObject[fieldName]) {
    return Array.isArray(filesObject[fieldName])
      ? filesObject[fieldName]
      : [filesObject[fieldName]];
  }

  // Otherwise, collect all files from all fields
  const allFiles = [];
  for (const key of Object.keys(filesObject)) {
    const files = filesObject[key];
    if (Array.isArray(files)) {
      allFiles.push(...files);
    } else if (files) {
      allFiles.push(files);
    }
  }

  return allFiles;
}

/**
 * Helper to process multiple file fields at once
 *
 * @param {Object} filesObject - req.files from Multer
 * @param {Object} fieldConfig - Configuration object mapping field names to modules
 * @returns {Promise<Object>} - Object with processed file URLs for each field
 *
 * @example
 * const result = await processMultipleFields(req.files, {
 *   coverImage: 'gallery',
 *   galleryImages: 'gallery'
 * });
 * // Returns: { coverImage: 'url', galleryImages: ['url1', 'url2'] }
 */
export async function processMultipleFields(filesObject, fieldConfig) {
  if (!filesObject || !fieldConfig) {
    return {};
  }

  const result = {};

  for (const [fieldName, module] of Object.entries(fieldConfig)) {
    const files = filesObject[fieldName];

    if (!files) {
      result[fieldName] = null;
      continue;
    }

    if (Array.isArray(files)) {
      result[fieldName] = await processUploadedFiles(files, module);
    } else {
      result[fieldName] = await processSingleFile(files, module);
    }
  }

  return result;
}
