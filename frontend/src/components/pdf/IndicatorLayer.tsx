/**
 * PHASE 7.4: Indicator Layer Component
 * Overlay displaying anchor dots and labels on PDF canvas
 */

'use client';

import { Anchor } from '@/types';
import { shouldShowOnPage } from '@/lib/utils';

interface IndicatorLayerProps {
  anchors: Anchor[];
  currentPage: number;
  totalPages: number;
  canvasWidth: number;
  canvasHeight: number;
  displayWidth: number;
  displayHeight: number;
}

export function IndicatorLayer({
  anchors,
  currentPage,
  totalPages,
  canvasWidth,
  canvasHeight,
  displayWidth,
  displayHeight
}: IndicatorLayerProps) {
  // Don't render if dimensions are not yet available
  if (canvasWidth === 0 || canvasHeight === 0 || displayWidth === 0 || displayHeight === 0) {
    return null;
  }

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{ width: displayWidth, height: displayHeight }}
    >
      {anchors.map((anchor) => {
        // Check if this anchor should show on current page
        if (!shouldShowOnPage(anchor.page, currentPage, totalPages)) {
          return null;
        }

        // Calculate visual position based on canvas/display ratio
        // anchor.x and anchor.y are in canvas pixel coordinates
        // We need to convert them to display (CSS) coordinates
        const visualX = (anchor.x / canvasWidth) * displayWidth;
        const visualY = (anchor.y / canvasHeight) * displayHeight;

        return (
          <div key={anchor.id}>
            {/* Anchor Dot */}
            <div
              className="coord-dot"
              style={{
                left: `${visualX}px`,
                top: `${visualY}px`
              }}
            />
            {/* Anchor Label */}
            <div
              className="coord-label"
              style={{
                left: `${visualX}px`,
                top: `${visualY}px`
              }}
            >
              {anchor.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
