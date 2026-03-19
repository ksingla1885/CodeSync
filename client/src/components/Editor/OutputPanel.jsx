'use client';
import React from 'react';
import { Terminal, X, Loader2 } from 'lucide-react';

const isError = (text) =>
  /^(error|⚠️|TypeError|ReferenceError|SyntaxError|Cannot)/i.test(text?.trim() || '');

const OutputPanel = ({ output, isLoading, onClose }) => {
  return (
    <div
      className="border-t border-white/5 bg-[#0b0b0b] flex flex-col flex-shrink-0"
      style={{ height: '220px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-[#8a2be2]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Terminal Output
          </span>
          {isLoading && <Loader2 size={11} className="animate-spin text-[#8a2be2] ml-1" />}
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
        >
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-sm leading-relaxed">
        {isLoading ? (
          <div className="flex items-center gap-2 text-white/30">
            <Loader2 size={13} className="animate-spin" />
            <span>Executing code…</span>
          </div>
        ) : output ? (
          <pre
            className={`whitespace-pre-wrap ${
              isError(output) ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {output}
          </pre>
        ) : (
          <p className="text-white/20 italic text-xs">
            Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/50 not-italic text-[10px]">Run</kbd> to execute the active file.
          </p>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
