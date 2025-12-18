import { uploadFiles, deleteFiles } from "./index.js";

/**
 * Execute a database operation with automatic storage rollback on failure
 * This ensures uploaded files are cleaned up if the database save fails
 *
 * @param {Function} uploadFn - Async function that uploads files and returns file URLs/paths
 * @param {Function} dbOperation - Async function that saves to database using the uploaded file URLs
 * @returns {Promise<any>} - Result from dbOperation
 *
 * @example
 * const result = await withStorageTransaction(
 *   async () => {
 *     // Upload files
 *     const urls = await uploadFiles(fileBuffers);
 *     return urls;
 *   },
 *   async (urls) => {
 *     // Save to database
 *     return await prisma.camp.create({
 *       data: { images: urls, ...otherData }
 *     });
 *   }
 * );
 */
export async function withStorageTransaction(uploadFn, dbOperation) {
  let uploadedFiles = [];

  try {
    // Step 1: Upload files to storage
    uploadedFiles = await uploadFn();

    // Ensure uploadedFiles is an array
    if (!Array.isArray(uploadedFiles)) {
      uploadedFiles = uploadedFiles ? [uploadedFiles] : [];
    }

    // Step 2: Save to database
    const result = await dbOperation(uploadedFiles);

    // Success - return result
    console.log("✅ Storage transaction completed successfully");
    return result;
  } catch (error) {
    // Step 3: Rollback - delete uploaded files if DB operation failed
    console.error("❌ Storage transaction failed, rolling back...", error);

    if (uploadedFiles.length > 0) {
      try {
        console.log(
          `🔄 Rolling back ${uploadedFiles.length} uploaded files...`
        );
        const deleteResult = await deleteFiles(uploadedFiles);
        console.log(
          `✅ Rollback complete: ${deleteResult.success} files deleted`
        );
      } catch (rollbackError) {
        console.error(
          "❌ Rollback failed (files may be orphaned):",
          rollbackError
        );
        // Log for manual cleanup but don't throw
      }
    }

    // Re-throw original error
    throw error;
  }
}

/**
 * Wrapper for simple upload + save operations
 * Handles single or multiple files
 *
 * @param {Array<Object>|Object} files - File object(s) with buffer, mimetype, originalname, module
 * @param {Function} dbSaveFn - Function that receives file URLs and saves to DB
 * @returns {Promise<any>} - Result from database save
 *
 * @example
 * const camp = await uploadAndSave(
 *   fileBuffers,
 *   async (imageUrls) => {
 *     return await prisma.camp.create({
 *       data: { images: imageUrls, name: 'Camp Name' }
 *     });
 *   }
 * );
 */
export async function uploadAndSave(files, dbSaveFn) {
  return withStorageTransaction(async () => {
    // Handle both single file and array of files
    if (Array.isArray(files)) {
      return await uploadFiles(files);
    } else if (files) {
      const result = await uploadFiles([files]);
      return result[0]; // Return single URL for single file
    }
    return [];
  }, dbSaveFn);
}

/**
 * Safe deletion wrapper that logs errors but doesn't throw
 * Useful for cleanup operations that shouldn't block the main flow
 *
 * @param {Array<string>|string} filePathsOrUrls - File path(s) or URL(s) to delete
 * @returns {Promise<Object>} - Deletion results
 *
 * @example
 * // Delete old images when updating
 * await safeDelete(oldImageUrls);
 */
export async function safeDelete(filePathsOrUrls) {
  try {
    if (!filePathsOrUrls) {
      return { success: 0, failed: 0, results: [] };
    }

    const filesToDelete = Array.isArray(filePathsOrUrls)
      ? filePathsOrUrls
      : [filePathsOrUrls];

    const result = await deleteFiles(filesToDelete);

    if (result.failed > 0) {
      console.warn(`⚠️ Some files failed to delete: ${result.failed} failures`);
    }

    return result;
  } catch (error) {
    console.error("❌ Safe delete encountered error:", error);
    return {
      success: 0,
      failed: Array.isArray(filePathsOrUrls) ? filePathsOrUrls.length : 1,
      results: [],
      error: error.message,
    };
  }
}
