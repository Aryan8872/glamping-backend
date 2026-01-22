import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client lazily
let supabaseInstance = null;

const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "❌ Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

const BUCKET_NAME = process.env.SUPABASE_BUCKET || "uploads";

/**
 * Upload a single file to Supabase storage
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.mimetype - File MIME type
 * @param {string} params.originalname - Original filename
 * @param {string} params.module - Module name (e.g., 'camp', 'gallery')
 * @returns {Promise<string>} - Public URL to the uploaded file
 */
export async function uploadToSupabase({
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

    // Validate Supabase configuration
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${module}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase
    // Upload to Supabase
    const { data, error } = await getSupabase()
      .storage.from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: mimetype,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    // Get public URL
    const { data: urlData } = getSupabase()
      .storage.from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase");
    }

    console.log("✅ File uploaded to Supabase:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("❌ Supabase upload failed:", error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }
}

/**
 * Upload multiple files to Supabase storage in parallel
 * @param {Array<Object>} files - Array of file objects
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
export async function uploadMultipleToSupabase(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    const uploadPromises = files.map((file) => uploadToSupabase(file));
    const results = await Promise.all(uploadPromises);
    console.log(`✅ Uploaded ${results.length} files to Supabase`);
    console.log(results)
    return results;
  } catch (error) {
    console.error("❌ Multiple Supabase uploads failed:", error);
    throw error;
  }
}

/**
 * Extract file path from Supabase public URL
 * @param {string} publicUrl - Supabase public URL
 * @returns {string|null} - File path within bucket or null if invalid
 */
function extractFilePathFromUrl(publicUrl) {
  try {
    if (!publicUrl || typeof publicUrl !== "string") {
      return null;
    }

    // Supabase URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlPattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
    const match = publicUrl.match(urlPattern);

    if (match && match[1]) {
      return match[1]; // Returns the file path within the bucket
    }

    return null;
  } catch (error) {
    console.error("❌ Failed to extract file path from URL:", error);
    return null;
  }
}

/**
 * Delete a single file from Supabase storage
 * @param {string} filePathOrUrl - File path within bucket or public URL
 * @returns {Promise<boolean>} - True if deleted, false otherwise
 */
export async function deleteFromSupabase(filePathOrUrl) {
  try {
    if (!filePathOrUrl) {
      console.warn("⚠️ No file path provided for deletion");
      return false;
    }

    // Extract file path if URL is provided
    let filePath = filePathOrUrl;
    if (filePathOrUrl.startsWith("http")) {
      filePath = extractFilePathFromUrl(filePathOrUrl);
      if (!filePath) {
        console.warn("⚠️ Could not extract file path from URL:", filePathOrUrl);
        return false;
      }
    }

    // Delete from Supabase
    // Delete from Supabase
    const { data, error } = await getSupabase()
      .storage.from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("❌ Supabase deletion error:", error);
      return false;
    }

    console.log("✅ File deleted from Supabase:", filePath);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete file from Supabase:", error);
    // Don't throw - deletion failures shouldn't break the application
    return false;
  }
}

/**
 * Delete multiple files from Supabase storage in parallel
 * @param {Array<string>} filePathsOrUrls - Array of file paths or URLs
 * @returns {Promise<Object>} - Results with success count and failures
 */
export async function deleteMultipleFromSupabase(filePathsOrUrls) {
  if (
    !filePathsOrUrls ||
    !Array.isArray(filePathsOrUrls) ||
    filePathsOrUrls.length === 0
  ) {
    return { success: 0, failed: 0, results: [] };
  }

  try {
    // Extract file paths from URLs
    const filePaths = filePathsOrUrls
      .map((item) => {
        if (item.startsWith("http")) {
          return extractFilePathFromUrl(item);
        }
        return item;
      })
      .filter(Boolean); // Remove nulls

    if (filePaths.length === 0) {
      console.warn("⚠️ No valid file paths to delete");
      return { success: 0, failed: filePathsOrUrls.length, results: [] };
    }

    // Delete all files in one request (Supabase supports batch deletion)
    // Delete all files in one request (Supabase supports batch deletion)
    const { data, error } = await getSupabase()
      .storage.from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      console.error("❌ Supabase batch deletion error:", error);
      return {
        success: 0,
        failed: filePaths.length,
        results: [],
        error: error.message,
      };
    }

    const success = filePaths.length;
    console.log(`🗑️ Supabase deletion complete: ${success} files deleted`);

    return {
      success,
      failed: 0,
      results: filePaths.map((fp) => ({ filePath: fp, success: true })),
    };
  } catch (error) {
    console.error("❌ Multiple Supabase deletions failed:", error);
    return {
      success: 0,
      failed: filePathsOrUrls.length,
      results: [],
      error: error.message,
    };
  }
}
