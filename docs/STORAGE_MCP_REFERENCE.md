# Storage MCP Reference

## Overview

The Storage MCP server provides file hosting capabilities for the BambiSleep™ Church MCP Control Tower. It manages image and video files with automatic categorization, path traversal protection, and comprehensive file operations.

**Ported from**: [bambisleep-church-storage-agent](https://github.com/BambiSleepChurch/bambisleep-church-storage-agent)

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   REST API          │────▶│   Storage Handlers  │
│   (Port 8080)       │◀────│   (storage.js)      │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                                       │ File System
                                       │ Operations
                                       ▼
                            ┌─────────────────────┐
                            │   data/storage/     │
                            │   ├── IMAGES/       │
                            │   └── VIDEOS/       │
                            └─────────────────────┘
```

## Storage Directory Structure

```
data/storage/
├── IMAGES/          # Image files (.png, .jpg, .gif, .webp, etc.)
├── VIDEOS/          # Video files (.mp4, .webm, .mov, .avi, etc.)
└── [root files]     # Other files
```

## Supported File Types

### Images

| Extension | MIME Type       |
| --------- | --------------- |
| `.png`    | `image/png`     |
| `.jpg`    | `image/jpeg`    |
| `.jpeg`   | `image/jpeg`    |
| `.gif`    | `image/gif`     |
| `.bmp`    | `image/bmp`     |
| `.webp`   | `image/webp`    |
| `.svg`    | `image/svg+xml` |
| `.ico`    | `image/x-icon`  |
| `.tiff`   | `image/tiff`    |
| `.avif`   | `image/avif`    |
| `.heic`   | `image/heic`    |

### Videos

| Extension | MIME Type           |
| --------- | ------------------- |
| `.mp4`    | `video/mp4`         |
| `.webm`   | `video/webm`        |
| `.mov`    | `video/quicktime`   |
| `.avi`    | `video/x-msvideo`   |
| `.mkv`    | `video/x-matroska`  |
| `.gif`    | `image/gif` (video) |

## REST API Endpoints

### Status & Connection

#### GET `/api/storage/status`

Check storage initialization status.

**Response:**

```json
{
  "connected": true
}
```

#### POST `/api/storage/connect`

Initialize storage directories.

**Response:**

```json
{
  "success": true,
  "storageDir": "/path/to/data/storage"
}
```

### File Listing

#### GET `/api/storage/files`

List files, optionally filtered by folder.

**Query Parameters:**

- `folder` - `all` (default), `IMAGES`, `VIDEOS`, or `root`

**Response:**

```json
[
  {
    "folder": "IMAGES",
    "files": [
      {
        "name": "photo.png",
        "type": "image",
        "mimeType": "image/png",
        "size": 102400,
        "sizeHuman": "100.0 KB",
        "modified": "2025-12-31T00:00:00.000Z"
      }
    ]
  },
  {
    "folder": "VIDEOS",
    "files": []
  },
  {
    "folder": "root",
    "files": []
  }
]
```

#### GET `/api/storage/images`

List only images.

**Response:**

```json
{
  "folder": "IMAGES",
  "images": [
    {
      "name": "photo.png",
      "type": "image",
      "mimeType": "image/png",
      "size": 102400,
      "sizeHuman": "100.0 KB",
      "modified": "2025-12-31T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/storage/videos`

List only videos.

**Response:**

```json
{
  "folder": "VIDEOS",
  "videos": [
    {
      "name": "clip.mp4",
      "type": "video",
      "mimeType": "video/mp4",
      "size": 10485760,
      "sizeHuman": "10.0 MB",
      "modified": "2025-12-31T00:00:00.000Z"
    }
  ]
}
```

### File Operations

#### POST `/api/storage/upload`

Upload a file. Files are automatically routed to IMAGES or VIDEOS folders based on extension.

**Request Body:**

```json
{
  "filename": "photo.png",
  "content": "base64-encoded-content",
  "type": "image",
  "encoding": "base64"
}
```

- `type` - Optional: `image`, `video`, or omit for auto-detection
- `encoding` - Optional: `base64` (default) or `utf8`

**Response:**

```json
{
  "success": true,
  "path": "/path/to/data/storage/IMAGES/photo.png",
  "type": "image",
  "size": 102400,
  "sizeHuman": "100.0 KB"
}
```

#### GET `/api/storage/file/:folder/:filename`

Download a file.

**URL Parameters:**

- `folder` - `IMAGES`, `VIDEOS`, or `root`
- `filename` - URL-encoded filename

**Query Parameters:**

- `encoding` - `base64` (default) or `utf8`

**Response:**

```json
{
  "filename": "photo.png",
  "folder": "IMAGES",
  "content": "base64-encoded-content",
  "encoding": "base64"
}
```

#### GET `/api/storage/info/:folder/:filename`

Get file metadata.

**Response:**

```json
{
  "name": "photo.png",
  "type": "image",
  "mimeType": "image/png",
  "path": "/path/to/data/storage/IMAGES/photo.png",
  "size": 102400,
  "sizeHuman": "100.0 KB",
  "created": "2025-12-31T00:00:00.000Z",
  "modified": "2025-12-31T00:00:00.000Z"
}
```

#### DELETE `/api/storage/file/:folder/:filename`

Delete a file.

**Response:**

```json
{
  "success": true
}
```

### Statistics

#### GET `/api/storage/stats`

Get storage statistics.

**Response:**

```json
{
  "storageDir": "/path/to/data/storage",
  "totalFiles": 42,
  "totalSize": 1073741824,
  "totalSizeHuman": "1.0 GB",
  "images": 35,
  "videos": 5,
  "other": 2
}
```

## Handler Methods

The `storageHandlers` object exposes these methods for programmatic access:

```javascript
import { storageHandlers } from "../servers/storage.js";

// Status
storageHandlers.getStatus(); // { connected: boolean }

// Connection
await storageHandlers.connect(); // Initialize storage

// Listing
await storageHandlers.listFiles("all"); // List all folders
await storageHandlers.listImages(); // List images only
await storageHandlers.listVideos(); // List videos only

// File Operations
await storageHandlers.uploadFile(filename, content, encoding);
await storageHandlers.uploadImage(filename, content);
await storageHandlers.uploadVideo(filename, content);
await storageHandlers.downloadFile(filename, folder, encoding);
await storageHandlers.deleteFile(filename, folder);

// Metadata
await storageHandlers.getFileInfo(filename, folder);
await storageHandlers.getStats();
```

## Security

### Path Traversal Protection

All file operations validate paths to prevent directory traversal attacks:

```javascript
// These will throw errors:
await storageHandlers.uploadFile("../../../etc/passwd", content);
await storageHandlers.downloadFile("../../../etc/passwd", "root");
```

### Content Validation

- Files are stored as binary buffers
- Base64 encoding is used by default for safe transport
- No executable file handling

## Environment Variables

| Variable      | Default          | Description       |
| ------------- | ---------------- | ----------------- |
| `STORAGE_DIR` | `./data/storage` | Storage root path |

## Error Handling

All endpoints return JSON errors:

```json
{
  "error": "File not found: photo.png"
}
```

Common error codes:

- `404` - File not found
- `500` - Server error (path traversal, disk full, etc.)

## Usage Examples

### Upload an Image

```bash
# Encode image to base64
BASE64=$(base64 -w 0 photo.png)

# Upload via API
curl -X POST http://localhost:8080/api/storage/upload \
  -H "Content-Type: application/json" \
  -d "{\"filename\": \"photo.png\", \"content\": \"$BASE64\", \"type\": \"image\"}"
```

### Download an Image

```bash
# Get base64 content
curl http://localhost:8080/api/storage/file/IMAGES/photo.png | jq -r '.content' | base64 -d > photo.png
```

### List All Files

```bash
curl http://localhost:8080/api/storage/files?folder=all
```

### Delete a File

```bash
curl -X DELETE http://localhost:8080/api/storage/file/IMAGES/photo.png
```

## Migration from bambisleep-church-storage-agent

The original TypeScript implementation has been converted to pure ES modules JavaScript:

| Original (TypeScript)      | Control Tower (JavaScript)         |
| -------------------------- | ---------------------------------- |
| `src/agent.ts`             | `src/servers/storage.js`           |
| `src/mcp-client.ts`        | Integrated into handlers           |
| Express + WebSocket server | Vanilla Node.js HTTP               |
| Port 3000 (combined)       | Port 8080 (API) + 3000 (Dashboard) |
| MCP stdio transport        | Direct filesystem operations       |

### Key Differences

1. **No external MCP server** - Operations are performed directly on the filesystem
2. **REST-only API** - WebSocket real-time updates handled by main Control Tower
3. **Unified configuration** - Uses `.vscode/settings.json` via config loader
4. **Integrated testing** - 31 tests with Node.js built-in test runner
