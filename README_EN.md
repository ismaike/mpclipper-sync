# MpClipper Sync

An Obsidian plugin for synchronizing Markdown documents from S3 object storage to Obsidian.

## Features

- Download Markdown documents directly from S3 object storage
- Save documents to your Obsidian vault
- Record synchronization progress locally
- Support manual and automatic synchronization
- Quick sync button in the left sidebar
- Synchronization status control to prevent multiple sync tasks from running simultaneously
- Configurable sync folder and sync interval

## Installation

1. Open Settings in Obsidian
2. Go to "Third-party plugins" tab
3. Disable "Safe mode"
4. Click the "Browse" button
5. Search for "MpClipper Sync" and install

Alternatively, you can install manually:

1. Download the latest release
2. Extract to your Obsidian vault's `.obsidian/plugins` directory
3. Enable the plugin in Obsidian

## Usage

1. Configure S3 parameters in the plugin settings:
   - Bucket name
   - Endpoint
   - Region
   - Access key and secret
   - File path prefix (optional)
2. Set up sync folder (optional)
3. Click the "Test Connection" button to test S3 connection
4. Click the "Sync" button or use the sync button in the left sidebar to start synchronization

You can choose to enable automatic synchronization and set the sync interval. The plugin automatically prevents multiple sync tasks from running simultaneously, ensuring the stability of the synchronization process.

## How It Works

### S3 Synchronization Mechanism

MpClipper Sync synchronizes documents directly from S3 object storage:

1. Retrieves new or modified documents based on the timestamp of the last synchronization
2. Downloads and saves documents in timestamp order
3. Records the timestamp of the last synchronization locally to avoid duplicate downloads

### Synchronization Status Control

The plugin implements a synchronization status control mechanism to prevent multiple sync tasks from running simultaneously. When a sync task is running, if the user tries to start another sync task, the plugin will display a "Syncing in progress, please try again later" notification.

### Notes

- S3 mode requires appropriate S3 access permissions to list and retrieve files under the specified path
- The plugin only supports synchronizing Markdown files (.md file extension)
- If you need to synchronize a large number of files, it is recommended to use a file path prefix to limit the synchronization scope

## License

MIT
