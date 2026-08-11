import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, HardDrive, Search } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';

const doesNodeMatch = (node, query) => {
  if (node.name.toLowerCase().includes(query)) return true;
  if (node.children && node.children.length > 0) {
    return node.children.some(child => doesNodeMatch(child, query));
  }
  return false;
};

const TreeNode = ({ node, depth = 0, filterQuery = '' }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const { selectedFolder, setSelectedFolder } = useGalleryStore();
  
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFolder === node.path;
  
  // Filter logic
  const isMatch = filterQuery ? doesNodeMatch(node, filterQuery) : true;
  if (!isMatch) return null;
  
  const isExpanded = filterQuery ? true : expanded;

  return (
    <div className="select-none">
      <button
        id={`folder-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
        onClick={() => {
          setSelectedFolder(isSelected ? null : node.path);
          if (hasChildren && !filterQuery) setExpanded(!expanded);
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
            className={`flex-shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {depth === 0 ? (
          <HardDrive size={14} className="flex-shrink-0" />
        ) : isExpanded && hasChildren ? (
          <FolderOpen size={14} className="flex-shrink-0" />
        ) : (
          <Folder size={14} className="flex-shrink-0" />
        )}

        <span className="truncate flex-1 font-medium text-xs">{node.name}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              filterQuery={filterQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = () => {
  const { scanResult, selectedFolder, setSelectedFolder, sidebarOpen } = useGalleryStore();
  const [filterQuery, setFilterQuery] = useState('');

  if (!scanResult || !sidebarOpen) return null;

  return (
    <aside className="w-64 flex-shrink-0 border-r border-surface-800 bg-surface-950 flex flex-col h-full animate-slide-in-right">
      <div className="p-3 pb-0 flex-shrink-0">
        {/* All files button */}
        <button
          id="folder-all"
          onClick={() => setSelectedFolder(null)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-3
            transition-all duration-150
            ${selectedFolder === null
              ? 'bg-accent-500/15 text-accent-300'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }
          `}
        >
          <Folder size={14} />
          <span>All Files</span>
          <span className="ml-auto text-xs text-surface-500">{scanResult.totalFiles}</span>
        </button>

        {/* Folder search */}
        <div className="relative mb-3">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
           <input 
             type="text"
             placeholder="Filter folders..."
             value={filterQuery}
             onChange={(e) => setFilterQuery(e.target.value.toLowerCase())}
             className="w-full bg-surface-900 border border-surface-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-surface-200 focus:outline-none focus:border-surface-700"
           />
        </div>

        <div className="h-px bg-surface-800 mb-2" />
        
        <p className="text-xs text-surface-600 font-medium uppercase tracking-wider px-2 mb-2">
          Folders
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {/* Folder tree */}
        {scanResult.folderTree ? (
          <TreeNode
            node={scanResult.folderTree}
            depth={0}
            filterQuery={filterQuery}
          />
        ) : (
          <p className="text-xs text-surface-600 px-2">No subfolders</p>
        )}
      </div>
    </aside>
  );
};

export default FolderTree;
