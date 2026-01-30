import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  // Toggle 'has-modal' class on body to allow other components (like Header) to react
  useEffect(() => {
    document.body.classList.add('has-modal');
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.classList.remove('has-modal');
      document.body.style.overflow = '';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-paper backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Fixed & Solid Background */}
        <div className="flex-none flex items-center justify-between p-6 md:p-8 border-b border-sand/50 bg-paper z-20">
          <h3 className="text-2xl font-serif font-bold text-ink tracking-tight leading-none pt-1">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-subtle hover:bg-clay/10 hover:text-clay rounded-full transition-all duration-200 hover:rotate-90"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth bg-white/50">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};