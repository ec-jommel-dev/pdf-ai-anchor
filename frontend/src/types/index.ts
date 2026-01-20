/**
 * PHASE 3: Type Definitions
 * Core interfaces for the ProviderHub application
 */

// Anchor represents a coordinate marker on a PDF document
export interface Anchor {
  id: number;
  text: string;           // e.g., "{{signature_1}}"
  x: number;              // X coordinate on PDF canvas
  y: number;              // Y coordinate on PDF canvas
  page: string;           // 'global' | 'last' | comma-separated page numbers (e.g., "1, 2, 5")
  canvasWidth?: number;   // Canvas width when anchor was placed (for accurate conversion)
  canvasHeight?: number;  // Canvas height when anchor was placed (for accurate conversion)
}

// Provider represents a company/entity with associated anchor settings
export interface Provider {
  id: string;
  name: string;
  active: boolean;
  anchors: Anchor[];
}

// Navigation tabs in the application
export type TabType = 'upload' | 'autofill' | 'list' | 'profile';

// Modal types for controlling which modal is open
export type ModalType = 
  | 'provider' 
  | 'anchor' 
  | 'preview' 
  | 'nextStep' 
  | 'confirmDelete' 
  | null;

// PDF state for the viewer component
export interface PDFState {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
}
