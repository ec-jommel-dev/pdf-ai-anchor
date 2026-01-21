/**
 * Toast Notification Component
 * Shows success/error messages that auto-fade after 4 seconds
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', isVisible, onClose, duration = 4000 }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300); // Wait for fade animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isShowing) return null;

  const Icon = type === 'success' ? CheckCircle : XCircle;
  const bgColor = type === 'success' ? 'bg-[#238636]' : 'bg-[#da3633]';
  const borderColor = type === 'success' ? 'border-[#2ea043]' : 'border-[#f85149]';

  return (
    <div 
      className={`
        fixed top-5 right-5 z-[9999]
        flex items-center gap-3
        px-4 py-3 rounded-lg
        ${bgColor} ${borderColor} border
        text-white text-sm font-medium
        shadow-lg shadow-black/20
        transition-all duration-300 ease-out
        ${isShowing ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'}
      `}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span>{message}</span>
      <button 
        onClick={() => {
          setIsShowing(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 p-0.5 hover:bg-white/10 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
