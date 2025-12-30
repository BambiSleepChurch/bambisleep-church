/**
 * BambiSleep™ Church MCP Control Tower
 * Storage MCP Server Wrapper - File Hosting Operations
 * 
 * Integrates BRANDYFICATION file hosting with image/video management.
 * Port of bambisleep-church-storage-agent to pure ES modules.
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('storage');

/**
 * File information structure
 * @typedef {Object} FileInfo
 * @property {string} name - Filename
 * @property {string} type - File type (image/video/other)
 * @property {string} mimeType - MIME type
 * @property {string} path - Full path
 * @property {number} size - Size in bytes
 * @property {string} sizeHuman - Human-readable size
 * @property {string} created - Created timestamp
 * @property {string} modified - Modified timestamp
 */

/**
 * Folder listing structure
 * @typedef {Object} FolderListing
 * @property {string} folder - Folder name
 * @property {FileInfo[]} files - Files in folder
 */

/**
 * MIME type mappings by extension
 */
const MIME_TYPES = {
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
};

/**
 * Image extensions
 */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.avif', '.heic'];

/**
 * Video extensions
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.gif'];

/**
 * Storage client for file hosting operations
 */
class StorageClient {
  constructor(storageDir = null) {
    this.storageDir = storageDir || process.env.STORAGE_DIR || path.resolve(process.cwd(), 'data/storage');
    this.imagesDir = path.join(this.storageDir, 'IMAGES');
    this.videosDir = path.join(this.storageDir, 'VIDEOS');
    this._initialized = false;
  }

