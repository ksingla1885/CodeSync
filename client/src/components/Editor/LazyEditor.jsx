'use client';
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center" style={{ background: '#09090b' }}>
      <div className="flex flex-col items-center gap-3 text-white/20">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        <span className="text-[10px] font-mono tracking-widest uppercase">Loading editor…</span>
      </div>
    </div>
  ),
});

export default CodeEditor;
