// src/core/upload/storage.utils.js
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

/**
 * Ensure folder exists - creates recursively if missing.
 * Uses fs.mkdirSync / fsPromises to avoid race conditions in cold start.
 *
 * @param {string} folderPath - relative or absolute path
 */
export const ensureFolderExists = (folderPath) => {
  const resolved = path.resolve(folderPath);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
};

/**
 * Generate a safe, unique filename using timestamp + original base name
 * Example: my_photo_1700000000000.jpg
 *
 * @param {string} originalName
 * @returns {string}
 */
export const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, ""); // strip odd chars
  return `${base || "file"}_${timestamp}${ext}`;
};

/**
 * Build module-specific upload path under the main uploads folder.
 *
 * Example: getUploadPath("gallery") -> "uploads/gallery"
 *
 * @param {string} moduleName
 * @returns {string}
 */
export const getUploadPath = (moduleName) => {
  // keep uploads directory at project root (adjust as needed)
  return path.join(process.cwd(), "uploads", moduleName);
};

/**
 * Convert absolute path -> relative path used in DB / client URLs
 * e.g. /full/path/project/uploads/gallery/file.jpg -> /uploads/gallery/file.jpg
 */
export const toPublicPath = (absolutePath) => {
  const cwd = process.cwd();
  return absolutePath.startsWith(cwd)
    ? absolutePath.slice(cwd.length).replace(/\\/g, "/")
    : absolutePath.replace(/\\/g, "/");
};
