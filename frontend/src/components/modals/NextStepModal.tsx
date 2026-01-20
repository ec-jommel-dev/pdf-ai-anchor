/**
 * PHASE 9.3: Next Step Modal Component
 * Shows after placing an anchor - continue mapping or finish
 */

'use client';

import { MousePointer2, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface NextStepModalProps {
  isOpen: boolean;
  onKeepMapping: () => void;
  onFinish: () => void;
}

export function NextStepModal({ isOpen, onKeepMapping, onFinish }: NextStepModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onKeepMapping}>
      <h3 className="text-lg font-semibold text-[var(--text-heading)] mt-0 mb-2">
        Anchor Placed Successfully!
      </h3>
      <p className="text-sm text-[#8b949e] mb-5">
        What would you like to do next?
      </p>

      {/* Keep Mapping Option */}
      <div
        className="step-option"
        onClick={onKeepMapping}
      >
        <MousePointer2 size={20} className="text-[var(--gh-blue)]" />
        <div>
          <div className="font-semibold text-sm text-[var(--text-heading)]">Keep Mapping</div>
          <div className="text-xs text-[#8b949e]">Place more anchors on this document</div>
        </div>
      </div>

      {/* Finish Option */}
      <div
        className="step-option"
        onClick={onFinish}
      >
        <CheckCircle size={20} className="text-[var(--gh-blue)]" />
        <div>
          <div className="font-semibold text-sm text-[var(--text-heading)]">Finish & Review</div>
          <div className="text-xs text-[#8b949e]">Return to upload view</div>
        </div>
      </div>
    </Modal>
  );
}
