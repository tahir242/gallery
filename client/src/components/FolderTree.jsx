import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, HardDrive } from 'lucide-react';
import useGalleryStore from '../../store/galleryStore';

const TreeNode = ({ node, depth = 0, filesByDir }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const { selectedFolder, setSelectedFolder } = useGalleryStore();
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFolder === node.path;
  const fileCount = filesByDir[node.path] || 0;

  return (
    <div className="select-none">
      <button
        id={`folder-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
        onClick={() => {
          setSelectedFolder(isSelected ? null : node.path);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={`
          w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm
          transition-all duration-150 group text-left
          ${isSelected
            ? 'bg-accent-500/15 text-accent-300'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            size={13}
            className={`flex-shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {depth === 0 ? (
          <HardDrive size={14} className="flex-shrink-0" />
        ) : expanded && hasChildren ? (
          <FolderOpen size={14} className="flex-shrink-0" />
        ) : (
          <Folder size={14} className="flex-shrink-0" />
        )}

        <span className="truncate flex-1 font-medium text-xs">{node.name}</span>

        {fileCount > 0 && (
          <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-accent-400' : 'text-surface-600'}`}>
            {fileCount}
          </span>
        )}
      </button>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              filesByDir={filesByDir}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = () => {
  const { scanResult, selectedFolder, setSelectedFolder, sidebarOpen } = useGalleryStore();

  if (!scanResult || !sidebarOpen) return null;

  // Build a map of folder path → file count
  const filesByDir = {};
  for (const file of scanResult.files) {
    const dir = file.path.substring(0, file.path.lastIndexOf('\\') || file.path.lastIndexOf('/'));
    filesByDir[dir] = (filesByDir[dir] || 0) + 1;
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-surface-800 bg-surface-950 overflow-y-auto h-full animate-slide-in-right">
      <div className="p-3">
        {/* All files button */}
        <button
          id="folder-all"
          onClick={() => setSelectedFolder(null)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-2
            transition-all duration-150
            ${selectedFolder === null
              ? 'bg-accent-500/15 text-accent-300'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }
          `}
        >
          <Folder size={14} />
          <span>All Files</span>
          <span className="ml-auto text-xs text-surface-500">{scanResult.fileCount}</span>
        </button>

        <div className="h-px bg-surface-800 mb-2" />

        {/* Folder tree */}
        <p className="text-xs text-surface-600 font-medium uppercase tracking-wider px-2 mb-2">
          Folders
        </p>
        {scanResult.folderTree ? (
          <TreeNode
            node={scanResult.folderTree}
            depth={0}
            filesByDir={filesByDir}
          />
        ) : (
          <p className="text-xs text-surface-600 px-2">No subfolders</p>
        )}
      </div>
    </aside>
  );
};

export default FolderTree;