  /**
   * Ensure storage directories exist
   */
  async initialize() {
    if (this._initialized) return;

    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await fs.mkdir(this.imagesDir, { recursive: true });
      await fs.mkdir(this.videosDir, { recursive: true });
      this._initialized = true;
      logger.info(`Storage initialized: ${this.storageDir}`);
    } catch (err) {
      logger.error('Failed to initialize storage directories:', err.message);
      throw err;
    }
  }

  /**
   * Get human-readable file size
   */
  humanFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Determine file type from extension
   */
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    return 'other';
  }

  /**
   * Get MIME type from extension
   */
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  /**
   * Get file info for a specific file
   * @param {string} filename
   * @param {string} folder - 'IMAGES', 'VIDEOS', or 'root'
   * @returns {Promise<FileInfo>}
   */
  async getFileInfo(filename, folder = 'root') {
    await this.initialize();

    let filePath;
    switch (folder) {
      case 'IMAGES':
        filePath = path.join(this.imagesDir, filename);
        break;
      case 'VIDEOS':
        filePath = path.join(this.videosDir, filename);
        break;
      default:
        filePath = path.join(this.storageDir, filename);
    }

    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }

    const stats = await fs.stat(filePath);
    const ext = path.extname(filename).toLowerCase();

    return {
      name: filename,
      type: this.getFileType(filename),
      mimeType: this.getMimeType(filename),
      path: filePath,
      size: stats.size,
      sizeHuman: this.humanFileSize(stats.size),
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
    };
  }

  /**
   * List files in a folder
   * @param {string} folder - 'IMAGES', 'VIDEOS', 'root', or 'all'
   * @returns {Promise<FolderListing[]>}
   */
  async listFiles(folder = 'all') {
    await this.initialize();

    const results = [];

    const listDir = async (dirPath, folderName) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
          if (entry.isFile()) {
            const filePath = path.join(dirPath, entry.name);
            const stats = await fs.stat(filePath);
            files.push({
              name: entry.name,
              type: this.getFileType(entry.name),
              mimeType: this.getMimeType(entry.name),
              size: stats.size,
              sizeHuman: this.humanFileSize(stats.size),
              modified: stats.mtime.toISOString(),
            });
          }
        }

        return { folder: folderName, files };
      } catch (err) {
        logger.warn(`Failed to list ${folderName}:`, err.message);
        return { folder: folderName, files: [] };
      }
    };

    switch (folder) {
      case 'IMAGES':
        results.push(await listDir(this.imagesDir, 'IMAGES'));
        break;
      case 'VIDEOS':
        results.push(await listDir(this.videosDir, 'VIDEOS'));
        break;
      case 'root':
        results.push(await listDir(this.storageDir, 'root'));
        break;
      case 'all':
      default:
        results.push(await listDir(this.imagesDir, 'IMAGES'));
        results.push(await listDir(this.videosDir, 'VIDEOS'));
        results.push(await listDir(this.storageDir, 'root'));
        break;
    }

    logger.info(`Listed ${folder} folders`);
    return results;
  }

  /**
   * List images only
   * @returns {Promise<{folder: string, images: FileInfo[]}>}
   */
  async listImages() {
    const results = await this.listFiles('IMAGES');
    const folder = results[0];
    return {
      folder: 'IMAGES',
      images: folder.files.filter(f => f.type === 'image'),
    };
  }

  /**
   * List videos only
   * @returns {Promise<{folder: string, videos: FileInfo[]}>}
   */
  async listVideos() {
    const results = await this.listFiles('VIDEOS');
    const folder = results[0];
    return {
      folder: 'VIDEOS',
      videos: folder.files.filter(f => f.type === 'video'),
    };
  }

  /**
   * Upload a file
   * @param {string} filename
   * @param {string} content - Base64 encoded content
   * @param {string} encoding - 'base64' or 'utf8'
   * @returns {Promise<{success: boolean, path: string}>}
   */
  async uploadFile(filename, content, encoding = 'base64') {
    await this.initialize();

    const fileType = this.getFileType(filename);
    let destDir;

    switch (fileType) {
      case 'image':
        destDir = this.imagesDir;
        break;
      case 'video':
        destDir = this.videosDir;
        break;
      default:
        destDir = this.storageDir;
    }

    const destPath = path.join(destDir, filename);
    
    // Prevent path traversal
    if (!destPath.startsWith(this.storageDir)) {
      throw new Error('Invalid filename: path traversal detected');
    }

    const buffer = encoding === 'base64' 
      ? Buffer.from(content, 'base64')
      : Buffer.from(content, 'utf8');

    await fs.writeFile(destPath, buffer);
    logger.info(`Uploaded: ${filename} to ${fileType === 'image' ? 'IMAGES' : fileType === 'video' ? 'VIDEOS' : 'root'}`);

    return {
      success: true,
      path: destPath,
      type: fileType,
      size: buffer.length,
      sizeHuman: this.humanFileSize(buffer.length),
    };
  }

  /**
   * Upload image specifically
   * @param {string} filename
   * @param {string} content - Base64 encoded content
   * @returns {Promise<{success: boolean, path: string}>}
   */
  async uploadImage(filename, content) {
    await this.initialize();
    
    const destPath = path.join(this.imagesDir, filename);
    
    if (!destPath.startsWith(this.storageDir)) {
      throw new Error('Invalid filename: path traversal detected');
    }

    const buffer = Buffer.from(content, 'base64');
    await fs.writeFile(destPath, buffer);
    logger.info(`Uploaded image: ${filename}`);

    return {
      success: true,
      path: destPath,
      type: 'image',
      size: buffer.length,
      sizeHuman: this.humanFileSize(buffer.length),
    };
  }

  /**
   * Upload video specifically
   * @param {string} filename
   * @param {string} content - Base64 encoded content
   * @returns {Promise<{success: boolean, path: string}>}
   */
  async uploadVideo(filename, content) {
    await this.initialize();
    
    const destPath = path.join(this.videosDir, filename);
    
    if (!destPath.startsWith(this.storageDir)) {
      throw new Error('Invalid filename: path traversal detected');
    }

    const buffer = Buffer.from(content, 'base64');
    await fs.writeFile(destPath, buffer);
    logger.info(`Uploaded video: ${filename}`);

    return {
      success: true,
      path: destPath,
      type: 'video',
      size: buffer.length,
      sizeHuman: this.humanFileSize(buffer.length),
    };
  }

  /**
   * Download a file
   * @param {string} filename
   * @param {string} folder - 'IMAGES', 'VIDEOS', or 'root'
   * @param {string} encoding - 'base64' or 'utf8'
   * @returns {Promise<string>} - File content
   */
  async downloadFile(filename, folder = 'root', encoding = 'base64') {
    await this.initialize();

    let filePath;
    switch (folder) {
      case 'IMAGES':
        filePath = path.join(this.imagesDir, filename);
        break;
      case 'VIDEOS':
        filePath = path.join(this.videosDir, filename);
        break;
      default:
        filePath = path.join(this.storageDir, filename);
    }

    // Prevent path traversal
    if (!filePath.startsWith(this.storageDir)) {
      throw new Error('Invalid filename: path traversal detected');
    }

    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }

    const buffer = await fs.readFile(filePath);
    logger.info(`Downloaded: ${filename} from ${folder}`);

    return buffer.toString(encoding);
  }

  /**
   * Delete a file
   * @param {string} filename
   * @param {string} folder - 'IMAGES', 'VIDEOS', or 'root'
   * @returns {Promise<{success: boolean}>}
   */
  async deleteFile(filename, folder = 'root') {
    await this.initialize();

    let filePath;
    switch (folder) {
      case 'IMAGES':
        filePath = path.join(this.imagesDir, filename);
        break;
      case 'VIDEOS':
        filePath = path.join(this.videosDir, filename);
        break;
      default:
        filePath = path.join(this.storageDir, filename);
    }

    // Prevent path traversal
    if (!filePath.startsWith(this.storageDir)) {
      throw new Error('Invalid filename: path traversal detected');
    }

    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }

    await fs.unlink(filePath);
    logger.info(`Deleted: ${filename} from ${folder}`);

    return { success: true };
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    await this.initialize();

    const listings = await this.listFiles('all');
    
    let totalFiles = 0;
    let totalSize = 0;
    let imageCount = 0;
    let videoCount = 0;

    for (const listing of listings) {
      for (const file of listing.files) {
        totalFiles++;
        totalSize += file.size;
        if (file.type === 'image') imageCount++;
        if (file.type === 'video') videoCount++;
      }
    }

    return {
      storageDir: this.storageDir,
      totalFiles,
      totalSize,
      totalSizeHuman: this.humanFileSize(totalSize),
      images: imageCount,
      videos: videoCount,
      other: totalFiles - imageCount - videoCount,
    };
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  isConnected() {
    return this._initialized;
  }
}

