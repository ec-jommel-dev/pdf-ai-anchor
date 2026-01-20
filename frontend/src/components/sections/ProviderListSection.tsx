/**
 * PHASE 8.3: Provider List Section
 * Table of providers with CRUD operations
 */

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProviderModal } from '@/components/modals/ProviderModal';
import { useProviderStore } from '@/stores/useProviderStore';

export function ProviderListSection() {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { providers, viewProfile, isLoading } = useProviderStore();

  const handleAddNew = () => {
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
  };

  return (
    <section className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)] m-0">
          Providers
        </h2>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={14} /> Add New
        </Button>
      </div>

      {/* Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Provider Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr 
                key={provider.id}
                className={provider.active ? '' : 'is-archived'}
              >
                <td data-label="Name">
                  <strong className="text-[var(--text-heading)]">{provider.name}</strong>
                </td>
                <td data-label="Status">
                  <Badge variant={provider.active ? 'active' : 'inactive'}>
                    {provider.active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="action-cell" data-label="Actions">
                  <div className="flex gap-[5px]">
                    <Button onClick={() => viewProfile(provider.id)}>
                      View
                    </Button>
                    <Button onClick={() => handleEdit(provider.id)}>
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={3} className="text-center text-[#8b949e] py-8">
                  Loading providers...
                </td>
              </tr>
            )}
            {!isLoading && providers.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-[#8b949e] py-8">
                  No providers yet. Click "Add New" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Provider Modal */}
      <ProviderModal
        isOpen={showModal}
        onClose={handleCloseModal}
        editId={editId}
      />
    </section>
  );
}
