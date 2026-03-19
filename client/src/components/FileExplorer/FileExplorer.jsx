'use client';
import React from 'react';
import { File, Plus, Trash2, Code2, FileCode, Hash, FolderPlus, Folder } from 'lucide-react';

const FileExplorer = ({ files, selectedFile, onFileSelect, onAddFile, onAddFolder, onDeleteFile }) => {
  const getFileIcon = (file, active) => {
    if (file.isFolder) {
      return <Folder size={13} className={active ? 'text-white' : 'text-white/40 group-hover:text-white/70'} fill="currentColor" fillOpacity={0.2} />;
    }
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();
    const iconClass = active ? 'text-white' : 'text-white/40 group-hover:text-white/70';
    
    if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
      return <Code2 size={13} className={iconClass} />;
    }
    if (ext === 'html') {
      return <FileCode size={13} className={iconClass} />;
    }
    if (ext === 'css') {
      return <Hash size={13} className={iconClass} />;
    }
    return <File size={13} className={iconClass} />;
  };

  const getIconBg = (file, active) => {
    if (active) return 'bg-[#8a2be2]';
    if (file.isFolder) return 'bg-white/5 group-hover:bg-white/10';
    
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'js') return 'bg-yellow-500/10 group-hover:bg-yellow-500/20';
    if (ext === 'html') return 'bg-orange-500/10 group-hover:bg-orange-500/20';
    if (ext === 'css') return 'bg-blue-500/10 group-hover:bg-blue-500/20';
    return 'bg-white/5 group-hover:bg-white/10';
  };

  return (
    <div className="w-60 h-full bg-[#141414] border-r border-white/5 flex flex-col flex-shrink-0">
      <div className="p-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
          Explorer
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={onAddFile}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
            title="New File"
          >
            <Plus size={13} />
          </button>
          <button 
            onClick={onAddFolder}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
            title="New Folder"
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {files.map((file) => {
          const active = selectedFile?.id === file.id;
          return (
            <div
              key={file.id}
              onClick={() => !file.isFolder && onFileSelect(file)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group relative ${
                active
                  ? 'bg-[#8a2be2]/15 text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              <div
                className={`p-1 rounded-md flex-shrink-0 transition-colors ${getIconBg(file, active)}`}
              >
                {getFileIcon(file, active)}
              </div>
              <span className={`text-sm font-medium truncate flex-1 ${file.isFolder ? 'text-white/60' : ''}`}>{file.name}</span>
              
              {/* Delete button (hidden by default, shown on hover, unless only 1 file exists) */}
              {(files.length > 1 || file.isFolder) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"
                  title={file.isFolder ? "Delete Folder" : "Delete File"}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileExplorer;

