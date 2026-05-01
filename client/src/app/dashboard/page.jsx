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
  Loader2,
  Mail,
  Bell,
  Settings,
  PlusCircle,
  FolderOpen,
  Sparkles,
  Shield,
  Activity,
  X
} from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import CustomSelect from '@/components/UI/custom-select'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export default function Dashboard() {
  // Auth User
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const userId = user?._id;

  // Modal States
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isAddCollabModalOpen, setIsAddCollabModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
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
  const [collabStep, setCollabStep] = useState(1);

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
      if (res.ok && Array.isArray(data)) setProjects(data);
      else setProjects([]);
    } catch (err) {
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
    } catch (err) { }
  };

  const handleDeleteProject = async (projectId) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/${projectId}`, { method: 'DELETE' });
          if (res.ok) fetchProjects();
        } catch (err) { }
      }
    });
  };

  const handleClearAll = async () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Clear Workspace',
      message: 'Delete ALL projects and folders? This is permanent.',
      onConfirm: async () => {
        try {
          const res = await fetch(`${SERVER_URL}/api/projects/clear?userId=${userId}`, { method: 'DELETE' });
          if (res.ok) fetchProjects();
        } catch (err) { }
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
    } catch (err) { }
  };

  const handleRequestCollabCode = async () => {
    if (!collabEmail) return;
    setCollabLoading(true);
    setCollabStatus({ type: 'loading', message: 'Sending code...' });
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail }),
      });
      if (res.ok) {
        setCollabStatus({ type: 'success', message: 'Code sent!' });
        setCollabStep(2);
      } else {
        const data = await res.json();
        setCollabStatus({ type: 'error', message: data.error || 'Failed' });
      }
    } catch (err) {
      setCollabStatus({ type: 'error', message: 'Error' });
    } finally {
      setCollabLoading(false);
    }
  };

  const handleAddCollaboratorAction = async (e) => {
    e.preventDefault();
    if (!selectedProjectForCollab || !collabEmail || !collabCode) return;
    setCollabLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/projects/${selectedProjectForCollab._id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collabEmail, code: collabCode }),
      });
      if (res.ok) {
        setCollabStatus({ type: 'success', message: 'Added!' });
        setTimeout(() => {
          setIsAddCollabModalOpen(false);
          setCollabEmail('');
          setCollabCode('');
          setCollabStatus({ type: '', message: '' });
          fetchProjects();
        }, 1000);
      } else {
        const data = await res.json();
        setCollabStatus({ type: 'error', message: data.error || 'Failed' });
      }
    } catch (err) { } finally {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex font-sans selection:bg-white/10">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.06] flex flex-col p-6 bg-[#09090b] hidden lg:flex">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">C</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">CodeSync</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarLink icon={LayoutGrid} label="Dashboard" active onClick={() => router.push('/dashboard')} />
          <SidebarLink icon={Users} label="Team" onClick={() => setIsAddCollabModalOpen(true)} />
          <SidebarLink icon={FolderOpen} label="Projects" onClick={() => router.push('/dashboard')} />
          <SidebarLink icon={Bell} label="Updates" onClick={() => setIsUpdatesModalOpen(true)} />
          <SidebarLink icon={Settings} label="Settings" onClick={() => setIsSettingsModalOpen(true)} />
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium uppercase">
              {String(user?.name?.[0] || user?.email?.[0] || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{String(user?.name || 'User')}</p>
              <p className="text-xs text-white/40 truncate">{String(user?.email || '')}</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('user'); router.push('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/40 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Overview</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-xs w-48 focus:w-64 focus:outline-none focus:border-white/20 transition-all placeholder-white/20"
              />
            </div>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all active:scale-95"
            >
              <Plus size={14} />
              Create
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 lg:p-12 max-w-6xl w-full mx-auto overflow-y-auto">
          {/* Hero Section */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {String(getGreeting())}, {String(user?.name?.split(' ')[0] || 'there')}
              </h2>
              <p className="text-white/40 text-sm">
                Here's what's happening in your workspace today.
              </p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white'}`}><List size={16} /></button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 mb-12">
            <button onClick={() => setIsNewFolderModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-medium transition-all">
              <FolderPlus size={14} />
              New Folder
            </button>
            <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/[0.04] border border-red-500/10 hover:bg-red-500/[0.08] text-red-400/60 hover:text-red-400 text-xs font-medium transition-all">
              <Trash2 size={14} />
              Clear All
            </button>
          </div>

          {/* Content Area */}
          <div className="space-y-16">
            {serverStatus === 'offline' && (
              <div className="p-4 bg-red-500/[0.06] border border-red-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs font-medium text-red-400">Server unreachable. Check your connection.</p>
                </div>
                <button onClick={() => { setLoading(true); checkServerHealth(); fetchProjects(); }} className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:underline">Retry</button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-white/20" size={32} />
                <p className="text-xs text-white/20 font-medium">Loading workspace...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center text-white/10 mb-6 border border-white/[0.06]">
                  <FolderOpen size={32} />
                </div>
                <h3 className="text-lg font-semibold mb-1">Empty Workspace</h3>
                <p className="text-white/40 text-sm max-w-[240px]">No projects found in this view. Create one to get started.</p>
                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="mt-6 px-6 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-all"
                >
                  Create Project
                </button>
              </div>
            ) : filteredFolders.map(folder => (
              <section key={folder}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40">
                    <Folder size={16} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{folder}</h3>
                  <span className="text-[10px] font-bold text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                    {groupedProjects[folder].length}
                  </span>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                  {groupedProjects[folder].map(project => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      viewMode={viewMode}
                      onDelete={() => handleDeleteProject(project._id)}
                      onMove={(proj) => { setProjectToMove(proj); setIsMoveModalOpen(true); }}
                      onAddCollab={(proj) => { setSelectedProjectForCollab(proj); setIsAddCollabModalOpen(true); }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      {/* Modals Container */}
      <Modals
        isNewProjectModalOpen={isNewProjectModalOpen} setIsNewProjectModalOpen={setIsNewProjectModalOpen}
        isNewFolderModalOpen={isNewFolderModalOpen} setIsNewFolderModalOpen={setIsNewFolderModalOpen}
        isAddCollabModalOpen={isAddCollabModalOpen} setIsAddCollabModalOpen={setIsAddCollabModalOpen}
        isMoveModalOpen={isMoveModalOpen} setIsMoveModalOpen={setIsMoveModalOpen}
        isSettingsModalOpen={isSettingsModalOpen} setIsSettingsModalOpen={setIsSettingsModalOpen}
        isUpdatesModalOpen={isUpdatesModalOpen} setIsUpdatesModalOpen={setIsUpdatesModalOpen}
        newProjectData={newProjectData} setNewProjectData={setNewProjectData}
        folders={folders} handleCreateProject={handleCreateProject}
        tempFolderName={tempFolderName} setTempFolderName={setTempFolderName}
        selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId}
        projects={projects} fetchProjects={fetchProjects}
        projectToMove={projectToMove} setProjectToMove={setProjectToMove}
        targetFolder={targetFolder} setTargetFolder={setTargetFolder} handleMoveProject={handleMoveProject}
        collabEmail={collabEmail} setCollabEmail={setCollabEmail}
        collabCode={collabCode} setCollabCode={setCollabCode}
        collabStatus={collabStatus} setCollabStatus={setCollabStatus}
        collabLoading={collabLoading} collabStep={collabStep} setCollabStep={setCollabStep}
        handleRequestCollabCode={handleRequestCollabCode}
        handleAddCollaboratorAction={handleAddCollaboratorAction}
        selectedProjectForCollab={selectedProjectForCollab}
        user={user}
      />

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarLink({ icon: Icon, label, active = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${active ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.03]'}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all ${danger
        ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06]'
        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ProjectCard({ project, viewMode, onDelete, onMove, onAddCollab }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const MenuDropdown = () => (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-1.5 w-44 bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden py-1"
    >
      <DropdownItem icon={<ChevronRight size={14} />} label="Open" onClick={() => router.push(`/editor/${project._id}`)} />
      <DropdownItem icon={<PlusCircle size={14} />} label="Add Collaborator" onClick={() => { setMenuOpen(false); onAddCollab(project); }} />
      <DropdownItem icon={<FolderPlus size={14} />} label="Move to Folder" onClick={() => { setMenuOpen(false); onMove(project); }} />
      <div className="my-1 border-t border-white/[0.06]" />
      <DropdownItem icon={<Trash2 size={14} />} label="Delete" onClick={() => { setMenuOpen(false); onDelete(); }} danger />
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => router.push(`/editor/${project._id}`)}
        className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-white truncate">{project.name}</h4>
            <p className="text-[10px] text-white/30 flex items-center gap-1.5 mt-0.5">
              <Clock size={10} />
              Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="relative ml-4" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-2 text-white/20 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && <MenuDropdown />}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/editor/${project._id}`)}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all group relative overflow-visible cursor-pointer"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/20 group-hover:text-white transition-all">
          <Users size={20} />
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-2 text-white/20 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && <MenuDropdown />}
        </div>
      </div>

      <h4 className="font-semibold text-base mb-1 group-hover:text-white truncate">{project.name}</h4>
      <div className="flex items-center justify-between mt-6">
        <div className="flex -space-x-2">
          {Array.isArray(project.collaborators) && project.collaborators.slice(0, 3).map((c, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-[#09090b] bg-white/10 flex items-center justify-center text-[8px] font-bold uppercase" title={c.email}>
              {c.name?.[0] || c.email?.[0]}
            </div>
          ))}
          {Array.isArray(project.collaborators) && project.collaborators.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-[#09090b] bg-white/5 flex items-center justify-center text-[8px] font-bold text-white/40">
              +{project.collaborators.length - 3}
            </div>
          )}
        </div>
        <div className="text-[10px] text-white/20 font-medium">
          {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function Modals({
  isNewProjectModalOpen, setIsNewProjectModalOpen,
  isNewFolderModalOpen, setIsNewFolderModalOpen,
  isAddCollabModalOpen, setIsAddCollabModalOpen,
  isMoveModalOpen, setIsMoveModalOpen,
  isSettingsModalOpen, setIsSettingsModalOpen,
  isUpdatesModalOpen, setIsUpdatesModalOpen,
  newProjectData, setNewProjectData,
  folders, handleCreateProject,
  tempFolderName, setTempFolderName,
  selectedProjectId, setSelectedProjectId,
  projects, fetchProjects,
  projectToMove, setProjectToMove,
  targetFolder, setTargetFolder, handleMoveProject,
  collabEmail, setCollabEmail,
  collabCode, setCollabCode,
  collabStatus, setCollabStatus,
  collabLoading, collabStep, setCollabStep,
  handleRequestCollabCode,
  handleAddCollaboratorAction,
  selectedProjectForCollab,
  user
}) {
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

  return (
    <>
      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <ModalWrapper onClose={() => setIsNewProjectModalOpen(false)} title="New Project">
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Project Name</label>
              <input
                autoFocus required type="text" placeholder="Design System..."
                value={newProjectData.name} onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Destination Folder</label>
              <CustomSelect
                value={newProjectData.folder}
                onChange={(val) => setNewProjectData({ ...newProjectData, folder: val })}
                options={[
                  { value: '', label: 'My Projects (Default)' },
                  ...folders.filter(f => f !== 'My Projects').map(f => ({ value: f, label: f }))
                ]}
                placeholder="My Projects (Default)"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all active:scale-95">Create Project</button>
          </form>
        </ModalWrapper>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <ModalWrapper onClose={() => setIsNewFolderModalOpen(false)} title="New Folder">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedProjectId) return;
            const res = await fetch(`${SERVER_URL}/api/projects/${selectedProjectId}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folder: tempFolderName }),
            });
            if (res.ok) { setIsNewFolderModalOpen(false); setTempFolderName(''); setSelectedProjectId(''); fetchProjects(); }
          }} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Folder Name</label>
              <input
                autoFocus required type="text" placeholder="Client Work..."
                value={tempFolderName} onChange={(e) => setTempFolderName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Initial Project</label>
              <CustomSelect
                value={selectedProjectId}
                onChange={(val) => setSelectedProjectId(val)}
                options={[
                  { value: '', label: 'Select project to move...', disabled: true },
                  ...projects.map(p => ({ value: p._id, label: p.name }))
                ]}
                placeholder="Select project..."
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all active:scale-95">Create Folder</button>
          </form>
        </ModalWrapper>
      )}

      {/* Move Project Modal */}
      {isMoveModalOpen && (
        <ModalWrapper onClose={() => setIsMoveModalOpen(false)} title="Move Project">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-white/40 ml-1">Move <span className="text-white font-medium">{projectToMove?.name}</span> to:</p>
              <div className="grid grid-cols-2 gap-2">
                {folders.map(f => (
                  <button key={f} onClick={() => setTargetFolder(f)} className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${targetFolder === f ? 'bg-white text-black border-white' : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.08]'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="h-px bg-white/[0.08]" />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 ml-1">Or Create New Folder</label>
              <input
                type="text" placeholder="Custom..." value={targetFolder && !folders.includes(targetFolder) ? targetFolder : ''}
                onChange={(e) => setTargetFolder(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <button onClick={handleMoveProject} disabled={!targetFolder} className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Confirm Move</button>
          </div>
        </ModalWrapper>
      )}

      {/* Add Collab Modal */}
      {isAddCollabModalOpen && (
        <ModalWrapper onClose={() => { setIsAddCollabModalOpen(false); setCollabStep(1); setCollabStatus({ type: '', message: '' }); }} title="Add Team Member">
          <div className="space-y-6">
            <div className="text-center p-4 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Project</p>
              <p className="text-sm font-semibold text-white/70">{selectedProjectForCollab?.name}</p>
            </div>

            {collabStep === 1 ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Email Address</label>
                  <input autoFocus type="email" placeholder="teammate@company.com" value={collabEmail} onChange={(e) => setCollabEmail(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all" />
                </div>
                <button onClick={handleRequestCollabCode} disabled={collabLoading || !collabEmail} className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all active:scale-95 disabled:opacity-30">{collabLoading ? 'Requesting...' : 'Send Code'}</button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 text-center block">Verification Code</label>
                  <input required type="text" maxLength={6} value={collabCode} onChange={(e) => setCollabCode(e.target.value)} placeholder="000000" className="w-full bg-transparent border-b-2 border-white/10 text-center text-3xl font-bold tracking-[0.4em] focus:outline-none focus:border-white/40 transition-all py-4" />
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleAddCollaboratorAction} disabled={collabLoading || collabCode.length !== 6} className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all">{collabLoading ? 'Adding...' : 'Verify & Add'}</button>
                  <button onClick={() => setCollabStep(1)} className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors">Edit Email</button>
                </div>
              </div>
            )}
            {collabStatus.message && (
              <div className={`p-3 rounded-xl text-[10px] font-bold text-center uppercase tracking-widest border ${collabStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : collabStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>{String(collabStatus.message)}</div>
            )}
          </div>
        </ModalWrapper>
      )}
      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <ModalWrapper title="Account Settings" onClose={() => setIsSettingsModalOpen(false)}>
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-medium uppercase text-white/60">
                {user?.name?.[0] || user?.email?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-white/30 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Preferences</label>
              <div className="space-y-1">
                <SettingsItem icon={<Shield size={14} />} label="Security & Password" />
                <SettingsItem icon={<Activity size={14} />} label="System Status" status="Online" />
                <SettingsItem icon={<Sparkles size={14} />} label="Beta Features" status="Enabled" />
              </div>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all"
            >
              Save Changes
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* Updates Modal */}
      {isUpdatesModalOpen && (
        <ModalWrapper title="What's New" onClose={() => setIsUpdatesModalOpen(false)}>
          <div className="space-y-6">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <UpdateItem
                title="Zinc UI Revamp"
                desc="The workspace has been modernized with a new, minimal design system."
                date="Today"
                isNew
              />
              <UpdateItem
                title="Custom Select Components"
                desc="Native dropdowns replaced with accessible custom components."
                date="Yesterday"
              />
              <UpdateItem
                title="Performance Optimization"
                desc="File tree loading speeds improved by 40% using memoization."
                date="May 1, 2026"
              />
            </div>

            <button
              onClick={() => setIsUpdatesModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white transition-all text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </ModalWrapper>
      )}
    </>
  );
}

function ModalWrapper({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#121214] border border-white/[0.08] rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1 text-white/20 hover:text-white transition-colors">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, status }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group border border-transparent hover:border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-white/[0.04] text-white/30 group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-xs text-white/60 group-hover:text-white transition-colors">{label}</span>
      </div>
      {status && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">{status}</span>}
    </div>
  );
}

function UpdateItem({ title, desc, date, isNew }) {
  return (
    <div className="space-y-2 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] transition-all">
      <div className="flex items-start justify-between">
        <h5 className="text-xs font-semibold text-white flex items-center gap-2">
          {title}
          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        </h5>
        <span className="text-[10px] text-white/20">{date}</span>
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}
