const fs = require('fs');
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
 * Check if a directory is accessible
 * @param {string} dirPath
 * @returns {{ accessible: boolean, error?: string }}
 */
const checkAccess = (dirPath) => {
  try {
    fs.accessSync(dirPath, fs.constants.R_OK);
    const stat = fs.statSync(dirPath);
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
        : `Cannot access path: ${err.message}`,
    };
  }
};

/**
 * Recursively scan a directory for media files
 * @param {string} dirPath - absolute directory path
 * @param {string} rootPath - root of the scan (for relative path calculation)
 * @param {Object} options
 * @param {number} options.maxDepth - maximum recursion depth (default: 20)
 * @param {number} options.currentDepth - current depth (internal)
 * @returns {{ files: Array, folders: string[], errors: string[] }}
 */
const scanDirectory = (dirPath, rootPath, options = {}) => {
  const { maxDepth = 20, currentDepth = 0 } = options;

  const result = {
    files: [],
    folders: [],
    errors: [],
  };

  if (currentDepth > maxDepth) return result;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    result.errors.push(`Cannot read directory ${dirPath}: ${err.message}`);
    return result;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    try {
      if (entry.isDirectory()) {
        result.folders.push(fullPath);

        // Recurse
        const childResult = scanDirectory(fullPath, rootPath, {
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
            stat = fs.statSync(fullPath);
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
  }

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

module.exports = { normalizePath, checkAccess, scanDirectory, buildFolderTree };
