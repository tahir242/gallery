# Gallery User Manual

Welcome to the Gallery User Manual! This guide will help you understand how to use all the features of Gallery, a lightning-fast, premium desktop media gallery.

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Using Desktop Installers](#using-desktop-installers)
   - [Running from Source (Git or Zip)](#running-from-source-git-or-zip)
3. [Features & Capabilities](#features--capabilities)
   - [Adding & Indexing Directories](#adding--indexing-directories)
   - [Viewing Media](#viewing-media)
   - [Favorites, Search & Filtering](#favorites-search--filtering)
   - [Folder Tree Navigation](#folder-tree-navigation)
4. [Advanced Functionality](#advanced-functionality)
5. [Troubleshooting](#troubleshooting)

---

## Introduction

Gallery is an intelligent, portable media desktop application that lets you seamlessly index and browse local and network directories. It brings your photos, videos, audio, and documents to life with an attractive, responsive design and powerful native desktop capabilities.

---

## Getting Started

You can run Gallery either by installing the pre-built desktop application or by running it directly from the source code.

### Using Desktop Installers
Gallery provides standalone `.exe`, `.dmg`, and `.AppImage` wrappers for Windows, macOS, and Linux, respectively.
1. Download the latest installer for your operating system from the **Releases** page.
2. Run the installer and follow the on-screen instructions.
3. Launch the Gallery application from your desktop or applications menu.

### Running from Source (Git or Zip)
If you prefer to run the application without installing it, or if you downloaded the source `.zip` release:

**Prerequisites:** You must have Node.js (v22 or higher) and npm installed on your system.

1. **Download the Source**:
   - **Via Git**: `git clone https://github.com/tahir242/gallery.git`
   - **Via Zip**: Download the source code `.zip` from the Releases page and extract it.
2. **Open your Terminal/Command Prompt** and navigate to the extracted `gallery` folder.
3. **Install Dependencies**: Run the following command to install required packages for both the server and client:
   ```bash
   npm run install:all
   ```
4. **Start the Application**: Run the development command to start both the backend server and the frontend UI:
   ```bash
   npm run dev
   ```
5. The frontend will open in your default web browser (usually at `http://localhost:5173`), and the backend will run concurrently on port `5000`.

---

## Features & Capabilities

### Adding & Indexing Directories
- **Universal Scanning**: Click the **"Add Directory"** button in the sidebar to add a local folder (e.g., `C:\Users\Name\Pictures`) or a UNC network path (e.g., `\\server\share\photos`).
- **Background Processing**: When you add a directory, Gallery scans it in batches of 2000 files. The UI remains responsive, and you can browse media as it is being discovered.
- **Incremental Rescanning**: If you add or remove files in a directory using your operating system, you can rescan the directory in Gallery. The scanner will incrementally add new files and purge any deleted files from the database to keep your gallery in sync.

### Viewing Media
- **Rich Media Support**: Gallery natively supports:
  - 🖼️ **Images**: JPG, PNG, GIF, WebP, etc.
  - 🎥 **Videos**: MP4, WebM, etc.
  - 🎵 **Audio**: MP3, WAV, etc.
  - 📄 **PDFs**: Renders a beautiful first-page thumbnail using client-side PDF rendering, and allows viewing PDFs.
- **Responsive Grid**: The media grid automatically adjusts to your screen size.

### Favorites, Search & Filtering
- **Favorites**: Click the heart icon on any media file to mark it as a favorite. You can then toggle the "Favorites" filter to exclusively view your starred media.
- **Deep Search**: Use the search bar to find files by name across the currently selected folder and its subfolders.
- **Dynamic Filters & Sorting**: 
  - Filter your media by specific file extensions (e.g., show only `.png` or `.mp4`).
  - Sort your gallery by **Name**, **File Size**, or **Date Modified** (in ascending or descending order).

### Editing Images
Gallery includes a built-in, professional image editing suite accessible by clicking the **Edit (Pencil)** icon on any image.
- **Cropping**: Draw a freeform crop box, or use the quick-select toolbar to lock the aspect ratio to Square, 16:9, 4:3, or 9:16.
- **Pan & Zoom**: Scroll your mouse wheel to infinitely zoom into your image (up to 400%). When zoomed in, click and drag anywhere to pan the image around.
- **Live Adjustments**: Switch to the **Adjust** tab to tweak Brightness, Saturation, and Blur in real-time.
- **Exporting**: Save your edits destructively by clicking **Replace**, or non-destructively by clicking **Save as New**. You can also convert formats (PNG, JPEG, WebP) and resize the image dimensions precisely on export.

### Folder Tree Navigation
- Navigate complex directory structures easily using the dedicated sidebar tree.
- Click on any folder to view the media contained specifically within that path.
- **Removing Directories**: You can delete a directory's index from your history to remove those files from your gallery view.

---

## Advanced Functionality

### Portable SQLite Database
Gallery stores its index securely using a portable SQLite database. When running the desktop app, this is stored in your OS AppData directory. This means there are no complex databases to install or configure.

### Upcoming Features
*(Currently in development)*
- **Custom Lists**: Create collections without moving the original files.
- **Secure Public Sharing**: Generate expiring links to share media with guests.
- **AI-Powered Grouping**: Automatic facial recognition, location grouping, and smart search.

---

## Troubleshooting

- **Media not showing up?** Ensure Gallery has read permissions to the directory. If using a network path, make sure you are authenticated to the network share.
- **App is slow?** The initial scan of a very large network drive might take time. Wait for the background indexing to complete. Subsequent loads are lightning-fast thanks to the local SQLite cache.
