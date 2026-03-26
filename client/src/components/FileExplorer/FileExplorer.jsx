'use client';
import React, { useState, useMemo } from 'react';
import { 
  File, 
  Plus, 
  Trash2, 
  Code2, 
  FileCode, 
  Hash, 
  FolderPlus, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  FileText,
  Files,
  FolderTree
} from 'lucide-react';

const FileExplorer = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onAddFile, 
  onAddFolder, 
  onDeleteFile 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(['root']);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };

  // Build a tree from flat files
  const fileTree = useMemo(() => {
    const tree = { id: 'root', name: 'Root', isFolder: true, children: [] };
    const lookup = { root: tree };

    // First pass: Add all folders to lookup
    files.forEach(file => {
      if (file.isFolder) {
        lookup[file.id] = { ...file, children: [] };
      }
    });

    // Second pass: Associate files/folders with parents
    files.forEach(file => {
      const item = file.isFolder ? lookup[file.id] : { ...file };
      const parentId = file.parentId || 'root';
      
      if (lookup[parentId]) {
        lookup[parentId].children.push(item);
      } else {
        // Fallback to root if parent not found
        tree.children.push(item);
      }
    });

    return tree;
  }, [files]);

  const getFileIcon = (file, active) => {
    const iconClass = active ? 'text-white' : 'text-white/40 group-hover:text-white/70';
    if (file.isFolder) {
      return <Folder size={14} className={iconClass} fill="currentColor" fillOpacity={0.1} />;
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <Code2 size={14} className={iconClass} />;
    if (ext === 'html') return <FileCode size={14} className={iconClass} />;
    if (ext === 'css') return <Hash size={14} className={iconClass} />;
    if (['md', 'txt'].includes(ext)) return <FileText size={14} className={iconClass} />;
    return <File size={14} className={iconClass} />;
  };

  const getIconBg = (file, active) => {
    if (active) return 'bg-[#8a2be2]';
    if (file.isFolder) return 'bg-white/5 group-hover:bg-white/10';
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'js') return 'bg-yellow-500/10 group-hover:bg-yellow-500/20';
    if (ext === 'html') return 'bg-orange-500/10 group-hover:bg-orange-500/20';
    if (ext === 'css') return 'bg-blue-500/10 group-hover:bg-blue-500/20';
    return 'bg-white/5 group-hover:bg-white/10';
  };

  const RenderTree = ({ item, depth = 0 }) => {
    const isExpanded = expandedFolders.includes(item.id);
    const active = selectedFile?.id === item.id;

    if (item.id === 'root') {
      return (
        <div className="space-y-0.5">
          {item.children.map(child => (
            <RenderTree key={child.id} item={child} depth={0} />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {/* Item Row */}
        <div
          onClick={() => {
            if (item.isFolder) toggleFolder(item.id);
            else onFileSelect(item);
          }}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          className={`flex items-center gap-2.5 py-2 pr-3 rounded-lg cursor-pointer transition-all group relative ${
            active ? 'bg-[#8a2be2]/20 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/80'
          }`}
        >
          {item.isFolder ? (
            <span className="text-white/20 group-hover:text-white/50 transition-colors">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
             <span className="w-3.5" /> // Spacer for alignment
          )}

          <div className={`p-1 rounded-md flex-shrink-0 transition-colors ${getIconBg(item, active)}`}>
            {getFileIcon(item, active)}
          </div>

          <span className={`text-[13px] font-medium truncate flex-1 ${item.isFolder ? 'text-white/70' : ''}`}>
            {item.name}
          </span>

          {/* Action Buttons for Folder (Hidden by default, show on hover) */}
          {item.isFolder && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onAddFile(item.id); }}
                className="p-1 hover:bg-[#8a2be2]/20 rounded text-[#8a2be2]"
              >
                <Plus size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onAddFolder(item.id); }}
                className="p-1 hover:bg-[#8a2be2]/20 rounded text-[#8a2be2]"
              >
                <FolderPlus size={12} />
              </button>
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteFile(item.id); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Children (if expanded) */}
        {item.isFolder && isExpanded && (
          <div className="flex flex-col mt-0.5">
            {item.children.length === 0 ? (
              <div 
                style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
                className="py-1.5 text-[11px] font-bold text-white/10 uppercase tracking-widest italic"
              >
                Empty
              </div>
            ) : (
              item.children
                .sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0)) // Folders first
                .map(child => (
                  <RenderTree key={child.id} item={child} depth={depth + 1} />
                ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-[#0d0d0d] border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#141414]/50 flex-shrink-0">
        <div className="flex items-center gap-2">
           <FolderTree size={16} className="text-[#8a2be2]" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Explorer
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onAddFile('root')}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-white/20 hover:text-white"
            title="New File at Root"
          >
            <Plus size={14} />
          </button>
          <button 
            onClick={() => onAddFolder('root')}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-white/20 hover:text-white"
            title="New Folder at Root"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-4">
        <RenderTree item={fileTree} />
      </div>
      
      {/* Bottom Info */}
      <div className="p-4 border-t border-white/5 bg-[#141414]/30 min-h-[60px]">
         <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
            <Files size={12} /> {files.length} Resources
         </div>
         <p className="text-[9px] text-white/10 font-medium truncate">
            {selectedFile ? `Editing: ${selectedFile.name}` : 'Select a resource'}
         </p>
      </div>
    </div>
  );
};

export default FileExplorer;
