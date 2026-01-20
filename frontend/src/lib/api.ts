/**
 * API Service - Connects frontend to Flask backend
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

// Provider types from API
export interface APIProvider {
  id: string;
  name: string;
  active: boolean;
  anchors: APIAnchor[];
}

export interface APIAnchor {
  id: number;
  text: string;
  x: number;
  y: number;
  page: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

// ============ PROVIDER API ============

export const providerAPI = {
  // Get all providers
  getAll: () => fetchAPI<APIProvider[]>('/providers'),

  // Get single provider
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

// ============ ANCHOR API ============

export const anchorAPI = {
  // Get all anchors for provider
  getAll: (providerId: string) => 
    fetchAPI<APIAnchor[]>(`/providers/${providerId}/anchors`),

  // Create anchor
  create: (providerId: string, anchor: Omit<APIAnchor, 'id'>) =>
    fetchAPI<APIAnchor>(`/providers/${providerId}/anchors`, {
      method: 'POST',
      body: JSON.stringify(anchor),
    }),

  // Update anchor (uses /anchors/:id endpoint)
  update: (providerId: string, anchorId: number, data: Partial<APIAnchor>) =>
    fetchAPI<APIAnchor>(`/anchors/${anchorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete anchor (uses /anchors/:id endpoint)
  delete: (providerId: string, anchorId: number) =>
    fetchAPI<{ message: string }>(`/anchors/${anchorId}`, {
      method: 'DELETE',
    }),
};

// ============ PDF API ============

export interface APIPdfInfo {
  id: number;
  filename: string;
  fileSize: number;
  totalPages: number;
  contentHash: string | null;
  createdAt: string | null;
}

export const pdfAPI = {
  // Upload PDF for provider (stores in backend)
  upload: async (providerId: string, file: File): Promise<APIPdfInfo> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch(`${API_URL}/api/providers/${providerId}/pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Upload failed' }));
      // Check for duplicate warning
      if (res.status === 409) {
        throw new Error(error.message || 'This PDF already exists for another provider');
      }
      throw new Error(error.message || 'Upload failed');
    }

    return res.json();
  },

  // Get PDF info for provider
  getInfo: (providerId: string) => 
    fetchAPI<APIPdfInfo>(`/providers/${providerId}/pdf/info`),

  // Download PDF as blob (for viewing in PDFViewer)
  download: async (providerId: string): Promise<ArrayBuffer> => {
    const res = await fetch(`${API_URL}/api/providers/${providerId}/pdf`);
    if (!res.ok) {
      throw new Error('Failed to download PDF');
    }
    return res.arrayBuffer();
  },

  // Delete PDF
  delete: (providerId: string) =>
    fetchAPI<{ message: string }>(`/providers/${providerId}/pdf`, {
      method: 'DELETE',
    }),

  // Check for duplicate before upload
  checkDuplicate: async (file: File): Promise<{ isDuplicate: boolean; existingProviderName?: string; existingProviderId?: string }> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch(`${API_URL}/api/pdf/check-duplicate`, {
      method: 'POST',
      body: formData,
    });

    return res.json();
  },
};

// ============ AUTOFILL API ============

export const autofillAPI = {
  /**
   * Process PDF with anchors
   * @param file - PDF file to process
   * @param anchors - Array of anchor settings
   * @param canvasWidth - Canvas width when anchors were placed
   * @param canvasHeight - Canvas height when anchors were placed
   * @param preview - If true, uses RED text (for verification). If false, uses WHITE text (clean output)
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

    // Return blob for download
    return res.blob();
  },
};
