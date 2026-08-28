# 🗺️ Gallery Roadmap

This document outlines planned features and improvements. Items are roughly prioritized from top to bottom.

Want to help? Pick any unchecked item below and [open an issue](../../issues/new?template=feature_request.md) to claim it before starting work. 🙋

---

## 🔥 In Progress

- [ ] Performance optimizations for libraries with 10,000+ files
- [ ] Improved mobile touch gestures in the lightbox

---

## 🔐 Authentication & Multi-User Support

Enterprise-grade security meets personal media management.

- [ ] Login system (username + password)
- [ ] Multi-user accounts with individual libraries
- [ ] Role-based access control (Admin, Viewer, Editor)
- [ ] Session management and "Remember Me"
- [ ] Optional: OAuth2 / SSO integration

---

## 📋 Custom Lists & Collections

Organize your media without moving files.

- [ ] Create named collections/albums
- [ ] Add/remove files to collections via UI
- [ ] Reorder items within a collection
- [ ] Share a collection as a gallery link
- [ ] Nested collections (sub-albums)

---

## 🖼️ Collage Maker

- [ ] Multi-select photos from the grid
- [ ] Choose from preset collage layouts (grid, mosaic, freeform)
- [ ] Customize spacing, borders, and background color
- [ ] Export as PNG or JPEG at high resolution
- [ ] Add text captions to collages

---

## 🔗 Secure Public Sharing

Share with family and friends, securely.

- [ ] Generate unique, expiring share links per file/folder
- [ ] View-only mode (no download)
- [ ] Download-allowed mode (full resolution)
- [ ] Password-protected links
- [ ] Link analytics (view count, last viewed)

---

## 🤖 AI-Powered Features

Making your gallery intelligent — no manual tagging required.

- [ ] **Face Detection & Grouping**: Recognize people and group photos by individual
- [ ] **Location Clustering**: Auto-group by GPS coordinates / city
- [ ] **Smart Search**: Search "beach", "dogs", "sunset" with natural language
- [ ] **Auto-Tagging**: Suggest tags based on image content
- [ ] **Duplicate Detection**: Find visually similar or exact duplicate files

---

## 🎞️ Media Enhancements

- [ ] Video trimming and clip export
- [ ] Batch image editing (apply same edits to multiple files)
- [ ] HEIC/HEIF format support
- [ ] RAW format preview (CR2, NEF, ARW)
- [ ] Audio waveform visualization
- [ ] Slideshow / presentation mode with music

---

## 🌐 Accessibility & Internationalization

- [ ] Full keyboard navigation
- [ ] Screen reader support (ARIA labels audit)
- [ ] High-contrast theme
- [ ] Internationalization (i18n) support for multiple languages

---

## 🏗️ Infrastructure

- [ ] Docker Compose setup for easy self-hosting
- [ ] Automated release pipeline (auto-build installers on tag)
- [ ] End-to-end tests with Playwright
- [ ] Unit test coverage > 70%

---

## ✅ Completed

- [x] Universal local & UNC network path scanning
- [x] Rich media grid (images, videos, audio, PDFs)
- [x] Professional image editor (crop, adjust, format convert)
- [x] Deep search & extension filters
- [x] Folder tree navigation
- [x] Background incremental indexing
- [x] Live directory sync (file watcher)
- [x] Portable SQLite database
- [x] Native desktop installers (Windows `.exe`, macOS `.dmg`, Linux `.AppImage`)
- [x] CI/CD with GitHub Actions
- [x] Code signing on Windows

---

> 💡 **Have an idea not listed here?** [Open a Feature Request](../../issues/new?template=feature_request.md)!
