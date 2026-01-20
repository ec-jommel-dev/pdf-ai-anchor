/**
 * PHASE 8.4: Provider Profile Section
 * Provider details and anchor management
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, Pin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AnchorModal } from '@/components/modals/AnchorModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { PreviewModal } from '@/components/modals/PreviewModal';
import { useProviderStore } from '@/stores/useProviderStore';
import { Anchor } from '@/types';

export function ProviderProfileSection() {
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingAnchorId, setEditingAnchorId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<Anchor | null>(null);

  const { 
    getCurrentProvider, 
    setActiveTab, 
    deleteAnchor,
    currentProviderId,
    pdfTotalPages,
    showToast
  } = useProviderStore();

  const provider = getCurrentProvider();

  if (!provider) {
    return (
      <section className="max-w-[900px] mx-auto">
        <p>Provider not found.</p>
        <Button onClick={() => setActiveTab('list')}>
          <ArrowLeft size={14} /> Back to List
        </Button>
      </section>
    );
  }

  const handleAddAnchor = () => {
    setEditingAnchorId(null);
    setShowAnchorModal(true);
  };

  const handleEditAnchor = (id: number) => {
    setEditingAnchorId(id);
    setShowAnchorModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId !== null && currentProviderId) {
      try {
        await deleteAnchor(currentProviderId, deleteTargetId);
        showToast('Anchor deleted successfully!', 'success');
      } catch {
        // Error handled by store
      }
    }
    setDeleteTargetId(null);
  };

  const handlePreview = (anchor: Anchor) => {
    setPreviewAnchor(anchor);
    setShowPreviewModal(true);
  };

  return (
    <section className="max-w-[900px] mx-auto">
      {/* Back Button */}
      <Button onClick={() => setActiveTab('list')} className="mb-5">
        <ArrowLeft size={14} /> Back to List
      </Button>

      {/* Provider Info Card */}
      <div className="table-card p-6 mb-6">
        <h3 className="text-xl font-semibold text-[var(--text-heading)] mt-0 mb-5">
          {provider.name}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
              Unique ID
            </label>
            <div className="text-sm font-mono text-[var(--text-heading)]">
              {provider.id}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
              Status
            </label>
            <div className="text-sm text-[var(--text-heading)]">
              {provider.active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Anchor Settings Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-heading)] m-0">
          Anchor Settings
        </h3>
        <Button variant="primary" onClick={handleAddAnchor}>
          <Pin size={14} /> Add Anchor
        </Button>
      </div>

      {/* Anchors Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Anchor Text</th>
              <th>Coords</th>
              <th>Page</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {provider.anchors.map((anchor) => (
              <tr key={anchor.id}>
                <td data-label="Anchor Text">
                  <code>{anchor.text}</code>
                  <div className="mt-1.5">
                    <Button 
                      onClick={() => handlePreview(anchor)}
                    >
                      <Eye size={14} /> Preview
                    </Button>
                  </div>
                </td>
                <td data-label="Coords">
                  {anchor.x}, {anchor.y}
                </td>
                <td data-label="Page">
                  <Badge>{String(anchor.page).toUpperCase()}</Badge>
                </td>
                <td className="action-cell" data-label="Actions">
                  <div className="flex gap-[5px]">
                    <Button onClick={() => handleEditAnchor(anchor.id)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteClick(anchor.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {provider.anchors.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-[#8b949e] py-8">
                  No anchors configured. Click "Add Anchor" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Anchor Modal */}
      {currentProviderId && (
        <AnchorModal
          isOpen={showAnchorModal}
          onClose={() => {
            setShowAnchorModal(false);
            setEditingAnchorId(null);
          }}
          providerId={currentProviderId}
          editAnchorId={editingAnchorId}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName="Anchor"
      />

      {/* Preview Modal - Fetches PDF from backend storage */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewAnchor(null);
        }}
        providerId={currentProviderId}
        anchor={previewAnchor}
        totalPages={pdfTotalPages}
      />
    </section>
  );
}
