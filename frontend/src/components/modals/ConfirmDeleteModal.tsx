/**
 * PHASE 9.5: Confirm Delete Modal Component
 * Confirmation dialog before deleting an anchor
 */

'use client';

import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  itemName = 'Anchor'
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
        
        <p className="text-sm text-[#8b949e] mb-6">
          This action cannot be undone.
        </p>

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
            Keep {itemName}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
