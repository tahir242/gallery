<div align="center">
  
# 🌌 Gallery

**A Modern, Fast, and Intelligent Portable Media Gallery**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![CI/CD](https://github.com/tahir242/gallery/actions/workflows/ci.yml/badge.svg)](https://github.com/tahir242/gallery/actions)

An intelligent, portable media desktop application that incrementally indexes local and network directories. Bring your photos and videos to life with an attractive, mobile-first design and powerful native desktop capabilities.

[User Manual](docs/USER_MANUAL.md) • [Explore Features](#sparkles-features) • [Installation](#rocket-getting-started) • [Developer Guide](docs/DEVELOPMENT.md) • [API Reference](#books-api-reference) • [Contributing](#handshake-contributing)

</div>

---

## :sparkles: Features

Our platform is continually evolving to give you the best experience to manage your media. 

### Core Capabilities
- 📂 **Universal Scanning**: Seamlessly index local paths and UNC network paths (`\\server\share\path`).
- 🖼️ **Rich Media Support**: Display images, videos, audio, and PDFs in a responsive, modern grid.
- 🎨 **Professional Image Editor**: Built-in editing suite with freeform cropping, aspect ratio locks, Brightness/Saturation/Blur sliders, infinite zoom, and smart format conversion.
- 📄 **Native Document Previews**: Render first-page thumbnails and fully interactive native viewers for PDFs, Word Documents (`.docx`), Excel Spreadsheets (`.xlsx`, `.csv`), Text (`.txt`), and Audio files directly in the LightBox.
- 🔍 **Deep Search & Filters**: Search across all files and child directories. Filter by any discovered file extension.
- 🌳 **Folder Tree Navigation**: Easily browse through complex folder structures with a dedicated sidebar.
- 📱 **Mobile-First Design**: Completely responsive UI crafted with Tailwind CSS for perfect viewing on any device.
- ⚡ **Background Processing**: Opens instantly after the first indexed batch while the rest of your large directory scans quietly in the background.
- 🔄 **Live Sync**: Watches indexed directories and automatically reflects added or removed media files.
- 🗃️ **Portable SQLite**: No complex database setups. Uses a persistent SQLite index securely stored in your OS AppData.
- 💻 **Native Desktop Installers**: Standalone `.exe`, `.dmg`, and `.AppImage` wrappers built dynamically with Electron for seamless desktop integration.
- 🛡️ **Code Signed**: Trusted execution on Windows with SHA-256 signatures mitigating Antivirus flagging.

---

## :rocket: Upcoming Innovations

We are actively developing powerful new capabilities to take your media gallery to the next level:

### 🔐 Authorization & Authentication
Enterprise-grade security meets personal media management. Secure your instance with multi-user support, login systems, and role-based access control to keep your memories private.

### 📋 Custom Lists
Create custom collections and lists of your favorite media. Organize your memories exactly how you want without moving the underlying files.

### 🖼️ Collage Maker
Select multiple photos and instantly generate beautiful, customizable collages ready to be saved and shared.

### 🔗 Secure Public Sharing
Share a specific image, album, or folder with friends and family using secure, expiring public links. 
- **View Only Mode**: Allow guests to see the media without downloading it.
- **Download Allowed**: Let your guests save the full-resolution files.

### 🤖 AI-Powered Detection & Grouping
Your gallery, organized intelligently. We are integrating advanced AI models to automatically process your library:
- **Face Detection**: Recognize people across your library and group photos by individual.
- **Location Grouping**: Automatically cluster photos based on where they were taken.
- **Smart Search**: Search for "beach", "dogs", or "birthday" without ever tagging a photo yourself.

---

## :wrench: Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js, Express.js
- **Database**: SQLite (local file, seamless setup)
- **Deployment**: GitHub Actions (CI/CD)

---

## :rocket: Getting Started

### Prerequisites

- **Node.js** >= 22.5 (Leverages Node's built-in SQLite support)
- **npm** >= 9
- Read access to the local or network directories you want to index.

### Installation

Clone the repository and install dependencies in one command:

```bash
# Clone the repository
git clone https://github.com/yourusername/gallery.git
cd gallery

# Install all dependencies (root, server, client)
npm run install:all
```

### Environment Setup (Optional)

Configure the backend to your liking by creating a `server/.env` file:

```env
PORT=5000
NODE_ENV=development
# Optional: Store the portable SQLite database on a different drive
# GALLERY_DATA_DIR=D:\GalleryData
```

### Running the Application

**Run everything concurrently (Development):**
```bash
npm run dev
```
*Starts the server on port 5000 and the client on port 5173.*

**Run individually:**
```bash
# Server only
npm run server

# Client only
npm run client
```

---

## :books: API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/directory/scan` | Scan a directory |
| `GET`  | `/api/directory/status` | Get background indexing progress |
| `GET`  | `/api/directory/files` | Query indexed files (pagination, search, filters, sorting) |
| `GET`  | `/api/directory/history` | View scan session history |
| `GET`  | `/api/media/serve` | Serve a media file (images, videos, audio, pdfs) |
| `GET`  | `/api/media/metadata` | Extract exhaustive EXIF, GPS, and XMP metadata |
| `GET`  | `/api/media/info` | Retrieve basic media properties (resolution, size) |
| `GET`  | `/api/media/list` | Paginated retrieval of media files |
| `GET`  | `/api/media/types` | Retrieve a list of all indexed file extensions |
| `POST` | `/api/media/favorite` | Toggle the favorite/starred status of a file |
| `GET`  | `/api/media/favorites/count` | Retrieve total number of favorited items |
| `POST` | `/api/media/edit` | Apply non-destructive/destructive `sharp` image edits (crop, rotate, modulate, format conversion) |

---

## :handshake: Contributing

We welcome contributions from the community! If you'd like to help build the roadmap features or fix a bug, please check out our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## :shield: Security

If you discover any security related issues, please review our [Security Policy](SECURITY.md) and report them accordingly.

## :scroll: Changelog

See the [CHANGELOG.md](CHANGELOG.md) for a detailed history of updates and releases.

## :balance_scale: License

This project is licensed under the **GPL-3.0 License** - see the [LICENSE](LICENSE) file for details.
