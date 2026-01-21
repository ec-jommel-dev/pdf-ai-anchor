/**
 * PHASE 8.4: Provider Profile Section
 * Provider details, PDF selection, and anchor management
 * Updated: Multiple PDFs per provider with dropdown selection
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Pin, Eye, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
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
    currentPdfId,
    setCurrentPdfId,
    getCurrentPdfAnchors,
    pdfTotalPages,
    showToast
  } = useProviderStore();

  const provider = getCurrentProvider();
  const selectedAnchors = getCurrentPdfAnchors();
  const selectedPdf = provider?.pdfs.find(p => p.id === currentPdfId);

  // Auto-select first PDF when provider changes
  useEffect(() => {
    if (provider && provider.pdfs.length > 0 && !currentPdfId) {
      setCurrentPdfId(provider.pdfs[0].id);
    }
  }, [provider, currentPdfId, setCurrentPdfId]);

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

  const handlePdfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pdfId = e.target.value ? parseInt(e.target.value) : null;
    setCurrentPdfId(pdfId);
  };

  const handleAddAnchor = () => {
    if (!currentPdfId) {
      showToast('Please select a PDF first', 'error');
      return;
    }
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
    if (deleteTargetId !== null) {
      try {
        await deleteAnchor(deleteTargetId);
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
        
        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
              PDFs
            </label>
            <div className="text-sm text-[var(--text-heading)]">
              {provider.pdfCount || provider.pdfs.length} contract(s)
            </div>
          </div>
        </div>
      </div>

      {/* PDF Selection Card */}
      {provider.pdfs.length > 0 && (
        <div className="table-card p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={18} className="text-[var(--gh-green)]" />
            <h4 className="text-sm font-semibold text-[var(--text-heading)] m-0">
              Select Contract PDF
            </h4>
          </div>
          
          <Select 
            value={currentPdfId?.toString() || ''} 
            onChange={handlePdfChange}
            placeholder="-- Select a PDF --"
            options={provider.pdfs.map((pdf) => ({
              value: String(pdf.id),
              label: `${pdf.filename} (${pdf.anchorCount} anchor${pdf.anchorCount !== 1 ? 's' : ''})`
            }))}
          />

          {selectedPdf && (
            <div className="mt-3 text-xs text-[#8b949e] flex gap-4">
              <span>{selectedPdf.totalPages || '?'} pages</span>
              <span>{selectedPdf.fileSize ? `${(selectedPdf.fileSize / 1024).toFixed(1)} KB` : ''}</span>
              {selectedPdf.createdAt && (
                <span>Added: {new Date(selectedPdf.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* No PDFs Message */}
      {provider.pdfs.length === 0 && (
        <div className="table-card p-6 mb-6 text-center">
          <FileText size={40} className="mx-auto mb-3 text-[#8b949e]" />
          <p className="text-[#8b949e] mb-3">No contract PDFs uploaded yet.</p>
          <Button 
            variant="primary" 
            onClick={() => {
              setCurrentPdfId(null);
              setActiveTab('upload');
            }}
          >
            Upload PDF in Contract Mapper
          </Button>
        </div>
      )}

      {/* Anchor Settings Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-heading)] m-0">
          Anchor Settings {selectedPdf && <span className="text-sm font-normal text-[#8b949e]">for {selectedPdf.filename}</span>}
        </h3>
        <Button 
          variant="primary" 
          onClick={handleAddAnchor}
          disabled={!currentPdfId}
        >
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
            {selectedAnchors.map((anchor) => (
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
            {selectedAnchors.length === 0 && currentPdfId && (
              <tr>
                <td colSpan={4} className="text-center text-[#8b949e] py-8">
                  No anchors for this PDF. Click "Add Anchor" to create one.
                </td>
              </tr>
            )}
            {!currentPdfId && provider.pdfs.length > 0 && (
              <tr>
                <td colSpan={4} className="text-center text-[#8b949e] py-8">
                  Please select a PDF above to view its anchors.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Anchor Modal */}
      {currentPdfId && (
        <AnchorModal
          isOpen={showAnchorModal}
          onClose={() => {
            setShowAnchorModal(false);
            setEditingAnchorId(null);
          }}
          providerId={currentProviderId || ''}
          pdfId={currentPdfId}
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

      {/* Preview Modal - Uses pdfId */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewAnchor(null);
        }}
        pdfId={currentPdfId}
        providerId={currentProviderId}
        anchor={previewAnchor}
        totalPages={pdfTotalPages}
      />
    </section>
  );
}
