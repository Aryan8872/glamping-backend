# 📚 Complete Guide to File Upload System: Supabase & Local Storage with Multer

## 🎯 Introduction

Welcome, students! In this comprehensive guide, you'll learn how a **flexible file upload system** works in a production-ready Node.js application. This system can seamlessly switch between **local disk storage** and **Supabase cloud storage** based on environment configuration.

Think of it like having two different filing cabinets (storage locations) for your documents, and you can choose which one to use just by changing a setting!

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Multer: The File Handler](#multer-the-file-handler)
4. [Storage Abstraction Layer](#storage-abstraction-layer)
5. [Upload Flow: Step by Step](#upload-flow-step-by-step)
6. [Complete Code Walkthrough](#complete-code-walkthrough)
7. [Best Practices](#best-practices)

---

## 🏗️ System Architecture Overview

### The Big Picture

Our file upload system consists of **4 main layers**:

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: HTTP Request (User uploads file)          │
│  (Controller receives multipart/form-data)           │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: Multer Middleware                          │
│  (Processes file based on STORAGE_DRIVER)            │
│  • Local: Saves to disk                              │
│  • Supabase: Stores in memory buffer                 │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Upload Adapter                             │
│  (Bridges Multer ↔ Storage Layer)                    │
│  • Processes Multer file objects                     │
│  • Calls appropriate storage functions               │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Layer 4: Storage Abstraction                        │
│  (Handles actual storage operations)                 │
│  • Local: File system operations                     │
│  • Supabase: Cloud storage API calls                 │
└─────────────────────────────────────────────────────┘
```

### Why This Design?

**Separation of Concerns**: Each layer has a single responsibility, making the code:

- ✅ Easier to test
- ✅ Easier to maintain
- ✅ Flexible to change storage providers
- ✅ Scalable for future requirements

---

## ⚙️ Environment Configuration

### Setting Up Your Environment

The entire storage behavior is controlled by environment variables in the `.env` file:

```bash
# .env file

# ==========================================
# STORAGE CONFIGURATION
# ==========================================

# Choose your storage driver
# Options: 'local' or 'supabase'
STORAGE_DRIVER=local

# ==========================================
# SUPABASE CONFIGURATION (Only if using Supabase)
# ==========================================

# Your Supabase project URL
SUPABASE_URL=https://your-project.supabase.co

# Your Supabase service role key (has full access)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# The bucket name where files will be stored
SUPABASE_BUCKET=uploads
```

### Understanding the Environment Variables

| Variable                    | Purpose                                    | Example Value                   |
| --------------------------- | ------------------------------------------ | ------------------------------- |
| `STORAGE_DRIVER`            | Determines which storage system to use     | `local` or `supabase`           |
| `SUPABASE_URL`              | Your Supabase project's unique URL         | `https://abcdef123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for server-side Supabase access | `eyJhbGciOiJIUzI1NiIs...`       |
| `SUPABASE_BUCKET`           | Name of the storage bucket                 | `uploads`, `images`, `media`    |

### 🔑 Key Concept: Runtime Configuration

The beauty of this system is that it reads `process.env.STORAGE_DRIVER` at **runtime**, not at build time:

```javascript
// This reads the environment variable when the app starts
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";

console.log(`📦 Storage driver initialized: ${STORAGE_DRIVER}`);
```

This means you can switch storage systems simply by:

1. Changing the `.env` file
2. Restarting your application
3. NO code changes needed! 🎉

---

## 🔧 Multer: The File Handler

### What is Multer?

**Multer** is a Node.js middleware that handles `multipart/form-data`, which is the encoding type used when uploading files through HTML forms.

Think of Multer as a **postal worker** who:

1. Receives packages (files) from the client
2. Checks if the package is valid (file type, size)
3. Decides where to put it (memory or disk)
4. Makes the file accessible to your application

### Multer Factory Pattern

We use a **factory function** to create customized Multer instances for different modules (camps, galleries, users, etc.):

```javascript
// File: utils/uploads/multerFactory.js

import multer from "multer";
import {
  ensureFolderExists,
  generateFileName,
  getUploadPath,
} from "./storage.utils.js";

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";

/**
 * Factory function to create a Multer instance
 *
 * @param {string} moduleName - Name of the module (e.g., "camp", "gallery")
 * @param {object} options - Configuration options
 * @returns {multer} Configured Multer instance
 */
export default function createMulter(moduleName, options = {}) {
  if (!moduleName) {
    throw new Error("moduleName is required for createMulter");
  }

  let storage;

  // ==========================================
  // STEP 1: Choose Storage Strategy
  // ==========================================

  if (STORAGE_DRIVER === "supabase") {
    // For Supabase: Store files in MEMORY (RAM)
    // Why? Because Supabase API needs the file buffer to upload to cloud
    console.log(
      `📦 Multer configured for Supabase (memoryStorage) - module: ${moduleName}`,
    );
    storage = multer.memoryStorage();
  } else {
    // For Local: Store files on DISK immediately
    // Why? Because we're saving directly to the server's file system
    console.log(
      `📦 Multer configured for local (diskStorage) - module: ${moduleName}`,
    );

    // Get the upload path for this module
    const uploadPath = getUploadPath(moduleName);

    // Ensure the directory exists (create if missing)
    ensureFolderExists(uploadPath);

    storage = multer.diskStorage({
      // Where to save the file
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },

      // What to name the file
      filename: (req, file, cb) => {
        if (options.preserveOriginalName) {
          const safe = file.originalname.replace(/\\s+/g, "_");
          cb(null, `${Date.now()}_${safe}`);
          return;
        }
        cb(null, generateFileName(file.originalname));
      },
    });
  }

  // ==========================================
  // STEP 2: Define File Validation
  // ==========================================

  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      const err = new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        file.fieldname,
      );
      err.message = `Invalid file type: ${file.mimetype}`;
      cb(err, false); // Reject the file
    }
  };

  // ==========================================
  // STEP 3: Create and Return Multer Instance
  // ==========================================

  return multer({
    storage,
    limits: {
      fileSize: options.maxSizeBytes || 10 * 1024 * 1024, // Default: 10MB
      files: options.maxFiles || 20, // Default: 20 files
      fieldSize: options.fieldSize || 1024 * 1024, // Default: 1MB
    },
    fileFilter,
  });
}
```

### Key Concepts Explained

#### 1. Memory Storage vs Disk Storage

**Memory Storage (Supabase)**:

```javascript
storage = multer.memoryStorage();
```

- Files are stored in RAM as **Buffer** objects
- Fast but temporary
- Perfect for uploading to cloud services
- File accessible via `file.buffer`

**Disk Storage (Local)**:

```javascript
storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Save to this folder
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname)); // Use this name
  },
});
```

- Files are written directly to the server's file system
- Permanent until manually deleted
- File accessible via `file.path`

#### 2. File Validation

The `fileFilter` function acts as a **security guard**:

```javascript
const fileFilter = (req, file, cb) => {
  // Check if the file type is allowed
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // ✅ Allow this file
  } else {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    err.message = `Invalid file type: ${file.mimetype}`;
    cb(err, false); // ❌ Reject this file
  }
};
```

**Why validate?**

- Prevent malicious file uploads (e.g., executable files)
- Ensure only supported formats are stored
- Protect server resources from huge files

#### 3. File Size Limits

```javascript
limits: {
  fileSize: 10 * 1024 * 1024,  // 10MB maximum per file
  files: 20,                    // Maximum 20 files per request
  fieldSize: 1024 * 1024,       // Maximum 1MB for text fields
}
```

These limits prevent:

- **Resource exhaustion**: Uploading 1GB files could crash your server
- **Denial of Service (DoS) attacks**: Flooding with massive uploads
- **Storage costs**: Preventing excessive cloud storage usage

### Module-Specific Multer Configuration

Each module gets its own Multer instance with custom settings:

```javascript
// File: utils/uploads/multer.camp.js

import createMulter from "./multerFactory.js";

// Create a Multer instance specifically for the "camp" module
export const uploadCamp = createMulter("camp", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 15 * 1024 * 1024, // 15MB per file (larger for camps)
  maxFiles: 20, // Up to 20 images per camp
});

// Create middleware for handling multiple file fields
export const campUploadMiddleware = uploadCamp.fields([
  { name: "campImages", maxCount: 20 },
]);
```

**What does `.fields()` do?**

It tells Multer to expect files in specific form fields:

```javascript
uploadCamp.fields([
  { name: "campImages", maxCount: 20 }, // Expect up to 20 files in "campImages" field
]);
```

When the client sends a form like this:

```html
<form enctype="multipart/form-data">
  <input type="file" name="campImages" multiple />
</form>
```

Multer processes all files and makes them available at:

```javascript
req.files.campImages; // Array of file objects
```

---

## 🗂️ Storage Abstraction Layer

### The Master Controller: storage/index.js

This file is the **brain** of our storage system. It decides which storage provider to use:

```javascript
// File: storage/index.js

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

// Read the storage driver from environment
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";

console.log(`📦 Storage driver initialized: ${STORAGE_DRIVER}`);

/**
 * Upload a single file to the configured storage
 *
 * @param {Object} params - File parameters
 * @param {Buffer} params.buffer - File buffer (binary data)
 * @param {string} params.mimetype - File MIME type (e.g., "image/jpeg")
 * @param {string} params.originalname - Original filename
 * @param {string} params.module - Module name (e.g., "camp", "gallery")
 * @returns {Promise<string>} - File URL or path
 */
export async function uploadFile({ buffer, mimetype, originalname, module }) {
  if (STORAGE_DRIVER === "supabase") {
    return uploadToSupabase({ buffer, mimetype, originalname, module });
  }
  return uploadToLocal({ buffer, mimetype, originalname, module });
}

/**
 * Upload multiple files in parallel
 *
 * @param {Array<Object>} files - Array of file objects
 * @returns {Promise<Array<string>>} - Array of file URLs/paths
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
 * Delete a single file
 *
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
 * Delete multiple files in parallel
 *
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
 * Get the currently configured storage driver
 *
 * @returns {string} - "local" or "supabase"
 */
export function getStorageDriver() {
  return STORAGE_DRIVER;
}
```

### Local Storage Implementation

```javascript
// File: storage/localStorage.js

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
 *
 * Process:
 * 1. Validate inputs
 * 2. Get upload path for the module
 * 3. Ensure directory exists
 * 4. Generate unique filename
 * 5. Write buffer to disk
 * 6. Return public path
 */
export async function uploadToLocal({
  buffer,
  mimetype,
  originalname,
  module,
}) {
  try {
    // ==========================================
    // STEP 1: Validate Required Parameters
    // ==========================================
    if (!buffer || !originalname || !module) {
      throw new Error(
        "Missing required parameters: buffer, originalname, or module"
      );
    }

    // ==========================================
    // STEP 2: Prepare Upload Directory
    // ==========================================

    // Get the full path where files should be saved
    // Example: /project/uploads/camp
    const uploadPath = getUploadPath(module);

    // Create the directory if it doesn't exist
    ensureFolderExists(uploadPath);

    // ==========================================
    // STEP 3: Generate Unique Filename
    // ==========================================

    // Example: "mountain_view_1705234567890.jpg"
    const filename = generateFileName(originalname);

    // Full path to the file
    // Example: /project/uploads/camp/mountain_view_1705234567890.jpg
    const filePath = path.join(uploadPath, filename);

    // ==========================================
    // STEP 4: Write File to Disk
    // ==========================================

    // Write the buffer (binary data) to a file
    await fs.promises.writeFile(filePath, buffer);

    // ==========================================
    // STEP 5: Return Public Path
    // ==========================================

    // This is the path that will be stored in the database
    // and used by the frontend to display the image
    // Example: /uploads/camp/mountain_view_1705234567890.jpg
    const publicPath = `/uploads/${module}/${filename}`;

    console.log(`✅ File uploaded to local storage: ${publicPath}`);
    return publicPath;
  } catch (error) {
    console.error("❌ Local upload failed:", error);
    throw new Error(`Failed to upload file to local storage: ${error.message}`);
  }
}

/**
 * Upload multiple files to local storage in parallel
 *
 * Benefits of parallel uploads:
 * - Faster overall completion time
 * - Better resource utilization
 */
export async function uploadMultipleToLocal(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    // Create an array of upload promises
    const uploadPromises = files.map((file) => uploadToLocal(file));

    // Wait for all uploads to complete
    // Promise.all() runs them in parallel
    const results = await Promise.all(uploadPromises);

    console.log(`✅ Uploaded ${results.length} files to local storage`);
    return results;
  } catch (error) {
    console.error("❌ Multiple local uploads failed:", error);
    throw error;
  }
}

/**
 * Delete a single file from local storage
 */
export async function deleteFromLocal(filePath) {
  try {
    if (!filePath) {
      console.warn("⚠️ No file path provided for deletion");
      return false;
    }

    // ==========================================
    // STEP 1: Convert Public Path to Absolute Path
    // ==========================================

    let absolutePath;

    if (filePath.startsWith("/uploads/")) {
      // Public path format: /uploads/module/filename.jpg
      const relativePath = filePath.replace(/^\\/uploads\\//, "");
      absolutePath = path.join(__dirname, "..", "uploads", relativePath);
    } else if (path.isAbsolute(filePath)) {
      absolutePath = filePath;
    } else {
      console.warn("⚠️ Invalid file path format:", filePath);
      return false;
    }

    // ==========================================
    // STEP 2: Check if File Exists
    // ==========================================

    if (!fs.existsSync(absolutePath)) {
      console.warn("⚠️ File not found for deletion:", absolutePath);
      return false;
    }

    // ==========================================
    // STEP 3: Delete the File
    // ==========================================

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
```

### Supabase Storage Implementation

```javascript
// File: storage/supabaseStorage.js

import { createClient } from "@supabase/supabase-js";

// ==========================================
// Lazy Initialization Pattern
// ==========================================
// We don't create the Supabase client until it's actually needed
// This prevents errors if Supabase credentials aren't configured

let supabaseInstance = null;

const getSupabase = () => {
  // Return existing instance if already created
  if (supabaseInstance) return supabaseInstance;

  // Read configuration from environment
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate configuration
  if (!url || !key) {
    throw new Error(
      "❌ Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  // Create and cache the client
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

const BUCKET_NAME = process.env.SUPABASE_BUCKET || "uploads";

/**
 * Upload a single file to Supabase storage
 *
 * Process:
 * 1. Validate inputs and configuration
 * 2. Generate unique file path
 * 3. Upload to Supabase
 * 4. Get public URL
 * 5. Return URL
 */
export async function uploadToSupabase({
  buffer,
  mimetype,
  originalname,
  module,
}) {
  try {
    // ==========================================
    // STEP 1: Validate Inputs
    // ==========================================
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

    // ==========================================
    // STEP 2: Generate Unique File Path
    // ==========================================

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();

    // Sanitize filename (remove special characters)
    const sanitizedName = originalname.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Create path: module/timestamp-filename.ext
    // Example: "camp/1705234567890-mountain_view.jpg"
    const fileName = `${module}/${timestamp}-${sanitizedName}`;

    // ==========================================
    // STEP 3: Upload to Supabase
    // ==========================================

    const { data, error } = await getSupabase()
      .storage
      .from(BUCKET_NAME)           // Select the bucket
      .upload(fileName, buffer, {  // Upload the file
        contentType: mimetype,     // Set the MIME type
        upsert: false,             // Don't overwrite if exists
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // ==========================================
    // STEP 4: Get Public URL
    // ==========================================

    // Get the public URL for the uploaded file
    const { data: urlData } = getSupabase()
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase");
    }

    console.log("✅ File uploaded to Supabase:", urlData.publicUrl);

    // Return the public URL
    // Example: "https://abc123.supabase.co/storage/v1/object/public/uploads/camp/1705234567890-mountain_view.jpg"
    return urlData.publicUrl;
  } catch (error) {
    console.error("❌ Supabase upload failed:", error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }
}

/**
 * Upload multiple files to Supabase in parallel
 */
export async function uploadMultipleToSupabase(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    // Upload all files in parallel for better performance
    const uploadPromises = files.map((file) => uploadToSupabase(file));
    const results = await Promise.all(uploadPromises);

    console.log(`✅ Uploaded ${results.length} files to Supabase`);
    return results;
  } catch (error) {
    console.error("❌ Multiple Supabase uploads failed:", error);
    throw error;
  }
}

/**
 * Extract file path from Supabase public URL
 *
 * Converts:
 * https://abc123.supabase.co/storage/v1/object/public/uploads/camp/file.jpg
 *
 * To:
 * camp/file.jpg
 */
function extractFilePathFromUrl(publicUrl) {
  try {
    if (!publicUrl || typeof publicUrl !== "string") {
      return null;
    }

    // Supabase URL pattern
    const urlPattern = /\\/storage\\/v1\\/object\\/public\\/[^/]+\\/(.+)$/;
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
    const { data, error } = await getSupabase()
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]); // Supabase expects an array

    if (error) {
      console.error("❌ Supabase deletion error:", error);
      return false;
    }

    console.log("✅ File deleted from Supabase:", filePath);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete file from Supabase:", error);
    return false;
  }
}

/**
 * Delete multiple files from Supabase storage
 *
 * Advantage: Supabase supports batch deletion in a single API call
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

    // Delete all files in one API call (efficient!)
    const { data, error } = await getSupabase()
      .storage
      .from(BUCKET_NAME)
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
```

---

## 🔄 Upload Flow: Step by Step

### Complete Upload Journey

Let's trace what happens when a user uploads camping images:

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT: User selects 3 images and submits form              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTP POST /api/camps
                         │ Content-Type: multipart/form-data
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  ROUTER: Applies Multer middleware                           │
│                                                               │
│  router.post('/camps',                                        │
│    campUploadMiddleware,  ◄─── Multer processes files       │
│    createCampController                                       │
│  );                                                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Multer processes based on STORAGE_DRIVER
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐
│  If LOCAL        │            │  If SUPABASE     │
│                  │            │                  │
│  • Saves to disk │            │  • Stores in RAM │
│  • file.path     │            │  • file.buffer   │
└────────┬─────────┘            └────────┬─────────┘
        │                                  │
        └────────────────┬─────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  CONTROLLER: Receives processed files                        │
│                                                               │
│  const campImages = req.files?.campImages                    │
│    ? await processUploadedFiles(                             │
│        req.files.campImages,  ◄─── Array of Multer files   │
│        'camp'                  ◄─── Module name             │
│      )                                                        │
│    : [];                                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  UPLOAD ADAPTER: processUploadedFiles()                      │
│                                                               │
│  1. Check if files exist                                     │
│  2. Get storage driver (local or supabase)                   │
│  3. Process accordingly:                                     │
│                                                               │
│     If LOCAL:                                                │
│     • Files already on disk ✓                                │
│     • Convert paths to public URLs                           │
│     • Return: ["/uploads/camp/file1.jpg", ...]               │
│                                                               │
│     If SUPABASE:                                             │
│     • Extract buffers from Multer files                      │
│     • Call uploadFiles() from storage layer                  │
│     • Return: ["https://supabase.co/.../file1.jpg", ...]     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  STORAGE LAYER: uploadFiles()                                │
│                                                               │
│  • Receives array of file objects with buffers               │
│  • Routes to uploadMultipleToSupabase() or ...ToLocal()      │
│  • Performs actual upload operation                          │
│  • Returns array of URLs/paths                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Returns: Array of URLs
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  CONTROLLER: Saves to database                               │
│                                                               │
│  const newCamp = await campService.createCampSite({          │
│    ...otherData,                                             │
│    images: campImages  ◄─── Array of URLs/paths             │
│  });                                                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  DATABASE: Stores camp with image URLs                       │
│                                                               │
│  {                                                            │
│    id: 1,                                                     │
│    name: "Mountain Paradise",                                │
│    images: [                                                  │
│      "/uploads/camp/pic1.jpg",    ◄─── OR                   │
│      "https://supabase.co/..."    ◄─── Supabase URL        │
│    ]                                                          │
│  }                                                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  RESPONSE: Sent back to client                               │
│                                                               │
│  {                                                            │
│    message: "CampSite created successfully",                │
│    data: { ...camp with images }                             │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

### Upload Adapter Code

The **bridge** between Multer and the Storage Layer:

```javascript
// File: utils/uploads/uploadAdapter.js

import { uploadFiles, getStorageDriver } from "../../storage/index.js";

/**
 * Process uploaded files from Multer and upload to configured storage
 * This adapter bridges Multer's file handling with our storage abstraction
 *
 * @param {Array<Object>} multerFiles - Files from req.files (Multer format)
 * @param {string} module - Module name (e.g., 'camp', 'gallery')
 * @returns {Promise<Array<string>>} - Array of file URLs/paths
 */
export async function processUploadedFiles(multerFiles, module) {
  // ==========================================
  // STEP 1: Validate Input
  // ==========================================
  if (!multerFiles || !Array.isArray(multerFiles) || multerFiles.length === 0) {
    return [];
  }

  // ==========================================
  // STEP 2: Get Current Storage Driver
  // ==========================================
  const storageDriver = getStorageDriver();

  try {
    // ==========================================
    // STEP 3: Handle Based on Storage Type
    // ==========================================

    if (storageDriver === "local") {
      // For local storage, files are already on disk
      // We just need to convert absolute paths to public URLs

      return multerFiles.map((file) => {
        // Multer saved file at: C:/project/uploads/camp/file.jpg
        // We need to return: /uploads/camp/file.jpg

        const publicPath = file.path
          .replace(/\\\\/g, "/")                    // Normalize Windows backslashes
          .replace(/^.*\\/uploads\\//, "/uploads/"); // Extract public path

        console.log(`✅ Local file ready: ${publicPath}`);
        return publicPath;
      });
    }

    if (storageDriver === "supabase") {
      // For Supabase, files are in memory (buffers)
      // We need to upload them to Supabase cloud storage

      const fileObjects = multerFiles.map((file) => ({
        buffer: file.buffer,           // Binary data from memory
        mimetype: file.mimetype,       // e.g., "image/jpeg"
        originalname: file.originalname, // e.g., "mountain.jpg"
        module,                        // e.g., "camp"
      }));

      console.log(`📤 Uploading ${fileObjects.length} files to Supabase...`);

      // Call storage layer to upload to Supabase
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
 * @param {Object} multerFile - Single file from req.file
 * @param {string} module - Module name
 * @returns {Promise<string|null>} - File URL/path or null
 */
export async function processSingleFile(multerFile, module) {
  if (!multerFile) {
    return null;
  }

  // Reuse the multiple files function for consistency
  const result = await processUploadedFiles([multerFile], module);
  return result[0] || null;
}
```

### Controller Usage Example

```javascript
// File: modules/camps/campController.js

import * as campService from "./campService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { processUploadedFiles } from "../../utils/uploads/uploadAdapter.js";

export const createCampController = asyncHandler(async (req, res) => {
  // ==========================================
  // STEP 1: Extract and Process Files
  // ==========================================

  // req.files.campImages is populated by Multer middleware
  // It contains an array of file objects
  const campImages = req.files?.campImages
    ? await processUploadedFiles(req.files.campImages, "camp")
    : [];

  // campImages now contains:
  // - If local: ["/uploads/camp/file1.jpg", "/uploads/camp/file2.jpg"]
  // - If Supabase: ["https://xxx.supabase.co/.../file1.jpg", ...]

  // ==========================================
  // STEP 2: Extract Other Form Data
  // ==========================================

  const body = req.validated || req.body || {};

  // Parse JSON stringified arrays from FormData
  const facilities = safeParseArray(body.facilities);
  const adventureIds = safeParseArray(body.adventureIds);
  const newFacilities = safeParseArray(body.newFacilities);

  // ==========================================
  // STEP 3: Build Payload
  // ==========================================

  const payload = {
    ...body,
    hostId: body.hostId ? Number(body.hostId) : null,
    images: campImages, // ◄─── URLs/paths from upload
    facilities,
    adventureIds,
    newFacilities,
    maxAdult: body.maxAdult ? Number(body.maxAdult) : 0,
    maxChildren: body.maxChildren ? Number(body.maxChildren) : 0,
    maxPets: body.maxPets ? Number(body.maxPets) : 0,
    isFeatured: body.isFeatured === "true" || body.isFeatured === true,
  };

  // ==========================================
  // STEP 4: Create Camp in Database
  // ==========================================

  const newCamp = await campService.createCampSite(payload);

  // ==========================================
  // STEP 5: Send Response
  // ==========================================

  res.status(201).json({
    message: "CampSite created successfully",
    data: newCamp,
  });
});
```

---

## 🎓 Best Practices

### 1. Always Validate File Types

```javascript
// ❌ BAD: Accepting any file type
const upload = multer({ storage: multer.memoryStorage() });

// ✅ GOOD: Strict validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};
```

### 2. Set Reasonable File Size Limits

```javascript
// ❌ BAD: No limit or too large
limits: {
  fileSize: Infinity, // Anyone can upload 10GB files!
}

// ✅ GOOD: Reasonable limits based on use case
limits: {
  fileSize: 15 * 1024 * 1024, // 15MB max
  files: 20,                   // 20 files max
}
```

### 3. Generate Unique Filenames

```javascript
// ❌ BAD: Using original filename
const filename = file.originalname;
// Problem: Collisions if two users upload "photo.jpg"

// ✅ GOOD: Timestamp + sanitized original name
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .replace(/\\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return `${base || "file"}_${timestamp}${ext}`;
};
```

### 4. Handle Errors Gracefully

```javascript
// ✅ GOOD: Comprehensive error handling
try {
  const campImages = await processUploadedFiles(req.files.campImages, "camp");
} catch (error) {
  console.error("❌ Upload failed:", error);

  // Clean up any partially uploaded files
  // Send user-friendly error message
  return res.status(500).json({
    message: "Failed to upload images",
    error: error.message,
  });
}
```

### 5. Use Environment Variables

```javascript
// ❌ BAD: Hardcoded configuration
const STORAGE_DRIVER = "supabase";
const SUPABASE_URL = "https://my-project.supabase.co";

// ✅ GOOD: Environment-based configuration
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";
const SUPABASE_URL = process.env.SUPABASE_URL;
```

### 6. Implement Parallel Processing

```javascript
// ❌ BAD: Sequential uploads (slow)
const urls = [];
for (const file of files) {
  const url = await uploadFile(file);
  urls.push(url);
}

// ✅ GOOD: Parallel uploads (fast)
const uploadPromises = files.map((file) => uploadFile(file));
const urls = await Promise.all(uploadPromises);
```

### 7. Clean Up Failed Uploads

```javascript
// ✅ GOOD: Transaction-like behavior
try {
  const imageUrls = await uploadFiles(files);
  const camp = await createCampInDB({ ...data, images: imageUrls });
  return camp;
} catch (error) {
  // If DB creation fails, delete the uploaded files
  await deleteFiles(imageUrls);
  throw error;
}
```

---

## 🎯 Summary

### Key Takeaways

1. **Environment-Driven Configuration**: The system chooses storage based on `STORAGE_DRIVER` env variable

2. **Multer Adapts**:
   - Uses **disk storage** for local (saves files immediately)
   - Uses **memory storage** for Supabase (keeps in RAM for API upload)

3. **Abstraction Layer**:
   - Controllers don't know which storage is used
   - Easy to switch providers without code changes

4. **Processing Flow**:

   ```
   Client → Multer → Upload Adapter → Storage Layer → Database
   ```

5. **File Handling**:
   - **Local**: Path stored (`/uploads/camp/file.jpg`)
   - **Supabase**: Full URL stored (`https://...supabase.co/.../file.jpg`)

### What You've Learned

✅ How Multer processes files based on storage configuration  
✅ The difference between memory and disk storage  
✅ How to implement a flexible storage abstraction layer  
✅ Best practices for file validation and security  
✅ How to handle local and cloud storage seamlessly  
✅ Error handling and cleanup strategies

---

## 🚀 Next Steps

1. **Experiment**: Try switching `STORAGE_DRIVER` in your `.env` file
2. **Extend**: Add support for AWS S3 or Cloudflare R2
3. **Optimize**: Implement image compression before upload
4. **Secure**: Add virus scanning for uploaded files
5. **Monitor**: Track upload success rates and performance

---

## 📚 Additional Resources

- [Multer Documentation](https://github.com/expressjs/multer)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Node.js File System API](https://nodejs.org/api/fs.html)
- [FormData and Multipart](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

**Happy Learning! 🎓**

Remember: The best way to learn is by doing. Try modifying the code, break things, fix them, and understand why they work the way they do!
