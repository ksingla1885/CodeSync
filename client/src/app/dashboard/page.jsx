'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Folder, 
  Plus, 
  Search, 
  MoreVertical, 
  Users, 
  Clock, 
  ChevronRight,
  LayoutGrid,
  List,
  FolderPlus,
  Trash2,
  LogOut,
  Loader2
} from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export default function Dashboard() {

  
  // Auth User
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // If no user, redirect to login
      window.location.href = '/login';
    }
  }, []);

  const userId = user?.id;
  const router = useRouter();

  // Modal States
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isAddCollabModalOpen, setIsAddCollabModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Data States
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const [viewMode, setViewMode] = useState('grid');

  // Input States
  const [newProjectData, setNewProjectData] = useState({ name: '', folder: '' });
  const [tempFolderName, setTempFolderName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Collaborator States
  const [selectedProjectForCollab, setSelectedProjectForCollab] = useState(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabCode, setCollabCode] = useState('');
  const [collabStatus, setCollabStatus] = useState({ type: '', message: '' });
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabStep, setCollabStep] = useState(1); // 1: Email, 2: Code

  // Move States
  const [projectToMove, setProjectToMove] = useState(null);
  const [targetFolder, setTargetFolder] = useState('');

  useEffect(() => {
    if (userId) {
      checkServerHealth();
      fetchProjects();
    }
  }, [userId]);

  const checkServerHealth = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/health`);
      if (res.ok) setServerStatus('online');
      else setServerStatus('offline');
    } catch (err) {
      setServerStatus('offline');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/projects?userId=${userId}`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('Fetch Projects Failed:', data.error || 'Invalid format');
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${SERVER_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProjectData, userId }),
      });
      if (res.ok) {
        setIsNewProjectModalOpen(false);
        setNewProjectData({ name: '', folder: '' });
        fetchProjects();
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/${projectId}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            fetchProjects();
          }
        } catch (err) {
          console.error('Error deleting project:', err);
        }
      }
    });
  };

  const handleClearAll = async () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Clear Workspace',
      message: 'Are you sure you want to delete ALL projects and folders? This will permanently remove all your work.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/clear?userId=${userId}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            fetchProjects();
          }
        } catch (err) {
          console.error('Error clearing workspace:', err);
        }
      }
    });
  };

  const handleMoveProject = async () => {
    if (!projectToMove || !targetFolder) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/projects/${projectToMove._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: targetFolder }),
      });
      if (res.ok) {
        setIsMoveModalOpen(false);
        setProjectToMove(null);
        setTargetFolder('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Error moving project:', err);
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

  const handleAddCollaboratorAction = async (e) => {
    e.preventDefault();
    if (!selectedProjectForCollab || !collabEmail || !collabCode) return;
    setCollabLoading(true);
    setCollabStatus({ type: 'loading', message: 'Verifying and adding...' });
    try {
      const res = await fetch(`${SERVER_URL}/api/projects/${selectedProjectForCollab._id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail, code: collabCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setCollabStatus({ type: 'success', message: 'Collaborator added!' });
        setTimeout(() => {
          setIsAddCollabModalOpen(false);
          setCollabEmail('');
          setCollabCode('');
          setCollabStatus({ type: '', message: '' });
          fetchProjects();
        }, 1500);
      } else {
        setCollabStatus({ type: 'error', message: data.error || 'Failed to add' });
      }
    } catch (err) {
      setCollabStatus({ type: 'error', message: 'Connection failed' });
    } finally {
      setCollabLoading(false);
    }
  };

  const groupedProjects = (Array.isArray(projects) ? projects : []).reduce((acc, project) => {
    const folder = project.folder || 'My Projects';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(project);
    return acc;
  }, {});

  const folders = Object.keys(groupedProjects).sort((a, b) => {
    const latestA = Math.max(...groupedProjects[a].map(p => new Date(p.createdAt).getTime()));
    const latestB = Math.max(...groupedProjects[b].map(p => new Date(p.createdAt).getTime()));
    return latestB - latestA;
  });

  const filteredFolders = folders.filter(folder => 
    folder.toLowerCase().includes(searchQuery.toLowerCase()) ||
    groupedProjects[folder].some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Mini Sidebar */}
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-10 bg-[#0d0d0d]">
         <div className="w-12 h-12 rounded-2xl bg-[#8a2be2] flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.2)]">
            <LayoutGrid size={24} />
         </div>
         <nav className="flex flex-col gap-6">
            <div className="p-3 bg-white/5 text-[#8a2be2] rounded-xl cursor-pointer shadow-lg"><LayoutGrid size={22} /></div>
            <div className="p-3 text-white/20 hover:text-white transition-colors cursor-pointer"><Users size={22} /></div>
            <div className="p-3 text-white/20 hover:text-white transition-colors cursor-pointer"><Folder size={22} /></div>
            <div className="p-3 text-white/20 hover:text-white transition-colors cursor-pointer"><Clock size={22} /></div>
         </nav>
         <div className="mt-auto flex flex-col items-center gap-4 mb-8">
            <div 
               className="p-3 text-white/20 hover:text-red-400 transition-colors cursor-pointer group relative" 
               onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}
            >
               <LogOut size={22} />
               <span className="absolute left-[110%] top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">EXIT</span>
            </div>
         </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <nav className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight italic">DASHBOARD</h1>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">{user?.email}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#8a2be2] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm w-80 focus:outline-none focus:border-[#8a2be2]/30 focus:w-96 transition-all placeholder-white/10 font-medium"
              />
            </div>
            
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-white text-black hover:bg-[#8a2be2] hover:text-white transition-all text-sm font-black shadow-xl active:scale-[0.98] cursor-pointer"
            >
              CREATE NEW
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-10 max-w-7xl w-full mx-auto flex-1 custom-scrollbar overflow-y-auto">
          {/* Welcome Section */}
          <div className="mb-16 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-[#8a2be2] uppercase tracking-[0.4em] mb-3">Sync Workspace</p>
              <h2 className="text-5xl font-black tracking-tighter leading-none italic">
                <span className="uppercase">HELLO,</span> <br />
                <span className="text-white/90">
                  {(user?.name || 'Explorer')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')}
                </span>.
              </h2>
            </div>
             <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#8a2be2] shadow-lg text-white' : 'text-white/20 hover:text-white'}`}><LayoutGrid size={20}/></button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#8a2be2] shadow-lg text-white' : 'text-white/20 hover:text-white'}`}><List size={20}/></button>
             </div>
          </div>

          <div className="flex items-center gap-4 mb-12">
             <button onClick={() => setIsNewFolderModalOpen(true)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer">New Folder</button>
             <button onClick={handleClearAll} className="px-6 py-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer">Purge All</button>
          </div>

          {/* Folders & Projects */}
          <div className="space-y-20">
            {serverStatus === 'offline' && (
              <div className="mb-8 p-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <p className="text-sm font-black uppercase tracking-widest text-red-200/50">Connection Lost: Server Unreachable</p>
                </div>
                <button onClick={() => { setLoading(true); checkServerHealth(); fetchProjects(); }} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300">Reconnect</button>
              </div>
            )}

            {loading ? (
               <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-20">
                  <Loader2 className="animate-spin" size={48} />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Synchronizing...</p>
               </div>
            ) : filteredFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/10 mb-8 border border-white/5"><Search size={40} /></div>
                <h3 className="text-2xl font-black italic mb-2">EMPTY WORKSPACE</h3>
                <p className="text-white/20 text-sm font-medium tracking-wide">No projects found. Create one to get started.</p>
              </div>
            ) : filteredFolders.map(folder => (
              <section key={folder}>
                <div className="flex items-center justify-between mb-8 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#8a2be2] border border-white/5 shadow-lg"><Folder size={20} fill="currentColor" fillOpacity={0.1} /></div>
                    <h3 className="text-2xl font-black italic flex items-center gap-3 uppercase">{folder}<span className="text-[10px] font-bold not-italic text-white/20 bg-white/5 px-2.5 py-1 rounded-full">{groupedProjects[folder].length}</span></h3>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                  {groupedProjects[folder].map(project => (
                    <ProjectCard 
                      key={project._id} 
                      project={project} 
                      viewMode={viewMode} 
                      onDelete={() => handleDeleteProject(project._id)} 
                      onMove={(proj) => {
                        setProjectToMove(proj);
                        setIsMoveModalOpen(true);
                      }}
                      onAddCollab={(proj) => {
                        setSelectedProjectForCollab(proj);
                        setIsAddCollabModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewProjectModalOpen(false)} />
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-modal-in transform transition-all">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#8a2be2]/10 flex items-center justify-center text-[#8a2be2]">
                   <Plus size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black italic uppercase italic tracking-tighter">NEW PROJECT</h3>
                   <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Build something amazing</p>
                </div>
             </div>
             
             <form onSubmit={handleCreateProject} className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Project Name</label>
                   <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. INTELLIGENCE v1" 
                      value={newProjectData.name}
                      onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#8a2be2]/50 transition-all placeholder-white/10"
                   />
                </div>
                
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Choose Destination</label>
                   <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                      {folders.map(f => (
                         <button 
                            key={f}
                            type="button"
                            onClick={() => setNewProjectData({...newProjectData, folder: f})}
                            className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${newProjectData.folder === f ? 'bg-[#8a2be2] border-[#8a2be2] text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                         >
                            {f}
                         </button>
                      ))}
                   </div>
                   <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest text-center mt-2 italic">Defaults to 'My Projects' if none selected</p>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                      type="button"
                      onClick={() => setIsNewProjectModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                   >
                      Cancel
                   </button>
                   <button 
                      type="submit"
                      className="flex-1 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#8a2be2] hover:text-white transition-all shadow-xl active:scale-[0.98] cursor-pointer"
                   >
                      Create Now
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Move Project Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMoveModalOpen(false)} />
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-modal-in transform transition-all">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#8a2be2]/10 flex items-center justify-center text-[#8a2be2]">
                   <FolderPlus size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black italic uppercase">Merge to Folder</h3>
                   <p className="text-white/20 text-xs font-bold uppercase tracking-widest">{projectToMove?.name}</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Select Destination</label>
                   <div className="grid grid-cols-2 gap-3">
                      {folders.filter(f => f !== 'My Projects').map(f => (
                         <button 
                            key={f}
                            onClick={() => setTargetFolder(f)}
                            className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all text-center ${targetFolder === f ? 'bg-[#8a2be2] border-[#8a2be2] text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                         >
                            {f}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Or Create New Folder</label>
                   <input 
                      type="text" 
                      placeholder="Custom Folder Name" 
                      value={targetFolder && !folders.includes(targetFolder) ? targetFolder : ''} 
                      onChange={(e) => setTargetFolder(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#8a2be2]/50 transition-all placeholder-white/10"
                   />
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                      onClick={() => setIsMoveModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={handleMoveProject}
                      disabled={!targetFolder}
                      className="flex-1 py-4 rounded-2xl bg-[#8a2be2] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#7a1bd2] transition-all shadow-xl shadow-[#8a2be2]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                   >
                      Confirm Move
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsNewFolderModalOpen(false)} />
          <div className="relative bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8a2be2] to-[#c084fc]" />
             <h3 className="text-2xl font-bold mb-2">Create New Folder</h3>
             <p className="text-white/40 text-sm mb-6 font-medium">Select a project to move it into this folder.</p>
             
             <form onSubmit={async (e) => {
               e.preventDefault();
               if (!selectedProjectId) return;
               
               try {
                 const res = await fetch(`${SERVER_URL}/api/projects/${selectedProjectId}`, {
                   method: 'PATCH',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ folder: tempFolderName }),
                 });
                 if (res.ok) {
                   setIsNewFolderModalOpen(false);
                   setTempFolderName('');
                   setSelectedProjectId('');
                   fetchProjects();
                 }
               } catch (err) {
                 console.error('Error updating project folder:', err);
               }
             }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Folder Name</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    value={tempFolderName}
                    onChange={(e) => setTempFolderName(e.target.value)}
                    placeholder="e.g. Experiments, Client Work"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8a2be2]/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Move Project To This Folder</label>
                  <select 
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8a2be2]/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#141414]">
                      {projects.length === 0 ? 'No projects available' : 'Select a project...'}
                    </option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id} className="bg-[#141414]">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
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
                    Continue
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Add Collaborator Modal */}
      {isAddCollabModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setIsAddCollabModalOpen(false); setCollabStep(1); setCollabStatus({ type: '', message: '' }); }} />
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-3xl overflow-hidden animate-modal-in transform transition-all group">
             {/* Dynamic Accent Bar */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#8a2be2] to-[#c084fc] shadow-[0_0_20px_rgba(138,43,226,0.3)]" />
             
             {/* Header */}
             <div className="text-center space-y-3 mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#8a2be2]/20 to-transparent flex items-center justify-center text-[#8a2be2] mx-auto border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                   {collabStep === 1 ? <Users size={32} /> : <Clock size={32} className="animate-pulse" />}
                </div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                   {collabStep === 1 ? 'Expand Team' : 'Secure Entry'}
                </h3>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] block">
                   {selectedProjectForCollab?.name}
                </p>
             </div>

             <div className="space-y-8">
                {collabStep === 1 ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 block">Collaborator Identity</label>
                      <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-[#8a2be2] transition-colors" size={20} />
                        <input 
                          autoFocus
                          type="email" 
                          placeholder="ENTER EMAIL ADDRESS"
                          value={collabEmail}
                          onChange={(e) => setCollabEmail(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-5 text-sm focus:outline-none focus:border-[#8a2be2]/50 transition-all font-black tracking-wide placeholder-white/5"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleRequestCollabCode}
                      disabled={collabLoading || !collabEmail}
                      className="group/btn relative w-full py-5 rounded-2xl bg-[#8a2be2] text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#9d4edd] transition-all shadow-2xl shadow-[#8a2be2]/20 disabled:opacity-30 active:scale-[0.97] cursor-pointer overflow-hidden"
                    >
                      <span className="relative z-10">{collabLoading ? 'REQUESTING CODE...' : 'CONTINUE'}</span>
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-500" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-center">
                       <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Code sent to</p>
                       <p className="text-sm font-black italic text-[#c084fc]">{collabEmail}</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] text-center block">Access Key</label>
                      <input 
                        required
                        type="text" 
                        maxLength={6}
                        value={collabCode}
                        onChange={(e) => setCollabCode(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-transparent border-b-4 border-white/10 rounded-none px-4 py-4 text-center text-5xl font-black tracking-[0.8em] focus:outline-none focus:border-[#8a2be2] transition-all text-[#8a2be2] placeholder-white/5"
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={handleAddCollaboratorAction}
                        disabled={collabLoading || collabCode.length !== 6}
                        className="group/btn relative w-full py-5 rounded-2xl bg-[#8a2be2] text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#9d4edd] transition-all shadow-2xl shadow-[#8a2be2]/20 disabled:opacity-30 active:scale-[0.97] cursor-pointer overflow-hidden"
                      >
                        <span className="relative z-10">{collabLoading ? 'AUTHORIZING...' : 'VERIFY & ADD'}</span>
                        <div className="absolute inset-0 bg-black/10 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500" />
                      </button>
                      <button 
                        onClick={() => { setCollabStep(1); setCollabCode(''); }}
                        className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-colors cursor-pointer text-center"
                      >
                        ← Edit Credentials
                      </button>
                    </div>
                  </div>
                )}

                {collabStatus.message && (
                  <div className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-[0.2em] animate-in slide-in-from-top-4 duration-500 border ${
                    collabStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    collabStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    'bg-white/5 text-white/30 border-white/5'
                  }`}>
                    {collabStatus.message}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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

function ProjectCard({ project, viewMode, onDelete, onMove, onAddCollab }) {
  const router = useRouter();
  const isUncategorized = project.folder === 'My Projects';

  const handleCardClick = () => {
    router.push(`/editor/${project._id}`);
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className="flex items-center justify-between p-4 bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1">
           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#8a2be2] transition-colors">
              <Users size={18} />
           </div>
           <div>
              <h4 className="font-bold text-white group-hover:text-[#c084fc] transition-colors">{project.name}</h4>
              <p className="text-xs text-white/30 flex items-center gap-2 mt-0.5">
                 <Clock size={12} />
                 Last edited {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
              </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {isUncategorized && (
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMove(project); }}
               className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8a2be2]/10 border border-[#8a2be2]/20 text-[#c084fc] text-[10px] font-black uppercase tracking-widest hover:bg-[#8a2be2] hover:text-white transition-all cursor-pointer shadow-lg shadow-[#8a2be2]/10"
             >
                Move to Folder
             </button>
           )}
           <div className="flex -space-x-2">
              {Array.isArray(project.collaborators) && project.collaborators.slice(0, 3).map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#141414] bg-[#8a2be2] flex items-center justify-center text-[9px] font-bold">
                  {c.name ? c.name[0] : '?'}
                </div>
              ))}
              {Array.isArray(project.collaborators) && project.collaborators.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-[#141414] bg-white/10 flex items-center justify-center text-[9px] font-bold">
                   +{project.collaborators.length - 3}
                </div>
              )}
           </div>
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
             className="p-2 text-white/10 hover:text-red-400 transition-colors cursor-pointer"
           >
              <Trash2 size={18} />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-[#8a2be2]/30 hover:bg-[#1a1a1a] transition-all group active:scale-[0.98] relative overflow-hidden cursor-pointer"
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#8a2be2]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#8a2be2]/10 group-hover:text-[#8a2be2] transition-all">
          <Users size={24} />
        </div>
        <div className="flex gap-2">
           {isUncategorized && (
             <button 
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMove(project); }}
               className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/20 hover:text-[#c084fc] hover:border-[#8a2be2]/30 transition-all cursor-pointer shadow-xl relative z-20"
               title="Move to Folder"
             >
                <FolderPlus size={18} />
             </button>
           )}
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
             className="p-2 text-white/10 hover:text-red-400 transition-colors cursor-pointer relative z-20"
           >
             <Trash2 size={18} />
           </button>
        </div>
      </div>

      <div className="space-y-1 mb-8 relative z-10">
        <h4 className="text-lg font-bold group-hover:text-[#c084fc] transition-colors">{project.name}</h4>
        <div className="flex items-center gap-2 text-xs text-white/30">
           <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
              Active
           </span>
           <span>•</span>
           <span>{project.collaborators.length} collaborators</span>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex -space-x-2">
           {Array.isArray(project.collaborators) && project.collaborators.map((c, i) => (
             <div key={i} title={c.name} className="w-8 h-8 rounded-full border-2 border-[#141414] bg-[#8a2be2] flex items-center justify-center text-[10px] font-black shadow-lg">
               {c.name ? c.name[0] : '?'}
             </div>
           ))}
           <div 
             onClick={(e) => { e.stopPropagation(); onAddCollab(project); }}
             className="w-8 h-8 rounded-full border-2 border-[#141414] bg-white/5 border-dashed flex items-center justify-center text-white/20 hover:text-white hover:border-[#8a2be2] transition-all cursor-pointer"
           >
              <Plus size={12} />
           </div>
        </div>
        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
           {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
