import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ensureFolderExists,
  generateFileName,
  getUploadPath,
} from "../utils/uploads/storage.utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload a single file to local storage
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.mimetype - File MIME type
 * @param {string} params.originalname - Original filename
 * @param {string} params.module - Module name (e.g., 'camp', 'gallery')
 * @returns {Promise<string>} - Public path to the uploaded file
 */
export async function uploadToLocal({
  buffer,
  mimetype,
  originalname,
  module,
}) {
  try {
    // Validate inputs
    if (!buffer || !originalname || !module) {
      throw new Error(
        "Missing required parameters: buffer, originalname, or module"
      );
    }

    // Get upload path and ensure directory exists
    const uploadPath = getUploadPath(module);
    ensureFolderExists(uploadPath);

    // Generate unique filename
    const filename = generateFileName(originalname);
    const filePath = path.join(uploadPath, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, buffer);

    // Return public path (relative to uploads directory)
    const publicPath = `/uploads/${module}/${filename}`;

    return publicPath;
  } catch (error) {
    console.error("❌ Local upload failed:", error);
    throw new Error(`Failed to upload file to local storage: ${error.message}`);
  }
}

/**
 * Upload multiple files to local storage in parallel
 * @param {Array<Object>} files - Array of file objects
 * @returns {Promise<Array<string>>} - Array of public paths
 */
export async function uploadMultipleToLocal(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    const uploadPromises = files.map((file) => uploadToLocal(file));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("❌ Multiple local uploads failed:", error);
    throw error;
  }
}

/**
 * Delete a single file from local storage
 * @param {string} filePath - Public path or full path to the file
 * @returns {Promise<boolean>} - True if deleted, false if file doesn't exist
 */
export async function deleteFromLocal(filePath) {
  try {
    if (!filePath) {
      console.warn("⚠️ No file path provided for deletion");
      return false;
    }

    // Convert public path to absolute path
    let absolutePath;
    if (filePath.startsWith("/uploads/")) {
      // Public path format: /uploads/module/filename.jpg
      const relativePath = filePath.replace(/^\/uploads\//, "");
      absolutePath = path.join(__dirname, "..", "uploads", relativePath);
    } else if (path.isAbsolute(filePath)) {
      absolutePath = filePath;
    } else {
      console.warn("⚠️ Invalid file path format:", filePath);
      return false;
    }

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.warn("⚠️ File not found for deletion:", absolutePath);
      return false;
    }

    // Delete file
    await fs.promises.unlink(absolutePath);
    console.log("✅ File deleted from local storage:", filePath);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete file from local storage:", error);
    // Don't throw - deletion failures shouldn't break the application
    return false;
  }
}

/**
 * Delete multiple files from local storage in parallel
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Promise<Object>} - Results with success count and failures
 */
export async function deleteMultipleFromLocal(filePaths) {
  if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
    return { success: 0, failed: 0, results: [] };
  }

  try {
    const deletePromises = filePaths.map(async (filePath) => {
      try {
        const result = await deleteFromLocal(filePath);
        return { filePath, success: result };
      } catch (error) {
        return { filePath, success: false, error: error.message };
      }
    });

    const results = await Promise.all(deletePromises);
    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `🗑️ Local deletion complete: ${success} succeeded, ${failed} failed`
    );

    return { success, failed, results };
  } catch (error) {
    console.error("❌ Multiple local deletions failed:", error);
    return {
      success: 0,
      failed: filePaths.length,
      results: [],
      error: error.message,
    };
  }
}
