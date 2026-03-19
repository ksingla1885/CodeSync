'use client';
import React from 'react';
import Link from 'next/link';
import { LayoutGrid, Code2, Users, Zap, Terminal, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans selection:bg-[#8a2be2]/30">
      {/* Header */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 md:px-20 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8a2be2] flex items-center justify-center shadow-2xl shadow-[#8a2be2]/40 ring-4 ring-[#8a2be2]/10">
            <LayoutGrid size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CodeSync</span>
        </div>
        <div className="flex items-center gap-8">
           <Link href="/docs" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Documentation</Link>
           <Link href="/login" className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8a2be2] to-[#60a5fa] text-white text-sm font-bold hover:opacity-90 transition-all shadow-xl hover:shadow-[#60a5fa]/30">
              Get Started
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden pt-20 pb-40">
        {/* Animated Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#8a2be2]/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8a2be2]/10 border border-[#8a2be2]/20 text-[#c084fc] text-[11px] font-bold uppercase tracking-widest animate-bounce">
            <Zap size={12} fill="currentColor" />
            Beta 1.0 is now live
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-4">
            Code Together. <br />
            Synchronize <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8a2be2] via-[#c084fc] to-[#60a5fa] drop-shadow-sm">Intelligence.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
            A high-performance, real-time collaborative IDE designed for modern teams. Group projects, share cursors, and execute code in seconds.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-10">
            <Link href="/login" className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#8a2be2] to-[#60a5fa] text-xl font-black shadow-2xl shadow-[#8a2be2]/30 hover:shadow-[#60a5fa]/40 transition-all hover:-translate-y-1 cursor-pointer">
              Get Started
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
             <button className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-xl font-black hover:bg-white/10 transition-all text-white/70">
              View Demo
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40 max-w-6xl w-full relative z-10">
           <FeatureCard 
              icon={<Code2 className="text-[#8a2be2]" />} 
              title="Real-time Sync" 
              desc="Powered by Yjs CRDTs for seamless, conflict-free editing across any network speed." 
            />
            <FeatureCard 
              icon={<Users className="text-blue-400" />} 
              title="Collaborative Sync" 
              desc="Invite your team to separate project folders and build together with live cursor tracking." 
            />
            <FeatureCard 
              icon={<Terminal className="text-green-400" />} 
              title="Docker Execution" 
              desc="Run your code instantly in isolated sandboxed containers with real-time output sync." 
            />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#0d0d0d] flex flex-col items-center gap-6">
         <div className="flex items-center gap-6 text-white/20 text-sm font-bold uppercase tracking-widest">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-white cursor-pointer transition-colors">Github</span>
         </div>
         <p className="text-white/10 text-xs font-mono">© 2026 CodeSync. Build with Antigravity.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] hover:border-white/20 transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-[#0d0d0d] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0d0d0d] shadow-xl group-hover:shadow-[#8a2be2]/10 transition-all">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <h3 className="text-xl font-extrabold mb-3 group-hover:text-[#8a2be2] transition-colors">{title}</h3>
      <p className="text-white/40 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
