# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **Exhaustive Metadata & EXIF Extraction**: Integrated `exiftool-vendored` in the backend to perform highly optimized, instant background reads of all metadata tags (EXIF, XMP, GPS, IPTC, ICC, etc.) across images, videos, audio, and PDF files.
- **Metadata Viewer UI**: Added an interactive "File Info" panel to the LightBox viewer that dynamically lists all extensive metadata extracted from the file.

### Changed
- **Unified Tooltip System**: Replaced native OS tooltips with a custom, highly responsive Radix UI tooltip system across the entire application for a more premium, consistent design.
- **Sidebar UX Overhaul**: Redesigned the folder tree to use horizontal scrolling instead of text truncation, ensuring deeply nested folders remain fully readable.
- **Compact UI Statistics**: Refactored global and sidebar statistics to use highly dense icon-based layouts rather than verbose text strings.
- **Decluttered Navigation**: Removed redundant total file counts from the top header navigation.
- **Number Formatting**: Applied consistent comma-separated number formatting to all tree-level folder and file counters.

### Fixed
- Fixed a major race condition in the polling mechanism where overlapping status requests during heavy indexing could permanently freeze the UI in a "scanning" state.
- Fixed an infinite scrolling architectural bug in the Masonry layout where `react-masonry-css` column distribution caused premature data fetching. Replaced mapped item observers with a unified sentinel component for accurate intersection tracking.
- Fixed a JSX parsing syntax error that crashed the build after migrating `MediaCard.jsx` to the new custom tooltip component.
- Removed unwanted tooltip hover states from the primary MediaGrid thumbnails.
- Fixed severe scroll jumping and layout reflow in the Masonry view when loading new images by migrating from CSS `column-count` to a JavaScript-driven column distributor (`react-masonry-css`).
- Fixed LightBox metadata scroll locking issues, ensuring mouse wheel actions exclusively scroll the active metadata pane rather than zooming the background image.
- Visually aligned the LightBox info header by persisting a hidden close button element to preserve `justify-between` spacing.

## [1.1.4] - 2026-08-13
### Fixed
- Fixed `403 Forbidden - Resource not accessible by integration` error on all CI runners by adding `permissions: contents: write` to the workflow and disabling `electron-builder`'s implicit auto-publish (`--publish never`).
- Fixed macOS build crash (`Icon must be at least 512x512 pixels, provided: 500x500`) by regenerating the application icon at 512×512px.
- Fixed Linux AppImage warnings by adding `category: Graphics` and `desktopName: Gallery` metadata to the build config.
- Upgraded `actions/checkout` and `actions/setup-node` from `v4` to `v5` to resolve Node.js 20 deprecation warnings on GitHub runners.
- Upgraded `softprops/action-gh-release` from `v1` to `v2`.

## [1.1.3] - 2026-08-13
### Fixed
- Renamed `CSC_LINK` to `WIN_CSC_LINK` in CI pipeline to prevent macOS runner from attempting to use Windows code signing certificates.

## [1.1.2] - 2026-08-13
### Fixed
- Resolved macOS CI crash by adding `CSC_IDENTITY_AUTO_DISCOVERY: false` to disable automatic certificate keychain scanning on non-Windows runners.
- Added `fail-fast: false` to the CI matrix strategy so a single platform failure no longer cancels all other builds.

## [1.1.1] - 2026-08-13
### Fixed
- Fixed CI matrix failure where all three runners (Windows, macOS, Linux) received hardcoded `--win --x64 --ia32` flags. Each OS runner now receives its own platform-specific build arguments via the matrix `include` strategy.

## [1.1.0] - 2026-08-13
### Added
- **Electron Desktop Application**: Fully native wrapper delivering standalone `.exe`, `.dmg`, and `.AppImage` distribution.
- **Dual Architecture CI/CD**: Cloud pipeline now cross-compiles Windows binaries for both 64-bit (`x64`) and 32-bit (`ia32`).
- **Windows Code Signing**: Integrated `CSC_LINK` logic into the GitHub CI for SHA-256 `.exe` signatures to prevent AV flagging.
- Custom premium application icon dynamically embedded into the Windows and macOS desktop installers.
- Comprehensive `DEVELOPMENT.md` guide documenting the new hybrid architecture.
- Auto-generated release notes enabled in the GitHub Actions publish step.

### Fixed
- Resolved `STATUS_ACCESS_VIOLATION` lock issues during `electron-builder` compilation by pushing dual-arch dependencies to GitHub Actions.
- Fixed `EADDRINUSE` backend crashes inside the production Electron wrapper by migrating to dynamic OS port assignment (`port 0`).
- Fixed SQLite database initialization `EPERM` crashes inside read-only `.asar` archives by relocating database writing to the user's secure `%APPDATA%` (`userData`) directory.
- Fixed React static file serving from the backend API inside packaged environments using directory-existence checks rather than strict Node environments.

### Changed
- Updated author to "Tahir Ali Channa" and added premium application description.
- Moved application icon from `build/` to `client/public/` for Vite compatibility.

## [1.0.0] - 2026-08-13
### Added
- Initial project structure.
- Local and network directory indexing.
- Responsive Tailwind CSS grid viewer.
- PDF thumbnail generation and rendering.
- Background scanning capabilities.
- GitHub CI/CD pipeline integration.
- GPL 3.0 License.
- Contributing guidelines and security policy.
