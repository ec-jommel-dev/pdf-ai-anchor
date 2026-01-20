/**
 * Warning Modal Component
 * Displays a warning message when user tries to perform an action without required selection
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function WarningModal({ isOpen, onClose, title = 'Warning', message }: WarningModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgba(234,179,8,0.1)] flex items-center justify-center">
          <AlertTriangle size={24} className="text-[#eab308]" />
        </div>
        
        <h3 className="text-lg font-semibold text-[var(--text-heading)] mt-0 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-[var(--text-main)] mb-6">
          {message}
        </p>
        
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
