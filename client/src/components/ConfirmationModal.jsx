'use client';
import React from 'react';
import { AlertCircle, Trash2, Info, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger" // 'danger' | 'info' | 'warning'
}) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 size={24} />;
      case 'warning': return <AlertTriangle size={24} />;
      default: return <Info size={24} />;
    }
  };

  const getTheme = () => {
    switch (type) {
      case 'danger': return 'text-red-400 bg-red-400/[0.06] border-red-400/20';
      case 'warning': return 'text-amber-400 bg-amber-400/[0.06] border-amber-400/20';
      default: return 'text-white bg-white/[0.06] border-white/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={!isConfirming ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0c0c0e] border border-white/[0.08] rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${getTheme()}`}>
            {getIcon()}
          </div>
          
          <h3 className="text-xl font-semibold tracking-tight text-white mb-2">
            {String(title)}
          </h3>
          
          <p className="text-white/40 text-sm font-medium leading-relaxed mb-8 px-4">
            {String(message)}
          </p>
          
          <div className="flex flex-col gap-2 w-full">
            <button 
              disabled={isConfirming}
              onClick={async () => {
                setIsConfirming(true);
                try {
                  await onConfirm();
                } catch (err) {
                  console.error('Modal Confirm Error:', err);
                } finally {
                  setIsConfirming(false);
                  onClose();
                }
              }}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center min-h-[44px] cursor-pointer ${
                type === 'danger' 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white text-black hover:bg-white/90'
              } disabled:opacity-50 disabled:cursor-wait`}
            >
              {isConfirming ? (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : confirmText}
            </button>

            <button 
              disabled={isConfirming}
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-medium transition-all active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
