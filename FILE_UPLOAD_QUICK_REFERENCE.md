# 📊 File Upload System - Quick Reference

## 🎯 System Overview

This file upload system provides **flexible storage** that can switch between **local disk** and **Supabase cloud** storage based on environment configuration.

---

## 🔧 Configuration Summary

### Environment Variables (.env)

```bash
# Storage Configuration
STORAGE_DRIVER=local          # Options: 'local' or 'supabase'

# Supabase Configuration (if using Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=uploads
```

---

## 📁 File Structure

```
backend/
├── storage/
│   ├── index.js                # Storage abstraction (routes to local/supabase)
│   ├── localStorage.js         # Local file system operations
│   ├── supabaseStorage.js      # Supabase cloud storage operations
│   └── storageTransaction.js   # Transaction support
│
├── utils/uploads/
│   ├── multerFactory.js        # Creates Multer instances
│   ├── uploadAdapter.js        # Bridges Multer ↔ Storage
│   ├── storage.utils.js        # Helper functions
│   ├── multer.camp.js          # Camp-specific Multer config
│   ├── multer.gallery.js       # Gallery-specific Multer config
│   └── ...                     # Other module configs
│
├── modules/
│   └── camps/
│       ├── campController.js   # Handles HTTP requests
│       ├── campService.js      # Business logic
│       └── campRoute.js        # Route definitions
│
└── .env                        # Environment configuration
```

---

