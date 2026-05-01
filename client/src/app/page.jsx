'use client';
import React from 'react';
import Link from 'next/link';
import { Code2, Users, Terminal, ArrowRight, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white flex flex-col font-sans">
      {/* Nav */}
      <nav className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 md:px-16 sticky top-0 z-50 bg-[#0c0c0c]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm leading-none">C</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">CodeSync</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="text-sm text-white/40 hover:text-white/80 transition-colors">
            Docs
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center justify-center px-6 pt-28 pb-24 text-center max-w-3xl mx-auto w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 text-white/40 text-xs mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Beta 1.0 — Now live
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 text-white">
            Collaborative code editing,{' '}
            <span className="text-white/40">built for teams.</span>
          </h1>

          <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed mb-10">
            Real-time synchronization, shared cursors, and sandboxed execution — all in one
            lightweight IDE your team can use instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/login"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Get started free
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-md border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Features */}
        <section className="py-20 px-6 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem
              icon={<Code2 size={18} className="text-white/60" />}
              title="Conflict-free editing"
              desc="Built on Yjs CRDTs — every keystroke syncs instantly across all clients, no matter the network."
            />
            <FeatureItem
              icon={<Users size={18} className="text-white/60" />}
              title="Team collaboration"
              desc="Invite teammates by email, track live cursors, and chat without leaving the editor."
            />
            <FeatureItem
              icon={<Terminal size={18} className="text-white/60" />}
              title="Sandboxed execution"
              desc="Run code in isolated Docker containers with real-time stdout streaming and zero setup."
            />
          </div>
        </section>

        {/* Social proof strip */}
        <div className="border-t border-white/[0.06] py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-white/20 text-xs font-medium tracking-widest uppercase">
            <span>Next.js</span>
            <span className="w-px h-3 bg-white/10" />
            <span>MongoDB</span>
            <span className="w-px h-3 bg-white/10" />
            <span>Docker</span>
            <span className="w-px h-3 bg-white/10" />
            <span>Yjs</span>
            <span className="w-px h-3 bg-white/10" />
            <span>WebSocket</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-8 md:px-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/25 text-xs">
          <span>© 2026 CodeSync</span>
          <div className="flex items-center gap-6">
            <span className="hover:text-white/60 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="space-y-3">
      <div className="w-8 h-8 rounded-md border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}
