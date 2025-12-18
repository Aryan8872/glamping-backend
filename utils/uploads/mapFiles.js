import path from "path";
import { toPublicPath } from "./storage.utils.js";
import { getStorageDriver } from "../../storage/index.js";

/**
 * Convert multer files into array of public paths
 */
export const mapMulterFiles = (filesObj) => {
  if (!filesObj) return [];

  const allPaths = [];

  for (const key of Object.keys(filesObj)) {
    for (const file of filesObj[key]) {
      const publicPath = toPublicPath(path.resolve(file.path));
      allPaths.push(publicPath.startsWith("/") ? publicPath : `/${publicPath}`);
    }
  }

  return allPaths;
};

/**
 * Convert Multer files to public paths (for local storage)
 * For Supabase, files should be processed through uploadAdapter instead
 */
export const mapFilesToPaths = (files) => {
  if (!files || !Array.isArray(files)) return [];

  const storageDriver = getStorageDriver();

  // For Supabase, this function shouldn't be used
  // Files should go through uploadAdapter which handles the upload
  if (storageDriver === "supabase") {
    console.warn(
      "⚠️ mapFilesToPaths called with Supabase driver. Use uploadAdapter instead."
    );
    return [];
  }

  return files.map((f) => {
    const publicPath = toPublicPath(path.resolve(f.path));
    return publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  });
};

/**
 * Storage-agnostic file mapping
 * Returns URLs/paths regardless of storage driver
 * Note: For new code, prefer using uploadAdapter.processUploadedFiles()
 */
export const mapFilesForStorage = (files) => {
  if (!files || !Array.isArray(files)) return [];

  const storageDriver = getStorageDriver();

  if (storageDriver === "supabase") {
    // For Supabase, files have URLs in the buffer/path
    return files.map((f) => f.url || f.path || "");
  }

  // For local, convert to public paths
  return mapFilesToPaths(files);
};
