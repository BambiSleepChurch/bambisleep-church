/**
 * BambiSleep™ Church MCP Control Tower
 * Storage Server Unit Tests
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import path from 'path';
import { StorageClient, storageHandlers } from '../../src/servers/storage.js';

// Use a test-specific storage directory
const TEST_STORAGE_DIR = path.resolve(process.cwd(), 'tests/.test-storage');

describe('Storage Module', () => {
  let client;

  before(async () => {
    // Clean up any existing test directory
    if (existsSync(TEST_STORAGE_DIR)) {
      await fs.rm(TEST_STORAGE_DIR, { recursive: true });
    }
    client = new StorageClient(TEST_STORAGE_DIR);
  });

  after(async () => {
    // Clean up test directory
    if (existsSync(TEST_STORAGE_DIR)) {
      await fs.rm(TEST_STORAGE_DIR, { recursive: true });
    }
  });

  describe('StorageClient', () => {
    describe('initialize()', () => {
      it('should create storage directories', async () => {
        await client.initialize();
        
        assert.ok(existsSync(TEST_STORAGE_DIR), 'Storage dir should exist');
        assert.ok(existsSync(path.join(TEST_STORAGE_DIR, 'IMAGES')), 'IMAGES dir should exist');
        assert.ok(existsSync(path.join(TEST_STORAGE_DIR, 'VIDEOS')), 'VIDEOS dir should exist');
      });

      it('should set initialized flag', async () => {
        await client.initialize();
        assert.strictEqual(client.isConnected(), true);
      });

      it('should be idempotent', async () => {
        await client.initialize();
        await client.initialize();
        assert.strictEqual(client.isConnected(), true);
      });
    });

    describe('humanFileSize()', () => {
      it('should format bytes correctly', () => {
        assert.strictEqual(client.humanFileSize(0), '0.0 B');
        assert.strictEqual(client.humanFileSize(500), '500.0 B');
        assert.strictEqual(client.humanFileSize(1024), '1.0 KB');
        assert.strictEqual(client.humanFileSize(1536), '1.5 KB');
        assert.strictEqual(client.humanFileSize(1048576), '1.0 MB');
        assert.strictEqual(client.humanFileSize(1073741824), '1.0 GB');
      });
    });

    describe('getFileType()', () => {
      it('should identify images', () => {
        assert.strictEqual(client.getFileType('test.png'), 'image');
        assert.strictEqual(client.getFileType('test.jpg'), 'image');
        assert.strictEqual(client.getFileType('test.JPEG'), 'image');
        assert.strictEqual(client.getFileType('test.webp'), 'image');
        assert.strictEqual(client.getFileType('test.svg'), 'image');
      });

      it('should identify videos', () => {
        assert.strictEqual(client.getFileType('test.mp4'), 'video');
        assert.strictEqual(client.getFileType('test.webm'), 'video');
        assert.strictEqual(client.getFileType('test.mov'), 'video');
        assert.strictEqual(client.getFileType('test.avi'), 'video');
      });

      it('should return other for unknown types', () => {
        assert.strictEqual(client.getFileType('test.txt'), 'other');
        assert.strictEqual(client.getFileType('test.pdf'), 'other');
        assert.strictEqual(client.getFileType('test'), 'other');
      });
    });

    describe('getMimeType()', () => {
      it('should return correct MIME types for images', () => {
        assert.strictEqual(client.getMimeType('test.png'), 'image/png');
        assert.strictEqual(client.getMimeType('test.jpg'), 'image/jpeg');
        assert.strictEqual(client.getMimeType('test.gif'), 'image/gif');
        assert.strictEqual(client.getMimeType('test.svg'), 'image/svg+xml');
      });

      it('should return correct MIME types for videos', () => {
        assert.strictEqual(client.getMimeType('test.mp4'), 'video/mp4');
        assert.strictEqual(client.getMimeType('test.webm'), 'video/webm');
        assert.strictEqual(client.getMimeType('test.mov'), 'video/quicktime');
      });

      it('should return octet-stream for unknown types', () => {
        assert.strictEqual(client.getMimeType('test.xyz'), 'application/octet-stream');
        assert.strictEqual(client.getMimeType('test'), 'application/octet-stream');
      });
    });

    describe('uploadFile()', () => {
      it('should upload image to IMAGES folder', async () => {
        await client.initialize();
        
        const content = Buffer.from('fake image content').toString('base64');
        const result = await client.uploadFile('test-upload.png', content, 'base64');
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.type, 'image');
        assert.ok(result.path.includes('IMAGES'));
      });

      it('should upload video to VIDEOS folder', async () => {
        await client.initialize();
        
        const content = Buffer.from('fake video content').toString('base64');
        const result = await client.uploadFile('test-upload.mp4', content, 'base64');
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.type, 'video');
        assert.ok(result.path.includes('VIDEOS'));
      });

      it('should upload other files to root folder', async () => {
        await client.initialize();
        
        const content = Buffer.from('fake text content').toString('base64');
        const result = await client.uploadFile('test-upload.txt', content, 'base64');
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.type, 'other');
      });

      it('should prevent path traversal', async () => {
        await client.initialize();
        
        const content = Buffer.from('malicious').toString('base64');
        
        await assert.rejects(
          async () => client.uploadFile('../../../etc/passwd', content),
          /path traversal/i
        );
      });
    });

    describe('listFiles()', () => {
      it('should list all folders', async () => {
        await client.initialize();
        
        const result = await client.listFiles('all');
        
        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 3);
        
        const folders = result.map(r => r.folder);
        assert.ok(folders.includes('IMAGES'));
        assert.ok(folders.includes('VIDEOS'));
        assert.ok(folders.includes('root'));
      });

      it('should list images folder only', async () => {
        await client.initialize();
        
        const result = await client.listFiles('IMAGES');
        
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].folder, 'IMAGES');
      });

      it('should list videos folder only', async () => {
        await client.initialize();
        
        const result = await client.listFiles('VIDEOS');
        
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].folder, 'VIDEOS');
      });
    });

    describe('downloadFile()', () => {
      it('should download uploaded file', async () => {
        await client.initialize();
        
        const originalContent = 'test file content for download';
        const base64Content = Buffer.from(originalContent).toString('base64');
        await client.uploadFile('download-test.txt', base64Content, 'base64');
        
        const downloaded = await client.downloadFile('download-test.txt', 'root', 'base64');
        const decoded = Buffer.from(downloaded, 'base64').toString('utf8');
        
        assert.strictEqual(decoded, originalContent);
      });

      it('should throw for non-existent file', async () => {
        await client.initialize();
        
        await assert.rejects(
          async () => client.downloadFile('non-existent.txt', 'root'),
          /not found/i
        );
      });

      it('should prevent path traversal', async () => {
        await client.initialize();
        
        await assert.rejects(
          async () => client.downloadFile('../../../etc/passwd', 'root'),
          /path traversal|not found/i
        );
      });
    });

    describe('getFileInfo()', () => {
      it('should return file info', async () => {
        await client.initialize();
        
        const content = Buffer.from('info test content').toString('base64');
        await client.uploadFile('info-test.png', content, 'base64');
        
        const info = await client.getFileInfo('info-test.png', 'IMAGES');
        
        assert.strictEqual(info.name, 'info-test.png');
        assert.strictEqual(info.type, 'image');
        assert.strictEqual(info.mimeType, 'image/png');
        assert.ok(info.size > 0);
        assert.ok(info.sizeHuman);
        assert.ok(info.created);
        assert.ok(info.modified);
      });

      it('should throw for non-existent file', async () => {
        await client.initialize();
        
        await assert.rejects(
          async () => client.getFileInfo('non-existent.txt', 'root'),
          /not found/i
        );
      });
    });

    describe('deleteFile()', () => {
      it('should delete existing file', async () => {
        await client.initialize();
        
        const content = Buffer.from('delete test').toString('base64');
        await client.uploadFile('delete-test.txt', content, 'base64');
        
        // Verify file exists
        const listBefore = await client.listFiles('root');
        const filesBefore = listBefore[0].files.map(f => f.name);
        assert.ok(filesBefore.includes('delete-test.txt'));
        
        // Delete
        const result = await client.deleteFile('delete-test.txt', 'root');
        assert.strictEqual(result.success, true);
        
        // Verify file deleted
        const listAfter = await client.listFiles('root');
        const filesAfter = listAfter[0].files.map(f => f.name);
        assert.ok(!filesAfter.includes('delete-test.txt'));
      });

      it('should throw for non-existent file', async () => {
        await client.initialize();
        
        await assert.rejects(
          async () => client.deleteFile('non-existent.txt', 'root'),
          /not found/i
        );
      });
    });

    describe('uploadImage()', () => {
      it('should upload to IMAGES folder', async () => {
        await client.initialize();
        
        const content = Buffer.from('image data').toString('base64');
        const result = await client.uploadImage('specific-image.png', content);
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.type, 'image');
        assert.ok(result.path.includes('IMAGES'));
      });
    });

    describe('uploadVideo()', () => {
      it('should upload to VIDEOS folder', async () => {
        await client.initialize();
        
        const content = Buffer.from('video data').toString('base64');
        const result = await client.uploadVideo('specific-video.mp4', content);
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.type, 'video');
        assert.ok(result.path.includes('VIDEOS'));
      });
    });

    describe('listImages()', () => {
      it('should list only images', async () => {
        await client.initialize();
        
        const result = await client.listImages();
        
        assert.strictEqual(result.folder, 'IMAGES');
        assert.ok(Array.isArray(result.images));
        
        for (const img of result.images) {
          assert.strictEqual(img.type, 'image');
        }
      });
    });

    describe('listVideos()', () => {
      it('should list only videos', async () => {
        await client.initialize();
        
        const result = await client.listVideos();
        
        assert.strictEqual(result.folder, 'VIDEOS');
        assert.ok(Array.isArray(result.videos));
        
        for (const vid of result.videos) {
          assert.strictEqual(vid.type, 'video');
        }
      });
    });

    describe('getStats()', () => {
      it('should return storage statistics', async () => {
        await client.initialize();
        
        const stats = await client.getStats();
        
        assert.ok(stats.storageDir);
        assert.ok(typeof stats.totalFiles === 'number');
        assert.ok(typeof stats.totalSize === 'number');
        assert.ok(stats.totalSizeHuman);
        assert.ok(typeof stats.images === 'number');
        assert.ok(typeof stats.videos === 'number');
        assert.ok(typeof stats.other === 'number');
      });
    });
  });

  describe('storageHandlers', () => {
    it('should expose all required handler methods', () => {
      assert.ok(typeof storageHandlers.getStatus === 'function');
      assert.ok(typeof storageHandlers.connect === 'function');
      assert.ok(typeof storageHandlers.listFiles === 'function');
      assert.ok(typeof storageHandlers.listImages === 'function');
      assert.ok(typeof storageHandlers.listVideos === 'function');
      assert.ok(typeof storageHandlers.getFileInfo === 'function');
      assert.ok(typeof storageHandlers.uploadFile === 'function');
      assert.ok(typeof storageHandlers.uploadImage === 'function');
      assert.ok(typeof storageHandlers.uploadVideo === 'function');
      assert.ok(typeof storageHandlers.downloadFile === 'function');
      assert.ok(typeof storageHandlers.deleteFile === 'function');
      assert.ok(typeof storageHandlers.getStats === 'function');
    });

    it('should return status', () => {
      const status = storageHandlers.getStatus();
      assert.ok(typeof status.connected === 'boolean');
    });
  });
});
