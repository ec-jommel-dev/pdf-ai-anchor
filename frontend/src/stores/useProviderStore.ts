/**
 * PHASE 4: State Management with Zustand
 * Centralized store for providers, anchors, and navigation state
 * Connected to Flask backend API
 */

import { create } from 'zustand';
import { Provider, Anchor, TabType, ModalType, ProviderPDF } from '@/types';
import { providerAPI, anchorAPI } from '@/lib/api';

// Initial state - empty providers (loaded from API)
const initialProviders: Provider[] = [];

// LocalStorage keys
const STORAGE_KEYS = {
  ACTIVE_TAB: 'pdfAnchor_activeTab',
  CURRENT_PROVIDER: 'pdfAnchor_currentProviderId'
};

// Helper to safely save to localStorage
const saveToStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

// Helper to safely get from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

interface ToastState {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

interface ProviderStore {
  // State
  providers: Provider[];
  currentProviderId: string | null;
  currentPdfId: number | null;  // Selected PDF for anchor operations
  activeTab: TabType;
  openModal: ModalType;
  editingAnchorId: number | null;
  deleteTargetId: number | null;
  pdfData: ArrayBuffer | null;
  pdfTotalPages: number;
  canvasDimensions: { width: number; height: number };
  toast: ToastState;
  isLoading: boolean;

  // Provider Actions (async - connected to API)
  fetchProviders: () => Promise<void>;
  addProvider: (name: string) => Promise<void>;
  updateProvider: (id: string, name: string, active?: boolean) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  toggleProviderStatus: (id: string) => Promise<void>;
  getActiveProviders: () => Provider[];
  getProviderById: (id: string) => Provider | undefined;
  getCurrentProvider: () => Provider | undefined;

  // Anchor Actions (async - connected to API, now use pdfId)
  addAnchor: (pdfId: number, anchor: Omit<Anchor, 'id'>) => Promise<void>;
  updateAnchor: (anchorId: number, data: Partial<Anchor>) => Promise<void>;
  deleteAnchor: (anchorId: number) => Promise<void>;
  getAnchorById: (anchorId: number) => Anchor | undefined;
  
  // PDF Selection Actions
  setCurrentPdfId: (id: number | null) => void;
  getCurrentPdf: () => ProviderPDF | undefined;
  getCurrentPdfAnchors: () => Anchor[];

  // Navigation Actions
  setActiveTab: (tab: TabType) => void;
  setCurrentProvider: (id: string | null) => void;
  viewProfile: (id: string) => void;

  // Modal Actions
  setOpenModal: (modal: ModalType) => void;
  setEditingAnchorId: (id: number | null) => void;
  setDeleteTargetId: (id: number | null) => void;

  // PDF Actions
  setPdfData: (data: ArrayBuffer | null) => void;
  setPdfTotalPages: (pages: number) => void;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;

  // Toast Actions
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;

  // Hydration Action (load from localStorage + API after mount)
  hydrateFromStorage: () => Promise<void>;
  isHydrated: boolean;
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  // Initial State (defaults - data loaded from API after hydration)
  providers: initialProviders,
  currentProviderId: null,
  currentPdfId: null,
  activeTab: 'dashboard',
  openModal: null,
  editingAnchorId: null,
  deleteTargetId: null,
  pdfData: null,
  pdfTotalPages: 1,
  canvasDimensions: { width: 0, height: 0 },
  toast: { message: '', type: 'success', isVisible: false },
  isHydrated: false,
  isLoading: false,

