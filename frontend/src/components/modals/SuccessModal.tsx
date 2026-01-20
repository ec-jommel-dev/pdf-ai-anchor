/**
 * Success Modal - Shows completion message after mapping anchors
 */

'use client';

import { CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message,
  primaryAction,
  secondaryAction 
}: SuccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-md">
      <div className="flex flex-col items-center p-4">
        <CheckCircle size={56} className="text-[var(--gh-green)] mb-4" />
        <h3 className="text-xl font-semibold text-[var(--text-heading)] mb-2 text-center">
          {title}
        </h3>
        <p className="text-[var(--text-main)] text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button variant="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
