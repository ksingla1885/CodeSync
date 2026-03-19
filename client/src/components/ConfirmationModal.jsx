'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * A reusable confirmation modal with premium styling
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when user cancels or clicks away
 * @param {Function} props.onConfirm - Function to call when user confirms
 * @param {string} props.title - Modal title (defaults to "localhost:3000 says")
 * @param {string} props.message - Warning message
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 * @param {string} props.type - 'danger' | 'info' | 'warning'
 */
export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "localhost:3000 says",
  message = "Are you sure you want to proceed?",
  confirmText = "OK",
  cancelText = "Cancel",
  type = "danger"
}) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
      {/* Backdrop with enhanced blur */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${!isConfirming ? 'cursor-pointer' : ''}`} 
        onClick={!isConfirming ? onClose : undefined}
      />
      
      {/* Modal Container: Simple, Clean, Attractive */}
      <div className="relative bg-[#111111]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] w-full max-w-sm p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)] animate-modal-in overflow-hidden">
        
        {/* Subtle Top Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 blur-3xl rounded-full opacity-20 pointer-events-none ${
          type === 'danger' ? 'bg-red-500' : 'bg-[#8a2be2]'
        }`} />

        <div className="flex flex-col items-center text-center relative z-10">
          {/* Circular Icon with Glow */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${
            type === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-[#8a2be2]/10 text-[#8a2be2]'
          }`}>
            <AlertCircle size={40} strokeWidth={1.5} />
          </div>
          
          <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
            {title === 'localhost:3000 says' ? 'Confirm Action' : title}
          </h3>
          
          <p className="text-white/40 text-[15px] font-medium leading-relaxed mb-8 px-2">
            {message}
          </p>
          
          <div className="flex flex-col gap-3 w-full">
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
              className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center min-h-[56px] cursor-pointer ${
                type === 'danger' 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                : 'bg-[#8a2be2] hover:bg-[#7a1bd2] text-white shadow-lg shadow-[#8a2be2]/20'
              } disabled:opacity-50 disabled:cursor-wait`}
            >
              {isConfirming ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : confirmText}
            </button>

            <button 
              disabled={isConfirming}
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-medium transition-all active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
