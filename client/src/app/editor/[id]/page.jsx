'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import FileExplorer from '@/components/FileExplorer/FileExplorer';
import CodeEditor from '@/components/Editor/LazyEditor';
import ChatPanel from '@/components/ChatPanel/ChatPanel';
import OutputPanel from '@/components/Editor/OutputPanel';
import Modal from '@/components/UI/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';

import useCollaboration from '@/hooks/useCollaboration';
import {
  Play,
  MessageSquare,
  Settings,
  Layout,
  Copy,
  Check,
  Trash2,
  Users,
  UserPlus,
  Mail,
  ArrowLeft,
  X,
  Code2,
  ChevronRight,
  Monitor,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

const INITIAL_FILES = [{ id: '1', name: 'main.js', language: 'javascript', content: '// Happy coding!' }];

// Defensive stringification helper to prevent [object Object] errors
const safeRender = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    const res = val.name || val.label || val.email || val.title || val.message;
    if (res && typeof res === 'string') return res;
    if (res && typeof res === 'number') return String(res);
    if (typeof val.toString === 'function' && val.toString() !== '[object Object]') return val.toString();
    try { return JSON.stringify(val); } catch (e) { return fallback || '[Complex Object]'; }
  }
  return String(val);
};

export default function EditorPage() {
  const params = useParams();
  const projectId = params.id;
  
  const [selectedFileId, setSelectedFileId] = useState('1');
  const [showChat, setShowChat] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'User', email: '', color: '#3b82f6' });
  const [project, setProject] = useState(null);
  const [openFileIds, setOpenFileIds] = useState(['1']);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.id && !parsedUser._id) parsedUser._id = parsedUser.id;
      setCurrentUser(prev => ({ ...prev, ...parsedUser }));
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/projects/${projectId}`);
        const data = await res.json();
        if (res.ok) setProject(data);
      } catch (err) {}
    };
    if (projectId) fetchProject();
  }, [projectId]);

  // Modal States
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
  
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [activeParentId, setActiveParentId] = useState('root');
  const [fileToDelete, setFileToDelete] = useState(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabCode, setCollabCode] = useState('');
  const [collabStatus, setCollabStatus] = useState({ type: '', message: '' });
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabStep, setCollabStep] = useState(1);
  const [confirmationModal, setConfirmationModal] = useState({ 
    isOpen: false, title: '', message: '', onConfirm: () => {} 
  });

  const { 
    code,
    files, 
    addFile, 
    deleteFile,
    updateCode, 
    cursors, 
    updateCursor, 
    messages, 
    sendMessage, 
    connected,
    ytext
  } = useCollaboration(projectId, selectedFileId, INITIAL_FILES);

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId) || files[0] || INITIAL_FILES[0];
  }, [files, selectedFileId]);

  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setShowOutput(true);
    setOutput('');
    try {
      const res = await fetch(`${SERVER_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: selectedFile.language }),
      });
      const data = await res.json();
      setOutput(data.output || data.error || 'No output');
    } catch (err) {
      setOutput(`⚠️ Execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, code, selectedFile.language]);

  const handleRequestCollabCode = async () => {
    if (!collabEmail) return;
    const isOwner = project?.owner?.email === collabEmail;
    const isAlreadyCollab = project?.collaborators?.some(c => c.email === collabEmail);
    if (isOwner || isAlreadyCollab) {
      setCollabStatus({ type: 'error', message: isOwner ? "You are the owner." : "Already a collaborator." });
      return;
    }
    setCollabLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail, type: 'collaboration', projectName: project?.name, ownerName: project?.owner?.name }),
      });
      if (res.ok) { setCollabStatus({ type: 'success', message: 'Code sent!' }); setCollabStep(2); }
      else { const data = await res.json(); setCollabStatus({ type: 'error', message: data.error || 'Failed' }); }
    } catch (err) {} finally { setCollabLoading(false); }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!collabEmail || !collabCode) return;
    setCollabLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail, code: collabCode }),
      });
      if (res.ok) {
        setCollabStatus({ type: 'success', message: 'Added!' });
        setCollabEmail(''); setCollabCode(''); setCollabStep(1);
        const updated = await (await fetch(`${SERVER_URL}/api/projects/${projectId}`)).json();
        setProject(updated);
      } else { const data = await res.json(); setCollabStatus({ type: 'error', message: data.error || 'Failed' }); }
    } finally { setCollabLoading(false); }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Remove Member',
      message: 'Remove this collaborator? They will lose access immediately.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/collaborators/${collaboratorId}?userId=${currentUser?._id}`, { method: 'DELETE' });
          if (res.ok) {
            const updated = await (await fetch(`${SERVER_URL}/api/projects/${projectId}`)).json();
            setProject(updated);
          }
        } catch (err) {}
      }
    });
  };

  const handleAddFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const file = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFileName, 
      parentId: String(activeParentId),
      language: newFileName.endsWith('.js') ? 'javascript' : newFileName.endsWith('.css') ? 'css' : newFileName.endsWith('.html') ? 'html' : 'plaintext',
      content: '// New file'
    };
    addFile(file); setIsNewFileModalOpen(false); setNewFileName(''); setSelectedFileId(file.id);
    setOpenFileIds(prev => [...new Set([...prev, file.id])]);
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: newFolderName, 
      isFolder: true, 
      parentId: String(activeParentId), 
      content: '' 
    };
    addFile(folder); setIsNewFolderModalOpen(false); setNewFolderName('');
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete.id); setIsDeleteModalOpen(false); setFileToDelete(null);
      setOpenFileIds(prev => prev.filter(id => id !== fileToDelete.id));
      if (selectedFileId === fileToDelete.id) setSelectedFileId('1');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-[#fafafa] overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 bg-[#09090b] z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/[0.04] rounded-lg text-white/40 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-xs">
                <span className="text-white/40">Projects</span>
                <ChevronRight size={12} className="text-white/20" />
                <span className="font-medium">{safeRender(project?.name, 'Loading...')}</span>
                <span className="text-white/20 px-2">/</span>
                <span className="text-white/40">{safeRender(project?.folder, 'Root')}</span>
             </div>
             {connected && (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
               </div>
             )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 mr-2">
             {project?.collaborators?.slice(0, 3).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#09090b] bg-white/10 flex items-center justify-center text-[8px] font-bold uppercase" title={safeRender(c.email)}>
                   {safeRender(c.name?.[0] || c.email?.[0] || '?', '?')}
                </div>
             ))}
             {project?.collaborators?.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-[#09090b] bg-white/5 flex items-center justify-center text-[8px] font-bold text-white/40">
                   +{project.collaborators.length - 3}
                </div>
             )}
          </div>

          <button
            onClick={() => setIsCollaboratorModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <Users size={14} />
            Share
          </button>

          <div className="w-px h-4 bg-white/[0.06] mx-1" />

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-all font-semibold text-xs active:scale-95 disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
            Run
          </button>

          <button
            onClick={() => setIsProjectSettingsModalOpen(true)}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => setShowChat(v => !v)}
            className={`p-2 rounded-lg transition-all ${showChat ? 'text-white bg-white/[0.08]' : 'text-white/40 hover:text-white hover:bg-white/[0.04]'}`}
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Explorer) */}
        <div className="w-64 border-r border-white/[0.06] bg-[#09090b] flex flex-col shrink-0">
           <FileExplorer
            files={files}
            selectedFile={selectedFile}
            onFileSelect={(f) => {
              setSelectedFileId(f.id);
              if (!openFileIds.includes(f.id)) setOpenFileIds(prev => [...prev, f.id]);
            }}
            onAddFile={(parentId) => { setActiveParentId(parentId); setIsNewFileModalOpen(true); }}
            onAddFolder={(parentId) => { setActiveParentId(parentId); setIsNewFolderModalOpen(true); }}
            onDeleteFile={(id) => { setFileToDelete(files.find(f => f.id === id)); setIsDeleteModalOpen(true); }}
          />
        </div>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
          {/* Tab Bar */}
          <div className="h-10 border-b border-white/[0.06] flex items-center bg-[#09090b] overflow-x-auto no-scrollbar">
            {files.filter(f => openFileIds.includes(f.id) && !f.isFolder).map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`h-full px-4 flex items-center gap-2 text-xs font-medium border-r border-white/[0.06] transition-all cursor-pointer relative group min-w-[120px] ${
                  file.id === selectedFileId ? 'bg-white/[0.03] text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.01]'
                }`}
              >
                {file.id === selectedFileId && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                <span className="truncate flex-1">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = openFileIds.filter(id => id !== file.id);
                    setOpenFileIds(next);
                    if (selectedFileId === file.id && next.length > 0) setSelectedFileId(next[next.length - 1]);
                  }}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1 relative min-h-0">
            {openFileIds.length > 0 ? (
              <CodeEditor
                code={code} ytext={ytext} connected={connected} language={selectedFile.language}
                onChange={(c) => updateCode(c)} cursors={cursors}
                onCursorChange={(p) => updateCursor(p, currentUser)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 space-y-4">
                <div className="p-8 rounded-full border border-dashed border-white/5">
                   <Code2 size={48} />
                </div>
                <p className="text-xs font-medium uppercase tracking-widest">Select a file to begin</p>
              </div>
            )}
          </div>

          {showOutput && <OutputPanel output={output} isLoading={isRunning} onClose={() => setShowOutput(false)} />}
        </main>

        {showChat && (
          <div className="w-80 border-l border-white/[0.06] bg-[#09090b] flex flex-col shrink-0">
            <ChatPanel messages={messages} inputMessage={inputMessage} setInputMessage={setInputMessage} onSend={() => { sendMessage(inputMessage, currentUser); setInputMessage(''); }} onClose={() => setShowChat(false)} />
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <footer className="h-6 border-t border-white/[0.06] bg-[#09090b] px-4 flex items-center justify-between text-[10px] font-medium text-white/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <span className={`w-1 h-1 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
             <span>{connected ? 'Ready' : 'Connecting...'}</span>
          </div>
          <span className="flex items-center gap-1"><Monitor size={10} /> main</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span className="text-white/50">{selectedFile.language}</span>
        </div>
      </footer>

      {/* Modals Container */}
      <Modals 
        isNewFileModalOpen={isNewFileModalOpen} setIsNewFileModalOpen={setIsNewFileModalOpen}
        isNewFolderModalOpen={isNewFolderModalOpen} setIsNewFolderModalOpen={setIsNewFolderModalOpen}
        isDeleteModalOpen={isDeleteModalOpen} setIsDeleteModalOpen={setIsDeleteModalOpen}
        isCollaboratorModalOpen={isCollaboratorModalOpen} setIsCollaboratorModalOpen={setIsCollaboratorModalOpen}
        isProjectSettingsModalOpen={isProjectSettingsModalOpen} setIsProjectSettingsModalOpen={setIsProjectSettingsModalOpen}
        newFileName={newFileName} setNewFileName={setNewFileName} handleAddFile={handleAddFile}
        newFolderName={newFolderName} setNewFolderName={setNewFolderName} handleCreateFolder={handleCreateFolder}
        fileToDelete={fileToDelete} handleConfirmDelete={handleConfirmDelete}
        collabEmail={collabEmail} setCollabEmail={setCollabEmail}
        collabCode={collabCode} setCollabCode={setCollabCode}
        collabStatus={collabStatus} setCollabStatus={setCollabStatus}
        collabLoading={collabLoading} collabStep={collabStep} setCollabStep={setCollabStep}
        handleRequestCollabCode={handleRequestCollabCode} handleAddCollaborator={handleAddCollaborator}
        project={project} currentUser={currentUser} handleRemoveCollaborator={handleRemoveCollaborator}
      />

      <ConfirmationModal 
        isOpen={confirmationModal.isOpen} title={confirmationModal.title} message={confirmationModal.message}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
      />
    </div>
  );
}

function Modals({ 
  isNewFileModalOpen, setIsNewFileModalOpen,
  isNewFolderModalOpen, setIsNewFolderModalOpen,
  isDeleteModalOpen, setIsDeleteModalOpen,
  isCollaboratorModalOpen, setIsCollaboratorModalOpen,
  isProjectSettingsModalOpen, setIsProjectSettingsModalOpen,
  newFileName, setNewFileName, handleAddFile,
  newFolderName, setNewFolderName, handleCreateFolder,
  fileToDelete, handleConfirmDelete,
  collabEmail, setCollabEmail,
  collabCode, setCollabCode,
  collabStatus, setCollabStatus,
  collabLoading, collabStep, setCollabStep,
  handleRequestCollabCode, handleAddCollaborator,
  project, currentUser, handleRemoveCollaborator
}) {
  return (
    <>
      <Modal isOpen={isNewFileModalOpen} onClose={() => setIsNewFileModalOpen(false)} title="New File">
        <form onSubmit={handleAddFile} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">File Name</label>
            <input autoFocus required type="text" placeholder="main.js" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all">Create File</button>
        </form>
      </Modal>

      <Modal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} title="New Folder">
        <form onSubmit={handleCreateFolder} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Folder Name</label>
            <input autoFocus required type="text" placeholder="components" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all">Create Folder</button>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete">
        <div className="space-y-6">
          <p className="text-sm text-white/40">Are you sure you want to delete <span className="text-white font-medium">{fileToDelete?.name}</span>? This is permanent.</p>
          <div className="flex gap-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/[0.04] text-white/60 text-sm font-medium hover:bg-white/[0.08] transition-all">Cancel</button>
            <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCollaboratorModalOpen} onClose={() => setIsCollaboratorModalOpen(false)} title="Team Members">
        <div className="space-y-8">
           <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">Invite</label>
              {collabStep === 1 ? (
                <div className="flex gap-2">
                  <input type="email" placeholder="Email..." value={collabEmail} onChange={(e) => setCollabEmail(e.target.value)} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/20 transition-all" />
                  <button onClick={handleRequestCollabCode} disabled={collabLoading || !collabEmail} className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90 transition-all disabled:opacity-30">Send</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="text" maxLength={6} placeholder="000000" value={collabCode} onChange={(e) => setCollabCode(e.target.value)} className="w-full bg-transparent border-b border-white/20 text-center text-2xl font-bold py-2 focus:border-white transition-all" />
                  <button onClick={handleAddCollaborator} className="w-full py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90">Verify & Add</button>
                </div>
              )}
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30">Current Team</label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                <TeamMember user={project?.owner} role="Owner" />
                {project?.collaborators?.map((c, i) => (
                  <TeamMember key={i} user={c} role="Editor" onRemove={() => handleRemoveCollaborator(c._id)} showRemove={project?.owner?._id === currentUser?._id} />
                ))}
              </div>
           </div>
        </div>
      </Modal>
      
      {/* Project Settings Modal */}
      <Modal isOpen={isProjectSettingsModalOpen} onClose={() => setIsProjectSettingsModalOpen(false)} title="Project Settings">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Project Name</label>
              <input 
                type="text" 
                defaultValue={project?.name} 
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all text-white/60 cursor-not-allowed" 
                disabled 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Environment</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/60">
                <Monitor size={14} />
                Node.js v18.x (Auto-detected)
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20">Collaborator Access</h4>
            <button 
              onClick={() => { setIsProjectSettingsModalOpen(false); setIsCollaboratorModalOpen(true); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-3 text-sm font-medium">
                <Users size={16} className="text-white/40 group-hover:text-white" />
                Manage Team
              </div>
              <ChevronRight size={14} className="text-white/20" />
            </button>
          </div>

          <div className="pt-6">
             <button 
              onClick={() => setIsProjectSettingsModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function TeamMember({ user, role, onRemove, showRemove }) {
  if (!user) return null;
  return (
    <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-bold uppercase">{safeRender(user.name?.[0] || user.email?.[0] || 'U', 'U')}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{safeRender(user.name, 'User')}</p>
          <p className="text-[10px] text-white/30 truncate">{safeRender(user.email, '')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span className="text-[8px] font-bold uppercase tracking-widest text-white/20 border border-white/10 px-1.5 py-0.5 rounded-md">{role}</span>
        {showRemove && onRemove && (
          <button onClick={onRemove} className="p-1.5 text-white/10 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );
}

