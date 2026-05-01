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
  FolderTree,
  X
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

  const fileTree = useMemo(() => {
    const tree = { id: 'root', name: 'Root', isFolder: true, children: [] };
    const lookup = { root: tree };
    files.forEach(file => {
      if (file.isFolder) lookup[file.id] = { ...file, children: [] };
    });
    files.forEach(file => {
      const item = file.isFolder ? lookup[file.id] : { ...file };
      const parentId = file.parentId || 'root';
      if (lookup[parentId]) lookup[parentId].children.push(item);
      else tree.children.push(item);
    });
    return tree;
  }, [files]);

  const getFileIcon = (file, active) => {
    const iconClass = active ? 'text-white' : 'text-white/40 group-hover:text-white/70';
    if (file.isFolder) return <Folder size={14} className={iconClass} />;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <Code2 size={14} className="text-yellow-500/80" />;
    if (ext === 'html') return <FileCode size={14} className="text-orange-500/80" />;
    if (ext === 'css') return <Hash size={14} className="text-blue-500/80" />;
    return <File size={14} className={iconClass} />;
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
        <div
          onClick={() => {
            if (item.isFolder) toggleFolder(item.id);
            else onFileSelect(item);
          }}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          className={`flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer transition-all group relative ${
            active ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/80'
          }`}
        >
          {item.isFolder ? (
            <span className="text-white/20 group-hover:text-white/40">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
             <span className="w-3.5" />
          )}

          <div className="flex-shrink-0">
            {getFileIcon(item, active)}
          </div>

          <span className="text-xs font-medium truncate flex-1">
            {String(item.name)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.isFolder && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onAddFile(item.id); }} className="p-1 hover:bg-white/10 rounded transition-all"><Plus size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); onAddFolder(item.id); }} className="p-1 hover:bg-white/10 rounded transition-all"><FolderPlus size={12} /></button>
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDeleteFile(item.id); }} className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"><Trash2 size={12} /></button>
          </div>
        </div>

        {item.isFolder && isExpanded && (
          <div className="flex flex-col mt-0.5">
            {item.children.length === 0 ? (
              <div style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }} className="py-1 text-[10px] text-white/10 italic">Empty</div>
            ) : (
              item.children.sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0)).map(child => (
                <RenderTree key={child.id} item={child} depth={depth + 1} />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-[#09090b] flex flex-col shrink-0 overflow-hidden">
      <div className="h-10 px-4 flex items-center justify-between bg-[#09090b] shrink-0 border-b border-white/[0.04]">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Explorer</h2>
        <div className="flex gap-1">
          <button onClick={() => onAddFile('root')} className="p-1 hover:bg-white/[0.04] rounded-md text-white/20 hover:text-white transition-all"><Plus size={14} /></button>
          <button onClick={() => onAddFolder('root')} className="p-1 hover:bg-white/[0.04] rounded-md text-white/20 hover:text-white transition-all"><FolderPlus size={14} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <RenderTree item={fileTree} />
      </div>
    </div>
  );
};

export default FileExplorer;