// Singleton instance
const storageClient = new StorageClient();

/**
 * Storage handlers for REST API routes
 */
export const storageHandlers = {
  /**
   * Get storage status
   */
  getStatus() {
    return { connected: storageClient.isConnected() };
  },

  /**
   * Initialize storage
   */
  async connect() {
    await storageClient.initialize();
    return { success: true, storageDir: storageClient.storageDir };
  },

  /**
   * List files
   */
  async listFiles(folder = 'all') {
    return storageClient.listFiles(folder);
  },

  /**
   * List images
   */
  async listImages() {
    return storageClient.listImages();
  },

  /**
   * List videos
   */
  async listVideos() {
    return storageClient.listVideos();
  },

  /**
   * Get file info
   */
  async getFileInfo(filename, folder = 'root') {
    return storageClient.getFileInfo(filename, folder);
  },

  /**
   * Upload file
   */
  async uploadFile(filename, content, encoding = 'base64') {
    return storageClient.uploadFile(filename, content, encoding);
  },

  /**
   * Upload image
   */
  async uploadImage(filename, content) {
    return storageClient.uploadImage(filename, content);
  },

  /**
   * Upload video
   */
  async uploadVideo(filename, content) {
    return storageClient.uploadVideo(filename, content);
  },

  /**
   * Download file
   */
  async downloadFile(filename, folder = 'root', encoding = 'base64') {
    return storageClient.downloadFile(filename, folder, encoding);
  },

  /**
   * Delete file
   */
  async deleteFile(filename, folder = 'root') {
    return storageClient.deleteFile(filename, folder);
  },

  /**
   * Get storage statistics
   */
  async getStats() {
    return storageClient.getStats();
  },
};

export { StorageClient };
export default storageClient;
