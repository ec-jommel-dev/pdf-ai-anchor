/**
 * PHASE 9.5: Confirm Delete Modal Component
 * Confirmation dialog before deleting items
 * Updated: Support extra warning message for cascading deletes
 */

'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  extraWarning?: string;
}

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  itemName = 'Anchor',
  extraWarning
}: ConfirmDeleteModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <Trash2 size={40} className="text-[var(--gh-red)] mx-auto mb-4" />
        
        <h3 className="text-lg font-semibold text-[var(--text-heading)] mb-2">
          Delete {itemName}?
        </h3>
        
        <p className="text-sm text-[#8b949e] mb-4">
          This action cannot be undone.
        </p>

        {extraWarning && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-[rgba(207,34,46,0.1)] border border-[var(--gh-red)] rounded-md text-left">
            <AlertTriangle size={18} className="text-[var(--gh-red)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--gh-red)]">{extraWarning}</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <Button 
            variant="danger" 
            onClick={handleConfirm}
            className="justify-center py-2.5 w-full"
          >
            Delete Permanently
          </Button>
          <Button 
            onClick={onClose}
            className="justify-center py-2.5 w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
