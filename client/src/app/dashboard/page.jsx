'use client';
import React, { useState, useEffect } from 'react';
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
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [serverStatus, setServerStatus] = useState('unknown'); // 'online', 'offline', 'unknown'
  
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

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [projectToMove, setProjectToMove] = useState(null);
  const [targetFolder, setTargetFolder] = useState('');

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
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to move project');
      }
    } catch (err) {
      console.error('Error moving project:', err);
    }
  };

  const userId = user?.id;

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', folder: '' });
  const [tempFolderName, setTempFolderName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

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
      const res = await fetch(`${SERVER_URL}/api/projects?userId=${userId}`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setProjects(data);
      } else {
        const errorMessage = data.error || 'Server returned invalid data format';
        console.error('Fetch Projects Failed:', errorMessage);
        setProjects([]);
        // Optional: Signal to UI that there's a backend issue
      }
    } catch (err) {
      console.error('Network or Parsing Error:', err);
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
    console.log('🚮 handleDeleteProject initiated for project:', projectId);
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        console.log('✅ Deletion confirmed for project:', projectId);
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/${projectId}`, {
            method: 'DELETE',
          });
          console.log('📡 DELETE request status:', res.status, res.ok);
          if (res.ok) {
            console.log('✨ Project deleted successfully, refreshing list...');
            await fetchProjects();
          } else {
            const errData = await res.json();
            console.error('❌ Delete failed:', errData);
          }
        } catch (err) {
          console.error('💥 Network or Request Error during delete:', err);
        }
      }
    });
  };

  const handleClearAll = async () => {
    console.log('🚮 handleClearAll initiated');
    setConfirmationModal({
      isOpen: true,
      title: 'Clear Workspace',
      message: 'Are you sure you want to delete ALL projects and folders? This will permanently remove all your work.',
      onConfirm: async () => {
        console.log('✅ Workspace clear confirmed');
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/clear?userId=${userId}`, {
            method: 'DELETE',
          });
          console.log('📡 CLEAR DELETE request status:', res.status, res.ok);
          if (res.ok) {
            console.log('✨ Workspace cleared successfully, refreshing list...');
            await fetchProjects();
          } else {
            const errData = await res.json();
            console.error('❌ Clear failed:', errData);
          }
        } catch (err) {
          console.error('💥 Network or Request Error during clear:', err);
        }
      }
    });
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

function ProjectCard({ project, viewMode, onDelete, onMove }) {
  const isUncategorized = project.folder === 'My Projects';

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl transition-all group">
        <Link href={`/editor/${project._id}`} className="flex items-center gap-4 flex-1">
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
        </Link>
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
    <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-[#8a2be2]/30 hover:bg-[#1a1a1a] transition-all group active:scale-[0.98] relative overflow-hidden cursor-pointer">
      <Link href={`/editor/${project._id}`} className="absolute inset-0 z-0" />
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
               className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/20 hover:text-[#c084fc] hover:border-[#8a2be2]/30 transition-all cursor-pointer shadow-xl"
               title="Move to Folder"
             >
                <FolderPlus size={18} />
             </button>
           )}
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
             className="p-2 text-white/10 hover:text-red-400 transition-colors cursor-pointer"
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
           <div className="w-8 h-8 rounded-full border-2 border-[#141414] bg-white/5 border-dashed flex items-center justify-center text-white/20 hover:text-white hover:border-[#8a2be2] transition-all cursor-pointer">
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
