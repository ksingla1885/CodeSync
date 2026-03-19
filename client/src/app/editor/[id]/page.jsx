'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

const INITIAL_FILES = [{ id: '1', name: 'main.js', language: 'javascript', content: '// Happy coding!' }];

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
  const [currentUser, setCurrentUser] = useState({ name: 'User', email: '', color: '#8a2be2' });
  const [project, setProject] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Normalize id/_id
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
      } catch (err) {
        console.error('Failed to fetch project:', err);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);
  // Modal States
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabCode, setCollabCode] = useState('');
  const [collabStatus, setCollabStatus] = useState({ type: '', message: '' });
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabStep, setCollabStep] = useState(1); // 1: Email, 2: Code
  const [confirmationModal, setConfirmationModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
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

  const handleRunCode = async () => {
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
  };

  const handleRequestCollabCode = async () => {
    if (!collabEmail) return;
    setCollabLoading(true);
    setCollabStatus({ type: 'loading', message: 'Sending verification code...' });
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setCollabStatus({ type: 'success', message: 'Verification code sent!' });
        setCollabStep(2);
      } else {
        setCollabStatus({ type: 'error', message: data.error || 'Failed to send code' });
      }
    } catch (err) {
      setCollabStatus({ type: 'error', message: 'Connection failed' });
    } finally {
      setCollabLoading(false);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!collabEmail || !collabCode) return;
    setCollabLoading(true);
    setCollabStatus({ type: 'loading', message: 'Adding...' });
    try {
      const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail, code: collabCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setCollabStatus({ type: 'success', message: 'Added successfully!' });
        setCollabEmail('');
        setCollabCode('');
        setCollabStep(1);
        setTimeout(() => setCollabStatus({ type: '', message: '' }), 3000);
        // Optionally refetch project to update collaborator list
        const updatedProjectRes = await fetch(`${SERVER_URL}/api/projects/${projectId}`);
        const updatedProjectData = await updatedProjectRes.json();
        if (updatedProjectRes.ok) setProject(updatedProjectData);
      } else {
        setCollabStatus({ type: 'error', message: data.error || 'Failed to add' });
      }
    } finally {
      setCollabLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id; // Requester ID (handle legacy 'id' field)

    setConfirmationModal({
      isOpen: true,
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator from the project? They will lose access immediately.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/${projectId}/collaborators/${collaboratorId}?userId=${userId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (res.ok) {
            setCollabStatus({ type: 'success', message: 'Collaborator removed' });
            // Refetch project
            const updatedProjectRes = await fetch(`${SERVER_URL}/api/projects/${projectId}`);
            const updatedProjectData = await updatedProjectRes.json();
            if (updatedProjectRes.ok) setProject(updatedProjectData);
            setTimeout(() => setCollabStatus({ type: '', message: '' }), 3000);
          } else {
            setCollabStatus({ type: 'error', message: data.error || 'Failed to remove' });
          }
        } catch (err) {
          setCollabStatus({ type: 'error', message: 'Connection error' });
        }
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };


  const handleAddFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    const file = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFileName,
      language: newFileName.endsWith('.js') ? 'javascript' : 
                newFileName.endsWith('.css') ? 'css' : 
                newFileName.endsWith('.html') ? 'html' : 'plaintext',
      content: '// New file'
    };
    
    addFile(file);
    setIsNewFileModalOpen(false);
    setNewFileName('');
    setSelectedFileId(file.id);
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const folder = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFolderName,
      isFolder: true,
      content: ''
    };

    addFile(folder);
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete.id);
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
      if (selectedFileId === fileToDelete.id) {
        setSelectedFileId('1'); // Fallback to main
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0d0d] text-white overflow-hidden select-none">
      {/* Navbar */}
      <nav className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-[#141414] z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8a2be2] flex items-center justify-center shadow-lg shadow-[#8a2be2]/30">
              <Layout size={15} />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px]">CodeSync</span>
              <span className="text-white/20 mx-1">/</span>
              <span className="text-white/50 text-sm font-mono truncate max-w-[120px]">{projectId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            {connected ? 'LIVE' : 'SYNCING'}
          </div>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setIsCollaboratorModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs text-white/70 hover:text-white"
          >
            <Users size={14} />
            Collaborators
          </button>

          <button
            onClick={handleRunCode}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#8a2be2] hover:bg-[#7a1bd2] transition-all font-bold text-xs"
          >
            <Play size={10} fill="currentColor" />
            Run
          </button>

          <button
            onClick={() => setShowChat((v) => !v)}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'text-[#8a2be2] bg-[#8a2be2]/10' : 'text-white/40 hover:text-white'}`}
          >
            <MessageSquare size={17} />
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          files={files}
          selectedFile={selectedFile}
          onFileSelect={(f) => setSelectedFileId(f.id)}
          onAddFile={() => setIsNewFileModalOpen(true)}
          onAddFolder={() => setIsNewFolderModalOpen(true)}
          onDeleteFile={(id) => { setFileToDelete(files.find(f => f.id === id)); setIsDeleteModalOpen(true); }}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Tabs */}
          <div className="h-10 bg-[#141414]/50 border-b border-white/5 flex items-end flex-shrink-0 overflow-x-auto">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`h-full px-5 flex items-center gap-2 text-[11px] font-medium border-r border-white/5 transition-all relative ${
                  file.id === selectedFileId ? 'bg-[#0d0d0d] text-[#c084fc]' : 'text-white/30 hover:text-white/60'
                }`}
              >
                {file.id === selectedFileId && <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#8a2be2]" />}
                {file.name}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 relative">
            <CodeEditor
              code={code}
              ytext={ytext}
              connected={connected}
              language={selectedFile.language}
              onChange={(c) => updateCode(c)}
              cursors={cursors}
              onCursorChange={(p) => updateCursor(p, currentUser)}
            />
          </div>

          {showOutput && <OutputPanel output={output} isLoading={isRunning} onClose={() => setShowOutput(false)} />}
        </main>

        {showChat && <ChatPanel messages={messages} inputMessage={inputMessage} setInputMessage={setInputMessage} onSend={() => { sendMessage(inputMessage, currentUser); setInputMessage(''); }} onClose={() => setShowChat(false)} />}
      </div>

      {/* Collaborator Modal */}
      <Modal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        title="Project Collaborators"
        footer={<button onClick={() => setIsCollaboratorModalOpen(false)} className="px-5 py-2 rounded-xl bg-white/5 text-sm font-bold">Done</button>}
      >
        <div className="space-y-8">
            {collabStep === 1 ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Collaborator Email</label>
                    <div className="relative group">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#8a2be2] transition-colors" size={14} />
                       <input 
                          type="email" 
                          value={collabEmail}
                          onChange={(e) => setCollabEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#8a2be2]/50 transition-all shadow-inner"
                       />
                    </div>
                  </div>

                  <button 
                    onClick={handleRequestCollabCode}
                    disabled={collabLoading || !collabEmail}
                    className="w-full py-4 bg-[#8a2be2] hover:bg-[#7a1bd2] rounded-xl text-sm font-bold shadow-lg shadow-[#8a2be2]/20 transition-all disabled:opacity-50"
                  >
                    {collabLoading ? 'Requesting Code...' : 'Send Verification Code'}
                  </button>
               </div>
            ) : (
               <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="p-3 bg-white/5 border border-dashed border-white/10 rounded-xl text-center">
                     <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Code sent to</p>
                     <p className="text-sm font-bold text-[#c084fc]">{collabEmail}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center block">Enter 6-Digit Code</label>
                    <input 
                      required
                      type="text" 
                      maxLength={6}
                      value={collabCode}
                      onChange={(e) => setCollabCode(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-4xl font-black tracking-[0.5em] focus:outline-none focus:border-[#8a2be2]/50 transition-all text-[#8a2be2]"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleAddCollaborator}
                      className="w-full py-4 bg-[#8a2be2] hover:bg-[#7a1bd2] rounded-xl text-sm font-bold shadow-lg shadow-[#8a2be2]/20 transition-all disabled:opacity-50" 
                      disabled={collabLoading || collabCode.length !== 6}
                    >
                       {collabLoading ? 'Verifying...' : 'Verify & Add'}
                    </button>
                    <button 
                      onClick={() => { setCollabStep(1); setCollabCode(''); }}
                      className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
               </div>
            )}

            {collabStatus.message && (
              <p className={`text-[11px] font-medium flex items-center justify-center gap-1.5 mt-2 ${collabStatus.type === 'success' ? 'text-green-400' : collabStatus.type === 'error' ? 'text-red-400' : 'text-white/40'}`}>
                {collabStatus.message}
              </p>
            )}
        </div>

        <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Current Team</label>
               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Project Owner */}
                  {project?.owner && (
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/[0.08] transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#8a2be2] flex items-center justify-center text-xs font-black">
                             {project.owner.name ? project.owner.name[0].toUpperCase() : 'O'}
                          </div>
                          <div>
                             <p className="text-sm font-bold">
                                {project.owner.name} <span className="text-[10px] font-normal text-white/30 ml-1 bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">Owner</span>
                             </p>
                             <p className="text-[11px] text-white/30">{project.owner.email}</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Collaborators */}
                  {project?.collaborators && Array.isArray(project.collaborators) && project.collaborators.map((collab, index) => {
                    // Check if current user is the project owner
                    const ownerId = project.owner?._id || project.owner;
                    const isOwner = currentUser?._id && ownerId && (currentUser._id.toString() === ownerId.toString());

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black">
                              {collab.name ? collab.name[0].toUpperCase() : 'C'}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{collab.name}</p>
                              <p className="text-[11px] text-white/30">{collab.email}</p>
                            </div>
                        </div>
                        {isOwner && (
                          <button 
                            onClick={() => handleRemoveCollaborator(collab._id)}
                            className="p-2 text-white/10 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Remove Collaborator"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
      </Modal>
      
      {/* New File Modal */}
      <Modal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        title="Create New File"
      >
        <form onSubmit={handleAddFile} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">File Name</label>
            <input 
              autoFocus
              required
              type="text" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. styles.css"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8a2be2]/50 transition-all font-mono text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsNewFileModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-[#8a2be2] hover:bg-[#7a1bd2] text-sm font-bold shadow-lg shadow-[#8a2be2]/20 transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* New Folder Modal */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title="Create New Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Folder Name</label>
            <input 
              autoFocus
              required
              type="text" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. components"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8a2be2]/50 transition-all font-mono text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsNewFolderModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-[#8a2be2] hover:bg-[#7a1bd2] text-sm font-bold shadow-lg shadow-[#8a2be2]/20 transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete File"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <Trash2 className="text-red-400" size={24} />
            <p className="text-sm text-red-200/70 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-red-200">"{fileToDelete?.name}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold shadow-lg shadow-red-500/20 transition-all"
            >
              Delete File
            </button>
          </div>
        </div>
      </Modal>
      {/* Footer */}
      <footer className="h-6 bg-[#8a2be2] px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#141414] flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>● {connected ? 'Connected' : 'Reconnecting'}</span>
          <span className="opacity-50">Branch: main</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{selectedFile.language}</span>
        </div>
      </footer>
      <ConfirmationModal 
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
      />
    </div>
  );
}
