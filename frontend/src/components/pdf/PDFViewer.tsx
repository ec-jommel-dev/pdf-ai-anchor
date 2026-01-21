/**
 * PHASE 7.3: PDF Viewer Component
 * Canvas-based PDF renderer with page navigation and click-to-place anchors
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IndicatorLayer } from './IndicatorLayer';
import { Anchor } from '@/types';

// Dynamic import for PDF.js to avoid SSR issues
type PDFJSLib = typeof import('pdfjs-dist');
let pdfjsLib: PDFJSLib | null = null;

const RENDER_SCALE = 2.0;

interface PDFViewerProps {
  pdfData: ArrayBuffer;
  anchors: Anchor[];
  onCanvasClick: (x: number, y: number, page: number) => void;
  onReset: () => void;
  onFinish: () => void;
  onPagesLoaded?: (totalPages: number) => void;
  onDimensionsChange?: (canvasWidth: number, canvasHeight: number) => void;
}

export function PDFViewer({ 
  pdfData, 
  anchors, 
  onCanvasClick, 
  onReset, 
  onFinish,
  onPagesLoaded,
  onDimensionsChange
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  // Load PDF.js and PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Dynamic import of PDF.js
        if (!pdfjsLib) {
          pdfjsLib = await import('pdfjs-dist');
          // Use unpkg CDN for the worker (more reliable)
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        
        // Create a copy of ArrayBuffer to avoid detachment issues
        const dataCopy = pdfData.slice(0);
        const doc = await pdfjsLib.getDocument({ data: dataCopy }).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
        onPagesLoaded?.(doc.numPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [pdfData, onPagesLoaded]);

  // Render current page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas dimensions (high-res for sharp rendering)
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Set display dimensions (visual size)
      const visualWidth = viewport.width / (RENDER_SCALE / 1.5);
      const visualHeight = viewport.height / (RENDER_SCALE / 1.5);

      canvas.style.width = `${visualWidth}px`;
      canvas.style.height = `${visualHeight}px`;

      // Render PDF page
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      });
      
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
      
      // Set dimensions AFTER render completes to ensure accuracy
      // Use actual canvas dimensions for canvas coordinates
      setCanvasDimensions({ width: canvas.width, height: canvas.height });
      
      // Get actual rendered dimensions from getBoundingClientRect for display coordinates
      // This ensures click position matches indicator position exactly
      const actualRect = canvas.getBoundingClientRect();
      setDisplayDimensions({ width: actualRect.width, height: actualRect.height });
      
      // Notify parent of canvas dimensions for anchor storage
      onDimensionsChange?.(canvas.width, canvas.height);
    } catch (error) {
      // Ignore cancelled render errors
      if (error instanceof Error && error.message.includes('cancelled')) {
        return;
      }
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc]);

  // Re-render when page changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
    
    // Cleanup on unmount
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [pdfDoc, currentPage, renderPage]);

  // Handle page navigation
  const changePage = (delta: number) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvasDimensions.width === 0 || displayDimensions.width === 0) return;

    const rect = canvas.getBoundingClientRect();
    
    // Use state dimensions for consistency with IndicatorLayer
    // This ensures click coordinates match display coordinates
    const scaleX = canvasDimensions.width / displayDimensions.width;
    const scaleY = canvasDimensions.height / displayDimensions.height;

    // Calculate coordinates relative to canvas pixel space
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    onCanvasClick(x, y, currentPage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-main)]">Loading PDF...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)] m-0">Interactive Mapper</h2>
        <div className="flex gap-2.5">
          <Button onClick={() => setShowResetConfirm(true)}>
            <RefreshCw size={14} /> Start Over
          </Button>
          <Button variant="primary" onClick={onFinish}>
            <Check size={14} /> Finish & Review
          </Button>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-4 p-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-t-md">
        <Button onClick={() => changePage(-1)} disabled={currentPage <= 1}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-[13px] font-semibold text-[var(--text-heading)]">
          Page {currentPage} of {totalPages}
        </span>
        <Button onClick={() => changePage(1)} disabled={currentPage >= totalPages}>
          <ChevronRight size={16} />
        </Button>
        <div className="ml-auto text-[11px] text-[var(--gh-blue)]">
          Click PDF to place anchor
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="pdf-viewport">
        <div 
          className="relative shadow-lg bg-white"
          style={{ 
            width: displayDimensions.width > 0 ? displayDimensions.width : 'auto',
            height: displayDimensions.height > 0 ? displayDimensions.height : 'auto',
            lineHeight: 0
          }}
        >
          {/* Indicator Layer */}
          <IndicatorLayer
            anchors={anchors}
            currentPage={currentPage}
            totalPages={totalPages}
            canvasWidth={canvasDimensions.width}
            canvasHeight={canvasDimensions.height}
            displayWidth={displayDimensions.width}
            displayHeight={displayDimensions.height}
          />
          
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair block"
          />
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)}>
        <div className="text-center">
          <AlertTriangle size={40} className="text-[var(--gh-yellow)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-heading)] mb-2">
            Start Over?
          </h3>
          <p className="text-sm text-[#8b949e] mb-4">
            This will close the current PDF and return to the upload screen.
            {anchors.length > 0 && (
              <span className="block mt-2 text-[var(--gh-green)]">
                ✓ Your {anchors.length} saved anchor(s) are safe in the database.
              </span>
            )}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button 
              onClick={() => {
                setShowResetConfirm(false);
                onReset();
              }}
              className="justify-center py-2.5 w-full"
            >
              Yes, Start Over
            </Button>
            <Button 
              variant="primary"
              onClick={() => setShowResetConfirm(false)}
              className="justify-center py-2.5 w-full"
            >
              Continue Mapping
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
