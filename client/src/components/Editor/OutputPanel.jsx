'use client';
import React from 'react';
import { X, Loader2 } from 'lucide-react';

const isError = (text) =>
  /^(error|⚠️|TypeError|ReferenceError|SyntaxError|Cannot)/i.test(text?.trim() || '');

const OutputPanel = ({ output, isLoading, onClose }) => {
  const [height, setHeight] = React.useState(220);
  const isResizing = React.useRef(false);

  const startResizing = React.useCallback((e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'row-resize';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = React.useCallback((e) => {
    if (!isResizing.current) return;
    const newHeight = window.innerHeight - e.clientY;
    // Bounds: min 40px (header only), max 80% of window
    if (newHeight > 40 && newHeight < window.innerHeight * 0.8) {
      setHeight(newHeight);
    }
  }, []);

  return (
    <div
      className="border-t border-white/[0.06] bg-[#09090b] flex flex-col flex-shrink-0 relative group/terminal"
      style={{ height: `${height}px` }}
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={startResizing}
        className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-50 hover:bg-white/10 transition-colors"
        title="Drag to resize terminal"
      />

      {/* Header — matches image-1 "> TERMINAL OUTPUT" style */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] flex-shrink-0 bg-[#09090b]">
        <div className="flex items-center gap-2 text-white/30">
          <span className="text-white/20 font-mono text-xs">›_</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Terminal Output
          </span>
          {isLoading && <Loader2 size={11} className="animate-spin ml-1 text-white/40" />}
        </div>
        <button
          onClick={onClose}
          className="text-white/20 hover:text-white transition-colors p-1 rounded-md hover:bg-white/[0.04]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar font-mono text-sm leading-relaxed">
        {isLoading ? (
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Loader2 size={12} className="animate-spin" />
            <span>Executing…</span>
          </div>
        ) : output !== undefined && output !== null && output !== '' ? (
          <pre
            className={`whitespace-pre-wrap text-sm ${
              isError(output) ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
          </pre>
        ) : (
          <p className="text-white/20 text-xs italic">
            Press{' '}
            <kbd className="bg-white/[0.06] border border-white/10 px-1.5 py-0.5 rounded text-white/40 not-italic text-[10px] font-sans">
              Run
            </kbd>{' '}
            to execute the active file.
          </p>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
