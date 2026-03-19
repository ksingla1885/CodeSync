'use client';
import dynamic from 'next/dynamic';

// Monaco Editor must ONLY render in the browser (no SSR)
const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0d0d0d] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/20">
        <div className="w-8 h-8 border-2 border-[#8a2be2]/40 border-t-[#8a2be2] rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading editor…</span>
      </div>
    </div>
  ),
});

export default CodeEditor;