## 🔄 Upload Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                  (Uploads files via form)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ POST /api/camps
                          │ Content-Type: multipart/form-data
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MULTER MIDDLEWARE                        │
│                                                             │
│  STORAGE_DRIVER = local    │    STORAGE_DRIVER = supabase  │
│  ─────────────────────────────────────────────────────────  │
│  • Disk Storage            │    • Memory Storage           │
│  • Saves to disk           │    • Stores in RAM buffer    │
│  • file.path available     │    • file.buffer available   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ req.files.campImages
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLER                              │
│                                                             │
│  const images = await processUploadedFiles(                │
│    req.files.campImages,                                   │
│    'camp'                                                  │
│  );                                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   UPLOAD ADAPTER                            │
│                                                             │
│  LOCAL?                           │    SUPABASE?           │
│  ───────────────────────────────────────────────────────   │
│  • Convert path to public URL     │    • Extract buffers  │
│  • Return immediately             │    • Call storage API │
│  • ["/uploads/camp/file.jpg"]     │    • Upload to cloud  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                             │
│                                                             │
│  localStorage.js          │    supabaseStorage.js          │
│  ─────────────────────────────────────────────────────────  │
│  • File system ops        │    • uploadToSupabase()       │
│  • uploadToLocal()        │    • deleteFromSupabase()     │
│  • deleteFromLocal()      │    • Batch operations         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ Array of URLs/paths
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                               │
│                                                             │
│  Camp {                                                     │
│    id: 1,                                                   │
│    name: "Mountain Paradise",                              │
│    images: [                                                │
│      "/uploads/camp/pic1.jpg"   ← LOCAL                    │
│      "https://supabase.co/..."  ← SUPABASE                 │
│    ]                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Components

### 1. Multer Factory (`multerFactory.js`)

**Purpose**: Creates configured Multer instances based on storage driver

```javascript
createMulter(moduleName, options)

Parameters:
- moduleName: "camp", "gallery", etc.
- options: {
    allowedTypes: ["image/jpeg", "image/png"],
    maxSizeBytes: 15 * 1024 * 1024,
    maxFiles: 20
  }

Returns: Configured Multer instance
```

**Behavior**:

- **Local**: Uses `diskStorage`, saves files to `uploads/{module}/`
- **Supabase**: Uses `memoryStorage`, keeps files in RAM

---

### 2. Upload Adapter (`uploadAdapter.js`)

**Purpose**: Bridges Multer file objects with storage layer

```javascript
processUploadedFiles(multerFiles, module)

Input: Array of Multer file objects
Output: Array of URLs/paths

Flow:
1. Get storage driver
2. If local: Convert file.path → public URL
3. If Supabase: Extract buffers → upload to cloud
4. Return array of URLs
```

---

### 3. Storage Index (`storage/index.js`)

**Purpose**: Central routing to appropriate storage implementation

```javascript
Exported Functions:
- uploadFile(params)           → Single file upload
- uploadFiles(files)           → Multiple files upload
- deleteFile(path)             → Single file deletion
- deleteFiles(paths)           → Multiple files deletion
- getStorageDriver()           → Returns "local" or "supabase"

Routing Logic:
if (STORAGE_DRIVER === "supabase") {
  return uploadToSupabase(...)
}
return uploadToLocal(...)
```

---

### 4. Local Storage (`localStorage.js`)

**Purpose**: Handle file system operations

```javascript
Key Functions:
- uploadToLocal(params)
  • Creates directory if needed
  • Generates unique filename
  • Writes buffer to disk
  • Returns public path: "/uploads/{module}/{file}"

- deleteFromLocal(path)
  • Converts public path to absolute path
  • Removes file from disk
  • Returns success/failure
```

---

### 5. Supabase Storage (`supabaseStorage.js`)

**Purpose**: Handle Supabase cloud storage operations

```javascript
Key Functions:
- uploadToSupabase(params)
  • Validates Supabase config
  • Generates unique file path
  • Uploads buffer to Supabase
  • Returns public URL: "https://...supabase.co/..."

- deleteFromSupabase(urlOrPath)
  • Extracts file path from URL
  • Calls Supabase delete API
  • Returns success/failure
```

---

## 📤 Upload Examples

### Example 1: Creating a Camp with Images

**Client Side** (HTML Form):

```html
<form enctype="multipart/form-data">
  <input type="text" name="name" value="Mountain Paradise" />
  <input type="file" name="campImages" multiple accept="image/*" />
  <button type="submit">Create Camp</button>
</form>
```

**Server Side** (Controller):

```javascript
// File: modules/camps/campController.js

export const createCampController = asyncHandler(async (req, res) => {
  // 1. Process uploaded files
  const campImages = req.files?.campImages
    ? await processUploadedFiles(req.files.campImages, "camp")
    : [];

  // campImages = ["/uploads/camp/file1.jpg", ...] (local)
  // OR
  // campImages = ["https://...supabase.co/.../file1.jpg", ...] (Supabase)

  // 2. Create camp with image URLs
  const newCamp = await campService.createCampSite({
    name: req.body.name,
    images: campImages,
    // ... other fields
  });

  // 3. Return response
  res.status(201).json({
    message: "Camp created successfully",
    data: newCamp,
  });
});
```

---

## 🔐 Security Features

### File Type Validation

```javascript
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // ✅ Accept
  } else {
    cb(new Error("Invalid file type"), false); // ❌ Reject
  }
};
```

### File Size Limits

```javascript
limits: {
  fileSize: 15 * 1024 * 1024,  // 15MB max per file
  files: 20,                    // 20 files max per request
}
```

### Filename Sanitization

```javascript
generateFileName = (originalname) => {
  const timestamp = Date.now();
  const base = path
    .basename(originalname, ext)
    .replace(/\\s+/g, "_") // Replace spaces
    .replace(/[^a-zA-Z0-9_-]/g, ""); // Remove special chars
  return `${base}_${timestamp}${ext}`;
};
```

---

## 🔄 Switching Storage Drivers

### From Local to Supabase

1. **Set up Supabase project**:
   - Create account at https://supabase.com
   - Create new project
   - Create storage bucket named "uploads"
   - Set bucket to public (if needed)

2. **Update .env file**:

```bash
# Change this line
STORAGE_DRIVER=supabase

# Add Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=uploads
```

3. **Restart application**:

```bash
npm run dev
```

**That's it!** No code changes needed. 🎉

---

## 🧪 Testing

### Test Local Storage

```bash
# .env
STORAGE_DRIVER=local

# Upload a file
POST /api/camps
Files: campImages = [image1.jpg]

# Expected result
{
  "data": {
    "images": ["/uploads/camp/image1_1705234567890.jpg"]
  }
}

# File location
✅ backend/uploads/camp/image1_1705234567890.jpg
```

### Test Supabase Storage

```bash
# .env
STORAGE_DRIVER=supabase
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
SUPABASE_BUCKET=uploads

# Upload a file
POST /api/camps
Files: campImages = [image1.jpg]

# Expected result
{
  "data": {
    "images": [
      "https://abc123.supabase.co/storage/v1/object/public/uploads/camp/1705234567890-image1.jpg"
    ]
  }
}

# File location
✅ Supabase Dashboard → Storage → uploads → camp → 1705234567890-image1.jpg
```

---

## ⚡ Performance Tips

### 1. Parallel Uploads

```javascript
// ❌ Slow (sequential)
for (const file of files) {
  await uploadFile(file);
}

// ✅ Fast (parallel)
const promises = files.map((file) => uploadFile(file));
await Promise.all(promises);
```

### 2. Lazy Initialization

```javascript
// Only create Supabase client when needed
let supabaseInstance = null;

const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};
```

### 3. Batch Deletions

```javascript
// Supabase supports batch deletion in one API call
const { data, error } = await supabase.storage
  .from(BUCKET_NAME)
  .remove([file1, file2, file3]); // Delete all at once
```

---

## 🐛 Common Errors

### Error: "Supabase configuration missing"

**Cause**: STORAGE_DRIVER is "supabase" but env vars not set
**Solution**: Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env

### Error: "Invalid file type: application/octet-stream"

**Cause**: File type not in allowedTypes array
**Solution**: Add the mime type to allowedTypes in multerFactory options

### Error: "ENOENT: no such file or directory"

**Cause**: Upload directory doesn't exist
**Solution**: ensureFolderExists() should create it automatically. Check permissions.

### Error: "File too large"

**Cause**: File exceeds maxSizeBytes limit
**Solution**: Increase limit or compress file before upload

---

## 📚 Quick Reference Table

| Feature                | Local Storage            | Supabase Storage                      |
| ---------------------- | ------------------------ | ------------------------------------- |
| Storage Type           | Disk                     | Cloud                                 |
| Multer Mode            | diskStorage              | memoryStorage                         |
| File Access            | file.path                | file.buffer                           |
| Output Format          | `/uploads/camp/file.jpg` | `https://...supabase.co/.../file.jpg` |
| Scalability            | Limited to server disk   | Unlimited cloud storage               |
| Cost                   | Server disk space        | Supabase pricing                      |
| Performance            | Fast (local disk)        | Network dependent                     |
| Configuration Required | None                     | SUPABASE_URL, KEY, BUCKET             |
| Backup                 | Manual                   | Automatic (Supabase)                  |

---

## 🎯 Summary

### The Magic Formula

```
Environment Variable → Multer Configuration → Upload Adapter → Storage Layer → Database
```

### Key Principles

1. **Single Responsibility**: Each layer has one job
2. **Abstraction**: Controllers don't know storage details
3. **Flexibility**: Switch storage with environment variable
4. **Scalability**: Parallel operations for performance
5. **Security**: Validation at multiple levels

---

## 📖 For Detailed Explanations

See: `FILE_UPLOAD_GUIDE.md` for comprehensive walkthrough with code examples and best practices.

---

**Happy Coding! 🚀**
