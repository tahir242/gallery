# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Expandable Search Results**: Converted static directory search results into fully interactive tree nodes. Users can now click the expansion arrow on any searched folder to dynamically load, indent, and navigate its subdirectories directly within the search pane without losing their search context.
- **Native Document Previews**: Replaced generic fallback icons with full-featured native viewers for PDFs, Word Documents (`.docx`), Excel Spreadsheets (`.xlsx`, `.csv`), and Text files (`.txt`).
- **Audio Playback UI**: Added a slick custom audio player with waveform-inspired UI for `.mp3` and `.wav` files inside the LightBox.
- **Advanced PDF Engine**: Integrated `pdfjs-dist` via offscreen Canvas rendering. Includes full JBIG2 decoding support and explicit memory garbage collection to prevent Chromium VideoFrame leaks.
- **PDF Keyboard Navigation**: Added rapid page switching via `PageUp`, `PageDown`, `Ctrl + ArrowRight`, and `Ctrl + ArrowLeft`.
- **Translation Panning**: Rebuilt the PDF zoom engine to use hardware-accelerated CSS `transform: translate(x,y) scale(z)` (matching the image viewer) instead of native browser scrolling.

### Changed
- **Unified LightBox UX**: Stripped all background colors, scrollbars, and title bars from the custom document/media viewers, nesting them directly onto the LightBox's dark overlay for a highly consistent cinematic feel.
- **Floating Controls**: Moved all viewer-specific controls (PDF zoom/page inputs, spreadsheet tab selectors, text line counts) into floating pill bars pinned to the bottom of the screen.

### Fixed
- Fixed an issue where clicking a location from the "Recent Scans" list would ignore the originally saved file extensions and use the default selections. The scanner now correctly restores and applies the exact file types used during the initial scan.
- Fixed a bug where opening a specific scanned location or clicking the "Favorites" tab would incorrectly display media and favorites from *all* indexed locations. All media lists, file type totals, and favorite counters are now strictly scoped to the active root directory.
- Fixed missing file and subfolder counts in the directory search results by updating the backend `searchDirectories` API to properly compute and return these metrics.
- Fixed LightBox metadata panel z-index issues where the "File Info" header was hidden behind absolute-positioned global action buttons.
- Fixed a massive memory leak and black-screen UI crash when deep-zooming large PDFs by migrating to temporary offscreen canvas blobs instead of DOM-injected canvas layers.
- Fixed `pdf.js` JBIG2 initialization warnings and missing CMaps by wiring up the official web worker natively via Vite.

## [1.2.0] - 2026-08-18
### Added
- **Professional Image Editor**: Introduced a massive, Apple Photos/Adobe Lightroom-inspired image editing suite powered by `sharp` and HTML5 Canvas.
- **Advanced Cropping**: Added freeform cropping, aspect ratio locks (1:1, 16:9, 4:3, 9:16), cinematic 80% darkened overlay masks, elegant L-shaped iOS-style corner handles, and a dynamic fade-in Rule of Thirds grid.
- **Pan & Zoom Controls**: Added infinite zoom (up to 400%), seamless mouse wheel scrolling, and hand-tool panning across the editor canvas.
- **Live Adjustments**: Integrated real-time Brightness, Saturation, and Blur tuning tools, alongside 90-degree rotations and horizontal/vertical flips.
- **Smart Formatting**: Added dynamic export capabilities allowing users to choose output format (PNG, JPEG, WebP) and precise pixel dimensions.
- **Exhaustive Metadata & EXIF Extraction**: Integrated `exiftool-vendored` in the backend to perform highly optimized, instant background reads of all metadata tags (EXIF, XMP, GPS, IPTC, ICC, etc.) across images, videos, audio, and PDF files.
- **Metadata Viewer UI**: Added an interactive "File Info" panel to the LightBox viewer that dynamically lists all extensive metadata extracted from the file.

### Changed
- **Unified Tooltip System**: Replaced native OS tooltips with a custom, highly responsive Radix UI tooltip system across the entire application for a more premium, consistent design.
- **Sidebar UX Overhaul**: Redesigned the folder tree to use horizontal scrolling instead of text truncation, ensuring deeply nested folders remain fully readable.
- **Compact UI Statistics**: Refactored global and sidebar statistics to use highly dense icon-based layouts rather than verbose text strings.
- **Decluttered Navigation**: Removed redundant total file counts from the top header navigation.
- **Number Formatting**: Applied consistent comma-separated number formatting to all tree-level folder and file counters.

### Fixed
- Fixed critical Windows file locking (`EBUSY: resource busy or locked`) crashes during destructive image saves by reading original files into memory buffers prior to processing.
- Fixed `bad extract area` cropping errors by implementing strict coordinate clamping, guaranteeing coordinates never exceed native image boundaries during export.
- Fixed Lightbox UI bleed-through in the Image Editor by applying a solid `#0a0a0a` background layer.
- Fixed a dark-mode styling issue where the format selection dropdown (`<select>`) text was invisible on white default browser popups by assigning strict background colors.
- Fixed a major race condition in the polling mechanism where overlapping status requests during heavy indexing could permanently freeze the UI in a "scanning" state.
- Fixed an infinite scrolling architectural bug in the Masonry layout where `react-masonry-css` column distribution caused premature data fetching. Replaced mapped item observers with a unified sentinel component for accurate intersection tracking.
- Fixed a JSX parsing syntax error that crashed the build after migrating `MediaCard.jsx` to the new custom tooltip component.
- Removed unwanted tooltip hover states from the primary MediaGrid thumbnails.
- Fixed severe scroll jumping and layout reflow in the Masonry view when loading new images by migrating from CSS `column-count` to a JavaScript-driven column distributor (`react-masonry-css`).
- Fixed LightBox metadata scroll locking issues, ensuring mouse wheel actions exclusively scroll the active metadata pane rather than zooming the background image.
- Visually aligned the LightBox info header by persisting a hidden close button element to preserve `justify-between` spacing.
- Fixed an erratic behavior where LightBox zooming and panning UI controls intermittently failed. Refactored the `setZoom` updater to be pure, preventing React's state batching from discarding simultaneous pan reset coordinates.
- Fixed an issue where the plus, minus, and reset zoom buttons in the LightBox were unresponsive while zoomed in. Applied click propagation stoppers to prevent the image's drag-pan pointer capture from intercepting control clicks.
- Massively improved the responsiveness of opening and closing the LightBox by decoupling `MediaCard` and `TreeNode` components from global store re-renders via `React.memo` and atomic Zustand selectors. Eliminated heavy CSS `backdrop-blur` from the LightBox overlay to reduce GPU strain over large masonry grids.

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
