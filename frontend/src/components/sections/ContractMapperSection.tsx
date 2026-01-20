/**
 * PHASE 8.1: Contract Mapper Section
 * PDF upload and interactive anchor mapping
 * - User selects file → sees confirmation → clicks Upload button
 * - Uploads PDF to backend (stores in uploads folder)
 * - PDF is saved for preview in Anchor Settings
 */

'use client';

import { useState, useCallback } from 'react';
import { Loader2, FileText, X, Upload } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PDFUploadBox } from '@/components/pdf/PDFUploadBox';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { AnchorModal } from '@/components/modals/AnchorModal';
import { NextStepModal } from '@/components/modals/NextStepModal';
import { WarningModal } from '@/components/modals/WarningModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { useProviderStore } from '@/stores/useProviderStore';
import { pdfAPI } from '@/lib/api';

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export function ContractMapperSection() {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showNextStepModal, setShowNextStepModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clickCoords, setClickCoords] = useState({ x: 0, y: 0, page: 1 });
  
  // Staged file - user selected but not yet uploaded
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  const { 
    getActiveProviders, 
    currentProviderId, 
    setCurrentProvider,
    getCurrentProvider,
    setPdfData: setStorePdfData,
    setPdfTotalPages,
    setCanvasDimensions,
    viewProfile,
    showToast
  } = useProviderStore();

  const activeProviders = getActiveProviders();
  const currentProvider = getCurrentProvider();

  // Provider dropdown options
  const providerOptions = activeProviders.map((p) => ({
    value: p.id,
    label: p.name
  }));

  // Handle file selection - just stage the file, don't upload yet
  const handleFileSelect = useCallback((file: File) => {
    setStagedFile(file);
    setUploadError(null);
  }, []);

  // Cancel staged file
  const handleCancelStaged = useCallback(() => {
    setStagedFile(null);
    setUploadError(null);
  }, []);

  // Confirm and upload the staged file
  const handleConfirmUpload = useCallback(async () => {
    if (!currentProviderId || !stagedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload PDF to backend (stores in uploads folder + saves to DB)
      await pdfAPI.upload(currentProviderId, stagedFile);
      showToast('PDF uploaded successfully!', 'success');

      // Now get the PDF back as ArrayBuffer for viewing
      const arrayBuffer = await pdfAPI.download(currentProviderId);
      const copy = arrayBuffer.slice(0);
      
      setPdfData(copy);
      setStorePdfData(copy);
      setStagedFile(null);
      setShowMapper(true);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload PDF');
      showToast('Failed to upload PDF', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [currentProviderId, stagedFile, setStorePdfData, showToast]);

  // Handle canvas click - opens anchor modal with coordinates
  const handleCanvasClick = useCallback((x: number, y: number, page: number) => {
    setClickCoords({ x, y, page });
    setShowAnchorModal(true);
  }, []);

  // Reset to upload view
  const handleReset = useCallback(() => {
    setPdfData(null);
    setShowMapper(false);
    setUploadError(null);
  }, []);

  // Handle anchor save success
  const handleAnchorSaved = useCallback(() => {
    setShowNextStepModal(true);
  }, []);

  // Handle "Finish & Review" - show success modal
  const handleFinish = useCallback(() => {
    setShowNextStepModal(false);
    setShowSuccessModal(true);
  }, []);

  // Navigate to provider profile to see anchors
  const handleGoToAnchorSettings = useCallback(() => {
    setShowSuccessModal(false);
    handleReset();
    if (currentProviderId) {
      viewProfile(currentProviderId);
    }
  }, [currentProviderId, viewProfile, handleReset]);

  // Handle provider change
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentProvider(e.target.value);
    setUploadError(null);
  };

  // Handle total pages update from PDFViewer
  const handlePagesLoaded = useCallback((total: number) => {
    setPdfTotalPages(total);
  }, [setPdfTotalPages]);

  // Handle canvas dimensions update from PDFViewer
  const handleDimensionsChange = useCallback((width: number, height: number) => {
    setCanvasDimensions({ width, height });
  }, [setCanvasDimensions]);

  // Validate before upload - show warning if no provider selected
  const handleBeforeUpload = useCallback(() => {
    if (!currentProviderId || activeProviders.length === 0) {
      setShowWarningModal(true);
      return false;
    }
    return true;
  }, [currentProviderId, activeProviders.length]);

  return (
    <section className="max-w-[900px] mx-auto">
      {!showMapper ? (
        /* Upload Initial View */
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-heading)] m-0">
              Upload & Map Contract
            </h2>
          </div>

          <div className="table-card p-6">
            <Select
              label="Assign to Provider"
              placeholder="-- Select Provider --"
              options={providerOptions}
              value={currentProviderId || ''}
              onChange={handleProviderChange}
            />

            {/* Error Message */}
            {uploadError && (
              <div className="mt-4 p-3 bg-[rgba(207,34,46,0.1)] border border-[var(--gh-red)] rounded-md text-[var(--gh-red)] text-sm">
                {uploadError}
              </div>
            )}

            {/* Upload States */}
            {isUploading ? (
              /* Uploading State */
              <div className="mt-6 border-2 border-dashed border-[var(--border-default)] rounded-lg p-10 text-center">
                <Loader2 size={40} className="animate-spin text-[var(--gh-blue)] mx-auto mb-4" />
                <p className="text-[var(--text-heading)] font-medium">Uploading PDF...</p>
                <p className="text-sm text-[#8b949e] mt-2">
                  Storing file for {currentProvider?.name || 'provider'}
                </p>
              </div>
            ) : stagedFile ? (
              /* File Selected - Confirmation View */
              <div className="mt-6 border-2 border-solid border-[var(--gh-blue)] bg-[rgba(9,105,218,0.05)] rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[var(--gh-blue)] rounded-lg flex items-center justify-center">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-heading)] font-medium truncate">
                      {stagedFile.name}
                    </p>
                    <p className="text-sm text-[#8b949e]">
                      {formatFileSize(stagedFile.size)}
                    </p>
                  </div>
                  <button 
                    onClick={handleCancelStaged}
                    className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    title="Remove file"
                  >
                    <X size={20} className="text-[#8b949e]" />
                  </button>
                </div>
                
                <p className="text-sm text-[#8b949e] mb-4">
                  Ready to upload for <strong className="text-[var(--text-heading)]">{currentProvider?.name}</strong>
                </p>
                
                <div className="flex gap-3">
                  <Button onClick={handleCancelStaged}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleConfirmUpload}>
                    <Upload size={16} /> Upload & Continue
                  </Button>
                </div>
              </div>
            ) : (
              /* Default Upload Box */
              <PDFUploadBox 
                onFileSelect={handleFileSelect}
                onBeforeUpload={handleBeforeUpload}
              />
            )}
          </div>

          {/* How it works */}
          <div className="mt-6 p-4 bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-md">
            <h4 className="text-sm font-semibold text-[var(--text-heading)] mb-2">How it works:</h4>
            <ol className="text-sm text-[var(--text-main)] space-y-1 list-decimal list-inside">
              <li>Select a provider to assign the contract to</li>
              <li>Upload a PDF contract document</li>
              <li>Click anywhere on the PDF to place anchor markers</li>
              <li>Set the anchor key (e.g., <code className="text-[var(--gh-blue)]">{'{{day}}'}</code>) and page settings</li>
              <li>Anchors are saved and can be used in Auto Fill</li>
            </ol>
          </div>
        </div>
      ) : (
        /* PDF Mapper View */
        pdfData && currentProviderId && (
          <PDFViewer
            pdfData={pdfData}
            anchors={currentProvider?.anchors || []}
            onCanvasClick={handleCanvasClick}
            onReset={handleReset}
            onFinish={handleFinish}
            onPagesLoaded={handlePagesLoaded}
            onDimensionsChange={handleDimensionsChange}
          />
        )
      )}

      {/* Anchor Modal */}
      {currentProviderId && (
        <AnchorModal
          isOpen={showAnchorModal}
          onClose={() => setShowAnchorModal(false)}
          providerId={currentProviderId}
          initialX={clickCoords.x}
          initialY={clickCoords.y}
          initialPage={clickCoords.page}
          onSaveSuccess={handleAnchorSaved}
        />
      )}

      {/* Next Step Modal */}
      <NextStepModal
        isOpen={showNextStepModal}
        onKeepMapping={() => setShowNextStepModal(false)}
        onFinish={handleFinish}
      />

      {/* Success Modal - Mapping Complete */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Mapping Complete!"
        message={`Anchor settings have been saved for ${currentProvider?.name || 'this provider'}. You can view and edit them in the Anchor Settings.`}
        primaryAction={{
          label: 'View Anchor Settings',
          onClick: handleGoToAnchorSettings
        }}
        secondaryAction={{
          label: 'Map Another PDF',
          onClick: () => {
            setShowSuccessModal(false);
            handleReset();
          }
        }}
      />

      {/* Warning Modal - No Provider Selected */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="No Provider Selected"
        message="Please select a provider first before uploading a PDF contract."
      />
    </section>
  );
}
