// src/core/upload/multerFactory.js
import multer from "multer";
import path from "path";
import {
  ensureFolderExists,
  generateFileName,
  getUploadPath,
  toPublicPath,
} from "./storage.utils.js";

/**
 * createMulter: factory to create a multer instance configured for a module.
 *
 * @param {string} moduleName - e.g. "gallery", "campsite"
 * @param {object} options - { allowedTypes, maxSizeBytes, fieldSize, preserveOriginalName }
 * @returns multer instance
 */
export default function createMulter(moduleName, options = {}) {
  if (!moduleName) throw new Error("moduleName is required for createMulter");

  const uploadPath = getUploadPath(moduleName);
  ensureFolderExists(uploadPath);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // destination can be dynamic based on request if needed
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // option to preserve original name (not recommended for collisions)
      if (options.preserveOriginalName) {
        const safe = file.originalname.replace(/\s+/g, "_");
        cb(null, `${Date.now()}_${safe}`);
        return;
      }
      cb(null, generateFileName(file.originalname));
    },
  });

  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
      err.message = `Invalid file type: ${file.mimetype}`;
      cb(err, false);
    }
  };

  return multer({
    storage,
    limits: {
      fileSize: options.maxSizeBytes || 10 * 1024 * 1024, // default 10MB
      files: options.maxFiles || 20,
      fieldSize: options.fieldSize || 1024 * 1024, // text field size limit
    },
    fileFilter,
  });
}
