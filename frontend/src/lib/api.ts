/**
 * API Service - Connects frontend to Flask backend
 * Updated: Supports multiple PDFs per provider, each with own anchors
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Helper for API requests
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return res.json();
}

// ============ API Types ============

export interface APIAnchor {
  id: number;
  pdfId?: number;
  text: string;
  x: number;
  y: number;
  page: string;
  canvasWidth?: number;
  canvasHeight?: number;
  pdfFilename?: string;
}

export interface APIPdf {
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
  anchors: APIAnchor[];
  anchorCount: number;
}

export interface APIProvider {
  id: string;
  name: string;
  active: boolean;
  pdfs: APIPdf[];
  pdfCount: number;
  anchors: APIAnchor[];  // Flattened view of all anchors (backward compat)
}

// ============ PROVIDER API ============

export const providerAPI = {
  // Get all providers
  getAll: () => fetchAPI<APIProvider[]>('/providers'),

  // Get single provider with all PDFs and anchors
  getById: (id: string) => fetchAPI<APIProvider>(`/providers/${id}`),

  // Create provider
  create: (name: string) => 
    fetchAPI<APIProvider>('/providers', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Update provider
  update: (id: string, data: { name?: string; active?: boolean }) =>
    fetchAPI<APIProvider>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete provider
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/providers/${id}`, {
      method: 'DELETE',
    }),
};

// ============ PDF API (Multiple PDFs per Provider) ============

export const pdfAPI = {
  // List all PDFs for a provider
  list: (providerId: string) =>
    fetchAPI<APIPdf[]>(`/providers/${providerId}/pdfs`),

  // Upload new PDF for provider
  upload: async (providerId: string, file: File, canvasWidth?: number, canvasHeight?: number): Promise<APIPdf> => {
    const formData = new FormData();
    formData.append('pdf', file);
    if (canvasWidth) formData.append('canvasWidth', String(canvasWidth));
    if (canvasHeight) formData.append('canvasHeight', String(canvasHeight));

    const res = await fetch(`${API_URL}/api/providers/${providerId}/pdfs`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Upload failed' }));
      if (res.status === 409) {
        throw new Error(error.message || 'This PDF already exists');
      }
      throw new Error(error.message || 'Upload failed');
    }

    return res.json();
  },

  // Get PDF info by ID
  getInfo: (pdfId: number) => 
    fetchAPI<APIPdf>(`/pdfs/${pdfId}/info`),

  // Download PDF by ID as ArrayBuffer (for viewing)
  download: async (pdfId: number): Promise<ArrayBuffer> => {
    const res = await fetch(`${API_URL}/api/pdfs/${pdfId}`);
    if (!res.ok) {
      throw new Error('Failed to download PDF');
    }
    return res.arrayBuffer();
  },

  // Download PDF by Provider ID (legacy - gets first PDF)
  downloadByProvider: async (providerId: string): Promise<ArrayBuffer> => {
    const res = await fetch(`${API_URL}/api/providers/${providerId}/pdf`);
    if (!res.ok) {
      throw new Error('Failed to download PDF');
    }
    return res.arrayBuffer();
  },

  // Update PDF metadata
  update: (pdfId: number, data: { filename?: string; canvasWidth?: number; canvasHeight?: number }) =>
    fetchAPI<APIPdf>(`/pdfs/${pdfId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Soft delete PDF
  delete: (pdfId: number) =>
    fetchAPI<{ message: string }>(`/pdfs/${pdfId}`, {
      method: 'DELETE',
    }),

  // Hard delete PDF (permanent)
  hardDelete: (pdfId: number) =>
    fetchAPI<{ message: string }>(`/pdfs/${pdfId}/hard-delete`, {
      method: 'DELETE',
    }),

  // Check for duplicate
  checkDuplicate: async (file: File): Promise<{ 
    isDuplicate: boolean; 
    existingPdfId?: number;
    existingProviderName?: string; 
    existingProviderId?: string;
    filename?: string;
  }> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch(`${API_URL}/api/pdf/check-duplicate`, {
      method: 'POST',
      body: formData,
    });

    return res.json();
  },
};

// ============ ANCHOR API (Belongs to PDF) ============

export const anchorAPI = {
  // Get all anchors for a specific PDF
  getByPdf: (pdfId: number) => 
    fetchAPI<APIAnchor[]>(`/pdfs/${pdfId}/anchors`),

  // Get all anchors for a provider (aggregated from all PDFs)
  getByProvider: (providerId: string) => 
    fetchAPI<APIAnchor[]>(`/providers/${providerId}/anchors`),

  // Create anchor for a specific PDF
  create: (pdfId: number, anchor: Omit<APIAnchor, 'id'>) =>
    fetchAPI<APIAnchor>(`/pdfs/${pdfId}/anchors`, {
      method: 'POST',
      body: JSON.stringify(anchor),
    }),

  // Create anchor for provider (legacy - uses first PDF or requires pdfId in body)
  createForProvider: (providerId: string, anchor: Omit<APIAnchor, 'id'> & { pdfId?: number }) =>
    fetchAPI<APIAnchor>(`/providers/${providerId}/anchors`, {
      method: 'POST',
      body: JSON.stringify(anchor),
    }),

  // Update anchor
  update: (anchorId: number, data: Partial<APIAnchor>) =>
    fetchAPI<APIAnchor>(`/anchors/${anchorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete anchor
  delete: (anchorId: number) =>
    fetchAPI<{ message: string }>(`/anchors/${anchorId}`, {
      method: 'DELETE',
    }),
};

// ============ AUTOFILL API ============

export const autofillAPI = {
  /**
   * Process PDF with anchors (direct anchor input)
   */
  process: async (
    file: File, 
    anchors: APIAnchor[], 
    canvasWidth: number, 
    canvasHeight: number,
    preview: boolean = false
  ) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('anchors', JSON.stringify(anchors));
    formData.append('canvasWidth', String(canvasWidth));
    formData.append('canvasHeight', String(canvasHeight));
    formData.append('preview', String(preview));

    const res = await fetch(`${API_URL}/api/autofill`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Processing failed' }));
      throw new Error(error.message || 'Processing failed');
    }

    return res.blob();
  },

  /**
   * Process PDF using anchors from a saved PDF template
   */
  processWithPdf: async (
    file: File,
    pdfId: number,
    preview: boolean = false
  ) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('preview', String(preview));

    const res = await fetch(`${API_URL}/api/autofill/pdf/${pdfId}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Processing failed' }));
      throw new Error(error.message || 'Processing failed');
    }

    return res.blob();
  },
};
