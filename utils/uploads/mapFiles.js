import path from "path";
import { toPublicPath } from "./storage.utils.js";

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


export const mapFilesToPaths = (files) => {
  if (!files || !Array.isArray(files)) return [];
  return files.map((f) => {
    const publicPath = toPublicPath(path.resolve(f.path));
    return publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  });
};