# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-08-13
### Added
- **Electron Desktop Application**: Fully native wrapper delivering standalone `.exe`, `.dmg`, and `.AppImage` distribution.
- **Dual Architecture CI/CD**: Cloud pipeline now cross-compiles Windows binaries for both 64-bit (`x64`) and 32-bit (`ia32`).
- **Windows Code Signing**: Integrated `CSC_LINK` logic into the GitHub CI for SHA-256 `.exe` signatures to prevent AV flagging.
- Custom premium application icon dynamically embedded into the Windows and macOS desktop installers.
- Comprehensive `DEVELOPMENT.md` guide documenting the new hybrid architecture.

### Fixed
- Resolved `STATUS_ACCESS_VIOLATION` lock issues during `electron-builder` compilation by pushing dual-arch dependencies to GitHub Actions.
- Fixed `EADDRINUSE` backend crashes inside the production Electron wrapper by migrating to dynamic OS port assignment (`port 0`).
- Fixed SQLite database initialization `EPERM` crashes inside read-only `.asar` archives by relocating database writing to the user's secure `%APPDATA%` (`userData`) directory.
- Fixed React static file serving from the backend API inside packaged environments using directory-existence checks rather than strict Node environments.

## [1.0.0] - 2026-08-13
### Added
- Initial project structure.
- Local and network directory indexing.
- Responsive Tailwind CSS grid viewer.
- PDF thumbnail generation and rendering.
- Background scanning capabilities.
