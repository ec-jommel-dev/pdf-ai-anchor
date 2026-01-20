/**
 * PHASE 9.4: Preview Modal Component
 * Full-screen preview of anchor location on PDF page
 * - Fetches PDF from backend storage (not browser memory)
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Anchor } from '@/types';
import { pdfAPI } from '@/lib/api';

// Dynamic import for PDF.js to avoid SSR issues
type PDFJSLib = typeof import('pdfjs-dist');
let pdfjsLib: PDFJSLib | null = null;

const RENDER_SCALE = 2.0;

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string | null;
  anchor: Anchor | null;
  totalPages: number;
}

export function PreviewModal({ 
  isOpen, 
  onClose, 
  providerId, 
  anchor,
  totalPages 
}: PreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderPreview = useCallback(async () => {
    if (!providerId || !anchor || !canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch PDF from backend storage
      const pdfData = await pdfAPI.download(providerId);
      
      // Dynamic import of PDF.js
      if (!pdfjsLib) {
        pdfjsLib = await import('pdfjs-dist');
        // Use unpkg CDN for the worker (more reliable)
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
      
      // Create a copy of ArrayBuffer to avoid detachment issues
      const dataCopy = pdfData.slice(0);
      const doc = await pdfjsLib.getDocument({ data: dataCopy }).promise;
      
      // Determine which page to render
      let pageToLoad = 1;
      if (anchor.page === 'last') {
        pageToLoad = totalPages > 0 ? totalPages : doc.numPages;
      } else if (anchor.page !== 'global') {
        const pages = anchor.page.split(',').map(n => parseInt(n.trim(), 10));
        pageToLoad = pages[0] || 1;
      }

      const page = await doc.getPage(pageToLoad);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = canvasRef.current;
      
      // Guard against null canvas (component might have unmounted)
      if (!canvas) {
        setIsLoading(false);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const visualWidth = viewport.width / (RENDER_SCALE / 1.5);
      const visualHeight = viewport.height / (RENDER_SCALE / 1.5);

      canvas.style.width = `${visualWidth}px`;
      canvas.style.height = `${visualHeight}px`;

      setDisplayDimensions({ width: visualWidth, height: visualHeight });

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      }).promise;

    } catch (error) {
      console.error('Error rendering preview:', error);
      setError('No PDF uploaded for this provider. Please upload a contract in Contract Mapper first.');
    } finally {
      setIsLoading(false);
      
      // Reset scroll to top first, then scroll to anchor
      setTimeout(() => {
        // Find the scroll container and reset to top
        const scrollContainer = canvasRef.current?.closest('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
        
        // Then scroll to anchor position after a brief delay
        setTimeout(() => {
          const dot = indicatorRef.current?.querySelector('.coord-dot');
          if (dot) {
            dot.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }, 100);
    }
  }, [providerId, anchor, totalPages]);

  useEffect(() => {
    if (isOpen && providerId && anchor) {
      renderPreview();
    }
  }, [isOpen, providerId, anchor, renderPreview]);

  if (!anchor) return null;

  // Calculate visual position
  const canvasWidth = canvasRef.current?.width || 1;
  const canvasHeight = canvasRef.current?.height || 1;
  const visualX = (anchor.x / canvasWidth) * displayDimensions.width;
  const visualY = (anchor.y / canvasHeight) * displayDimensions.height;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-[90vw] w-[1000px]"
      className="h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-heading)] m-0">
          Anchor Context Preview
        </h3>
        <Button onClick={onClose}>
          <X size={16} /> Close
        </Button>
      </div>

      {/* PDF Preview Area */}
      <div className="flex-1 bg-[#525659] rounded-lg relative overflow-auto border border-[var(--border-default)] flex justify-center items-center p-5">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#525659] z-20">
            <Loader2 size={40} className="animate-spin text-white mb-3" />
            <p className="text-white">Loading PDF...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center px-4">
            <p className="text-[var(--gh-red)] mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        )}

        {/* PDF Canvas - Always rendered so ref stays valid */}
        {!error && (
          <div 
            className="relative"
            style={{ 
              width: displayDimensions.width || 'auto',
              height: displayDimensions.height || 'auto',
              lineHeight: 0,
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {/* Indicator Layer */}
            <div 
              ref={indicatorRef}
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: displayDimensions.width, height: displayDimensions.height }}
            >
              {displayDimensions.width > 0 && !isLoading && (
                <>
                  <div
                    className="coord-dot"
                    style={{ left: `${visualX}px`, top: `${visualY}px` }}
                  />
                  <div
                    className="coord-label"
                    style={{ left: `${visualX}px`, top: `${visualY}px` }}
                  >
                    {anchor.text}
                  </div>
                </>
              )}
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="bg-white shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4">
        <p className="text-[13px] font-medium text-[var(--text-heading)] m-0">
          Anchor: {anchor.text} | Page: {String(anchor.page).toUpperCase()}
        </p>
        <Button variant="primary" onClick={onClose}>
          Confirm View
        </Button>
      </div>
    </Modal>
  );
}
