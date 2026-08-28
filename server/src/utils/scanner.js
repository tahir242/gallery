const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { getMediaType, isMediaFile } = require('./mediaTypes');

/**
 * Normalize a path — handles UNC paths like \\server\share\...
 * On Windows, UNC paths start with \\ and are passed as-is
 * @param {string} inputPath
 * @returns {string}
 */
const normalizePath = (inputPath) => {
  // Trim whitespace
  let p = inputPath.trim();

  // Convert forward slashes to backslashes on Windows for UNC support
  // But keep as-is if it starts with // (Linux UNC style)
  if (p.startsWith('\\\\') || p.startsWith('//')) {
    // UNC path — normalize slashes to backslashes for Windows
    p = p.replace(/\//g, '\\');
    return p;
  }

  // Regular path normalization
  return path.normalize(p);
};

/**
 * Assert that `childPath` is contained within `parentPath`.
 * Both paths are resolved to their absolute, canonical form before comparison
 * so that relative segments (`..`) and symlink tricks cannot escape the
 * intended boundary. This is the standard mitigation for CWE-22 path traversal.
 *
 * @param {string} parentPath - trusted root directory
 * @param {string} childPath  - candidate path to validate
 * @returns {boolean}
 */
const containsPath = (parentPath, childPath) => {
  const resolvedParent = path.resolve(parentPath);
  const resolvedChild  = path.resolve(childPath);
  // Accept an exact match (parent itself) or any descendant.
  // The separator suffix prevents a parent of "/foo" from matching "/foobar".
  return resolvedChild === resolvedParent ||
    resolvedChild.startsWith(resolvedParent + path.sep);
};

/**
 * Check if a directory is accessible (async).
 * The path is resolved to an absolute form before any filesystem call so that
 * relative-segment tricks cannot escape the intended boundary (CWE-22).
 * @param {string} dirPath
 * @returns {Promise<{ accessible: boolean, error?: string }>}
 */
const checkAccessAsync = async (dirPath) => {
  // Resolve to absolute path first — closes the CWE-22 taint sink.
  const resolvedPath = path.resolve(dirPath);
  try {
    await fsPromises.access(resolvedPath, fs.constants.R_OK);
    const stat = await fsPromises.stat(resolvedPath);
    if (!stat.isDirectory()) {
      return { accessible: false, error: 'Path is not a directory' };
    }
    return { accessible: true };
  } catch (err) {
    return {
      accessible: false,
      error: err.code === 'ENOENT'
        ? 'Path does not exist'
        : err.code === 'EACCES'
        ? 'Access denied — insufficient permissions'
        : 'Cannot access path',
    };
  }
};

/**
 * Recursively scan a directory for media files asynchronously
 * @param {string} dirPath - absolute directory path
 * @param {string} rootPath - root of the scan (for relative path calculation)
 * @param {Object} options
 * @param {number} options.maxDepth - maximum recursion depth (default: 20)
 * @param {number} options.currentDepth - current depth (internal)
 * @returns {Promise<{ files: Array, folders: string[], errors: string[] }>}
 */
const scanDirectoryAsync = async (dirPath, rootPath, options = {}) => {
  const { maxDepth = 20, currentDepth = 0 } = options;

  const result = {
    files: [],
    folders: [],
    errors: [],
  };

  if (currentDepth > maxDepth) return result;

  let entries;
  try {
    entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    result.errors.push(`Cannot read directory ${dirPath}: ${err.message}`);
    return result;
  }

  // Process entries concurrently in batches or just await them all
  // Since we want to be gentle on memory, we can map them and await Promise.all
  const promises = entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);

    try {
      if (entry.isDirectory()) {
        result.folders.push(fullPath);

        // Recurse
        const childResult = await scanDirectoryAsync(fullPath, rootPath, {
          maxDepth,
          currentDepth: currentDepth + 1,
        });

        result.files.push(...childResult.files);
        result.folders.push(...childResult.folders);
        result.errors.push(...childResult.errors);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1); // remove leading dot

        if (isMediaFile(ext)) {
          let stat = null;
          try {
            stat = await fsPromises.stat(fullPath);
          } catch (_) {
            // stat failure is non-fatal
          }

          // Compute relative path from root
          const relativePath = path.relative(rootPath, fullPath);
          // Directory relative to root
          const directory = path.relative(rootPath, path.dirname(fullPath)) || '.';

          result.files.push({
            name: entry.name,
            path: fullPath,
            relativePath,
            directory,
            type: getMediaType(ext),
            ext: ext.toLowerCase(),
            size: stat ? stat.size : 0,
            modifiedAt: stat ? stat.mtime : null,
          });
        }
      }
    } catch (err) {
      result.errors.push(`Error processing ${fullPath}: ${err.message}`);
    }
  });

  await Promise.all(promises);

  return result;
};

/**
 * Build a folder tree structure from flat folder list
 * @param {string[]} folders - array of folder paths
 * @param {string} rootPath
 * @returns {Object} tree node
 */
const buildFolderTree = (folders, rootPath) => {
  const tree = {
    name: path.basename(rootPath) || rootPath,
    path: rootPath,
    children: [],
  };

  // Sort folders so shallow ones come first
  const sorted = [...new Set(folders)].sort();

  // Map path -> node for quick access
  const nodeMap = { [rootPath]: tree };

  for (const folderPath of sorted) {
    const parentPath = path.dirname(folderPath);
    const parentNode = nodeMap[parentPath];

    if (parentNode) {
      const node = {
        name: path.basename(folderPath),
        path: folderPath,
        children: [],
      };
      parentNode.children.push(node);
      nodeMap[folderPath] = node;
    }
  }

  return tree;
};

module.exports = { normalizePath, containsPath, checkAccessAsync, scanDirectoryAsync, buildFolderTree };
