/**
 * PHASE 9.2: Anchor Modal Component
 * Add/Edit anchor with coordinates and page settings
 * Includes live preview with click-to-adjust coordinates and zoom
 * Updated: Uses pdfId for anchor operations (multiple PDFs per provider)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, Loader2, MousePointer2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useProviderStore } from '@/stores/useProviderStore';
import { formatAnchorText, extractAnchorKey } from '@/lib/utils';
import { pdfAPI } from '@/lib/api';

// Dynamic import for PDF.js
type PDFJSLib = typeof import('pdfjs-dist');
let pdfjsLib: PDFJSLib | null = null;

const RENDER_SCALE = 2.0; // Higher quality rendering

interface AnchorModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  pdfId: number;           // Required: anchor belongs to specific PDF
  editAnchorId?: number | null;
  initialX?: number;
  initialY?: number;
  initialPage?: number;
  onSaveSuccess?: () => void;
}

const pageOptions = [
  { value: 'global', label: 'Global (Every Page)' },
  { value: 'specific', label: 'Specific Pages...' },
  { value: 'last', label: 'Last Page' }
];

export function AnchorModal({
  isOpen,
  onClose,
  providerId,
  pdfId,
  editAnchorId,
  initialX = 0,
  initialY = 0,
  initialPage,
  onSaveSuccess
}: AnchorModalProps) {
  const [anchorKey, setAnchorKey] = useState('');
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [pageType, setPageType] = useState<string>('specific');
  const [specificPages, setSpecificPages] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    anchorKey?: string;
    x?: string;
    y?: string;
    pages?: string;
  }>({});
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.0); // Zoom level (0.5 to 2.0)
  const [baseDisplayDimensions, setBaseDisplayDimensions] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { addAnchor, updateAnchor, getAnchorById, showToast, pdfTotalPages } = useProviderStore();

  // Populate form when editing or with initial values
  useEffect(() => {
    if (editAnchorId) {
      const anchor = getAnchorById(editAnchorId);
      if (anchor) {
        setAnchorKey(extractAnchorKey(anchor.text));
        setX(anchor.x);
        setY(anchor.y);
        
        // Determine page type
        if (anchor.page === 'global' || anchor.page === 'last') {
          setPageType(anchor.page);
        } else {
          setPageType('specific');
          setSpecificPages(anchor.page);
        }
      }
    } else {
      // New anchor - use initial values
      setAnchorKey('');
      setX(initialX);
      setY(initialY);
      if (initialPage) {
        setPageType('specific');
        setSpecificPages(String(initialPage));
      }
    }
  }, [editAnchorId, getAnchorById, isOpen, initialX, initialY, initialPage]);

  // Load preview PDF using pdfId
  const loadPreview = useCallback(async () => {
    if (!pdfId || !canvasRef.current) return;
    
    setIsLoadingPreview(true);
    setPreviewError(null);
    
    try {
      // Download PDF by pdfId
      const pdfData = await pdfAPI.download(pdfId);
      
      if (!pdfjsLib) {
        pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
      
      const dataCopy = pdfData.slice(0);
      const doc = await pdfjsLib.getDocument({ data: dataCopy }).promise;
      
      // Determine page to show
      let pageNum = 1;
      if (pageType === 'last') {
        pageNum = doc.numPages;
      } else if (pageType === 'specific') {
        const pages = specificPages.split(',').map(n => parseInt(n.trim(), 10));
        pageNum = pages[0] || 1;
      }
      
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = canvasRef.current;
      
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      setCanvasDimensions({ width: viewport.width, height: viewport.height });
      
      // Calculate base display size (larger for better viewing)
      const baseWidth = 500; // Larger base width
      const scale = baseWidth / viewport.width;
      const displayWidth = viewport.width * scale;
      const displayHeight = viewport.height * scale;
      
      setBaseDisplayDimensions({ width: displayWidth, height: displayHeight });
      
      // Apply current zoom
      canvas.style.width = `${displayWidth * zoom}px`;
      canvas.style.height = `${displayHeight * zoom}px`;
      setDisplayDimensions({ width: displayWidth * zoom, height: displayHeight * zoom });
      
      await page.render({
        canvasContext: ctx,
        viewport,
        canvas
      }).promise;
      
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError('Failed to load PDF preview.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [pdfId, pageType, specificPages, zoom]);

  // Load preview when toggled on
  useEffect(() => {
    if (showPreview && isOpen) {
      loadPreview();
    }
  }, [showPreview, isOpen, loadPreview]);

  // Update display dimensions when zoom changes
  useEffect(() => {
    if (baseDisplayDimensions.width > 0 && canvasRef.current) {
      const newWidth = baseDisplayDimensions.width * zoom;
      const newHeight = baseDisplayDimensions.height * zoom;
      canvasRef.current.style.width = `${newWidth}px`;
      canvasRef.current.style.height = `${newHeight}px`;
      setDisplayDimensions({ width: newWidth, height: newHeight });
    }
  }, [zoom, baseDisplayDimensions]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 2.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Handle click on preview to adjust coordinates
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || displayDimensions.width === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert from display coordinates to canvas coordinates
    const newX = Math.round((clickX / displayDimensions.width) * canvasDimensions.width);
    const newY = Math.round((clickY / displayDimensions.height) * canvasDimensions.height);
    
    setX(newX);
    setY(newY);
  }, [displayDimensions, canvasDimensions]);

  // Calculate indicator position on preview
  const indicatorX = displayDimensions.width > 0 ? (x / canvasDimensions.width) * displayDimensions.width : 0;
  const indicatorY = displayDimensions.height > 0 ? (y / canvasDimensions.height) * displayDimensions.height : 0;

  // Validate anchor input - only alphanumeric and underscores
  const handleKeyChange = (value: string) => {
    const cleaned = value.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9_]/g, '');
    setAnchorKey(cleaned);
  };

  const handleSave = async () => {
    // Validate all fields
    const newErrors: typeof errors = {};
    
    if (!anchorKey.trim()) {
      newErrors.anchorKey = 'Anchor key is required';
    }
    
    if (x < 0) {
      newErrors.x = 'X must be positive';
    } else if (x > 10000) {
      newErrors.x = 'X is too large';
    }
    
    if (y < 0) {
      newErrors.y = 'Y must be positive';
    } else if (y > 10000) {
      newErrors.y = 'Y is too large';
    }
    
    if (pageType === 'specific') {
      // Validate specific pages format (e.g., "1", "1,2,3", "1-5")
      const pagesPattern = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
      if (!specificPages.trim()) {
        newErrors.pages = 'Page number is required';
      } else if (!pagesPattern.test(specificPages.trim())) {
        newErrors.pages = 'Invalid format. Use: 1 or 1,2,3 or 1-5';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSaving(true);

    const pageValue = pageType === 'specific' ? specificPages : pageType;

    const anchorData = {
      text: formatAnchorText(anchorKey),
      x,
      y,
      page: pageValue,
      canvasWidth: canvasDimensions.width || undefined,
      canvasHeight: canvasDimensions.height || undefined,
      pdfId: pdfId
    };

    try {
      if (editAnchorId) {
        await updateAnchor(editAnchorId, anchorData);
        showToast('Anchor updated successfully!', 'success');
      } else {
        await addAnchor(pdfId, anchorData);
        showToast('Anchor saved successfully!', 'success');
      }

      onSaveSuccess?.();
      handleClose();
    } catch {
      // Error already handled by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setAnchorKey('');
    setX(0);
    setY(0);
    setPageType('specific');
    setSpecificPages('1');
    setShowPreview(false);
    setPreviewError(null);
    setZoom(1.0);
    setErrors({});
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      maxWidth={showPreview ? 'max-w-[1100px]' : 'max-w-md'}
      className={showPreview ? 'h-[90vh] flex flex-col' : ''}
    >
      <h3 className="text-lg font-semibold text-[var(--text-heading)] mt-0 mb-4">
        {editAnchorId ? 'Edit Anchor' : 'Map Anchor String'}
      </h3>

      <div className={`${showPreview ? 'flex gap-6 flex-1 min-h-0' : ''}`}>
        {/* Form Section */}
        <div className={showPreview ? 'w-[320px] flex-shrink-0' : ''}>
          {/* Anchor Key Input with {{ }} decoration */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Anchor Key (e.g. day)
            </label>
            <div className={`anchor-input-container ${errors.anchorKey ? 'border-[var(--gh-red)]' : ''}`}>
              <span className="anchor-bracket">{'{{'}</span>
              <input
                type="text"
                className="form-input"
                placeholder="day"
                value={anchorKey}
                onChange={(e) => {
                  handleKeyChange(e.target.value);
                  if (errors.anchorKey) setErrors(prev => ({ ...prev, anchorKey: undefined }));
                }}
              />
              <span className="anchor-bracket">{'}}'}</span>
            </div>
            {errors.anchorKey && (
              <p className="text-xs text-[var(--gh-red)] mt-1">{errors.anchorKey}</p>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            <Input
              label="X-Coordinate"
              type="number"
              value={x}
              onChange={(e) => {
                setX(parseInt(e.target.value) || 0);
                if (errors.x) setErrors(prev => ({ ...prev, x: undefined }));
              }}
              error={errors.x}
              min={0}
            />
            <Input
              label="Y-Coordinate"
              type="number"
              value={y}
              onChange={(e) => {
                setY(parseInt(e.target.value) || 0);
                if (errors.y) setErrors(prev => ({ ...prev, y: undefined }));
              }}
              error={errors.y}
              min={0}
            />
          </div>

          {/* Page Location */}
          <Select
            label="Page Location"
            options={pageOptions}
            value={pageType}
            onChange={(e) => setPageType(e.target.value)}
          />

          {/* Specific Pages Input */}
          {pageType === 'specific' && (
            <Input
              label={`Enter Pages (1-${pdfTotalPages || '?'})`}
              placeholder="1, 2, 6, 7"
              value={specificPages}
              onChange={(e) => {
                setSpecificPages(e.target.value);
                if (errors.pages) setErrors(prev => ({ ...prev, pages: undefined }));
              }}
              error={errors.pages}
            />
          )}

          {/* Preview Toggle Button */}
          <Button 
            onClick={() => setShowPreview(!showPreview)} 
            className="mt-4 w-full"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Hide Preview' : 'Show Preview & Adjust'}
          </Button>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Preview Header with Zoom Controls */}
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-main)]">
                Live Preview <span className="text-[#8b949e] font-normal">(click to adjust)</span>
              </label>
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 rounded bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} className="text-[var(--text-main)]" />
                </button>
                
                <span className="text-xs text-[var(--text-main)] min-w-[50px] text-center font-mono">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 2.5}
                  className="p-1.5 rounded bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} className="text-[var(--text-main)]" />
                </button>
                
                <button
                  onClick={handleZoomReset}
                  className="p-1.5 rounded bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw size={16} className="text-[var(--text-main)]" />
                </button>
              </div>
            </div>
            
            {/* Preview Container with Scroll */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 bg-[#525659] rounded-lg relative overflow-auto min-h-0"
            >
              {isLoadingPreview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-white mb-2" />
                  <p className="text-white text-sm">Loading preview...</p>
                </div>
              )}
              
              {previewError && !isLoadingPreview && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[var(--gh-red)] text-sm">{previewError}</p>
                </div>
              )}
              
              {!previewError && (
                <div 
                  ref={containerRef}
                  className="p-4 flex justify-center"
                  style={{ 
                    opacity: isLoadingPreview ? 0 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <div 
                    className="relative cursor-crosshair"
                    style={{ 
                      width: displayDimensions.width || 'auto',
                      height: displayDimensions.height || 'auto'
                    }}
                  >
                    {/* Canvas */}
                    <canvas
                      ref={canvasRef}
                      onClick={handlePreviewClick}
                      className="bg-white shadow-lg rounded"
                    />
                    
                    {/* Indicator - Fixed tiny size for precise placement */}
                    {displayDimensions.width > 0 && (
                      <div 
                        className="absolute pointer-events-none z-10"
                        style={{ 
                          left: `${indicatorX}px`, 
                          top: `${indicatorY}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {/* Tiny 4px dot - stays small for accuracy */}
                        <div 
                          className="w-1 h-1 bg-[var(--gh-red)] rounded-full"
                          style={{ 
                            boxShadow: '0 0 0 1px white, 0 0 0 2px var(--gh-red), 0 1px 3px rgba(0,0,0,0.4)'
                          }}
                        />
                        {/* Small label */}
                        {anchorKey && (
                          <div 
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--gh-red)] text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap shadow"
                          >
                            {`{{${anchorKey}}}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Hint */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#8b949e]">
              <MousePointer2 size={12} />
              Click on PDF to set anchor position • Scroll to pan • Use zoom controls for detail
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2.5 mt-4">
        <Button onClick={handleClose} disabled={isSaving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Anchor'}
        </Button>
      </div>
    </Modal>
  );
}
