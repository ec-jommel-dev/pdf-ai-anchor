/**
 * PHASE 8.4: Provider Profile Section
 * Provider details, PDF management, and anchor management
 * Updated: Confirmation modals for status toggle and delete
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Pin, Eye, FileText, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AnchorModal } from '@/components/modals/AnchorModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { PreviewModal } from '@/components/modals/PreviewModal';
import { useProviderStore } from '@/stores/useProviderStore';
import { pdfAPI } from '@/lib/api';
import { Anchor, ProviderPDF } from '@/types';

export function ProviderProfileSection() {
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showDeleteAnchorModal, setShowDeleteAnchorModal] = useState(false);
  const [showDeletePdfModal, setShowDeletePdfModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingAnchorId, setEditingAnchorId] = useState<number | null>(null);
  const [deleteAnchorTargetId, setDeleteAnchorTargetId] = useState<number | null>(null);
  const [deletePdfTarget, setDeletePdfTarget] = useState<ProviderPDF | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<ProviderPDF | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<Anchor | null>(null);
  const [isUpdatingPdf, setIsUpdatingPdf] = useState<number | null>(null);

  const { 
    getCurrentProvider, 
    setActiveTab, 
    deleteAnchor,
    currentProviderId,
    currentPdfId,
    setCurrentPdfId,
    getCurrentPdfAnchors,
    pdfTotalPages,
    showToast,
    fetchProviders
  } = useProviderStore();

  const provider = getCurrentProvider();
  const selectedAnchors = getCurrentPdfAnchors();
  const selectedPdf = provider?.pdfs.find(p => p.id === currentPdfId);

  // Auto-select first active PDF when provider changes
  useEffect(() => {
    if (provider && provider.pdfs.length > 0 && !currentPdfId) {
      const firstActivePdf = provider.pdfs.find(p => p.isActive);
      if (firstActivePdf) {
        setCurrentPdfId(firstActivePdf.id);
      }
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

  // Open status toggle confirmation
  const handleStatusToggleClick = (pdf: ProviderPDF) => {
    setStatusToggleTarget(pdf);
    setShowStatusModal(true);
  };

  // Confirm status toggle
  const handleConfirmStatusToggle = async () => {
    if (!statusToggleTarget) return;
    
    setIsUpdatingPdf(statusToggleTarget.id);
    setShowStatusModal(false);
    
    try {
      const newStatus = !statusToggleTarget.isActive;
      await pdfAPI.update(statusToggleTarget.id, { isActive: newStatus });
      showToast(`PDF ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
      await fetchProviders();
      
      // If we deactivated the currently selected PDF, select another active one
      if (!newStatus && currentPdfId === statusToggleTarget.id) {
        const nextActivePdf = provider.pdfs.find(p => p.id !== statusToggleTarget.id && p.isActive);
        setCurrentPdfId(nextActivePdf?.id || null);
      }
    } catch {
      showToast('Failed to update PDF status', 'error');
    } finally {
      setIsUpdatingPdf(null);
      setStatusToggleTarget(null);
    }
  };

  // Open delete PDF confirmation
  const handleDeletePdfClick = (pdf: ProviderPDF) => {
    setDeletePdfTarget(pdf);
    setShowDeletePdfModal(true);
  };

  // Confirm delete PDF
  const handleConfirmDeletePdf = async () => {
    if (!deletePdfTarget) return;
    
    try {
      await pdfAPI.hardDelete(deletePdfTarget.id);
      showToast(`PDF "${deletePdfTarget.filename}" and its ${deletePdfTarget.anchorCount} anchor(s) deleted!`, 'success');
      await fetchProviders();
      
      // If we deleted the currently selected PDF, select another
      if (currentPdfId === deletePdfTarget.id) {
        const nextPdf = provider.pdfs.find(p => p.id !== deletePdfTarget.id && p.isActive);
        setCurrentPdfId(nextPdf?.id || null);
      }
    } catch {
      showToast('Failed to delete PDF', 'error');
    } finally {
      setDeletePdfTarget(null);
      setShowDeletePdfModal(false);
    }
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

  const handleDeleteAnchorClick = (id: number) => {
    setDeleteAnchorTargetId(id);
    setShowDeleteAnchorModal(true);
  };

  const handleConfirmDeleteAnchor = async () => {
    if (deleteAnchorTargetId !== null) {
      try {
        await deleteAnchor(deleteAnchorTargetId);
        showToast('Anchor deleted successfully!', 'success');
      } catch {
        // Error handled by store
      }
    }
    setDeleteAnchorTargetId(null);
  };

  const handlePreview = (anchor: Anchor) => {
    setPreviewAnchor(anchor);
    setShowPreviewModal(true);
  };

  // Filter active PDFs for the anchor settings selector
  const activePdfs = provider.pdfs.filter(p => p.isActive);

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
              {provider.pdfs.length} contract(s) ({activePdfs.length} active)
            </div>
          </div>
        </div>
      </div>

      {/* PDF Management Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-heading)] m-0">
          Contract PDFs
        </h3>
        <Button 
          variant="primary" 
          onClick={() => setActiveTab('upload')}
        >
          <FileText size={14} /> Upload New PDF
        </Button>
      </div>

      {/* PDF Table - Shows ALL PDFs (active and inactive) */}
      {provider.pdfs.length > 0 ? (
        <div className="table-card mb-6">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Pages</th>
                <th>Anchors</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {provider.pdfs.map((pdf) => (
                <tr key={pdf.id} className={!pdf.isActive ? 'opacity-60' : ''}>
                  <td data-label="Filename">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className={pdf.isActive ? 'text-[var(--gh-green)]' : 'text-[#8b949e]'} />
                      <span className={`font-medium ${!pdf.isActive ? 'line-through' : ''}`}>
                        {pdf.filename}
                      </span>
                    </div>
                    {pdf.createdAt && (
                      <div className="text-xs text-[#8b949e] mt-1">
                        Added: {new Date(pdf.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td data-label="Pages">
                    {pdf.totalPages || '-'}
                  </td>
                  <td data-label="Anchors">
                    <Badge variant={pdf.anchorCount > 0 ? 'active' : 'default'}>
                      {pdf.anchorCount}
                    </Badge>
                  </td>
                  <td data-label="Status">
                    <button
                      onClick={() => handleStatusToggleClick(pdf)}
                      disabled={isUpdatingPdf === pdf.id}
                      className="flex items-center gap-1.5 text-sm cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity"
                      title={pdf.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {isUpdatingPdf === pdf.id ? (
                        <span className="text-[#8b949e]">Updating...</span>
                      ) : pdf.isActive ? (
                        <>
                          <ToggleRight size={22} className="text-[var(--gh-green)]" />
                          <span className="text-[var(--gh-green)] font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={22} className="text-[var(--gh-red)]" />
                          <span className="text-[var(--gh-red)] font-medium">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="action-cell" data-label="Actions">
                    <Button 
                      variant="danger" 
                      onClick={() => handleDeletePdfClick(pdf)}
                      title={`Delete PDF and ${pdf.anchorCount} anchor(s)`}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-card p-6 mb-6 text-center">
          <FileText size={40} className="mx-auto mb-3 text-[#8b949e]" />
          <p className="text-[#8b949e] mb-3">No contract PDFs uploaded yet.</p>
          <Button 
            variant="primary" 
            onClick={() => setActiveTab('upload')}
          >
            Upload PDF in Contract Mapper
          </Button>
        </div>
      )}

      {/* PDF Selection for Anchors (only active PDFs) */}
      {activePdfs.length > 0 && (
        <div className="table-card p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Pin size={18} className="text-[var(--gh-blue)]" />
            <h4 className="text-sm font-semibold text-[var(--text-heading)] m-0">
              Select PDF for Anchor Settings
            </h4>
          </div>
          
          <Select 
            value={currentPdfId?.toString() || ''} 
            onChange={handlePdfChange}
            placeholder="-- Select an active PDF --"
            options={activePdfs.map((pdf) => ({
              value: String(pdf.id),
              label: `${pdf.filename} (${pdf.anchorCount} anchor${pdf.anchorCount !== 1 ? 's' : ''})`
            }))}
          />

          {selectedPdf && (
            <div className="mt-3 text-xs text-[#8b949e] flex gap-4">
              <span>{selectedPdf.totalPages || '?'} pages</span>
              <span>{selectedPdf.fileSize ? `${(selectedPdf.fileSize / 1024).toFixed(1)} KB` : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* No Active PDFs Message */}
      {provider.pdfs.length > 0 && activePdfs.length === 0 && (
        <div className="table-card p-6 mb-6 text-center border border-[var(--gh-yellow)]">
          <AlertTriangle size={40} className="mx-auto mb-3 text-[var(--gh-yellow)]" />
          <p className="text-[var(--text-heading)] font-medium mb-2">No Active PDFs</p>
          <p className="text-[#8b949e] mb-3">
            All contract PDFs are inactive. Activate a PDF above to manage its anchors.
          </p>
        </div>
      )}

      {/* Anchor Settings Header */}
      {activePdfs.length > 0 && (
        <>
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
                        <Button variant="danger" onClick={() => handleDeleteAnchorClick(anchor.id)}>
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
                {!currentPdfId && activePdfs.length > 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-[#8b949e] py-8">
                      Please select a PDF above to view its anchors.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

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

      {/* Delete Anchor Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteAnchorModal}
        onClose={() => {
          setShowDeleteAnchorModal(false);
          setDeleteAnchorTargetId(null);
        }}
        onConfirm={handleConfirmDeleteAnchor}
        itemName="Anchor"
      />

      {/* Status Toggle Confirmation Modal */}
      <Modal 
        isOpen={showStatusModal} 
        onClose={() => {
          setShowStatusModal(false);
          setStatusToggleTarget(null);
        }}
      >
        <div className="text-center">
          {statusToggleTarget?.isActive ? (
            <ToggleLeft size={40} className="text-[var(--gh-yellow)] mx-auto mb-4" />
          ) : (
            <ToggleRight size={40} className="text-[var(--gh-green)] mx-auto mb-4" />
          )}
          
          <h3 className="text-lg font-semibold text-[var(--text-heading)] mb-2">
            {statusToggleTarget?.isActive ? 'Deactivate' : 'Activate'} PDF?
          </h3>
          
          <p className="text-sm text-[#8b949e] mb-2">
            <strong className="text-[var(--text-heading)]">{statusToggleTarget?.filename}</strong>
          </p>
          
          {statusToggleTarget?.isActive ? (
            <div className="text-sm text-[#8b949e] mb-4">
              <p className="mb-2">Deactivating this PDF will:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>Remove it from the anchor settings dropdown</li>
                <li>Prevent it from being used in Auto Fill</li>
                <li>Keep all {statusToggleTarget.anchorCount} anchor(s) intact</li>
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[#8b949e] mb-4">
              This will make the PDF available for anchor settings and Auto Fill again.
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <Button 
              variant={statusToggleTarget?.isActive ? 'default' : 'primary'}
              onClick={handleConfirmStatusToggle}
              className="justify-center py-2.5 w-full"
            >
              {statusToggleTarget?.isActive ? 'Yes, Deactivate PDF' : 'Yes, Activate PDF'}
            </Button>
            <Button 
              onClick={() => {
                setShowStatusModal(false);
                setStatusToggleTarget(null);
              }}
              className="justify-center py-2.5 w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete PDF Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeletePdfModal}
        onClose={() => {
          setShowDeletePdfModal(false);
          setDeletePdfTarget(null);
        }}
        onConfirm={handleConfirmDeletePdf}
        itemName={deletePdfTarget ? `PDF "${deletePdfTarget.filename}"` : 'PDF'}
        extraWarning={deletePdfTarget && deletePdfTarget.anchorCount > 0 
          ? `This will permanently delete ${deletePdfTarget.anchorCount} anchor(s) associated with this PDF. This action cannot be undone.`
          : 'This will permanently delete the PDF file from the server.'
        }
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
