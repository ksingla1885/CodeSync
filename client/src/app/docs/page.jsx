'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutGrid, 
  Book, 
  Zap, 
  Code2, 
  Users, 
  Terminal, 
  Shield, 
  Cpu, 
  Globe,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    {
      id: "intro",
      icon: <Book size={20} />,
      title: "Introduction",
      content: "CodeSync is a next-generation, real-time collaborative IDE designed to bridge the gap between individual coding and team synchronization. Built on the principles of extreme performance and seamless collaboration, CodeSync allows developers to work together as if they were on the same machine.",
      details: [
        "Eliminates version control conflicts for rapid prototyping.",
        "Shared state across all participants.",
        "Low-latency communication powered by WebSockets."
      ]
    },
    {
      id: "getting-started",
      icon: <Zap size={20} />,
      title: "Getting Started",
      content: "To begin, simply head to the Dashboard and create a new project. You can choose from various templates or start with a clean slate. Once your project is live, you can invite team members by sharing your project ID. Collaboration is instant—no refresh required.",
      steps: [
        "Login with your developer account.",
        "Click 'Create Project' and specify a name/language.",
        "Copy the unique Project ID from the editor top bar.",
        "Share it with your teammates to start live coding."
      ]
    },
    {
      id: "sync-engine",
      icon: <Cpu size={20} />,
      title: "Real-time Sync Engine",
      content: "At its core, CodeSync utilizes Yjs, a high-performance CRDT (Conflict-free Replicated Data Type) library. This ensures that every keystroke, cursor movement, and selection is synchronized across all clients with zero conflicts, even under high latency or offline scenarios.",
      technical: "Yjs uses a structure that represents every operation as a unique event. When multiple users edit the same line, Yjs merges these operations mathematically to ensure all clients converge to the exact same state without any central authority needed for conflict resolution."
    },
    {
      id: "docker",
      icon: <Terminal size={20} />,
      title: "Code Execution Hub",
      content: "CodeSync isn't just an editor; it's a runtime. Your code is executed in isolated, sandboxed Docker containers. This provides a secure and consistent environment for every user, ensuring that 'it works on my machine' is a problem of the past. Output is streamed back in real-time.",
      features: [
        "Isolated environments (Node.js, Python, C++, etc.)",
        "Ephemeral containers that reset after session.",
        "Resource limits to ensure fair performance.",
        "Real-time terminal output streaming."
      ]
    },
    {
      id: "architecture",
      icon: <Globe size={20} />,
      title: "Architecture",
      content: "Our architecture follows a microservices-inspired approach. The frontend is built with Next.js and Tailwind CSS for a premium UI, while the backend uses Node.js and Socket.io for persistent connections. Data persistence is handled via MongoDB, ensuring your projects are always safe.",
      stack: {
        frontend: "Next.js, Tailwind CSS, Lucide Icons",
        backend: "Node.js, Express, Socket.io, Yjs",
        execution: "Docker SDK, Redis (for caching)",
        database: "MongoDB (Mongoose)"
      }
    },
    {
      id: "security",
      icon: <Shield size={20} />,
      title: "Privacy & Security",
      content: "Security is baked into every layer of CodeSync. All communication is encrypted via TLS/SSL. Sandboxed execution environments prevent malicious code from affecting our infrastructure or other users. Your source code remains your own, protected by strict access controls.",
      details: [
        "End-to-end encryption for editor data.",
        "Role-based access control (RBAC) (Coming soon).",
        "Automated session timeouts for security."
      ]
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans selection:bg-[#8a2be2]/30">
      {/* Documentation Header */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 md:px-20 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-[#8a2be2] flex items-center justify-center shadow-lg shadow-[#8a2be2]/20">
              <LayoutGrid size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CodeSync</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/10 mx-4" />
          <span className="text-sm font-medium text-white/40 uppercase tracking-widest">Docs</span>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">
              Go to Dashboard
           </Link>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-16 flex flex-col md:flex-row gap-16">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8 h-fit md:sticky md:top-36">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a2be2] px-4 mb-4">Core Concepts</p>
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button 
                  key={section.id}
                  onClick={() => setActiveSection(section.id)} 
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? "bg-[#8a2be2]/10 text-white font-bold border border-[#8a2be2]/20" 
                      : "hover:bg-white/5 text-white/50 hover:text-white font-medium border border-transparent"
                  }`}
                >
                  <span className={`${isActive ? "text-[#8a2be2]" : "text-white/20 group-hover:text-[#8a2be2]"} transition-colors`}>
                    {section.icon}
                  </span>
                  {section.title}
                </button>
              );
            })}
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#8a2be2]/20 to-transparent border border-[#8a2be2]/10">
            <h4 className="text-sm font-bold mb-2">Need help?</h4>
            <p className="text-xs text-white/40 leading-relaxed mb-4">Can't find what you're looking for? Join our community.</p>
            <button className="text-xs font-bold text-[#8a2be2] hover:underline">Contact Support</button>
          </div>
        </aside>

        {/* Documentation Content */}
        <main className="flex-1 space-y-24 pb-40">
          <header className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <Book size={10} />
                Documentation Guide
             </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
              Mastering <span className="text-[#8a2be2]">CodeSync</span>
            </h1>
            <p className="text-xl text-white/40 font-medium max-w-2xl leading-relaxed">
              Explore the technical foundations and workflow patterns of the world's fastest collaborative IDE.
            </p>
          </header>

          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" key={currentSection.id}>
            <section id={currentSection.id} className="group">
              <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/10">
                <div className="w-12 h-12 rounded-xl bg-[#8a2be2] flex items-center justify-center text-white shadow-lg shadow-[#8a2be2]/20">
                  {currentSection.icon}
                </div>
                <h2 className="text-4xl font-black tracking-tight text-white">{currentSection.title}</h2>
              </div>
              
              <div className="space-y-10">
                <p className="text-xl text-white/70 leading-relaxed font-medium">
                  {currentSection.content}
                </p>

                {currentSection.details && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSection.details.map((detail, i) => (
                      <div key={i} className="flex items-start gap-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#8a2be2]/30 transition-colors">
                        <CheckCircle2 size={20} className="text-[#8a2be2] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/60 leading-relaxed">{detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentSection.steps && (
                  <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#8a2be2] mb-6">Workflow</h3>
                    {currentSection.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-4 group/step">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0d0d0d] border border-white/10 flex items-center justify-center text-sm font-black text-white/40 group-hover/step:border-[#8a2be2] group-hover/step:text-[#8a2be2] transition-all shadow-inner">
                          {i + 1}
                        </div>
                        <span className="text-white/70 font-medium text-lg leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentSection.technical && (
                  <div className="p-8 rounded-3xl bg-black border border-white/10 font-mono text-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8a2be2] to-transparent opacity-50" />
                    <div className="flex items-center gap-2 text-[#8a2be2] mb-4">
                      <Terminal size={16} />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-black">Under the hood</span>
                    </div>
                    <p className="text-white/50 leading-loose text-base">
                      {currentSection.technical}
                    </p>
                  </div>
                )}

                {currentSection.stack && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                     {Object.entries(currentSection.stack).map(([key, value]) => (
                       <div key={key} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8a2be2]">{key}</h4>
                          <p className="text-white font-bold">{value}</p>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className="p-12 md:p-16 rounded-[40px] bg-gradient-to-b from-[#8a2be2] to-[#7a1bd2] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-5xl font-black tracking-tight leading-none">Ready to start <br />coding?</h2>
              <p className="text-white/80 text-xl font-medium max-w-lg">
                Your sandbox is waiting. Create your first project now.
              </p>
              <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black text-xl font-black hover:scale-105 transition-all shadow-2xl shadow-black/20">
                Go to Dashboard
                <ArrowLeft size={24} className="rotate-180" />
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer (Simplified) */}
      <footer className="py-16 border-t border-white/5 bg-black/40 flex flex-col items-center gap-4">
         <div className="flex items-center gap-4 grayscale opacity-40">
            <LayoutGrid size={24} />
            <span className="font-bold">CodeSync Hub</span>
         </div>
         <p className="text-white/10 text-[10px] font-mono uppercase tracking-[0.2em]">Documentation version 1.1.2. Built with Antigravity.</p>
      </footer>
    </div>
  );
}
