'use client';
import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * CustomSelect — a fully styled dropdown that replaces the native <select>.
 * Props:
 *   value       — currently selected value
 *   onChange    — (val: string) => void
 *   options     — Array<{ value: string, label: string, disabled?: boolean }>
 *   placeholder — string shown when nothing is selected
 *   className   — optional extra classes on the trigger button
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select...', className = '' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const hasValue = selected && selected.value !== '';

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-left hover:border-white/20 focus:outline-none transition-all ${className}`}
      >
        <span className={hasValue ? 'text-white' : 'text-white/30'}>
          {String(hasValue ? selected.label : placeholder)}
        </span>
        <ChevronRight
          size={14}
          className={`text-white/30 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-[200] w-full mt-1.5 bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden py-1">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled) {
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={`w-full px-4 py-2.5 text-sm text-left transition-all ${
                  opt.disabled
                    ? 'text-white/20 cursor-not-allowed'
                    : isActive
                    ? 'text-white bg-white/[0.06] font-medium'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {String(opt.label)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
