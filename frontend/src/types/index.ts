/**
 * PHASE 3: Type Definitions
 * Core interfaces for the PDF Anchor Mapper application
 * Updated: Anchors now belong to PDFs, not directly to Providers
 */

// Anchor represents a coordinate marker on a PDF document
export interface Anchor {
  id: number;
  pdfId?: number;          // Reference to parent PDF
  text: string;            // e.g., "{{signature_1}}"
  x: number;               // X coordinate on PDF canvas
  y: number;               // Y coordinate on PDF canvas
  page: string;            // 'global' | 'last' | comma-separated page numbers
  canvasWidth?: number;    // Canvas width when anchor was placed
  canvasHeight?: number;   // Canvas height when anchor was placed
  pdfFilename?: string;    // For display: which PDF this anchor belongs to
}

// ProviderPDF represents an uploaded contract PDF template
export interface ProviderPDF {
  id: number;
  providerId: number;
  filename: string;
  filePath?: string;
  fileSize?: number;
  totalPages?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  contentHash?: string;
  isActive: boolean;
  createdAt?: string;
  anchors: Anchor[];       // Each PDF has its own anchors
  anchorCount: number;
}

// Provider represents a company/entity with multiple PDF templates
export interface Provider {
  id: string;
  name: string;
  active: boolean;
  pdfs: ProviderPDF[];     // Multiple PDFs per provider
  pdfCount: number;
  anchors: Anchor[];       // Flattened view of all anchors (backward compatibility)
}

// Navigation tabs in the application
export type TabType = 'dashboard' | 'upload' | 'autofill' | 'list' | 'converter' | 'profile';

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