  // Provider Actions (connected to API)
  fetchProviders: async () => {
    set({ isLoading: true });
    try {
      const providers = await providerAPI.getAll();
      set({ providers, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      set({ isLoading: false });
      get().showToast('Failed to load providers', 'error');
    }
  },

  addProvider: async (name: string) => {
    try {
      const newProvider = await providerAPI.create(name);
      set((state) => ({
        providers: [...state.providers, { ...newProvider, anchors: newProvider.anchors || [] }]
      }));
    } catch (error) {
      console.error('Failed to add provider:', error);
      get().showToast('Failed to add provider', 'error');
      throw error;
    }
  },

  updateProvider: async (id: string, name: string, active?: boolean) => {
    try {
      const data: { name?: string; active?: boolean } = { name };
      if (active !== undefined) data.active = active;
      await providerAPI.update(id, data);
      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id ? { ...p, name, ...(active !== undefined && { active }) } : p
        )
      }));
    } catch (error) {
      console.error('Failed to update provider:', error);
      get().showToast('Failed to update provider', 'error');
      throw error;
    }
  },

  deleteProvider: async (id: string) => {
    try {
      await providerAPI.delete(id);
      set((state) => ({
        providers: state.providers.filter((p) => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete provider:', error);
      get().showToast('Failed to delete provider', 'error');
      throw error;
    }
  },

  toggleProviderStatus: async (id: string) => {
    const provider = get().getProviderById(id);
    if (!provider) return;
    try {
      await providerAPI.update(id, { active: !provider.active });
      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id ? { ...p, active: !p.active } : p
        )
      }));
    } catch (error) {
      console.error('Failed to toggle status:', error);
      get().showToast('Failed to update status', 'error');
      throw error;
    }
  },

  getActiveProviders: () => {
    return get().providers.filter((p) => p.active);
  },

  getProviderById: (id: string) => {
    return get().providers.find((p) => p.id === id);
  },

  getCurrentProvider: () => {
    const { currentProviderId, providers } = get();
    return providers.find((p) => p.id === currentProviderId);
  },

  // Anchor Actions (connected to API - now use pdfId)
  addAnchor: async (pdfId: number, anchor: Omit<Anchor, 'id'>) => {
    const { canvasDimensions, currentProviderId } = get();
    const anchorData = {
      ...anchor,
      canvasWidth: canvasDimensions.width || anchor.canvasWidth,
      canvasHeight: canvasDimensions.height || anchor.canvasHeight
    };
    try {
      const newAnchor = await anchorAPI.create(pdfId, anchorData);
      // Update the provider's PDF anchors in state
      set((state) => ({
        providers: state.providers.map((p) => {
          if (p.id !== currentProviderId) return p;
          return {
            ...p,
            anchors: [...p.anchors, newAnchor],
            pdfs: p.pdfs.map((pdf) =>
              pdf.id === pdfId
                ? { ...pdf, anchors: [...pdf.anchors, newAnchor], anchorCount: pdf.anchorCount + 1 }
                : pdf
            )
          };
        })
      }));
    } catch (error) {
      console.error('Failed to add anchor:', error);
      get().showToast('Failed to add anchor', 'error');
      throw error;
    }
  },

  updateAnchor: async (anchorId: number, data: Partial<Anchor>) => {
    try {
      await anchorAPI.update(anchorId, data);
      set((state) => ({
        providers: state.providers.map((p) => ({
          ...p,
          anchors: p.anchors.map((a) => a.id === anchorId ? { ...a, ...data } : a),
          pdfs: p.pdfs.map((pdf) => ({
            ...pdf,
            anchors: pdf.anchors.map((a) => a.id === anchorId ? { ...a, ...data } : a)
          }))
        }))
      }));
    } catch (error) {
      console.error('Failed to update anchor:', error);
      get().showToast('Failed to update anchor', 'error');
      throw error;
    }
  },

  deleteAnchor: async (anchorId: number) => {
    try {
      await anchorAPI.delete(anchorId);
      set((state) => ({
        providers: state.providers.map((p) => ({
          ...p,
          anchors: p.anchors.filter((a) => a.id !== anchorId),
          pdfs: p.pdfs.map((pdf) => ({
            ...pdf,
            anchors: pdf.anchors.filter((a) => a.id !== anchorId),
            anchorCount: pdf.anchors.filter((a) => a.id !== anchorId).length
          }))
        }))
      }));
    } catch (error) {
      console.error('Failed to delete anchor:', error);
      get().showToast('Failed to delete anchor', 'error');
      throw error;
    }
  },

  getAnchorById: (anchorId: number) => {
    const { providers } = get();
    for (const p of providers) {
      const anchor = p.anchors.find((a) => a.id === anchorId);
      if (anchor) return anchor;
    }
    return undefined;
  },
  
  // PDF Selection Actions
  setCurrentPdfId: (id: number | null) => {
    set({ currentPdfId: id });
  },
  
  getCurrentPdf: () => {
    const { currentProviderId, currentPdfId, providers } = get();
    if (!currentProviderId || !currentPdfId) return undefined;
    const provider = providers.find((p) => p.id === currentProviderId);
    return provider?.pdfs.find((pdf) => pdf.id === currentPdfId);
  },
  
  getCurrentPdfAnchors: () => {
    const pdf = get().getCurrentPdf();
    return pdf?.anchors || [];
  },

  // Navigation Actions (with localStorage persistence for tab only)
  setActiveTab: (tab: TabType) => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, tab);
    // Clear provider selection when switching to upload or autofill (fresh start)
    if (tab === 'upload' || tab === 'autofill') {
      set({ activeTab: tab, currentProviderId: null });
    } else {
      set({ activeTab: tab });
    }
  },

  setCurrentProvider: (id: string | null) => {
    set({ currentProviderId: id });
  },

  viewProfile: (id: string) => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, 'profile');
    set({ currentProviderId: id, activeTab: 'profile' });
  },

  // Modal Actions
  setOpenModal: (modal: ModalType) => {
    set({ openModal: modal });
  },

  setEditingAnchorId: (id: number | null) => {
    set({ editingAnchorId: id });
  },

  setDeleteTargetId: (id: number | null) => {
    set({ deleteTargetId: id });
  },

  // PDF Actions
  setPdfData: (data: ArrayBuffer | null) => {
    set({ pdfData: data });
  },

  setPdfTotalPages: (pages: number) => {
    set({ pdfTotalPages: pages });
  },

  setCanvasDimensions: (dimensions: { width: number; height: number }) => {
    set({ canvasDimensions: dimensions });
  },

  // Toast Actions
  showToast: (message: string, type: 'success' | 'error' = 'success') => {
    set({ toast: { message, type, isVisible: true } });
  },

  hideToast: () => {
    set({ toast: { message: '', type: 'success', isVisible: false } });
  },

  // Hydration - load navigation state from localStorage AND providers from API
  hydrateFromStorage: async () => {
    const savedTab = getFromStorage<TabType>(STORAGE_KEYS.ACTIVE_TAB, 'dashboard');
    // Don't restore currentProviderId - user must select fresh each time
    // This prevents accidental operations on wrong provider
    set({ 
      activeTab: savedTab, 
      currentProviderId: null,
      isHydrated: true 
    });
    // Fetch providers from API
    await get().fetchProviders();
  }
}));
