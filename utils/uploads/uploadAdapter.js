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
        console.log(publicPath);
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
      console.log(fileObjects);
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
