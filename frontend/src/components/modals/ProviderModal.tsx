/**
 * PHASE 9.1: Provider Modal Component
 * Add/Edit provider form modal with status selection
 */

'use client';

import { useState, useEffect } from 'react';
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
  const { addProvider, updateProvider, getProviderById, showToast } = useProviderStore();

  // Populate form when editing
  useEffect(() => {
    if (editId) {
      const provider = getProviderById(editId);
      if (provider) {
        setName(provider.name);
        setStatus(provider.active ? 'active' : 'inactive');
      }
    } else {
      setName('');
      setStatus('active');
    }
  }, [editId, getProviderById, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;

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
      onClose();
    } catch {
      // Error already handled by store
    }
  };

  const handleClose = () => {
    setName('');
    setStatus('active');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h3 className="text-lg font-semibold text-[var(--text-heading)] mt-0 mb-4">
        {editId ? 'Edit Provider' : 'Add Provider'}
      </h3>

      <Input
        label="Company Name"
        placeholder="e.g. Pacific Gas & Electric"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save</Button>
      </div>
    </Modal>
  );
}
