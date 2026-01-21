/**
 * PHASE 8.2: Auto Fill Section
 * Upload PDF to apply saved anchor coordinates automatically
 * Updated: Supports selecting specific PDF template per provider
 * 
 * FLOW:
 * 1. User selects provider
 * 2. User selects PDF template (if provider has multiple PDFs)
 * 3. User selects PDF file → Shows confirmation
 * 4. User clicks "Process" to confirm
 * 5. Backend places anchor text at coordinates
 * 6. Returns new PDF → Auto-download
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Loader2, Download, AlertCircle, FileText, X, Eye } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { PDFUploadBox } from '@/components/pdf/PDFUploadBox';
import { Button } from '@/components/ui/Button';
import { WarningModal } from '@/components/modals/WarningModal';
import { useProviderStore } from '@/stores/useProviderStore';
import { autofillAPI } from '@/lib/api';

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export function AutoFillSection() {
  const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Staged file - user selected but not yet processed
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  const { getActiveProviders, currentProviderId, setCurrentProvider, getProviderById } = useProviderStore();

  const activeProviders = getActiveProviders();
  const providerOptions = activeProviders.map((p) => ({
    value: p.id,
    label: p.name
  }));

  // Get current provider with PDFs
  const currentProvider = currentProviderId ? getProviderById(currentProviderId) : null;
  
  // Get selected PDF's anchors
  const selectedPdf = useMemo(() => {
    if (!currentProvider || !selectedPdfId) return null;
    return currentProvider.pdfs.find(p => p.id === selectedPdfId);
  }, [currentProvider, selectedPdfId]);
  
  const selectedAnchors = selectedPdf?.anchors || [];
  const hasAnchors = selectedAnchors.length > 0;

  // PDF options for dropdown
  const pdfOptions = useMemo(() => {
    if (!currentProvider) return [];
    return currentProvider.pdfs.map(pdf => ({
      value: String(pdf.id),
      label: `${pdf.filename} (${pdf.anchorCount} anchors)`
    }));
  }, [currentProvider]);

  // Handle provider change
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentProvider(e.target.value);
    setSelectedPdfId(null); // Reset PDF selection
    setError(null);
    setSuccess(false);
    setStagedFile(null);
  };

  // Handle PDF selection change
  const handlePdfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pdfId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedPdfId(pdfId);
    setError(null);
    setSuccess(false);
  };

  // Validate before upload - show warning modal if issues
  const handleBeforeUpload = useCallback(() => {
    if (!currentProviderId || activeProviders.length === 0) {
      setWarningMessage('Please select a provider first before uploading a PDF contract.');
      setShowWarningModal(true);
      return false;
    }
    if (!selectedPdfId) {
      setWarningMessage('Please select a PDF template with anchor settings.');
      setShowWarningModal(true);
      return false;
    }
    if (!hasAnchors) {
      setWarningMessage('Selected PDF has no anchor settings configured. Please add anchors in Contract Mapper first.');
      setShowWarningModal(true);
      return false;
    }
    return true;
  }, [currentProviderId, activeProviders.length, selectedPdfId, hasAnchors]);

  // Handle file selection - just stage the file, don't process yet
  const handleFileSelect = useCallback((file: File) => {
    setStagedFile(file);
    setError(null);
    setSuccess(false);
  }, []);

  // Cancel staged file
  const handleCancelStaged = useCallback(() => {
    setStagedFile(null);
    setError(null);
  }, []);

  /**
   * Process the staged file using autofillAPI
   * @param preview - If true, uses RED text (for verification). If false, uses WHITE text (clean output for signing)
   */
  const handleConfirmProcess = useCallback(async (preview: boolean = false) => {
    if (!currentProviderId || !currentProvider || !stagedFile || !selectedPdfId) {
      setError('Please select a provider, PDF template, and file first.');
      return;
    }

    if (!hasAnchors) {
      setError('Selected PDF has no anchor settings. Please add anchors in Contract Mapper first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // Get canvas dimensions from first anchor
      const firstAnchor = selectedAnchors[0];
      const canvasWidth = firstAnchor?.canvasWidth || 1224;
      const canvasHeight = firstAnchor?.canvasHeight || 1584;

      // Use autofillAPI which handles the fetch
      const pdfBlob = await autofillAPI.process(
        stagedFile,
        selectedAnchors,
        canvasWidth,
        canvasHeight,
        preview
      );
      
      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Filename based on mode
      const suffix = preview ? '_preview' : '_filled';
      link.download = `${currentProvider.name.replace(/\s+/g, '_')}${suffix}_contract.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSuccess(true);
      // Don't clear staged file so user can download both versions
      if (!preview) {
        setStagedFile(null);
      }
    } catch (err) {
      console.error('Auto-fill error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentProviderId, currentProvider, stagedFile, selectedPdfId, hasAnchors, selectedAnchors]);

  return (
    <section className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)] m-0">
          Auto Fill Anchor Strings
        </h2>
      </div>

      <div className="table-card p-6">
        {/* Provider Selection */}
        <Select
          label="Select Provider"
          placeholder="-- Select Provider --"
          options={providerOptions}
          value={currentProviderId || ''}
          onChange={handleProviderChange}
        />

        {/* PDF Template Selection (if provider has PDFs) */}
        {currentProvider && currentProvider.pdfs.length > 0 && (
          <Select
            label="Select PDF Template"
            placeholder="-- Select PDF with anchors --"
            options={pdfOptions}
            value={selectedPdfId?.toString() || ''}
            onChange={handlePdfChange}
          />
        )}

        {/* No PDFs Message */}
        {currentProvider && currentProvider.pdfs.length === 0 && (
          <div className="mt-2 mb-4 text-sm text-[var(--gh-red)]">
            ⚠ This provider has no PDF templates. Upload a contract in Contract Mapper first.
          </div>
        )}

        {/* Anchor Count Info */}
        {selectedPdf && (
          <div className="mt-2 mb-4 text-sm text-[var(--text-main)]">
            {hasAnchors ? (
              <span className="text-[var(--gh-green)]">
                ✓ {selectedAnchors.length} anchor{selectedAnchors.length > 1 ? 's' : ''} configured for {selectedPdf.filename}
              </span>
            ) : (
              <span className="text-[var(--gh-red)]">
                ⚠ No anchors configured for this PDF. Add anchors in Contract Mapper first.
              </span>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-[rgba(207,34,46,0.1)] border border-[var(--gh-red)] rounded-md text-[var(--gh-red)] text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-[rgba(26,127,55,0.1)] border border-[var(--gh-green)] rounded-md text-[var(--gh-green)] text-sm">
            <Download size={16} />
            PDF processed successfully! Your download should start automatically.
          </div>
        )}

        {/* Upload States */}
        {isProcessing ? (
          /* Processing State */
          <div className="border-2 border-dashed border-[var(--border-default)] rounded-lg p-10 text-center">
            <Loader2 size={40} className="animate-spin text-[var(--gh-green)] mx-auto mb-4" />
            <p className="text-[var(--text-heading)] font-medium">Processing PDF...</p>
            <p className="text-sm text-[#8b949e] mt-2">
              Placing {selectedAnchors.length || 0} anchor(s) on your document
            </p>
          </div>
        ) : stagedFile ? (
          /* File Selected - Confirmation View */
          <div className="mt-4 border-2 border-solid border-[var(--gh-green)] bg-[rgba(26,127,55,0.05)] rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[var(--gh-green)] rounded-lg flex items-center justify-center">
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
              Using template: <strong className="text-[var(--text-heading)]">{selectedPdf?.filename}</strong> 
              <br />({selectedAnchors.length || 0} anchor{(selectedAnchors.length || 0) > 1 ? 's' : ''})
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCancelStaged}>
                Cancel
              </Button>
              <Button onClick={() => handleConfirmProcess(true)}>
                <Eye size={16} /> Preview (Red Text)
              </Button>
              <Button variant="primary" onClick={() => handleConfirmProcess(false)}>
                <Download size={16} /> Download Clean
              </Button>
            </div>
            
            <p className="text-xs text-[#8b949e] mt-3">
              💡 <strong>Preview:</strong> Red text to verify positions | <strong>Clean:</strong> White text for signing
            </p>
          </div>
        ) : (
          /* Default Upload Box */
          <PDFUploadBox 
            onFileSelect={handleFileSelect}
            onBeforeUpload={handleBeforeUpload}
            variant="autofill"
          />
        )}

        {/* Manual Retry Button (shown after error) */}
        {error && (
          <div className="mt-4 text-center">
            <Button onClick={() => setError(null)}>
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-md">
        <h4 className="text-sm font-semibold text-[var(--text-heading)] mb-2">How it works:</h4>
        <ol className="text-sm text-[var(--text-main)] space-y-1 list-decimal list-inside">
          <li>Select a provider</li>
          <li>Select a PDF template with configured anchor settings</li>
          <li>Upload a PDF contract (same format as the template)</li>
          <li>Click <strong>"Preview"</strong> to download with <span className="text-[var(--gh-red)]">red text</span> (verify positions)</li>
          <li>Click <strong>"Download Clean"</strong> to get the final PDF with white text (ready for signing)</li>
        </ol>
      </div>

      {/* Warning Modal */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Cannot Upload"
        message={warningMessage}
      />
    </section>
  );
}
