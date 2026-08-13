# Developer Guide

Welcome to the Gallery Developer Guide! This document provides an in-depth look at the architecture, building process, and deployment strategies for the Gallery application, tailored for developers and open-source contributors.

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

## 🖥️ Electron Integration Details

Building a reliable Electron wrapper around an Express API required solving several architectural challenges:

### 1. Dynamic Port Binding
By default, the Express server listens on port `5000`. However, if port `5000` is already in use by a developer's environment or a crashed background process, hardcoding this port would silently crash the production Electron app (`EADDRINUSE`). 
**Solution**: In production, `main.js` tells the Express server to bind to port `0`. The operating system automatically allocates a free, unused port. `main.js` retrieves this dynamically assigned port and points the `BrowserWindow` to it.

### 2. Read-Only ASAR Archives & SQLite
When `electron-builder` packages the application, it compresses the source code into a secure, read-only virtual filesystem archive (`app.asar`).
If the backend attempts to write the `database.sqlite` file inside its own directory (e.g., `__dirname/../data`), it fails with a `Permissions Error`.
**Solution**: We utilize Electron's `app.getPath('userData')` to resolve the user's OS-specific persistent data directory (e.g., `%APPDATA%\com.tahir242.gallery` on Windows). `main.js` passes this secure, writable path to the Express server using the `process.env.APP_DATA_DIR` environment variable, where the SQLite database safely initializes.

---

## 🛠️ Build Pipeline & CI/CD

We utilize **GitHub Actions** (`.github/workflows/release.yml`) to automatically compile and release desktop executables for Windows, Linux, and macOS.

### Dual-Architecture Builds (Windows)
The CI pipeline is configured to compile the Windows NSIS installer for both 64-bit and 32-bit machines:
```bash
npx electron-builder --win --x64 --ia32
```
Building 32-bit (`ia32`) C++ bindings (like `sqlite3`) on a 64-bit system requires a local Python installation and C++ Build Tools. To ensure a smooth local development experience without forcing contributors to install C++ toolchains, the local `package.json` build script ignores architecture enforcement. The dual-architecture compilation is strictly handled by the GitHub Cloud runner, which comes pre-installed with the required compilers.

### Windows Code Signing
Code signing is vital to prevent modern antiviruses (like Windows Defender SmartScreen) from flagging the application as suspicious. We have natively configured `electron-builder` in the CI pipeline to perform SHA-256 signing and timestamping.

**To enable code signing:**
Add the following secrets to your GitHub Repository (`Settings` > `Secrets and variables` > `Actions`):
1. `CSC_LINK`: The base64-encoded string of your Code Signing Certificate (`.pfx` or `.p12`).
2. `CSC_KEY_PASSWORD`: The password for the certificate.

When a new version tag (e.g., `v1.0.1`) is pushed, the workflow securely injects these variables. `electron-builder` detects them and applies a verified signature to the generated `.exe` installers.

---

## 🚀 Adding Features

If you plan to contribute:
1. Ensure your React components are placed in `client/src/components`.
2. Ensure API routes are placed in `server/src/routes`.
3. If introducing new Node dependencies, install them at the **root level** (`package.json`) so `electron-builder` can successfully trace and natively compile them. Do not use nested `package.json` files for the backend.
