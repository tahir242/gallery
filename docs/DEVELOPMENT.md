# Developer & Contributor Guide

Welcome to the Gallery Developer Guide! This document provides an in-depth look at the architecture, building process, coding style, and contribution guidelines for the Gallery application.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Electron Integration Details](#electron-integration-details)
4. [Coding Style & Conventions](#coding-style--conventions)
5. [How to Contribute](#how-to-contribute)
6. [Build Pipeline & CI/CD](#build-pipeline--cicd)

---

## 🏗️ Architecture Overview

The Gallery is designed as a hybrid application that can run both as a standard web application and a native desktop application via Electron.

### The Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand (State Management).
- **Backend API**: Node.js, Express.js.
- **Database**: SQLite (local, portable).
- **Desktop Wrapper**: Electron, electron-builder.

### How it Works Together
1. **Development Mode (`npm run dev`)**: We use `concurrently` to spawn two processes: a Vite development server (port `5173`) for HMR on the frontend, and a `nodemon` process (port `5000`) for the Express backend.
2. **Desktop Development (`npm run electron:dev`)**: Spawns Vite for the frontend and runs the Electron wrapper `main.js`. 
3. **Production Desktop (`npm run electron:build`)**: Compiles the React frontend using Vite into `client/dist`. It packages the Express server, Node modules, and the React distribution into an ASAR archive. The Electron `main.js` boots the Express server dynamically and loads it within a `BrowserWindow`.

---

## 📁 Folder Structure

The repository is organized as a monorepo containing both the client and server.

```text
gallery/
├── client/                 # Frontend React Application
│   ├── public/             # Static assets and icons
│   ├── src/
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── components/     # Reusable React components (UI)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Full page views
│   │   ├── services/       # API integration functions
│   │   ├── store/          # Zustand state management
│   │   ├── App.jsx         # Main application routing
│   │   ├── index.css       # Tailwind entry and global styles
│   │   └── main.jsx        # React root mount
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                 # Backend Node.js/Express Application
│   ├── src/
│   │   ├── controllers/    # Request handlers logic
│   │   ├── data/           # Data storage paths or static backend assets
│   │   ├── db/             # SQLite connection and migration logic
│   │   ├── routes/         # Express route definitions
│   │   ├── utils/          # Helper functions (hashing, scanning, etc.)
│   │   └── index.js        # Express server entry point
│   └── .env                # Server environment variables
├── docs/                   # Documentation (Manuals, Guides)
├── dist-desktop/           # Output directory for Electron builds (ignored in git)
├── main.js                 # Electron main process entry point
└── package.json            # Root configuration and scripts
```

---

## 🖥️ Electron Integration Details

Building a reliable Electron wrapper around an Express API required solving several architectural challenges:

### 1. Dynamic Port Binding
By default, the Express server listens on port `5000`. However, if port `5000` is already in use by a developer's environment or a crashed background process, hardcoding this port would silently crash the production Electron app (`EADDRINUSE`). 
**Solution**: In production, `main.js` tells the Express server to bind to port `0`. The operating system automatically allocates a free, unused port. `main.js` retrieves this dynamically assigned port and points the `BrowserWindow` to it.

### 2. Read-Only ASAR Archives & SQLite
When `electron-builder` packages the application, it compresses the source code into a secure, read-only virtual filesystem archive (`app.asar`).
If the backend attempts to write the `database.sqlite` file inside its own directory, it fails with a `Permissions Error`.
**Solution**: We utilize Electron's `app.getPath('userData')` to resolve the user's OS-specific persistent data directory (e.g., `%APPDATA%\com.tahir242.gallery` on Windows). `main.js` passes this secure, writable path to the Express server using the `process.env.APP_DATA_DIR`, where the SQLite database safely initializes.

---

## 💅 Coding Style & Conventions

To maintain a clean and understandable codebase, we follow these guidelines:

### Frontend (React/Vite)
- **Functional Components**: Use React Functional Components and Hooks. Avoid Class Components.
- **State Management**: Use `Zustand` for global state. Keep local state within components using `useState`.
- **Styling**: We strictly use **Tailwind CSS**. Avoid writing custom CSS in `index.css` unless creating reusable base classes or handling complex animations that Tailwind cannot easily address.
- **Naming**: 
  - Components: PascalCase (e.g., `ImageGallery.jsx`)
  - Hooks: camelCase starting with `use` (e.g., `useMediaScanner.js`)
  - Utilities/Services: camelCase (e.g., `apiClient.js`)

### Backend (Node.js/Express)
- **Modular Routing**: Keep `index.js` clean. Define routes in `server/src/routes/` and business logic in `server/src/controllers/`.
- **Database**: Use parameterized queries with `sqlite` and `sqlite3` to prevent SQL Injection. Do not concatenate strings for SQL queries.
- **Error Handling**: Use `try/catch` blocks in async controllers. Always return standard JSON error responses (e.g., `res.status(500).json({ error: 'Message' })`).

### General
- **Linting**: Run `oxlint` (configured via `.oxlintrc.json`) before committing.
- **Formatting**: We recommend using Prettier for consistent code formatting.

---

## 🤝 How to Contribute

We love community contributions! Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

### 1. Set Up the Project
```bash
git clone https://github.com/yourusername/gallery.git
cd gallery
npm run install:all
```

### 2. Create a Branch
Use descriptive branch names. Prefix the branch with the type of change (e.g., `feature/`, `bugfix/`, `docs/`, `refactor/`).
```bash
git checkout -b feature/dark-mode-toggle
```

### 3. Commit Your Changes
We prefer clear, descriptive commit messages.
- **Good**: `feat(ui): add dark mode toggle in sidebar`
- **Bad**: `fixed stuff`

### 4. Open a Pull Request (PR)
- Push your branch to your fork and open a Pull Request against the `master` branch.
- Provide a detailed description of what your PR does. Include screenshots or videos if it changes the UI.
- Ensure the app runs properly in both standard dev mode (`npm run dev`) and Electron dev mode (`npm run electron:dev`).

---

## 🛠️ Build Pipeline & CI/CD

We utilize **GitHub Actions** (`.github/workflows/release.yml`) to automatically compile and release desktop executables.

### Dual-Architecture Builds (Windows)
The CI pipeline is configured to compile the Windows NSIS installer for both 64-bit and 32-bit machines:
```bash
npx electron-builder --win --x64 --ia32
```
Building 32-bit (`ia32`) C++ bindings requires local build tools. The dual-architecture compilation is strictly handled by the GitHub Cloud runner to save local developers from complex C++ setups.

### Windows Code Signing
Code signing is vital to prevent modern antiviruses from flagging the application as suspicious. We have natively configured `electron-builder` in the CI pipeline to perform SHA-256 signing.
Add secrets `CSC_LINK` and `CSC_KEY_PASSWORD` to your GitHub Repository to enable automatic signing upon release tagging.
