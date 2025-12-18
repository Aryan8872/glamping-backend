import {
  processSingleFile,
  processUploadedFiles,
  extractFilesFromMulter,
} from "./utils/uploads/uploadAdapter.js";
import { getStorageDriver } from "./storage/index.js";
import fs from "fs";
import path from "path";

async function verifyStorageSetup() {
  console.log("🔍 Verifying Storage Setup...");

  // 1. Check Driver
  const driver = getStorageDriver();
  console.log(`✅ Current Storage Driver: ${driver}`);

  // 2. Test mapFilesForStorage / processUploadedFiles logic for LOCAL driver
  // Mock Multer file
  const mockFile = {
    fieldname: "coverImage",
    originalname: "test-image.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    destination: "C:\\Users\\User\\Desktop\\backend\\uploads\\camp",
    filename: "1731234567890-test-image.jpg",
    path: "C:\\Users\\User\\Desktop\\backend\\uploads\\camp\\1731234567890-test-image.jpg",
    size: 1024,
  };

  // NOTE: In local driver, processUploadedFiles expects the file to already exist if it checks,
  // but the current logic for local just converts string paths.

  console.log("🧪 Testing processSingleFile (Simulating Local Upload)...");

  try {
    const result = await processSingleFile(mockFile, "camp");
    console.log(`   Input Path: ${mockFile.path}`);
    console.log(`   Output URL: ${result}`);

    if (result === "/uploads/camp/1731234567890-test-image.jpg") {
      console.log("✅ processSingleFile returned correct public path format");
    } else {
      console.error("❌ processSingleFile returned unexpected format");
    }
  } catch (error) {
    console.error("❌ processSingleFile failed:", error);
  }

  // 3. Test Extract Files
  console.log("🧪 Testing extractFilesFromMulter...");
  const mockReqFiles = {
    campImages: [mockFile, mockFile],
    document: [mockFile],
  };

  const extracted = extractFilesFromMulter(mockReqFiles, "campImages");
  if (extracted.length === 2) {
    console.log("✅ extractFilesFromMulter extracted correct number of files");
  } else {
    console.error(
      `❌ extractFilesFromMulter failed. Expected 2, got ${extracted.length}`
    );
  }

  console.log("🏁 Verification Complete");
}

verifyStorageSetup().catch(console.error);
