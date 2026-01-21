/**
 * PHASE 9.1: Provider Modal Component
 * Add/Edit provider form modal with status selection
 * Updated: Confirmation when changing status to Inactive
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useProviderStore } from '@/stores/useProviderStore';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export function ProviderModal({ isOpen, onClose, editId }: ProviderModalProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [originalStatus, setOriginalStatus] = useState<'active' | 'inactive'>('active');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addProvider, updateProvider, getProviderById, showToast } = useProviderStore();

  // Get provider data for warning message
  const provider = editId ? getProviderById(editId) : null;
  const pdfCount = provider?.pdfs?.length || 0;
  const anchorCount = provider?.anchors?.length || 0;

  // Populate form when editing
  useEffect(() => {
    if (editId) {
      const provider = getProviderById(editId);
      if (provider) {
        setName(provider.name);
        setStatus(provider.active ? 'active' : 'inactive');
        setOriginalStatus(provider.active ? 'active' : 'inactive');
      }
    } else {
      setName('');
      setStatus('active');
      setOriginalStatus('active');
    }
    setShowConfirmation(false);
  }, [editId, getProviderById, isOpen]);

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      setNameError('Provider name is required');
      return;
    }
    setNameError(null);

    // Check if status is changing from Active to Inactive
    if (editId && originalStatus === 'active' && status === 'inactive') {
      setShowConfirmation(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      if (editId) {
        const shouldBeActive = status === 'active';
        await updateProvider(editId, name.trim(), shouldBeActive);
        showToast('Provider updated successfully!', 'success');
      } else {
        await addProvider(name.trim());
        showToast('Provider added successfully!', 'success');
      }

      setName('');
      setStatus('active');
      setShowConfirmation(false);
      setNameError(null);
      onClose();
    } catch {
      // Error already handled by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setStatus('active');
    setShowConfirmation(false);
    setNameError(null);
    setIsSaving(false);
    onClose();
  };

  // Confirmation view when deactivating
  if (showConfirmation) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="text-center">
          <AlertTriangle size={40} className="text-[var(--gh-yellow)] mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold text-[var(--text-heading)] mb-2">
            Deactivate Provider?
          </h3>
          
          <p className="text-sm text-[#8b949e] mb-2">
            You are about to deactivate <strong className="text-[var(--text-heading)]">{name}</strong>
          </p>
          
          <div className="text-sm text-[#8b949e] mb-4">
            <p className="mb-2">This will:</p>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>Hide provider from Contract Mapper dropdown</li>
              <li>Hide provider from Auto Fill selection</li>
              {pdfCount > 0 && <li>Keep {pdfCount} PDF(s) and {anchorCount} anchor(s) intact</li>}
            </ul>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button 
              onClick={performSave}
              className="justify-center py-2.5 w-full"
            >
              Yes, Deactivate Provider
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                setStatus('active');
                setShowConfirmation(false);
              }}
              className="justify-center py-2.5 w-full"
            >
              Keep Active
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h3 className="text-lg font-semibold text-[var(--text-heading)] mt-0 mb-4">
        {editId ? 'Edit Provider' : 'Add Provider'}
      </h3>

      <Input
        label="Company Name"
        placeholder="e.g. Pacific Gas & Electric"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (nameError) setNameError(null);
        }}
        onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleSave()}
        error={nameError}
      />

      {editId && (
        <Select
          label="Status"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
        />
      )}

      <div className="flex justify-end gap-2.5 mt-4">
        <Button onClick={handleClose} disabled={isSaving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Modal>
  );
}
