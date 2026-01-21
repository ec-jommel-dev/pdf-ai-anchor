# PDF Anchor Mapper - Next.js Implementation Guide

**Author & Developer:** Jommel Hinayon

## Overview
This guide documents the complete Next.js 14+ frontend implementation for the PDF Anchor Mapper application. The application allows users to map anchor coordinates on PDF contracts for automated text placement.

**Status: ✅ FULLY INTEGRATED** - Frontend connected to Flask backend API

---

## Phase 1: Project Setup ✅

### Step 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Step 1.2: Install Dependencies
```bash
npm install lucide-react pdfjs-dist zustand mammoth html2pdf.js
```

**Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.511.0 | Icon library |
| `pdfjs-dist` | ^5.2.133 | PDF rendering |
| `zustand` | ^5.0.5 | State management |
| `mammoth` | ^1.6.0 | Word to HTML conversion |
| `html2pdf.js` | ^0.10.1 | HTML to PDF conversion |

### Step 1.3: Final Project Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme script
│   ├── page.tsx            # Main page component
│   ├── globals.css         # Theme variables + global styles
│   ├── icon.svg            # Crosshair favicon
│   └── favicon.ico
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Desktop navigation
│   │   ├── MobileHeader.tsx    # Mobile hamburger menu
│   │   └── MainLayout.tsx      # Layout wrapper
│   ├── sections/
│   │   ├── DashboardSection.tsx      # ⭐ NEW: Dashboard landing page
│   │   ├── ContractMapperSection.tsx # PDF upload + mapper
│   │   ├── AutoFillSection.tsx       # Auto-fill PDF upload
│   │   ├── ProviderListSection.tsx   # Provider table
│   │   ├── ProviderProfileSection.tsx# Provider details + anchors
│   │   └── ConverterSection.tsx      # ⭐ NEW: Word to PDF converter
│   ├── pdf/
│   │   ├── PDFViewer.tsx       # Canvas PDF renderer
│   │   ├── PDFUploadBox.tsx    # Drag & drop upload
│   │   └── IndicatorLayer.tsx  # Anchor dot overlay
│   ├── modals/
│   │   ├── ProviderModal.tsx       # Add/Edit provider
│   │   ├── AnchorModal.tsx         # Map anchor with live preview + zoom
│   │   ├── PreviewModal.tsx        # Preview anchor on PDF (from backend)
│   │   ├── NextStepModal.tsx       # Post-placement options
│   │   ├── ConfirmDeleteModal.tsx  # Delete confirmation
│   │   ├── WarningModal.tsx        # Validation warning popup
│   │   └── SuccessModal.tsx        # Success completion modal
│   └── ui/
│       ├── Button.tsx      # Button variants
│       ├── Badge.tsx       # Status badges (active/inactive)
│       ├── Input.tsx       # Form input
│       ├── Select.tsx      # Dropdown select
│       ├── Modal.tsx       # Modal wrapper
│       └── Toast.tsx       # Toast notifications
├── stores/
│   └── useProviderStore.ts # Zustand global state
├── hooks/
│   └── useTheme.ts         # Theme toggle + localStorage
├── types/
│   └── index.ts            # TypeScript interfaces
└── lib/
    ├── utils.ts            # Utility functions (cn)
    └── api.ts              # API service (providers, anchors, pdfs, autofill)
```

---

## Phase 2: Theme & Global Styles ✅

### Step 2.1: CSS Variables (`globals.css`)

```css
/* Light Theme (default) */
:root {
  --bg-canvas: #ffffff;
  --bg-sidebar: #f6f8fa;
  --bg-card: #ffffff;
  --border-default: #d0d7de;
  --text-main: #1f2328;
  --text-heading: #1f2328;
  --gh-blue: #0969da;
  --gh-green: #1a7f37;
  --gh-green-hover: #166b2e;
  --gh-red: #cf222e;
  --gh-purple: #8250df;
  --gh-orange: #bf8700;
  --btn-bg: #f6f8fa;
  --btn-hover: #f3f4f6;
  --input-bg: #ffffff;
  --row-archived: rgba(175, 184, 193, 0.1);
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-canvas: #0d1117;
  --bg-sidebar: #010409;
  --bg-card: #0d1117;
  --border-default: #30363d;
  --text-main: #8b949e;
  --text-heading: #c9d1d9;
  --gh-blue: #58a6ff;
  --gh-green: #238636;
  --gh-green-hover: #2ea043;
  --gh-red: #f85149;
  --gh-purple: #a371f7;
  --gh-orange: #d29922;
  --btn-bg: #21262d;
  --btn-hover: #30363d;
  --input-bg: #0d1117;
  --row-archived: rgba(110, 118, 129, 0.15);
}
```

### Step 2.2: Hide Next.js Dev Tools
```css
.nextjs-toast,
[data-nextjs-toast],
#devtools-indicator {
  display: none !important;
}
```

### Step 2.3: Theme Flash Prevention (`layout.tsx`)
Inline script in `<head>` to prevent FOUC:
```tsx
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      const theme = localStorage.getItem('theme');
      if (theme) document.body.setAttribute('data-theme', theme);
    })();
  `
}} />
```

---

## Phase 3: Type Definitions ✅

### Step 3.1: Core Types (`types/index.ts`)

```typescript
// Anchor with coordinate metadata for backend processing
export interface Anchor {
  id: number;
  pdfId?: number;         // Reference to parent PDF
  text: string;           // e.g., "{{signature_1}}"
  x: number;              // X coordinate on PDF canvas
  y: number;              // Y coordinate on PDF canvas
  page: string;           // 'global' | 'last' | comma-separated pages
  canvasWidth?: number;   // Canvas width when anchor was placed
  canvasHeight?: number;  // Canvas height when anchor was placed
  pdfFilename?: string;   // For display: which PDF this anchor belongs to
}

// ProviderPDF represents an uploaded contract PDF template
export interface ProviderPDF {
  id: number;
  providerId: number;
  filename: string;
  fileSize?: number;
  totalPages?: number;
  isActive: boolean;
  createdAt?: string;
  anchors: Anchor[];       // Each PDF has its own anchors
  anchorCount: number;
}

// Provider with multiple PDF templates
export interface Provider {
  id: string;
  name: string;
  active: boolean;
  pdfs: ProviderPDF[];     // Multiple PDFs per provider
  pdfCount: number;
  anchors: Anchor[];       // Flattened view of all anchors
}

// Navigation tabs
export type TabType = 'dashboard' | 'upload' | 'autofill' | 'list' | 'converter' | 'profile';

// Modal state management
export type ModalType = 
  | 'provider' 
  | 'anchor' 
  | 'preview' 
  | 'nextStep' 
  | 'confirmDelete'
  | null;
```

---

## Phase 4: State Management ✅

### Step 4.1: Zustand Store (`stores/useProviderStore.ts`)

```typescript
interface ProviderStore {
  // State
  providers: Provider[];
  currentProviderId: string | null;
  currentPdfId: number | null;     // ⭐ NEW: Selected PDF for anchor operations
  activeTab: TabType;
  openModal: ModalType;
  pdfData: ArrayBuffer | null;
  pdfTotalPages: number;
  canvasDimensions: { width: number; height: number };
  toast: ToastState;
  isLoading: boolean;
  isHydrated: boolean;

  // Provider Actions (async - connected to API)
  fetchProviders: () => Promise<void>;
  addProvider: (name: string) => Promise<void>;
  updateProvider: (id: string, name: string, active?: boolean) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  toggleProviderStatus: (id: string) => Promise<void>;

  // Anchor Actions (async - now use pdfId)
  addAnchor: (pdfId: number, anchor: Omit<Anchor, 'id'>) => Promise<void>;
  updateAnchor: (anchorId: number, data: Partial<Anchor>) => Promise<void>;
  deleteAnchor: (anchorId: number) => Promise<void>;
  getAnchorById: (anchorId: number) => Anchor | undefined;

  // PDF Selection Actions ⭐ NEW
  setCurrentPdfId: (id: number | null) => void;
  getCurrentPdf: () => ProviderPDF | undefined;
  getCurrentPdfAnchors: () => Anchor[];

  // Navigation Actions
  setActiveTab: (tab: TabType) => void;
  setCurrentProvider: (id: string | null) => void;
  viewProfile: (id: string) => void;

  // Toast Actions
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;

  // Hydration
  hydrateFromStorage: () => Promise<void>;
}
```

---

## Phase 5: Navigation & Layout ✅

### Step 5.1: Sidebar Navigation Items
```typescript
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },      // ⭐ NEW
  { id: 'upload', label: 'Contract Mapper', icon: <UploadCloud /> },
  { id: 'autofill', label: 'Auto Fill Anchor', icon: <Zap /> },
  { id: 'list', label: 'Provider List', icon: <Radio /> },                  // Changed icon
  { id: 'converter', label: 'Word to PDF', icon: <FileOutput /> },          // ⭐ NEW
];
```

### Step 5.2: Logo
- Icon: `Crosshair` (lucide-react) - green color
- Text: "PDF Anchor Mapper"
- Favicon: Custom SVG crosshair (`app/icon.svg`)

---

## Phase 6: Section Components ✅

### Step 6.1: Dashboard Section ⭐ NEW

**Features:**
- Welcome header with app logo
- Quick stats cards (Providers, Active, Contracts, Anchors)
- Quick action cards:
  - **Contract Mapper** - Click to navigate
  - **Auto Fill Anchor** - Click to navigate
- Provider overview table (top 5 providers)
- "View All" link to Provider List

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 PDF Anchor Mapper                                            │
│ Map anchor strings to PDF contracts and auto-fill them          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                            │
│  │  4  │  │  3  │  │  5  │  │ 12  │  Quick Stats               │
│  │Provs│  │Actve│  │PDFs │  │Anchrs│                            │
│  └─────┘  └─────┘  └─────┘  └─────┘                            │
├─────────────────────────────────────────────────────────────────┤
│  Quick Actions                                                   │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │ 📤 Contract Mapper    │  │ ⚡ Auto Fill Anchor   │          │
│  │ Upload and map...     │  │ Apply saved settings..│          │
│  └───────────────────────┘  └───────────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  Provider Overview                            [View All →]       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Provider      │ Status │ Contracts │ Anchors │       │      │
│  │ PG&E          │ Active │    2      │    5    │ View→ │      │
│  │ SoCal Edison  │ Active │    1      │    3    │ View→ │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.2: Contract Mapper Section
**Flow:**
1. Select provider from dropdown
2. Select PDF file (staged - not uploaded yet)
3. **Confirmation view** - Shows file info with "Upload & Continue" button
4. Click "Upload & Continue" → PDF uploaded to backend
5. Interactive mapper view with click-to-place anchors
6. Finish → Success Modal → Navigate to Anchor Settings

**Updates:**
- Tracks `currentUploadedPdfId` for anchor creation
- Shows PDF count for selected provider
- Anchors saved to specific PDF

### Step 6.3: Auto Fill Section
**Flow:**
1. Select provider
2. Select PDF template (from provider's PDFs) ⭐ NEW
3. Select PDF file to process (staged)
4. Click "Preview" (red text) or "Download Clean" (white text)
5. Auto-downloads processed PDF

**Updates:**
- PDF template dropdown (multiple PDFs per provider)
- Shows anchor count for selected PDF
- Two output modes: Preview (red) and Clean (white)

### Step 6.4: Provider Profile Section
**Updates:**
- PDF selection dropdown ⭐ NEW
- Filters anchors by selected PDF
- Shows PDF metadata (pages, size, date)
- "No PDFs" message with upload CTA

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to List                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Provider Name: PG&E                                             │
│ ID: 4  │  Status: Active  │  PDFs: 2 contracts                 │
├─────────────────────────────────────────────────────────────────┤
│ 📄 Select Contract PDF                                          │
│ ┌──────────────────────────────────────────┐                   │
│ │ ▼ contract_2024.pdf (5 anchors)          │                   │
│ └──────────────────────────────────────────┘                   │
│ 10 pages • 245.3 KB • Added: 1/21/2026                         │
├─────────────────────────────────────────────────────────────────┤
│ Anchor Settings for contract_2024.pdf      [+ Add Anchor]       │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Anchor Text  │ Coords    │ Page │ Actions               │   │
│ │ {{day}}      │ 549, 312  │  1   │ Preview Edit Delete   │   │
│ │ {{month}}    │ 695, 310  │  1   │ Preview Edit Delete   │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.5: Word to PDF Converter ⭐ NEW

**Features:**
- 100% client-side conversion (no API/database needed)
- Uses `mammoth.js` for Word → HTML
- Uses `html2pdf.js` for HTML → PDF
- Drag & drop or click to upload
- Supports .docx and .doc files
- Auto-download after conversion

```
┌─────────────────────────────────────────────────────────────────┐
│ Word to PDF Converter                                           │
├─────────────────────────────────────────────────────────────────┤
│ ℹ️ Client-side conversion - Files never leave your browser      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │           📤 Drop your Word document here               │   │
│  │                  or click to browse                     │   │
│  │                                                         │   │
│  │              Supports .docx and .doc files              │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ How it works:                                                   │
│ 1. Select or drag & drop a Word document                       │
│ 2. Click "Convert & Download PDF"                              │
│ 3. Your PDF will automatically download                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 7: Modal Components ✅

### Step 7.1: Anchor Modal
**Updates:**
- Now requires `pdfId` prop
- Live preview fetches PDF by `pdfId`
- Creates anchors for specific PDF

### Step 7.2: Preview Modal
**Updates:**
- Accepts `pdfId` prop (primary)
- Falls back to `providerId` for legacy support
- Fetches PDF by ID from backend

---

## Phase 8: API Integration ✅

### Step 8.1: API Service (`lib/api.ts`)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Provider API
export const providerAPI = {
  getAll: () => fetchAPI<APIProvider[]>('/providers'),
  getById: (id: string) => fetchAPI<APIProvider>(`/providers/${id}`),
  create: (name: string) => fetchAPI('/providers', { method: 'POST', ... }),
  update: (id: string, data) => fetchAPI(`/providers/${id}`, { method: 'PUT', ... }),
  delete: (id: string) => fetchAPI(`/providers/${id}`, { method: 'DELETE' }),
};

// PDF API (Multiple PDFs per Provider) ⭐ UPDATED
export const pdfAPI = {
  list: (providerId: string) => fetchAPI(`/providers/${providerId}/pdfs`),
  upload: async (providerId: string, file: File) => { /* FormData */ },
  download: async (pdfId: number): Promise<ArrayBuffer> => { /* Get PDF by ID */ },
  downloadByProvider: async (providerId: string) => { /* Legacy */ },
  getInfo: (pdfId: number) => fetchAPI(`/pdfs/${pdfId}/info`),
  delete: (pdfId: number) => fetchAPI(`/pdfs/${pdfId}`, { method: 'DELETE' }),
};

// Anchor API (Belongs to PDF) ⭐ UPDATED
export const anchorAPI = {
  getByPdf: (pdfId: number) => fetchAPI(`/pdfs/${pdfId}/anchors`),
  getByProvider: (providerId: string) => fetchAPI(`/providers/${providerId}/anchors`),
  create: (pdfId: number, anchor) => fetchAPI(`/pdfs/${pdfId}/anchors`, { method: 'POST', ... }),
  update: (anchorId: number, data) => fetchAPI(`/anchors/${anchorId}`, { method: 'PUT', ... }),
  delete: (anchorId: number) => fetchAPI(`/anchors/${anchorId}`, { method: 'DELETE' }),
};

// Autofill API
export const autofillAPI = {
  process: async (file, anchors, canvasWidth, canvasHeight, preview) => {
    // Returns blob for download
    // preview=true: Red text | preview=false: White text
  },
};
```

---

## Phase 9: Key User Flows

### Dashboard → Contract Mapping
```
1. Land on Dashboard (default tab)
2. Click "Contract Mapper" quick action
3. Select Provider
4. Upload PDF → Confirmation view
5. Click "Upload & Continue"
6. PDF uploaded and stored
7. Click on PDF to place anchors
8. Save anchor → Next Step modal
9. Finish → Success Modal
10. "View Anchor Settings" → Provider Profile
```

### Dashboard → Auto-Fill
```
1. Land on Dashboard
2. Click "Auto Fill Anchor" quick action
3. Select Provider
4. Select PDF Template (with anchors)
5. Upload PDF to process → Confirmation view
6. Click "Preview (Red Text)" or "Download Clean"
7. Filled PDF auto-downloads
```

### Edit Anchor with Live Preview
```
1. Go to Provider Profile
2. Select PDF from dropdown
3. Click "Edit" on anchor
4. Click "Show Preview & Adjust"
5. PDF preview loads (from backend)
6. Click on PDF to adjust position
7. Use zoom controls for precision
8. Save → Toast notification
```

### Word to PDF Conversion
```
1. Click "Word to PDF" in sidebar
2. Drop or select Word document
3. Click "Convert & Download PDF"
4. PDF auto-downloads (client-side only)
```

---

## Phase 10: Bug Fixes & Optimizations ✅

| Issue | Solution |
|-------|----------|
| PDF.js SSR Error | Dynamic import of pdfjs-dist |
| PDF Worker Loading | Use unpkg.com CDN with `.mjs` |
| ArrayBuffer Detached | Clone: `pdfData.slice(0)` |
| Canvas Render Conflict | Track and cancel render tasks |
| Coordinate Accuracy | Consistent display dimensions |
| Hydration Mismatch | `hydrateFromStorage()` in useEffect |
| Select without options | Pass `options` prop, not children |

---

## Environment Setup

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## Quick Reference

### Navigation Tabs
| Tab | Icon | Component | Description |
|-----|------|-----------|-------------|
| Dashboard | LayoutDashboard | DashboardSection | Landing page with stats |
| Contract Mapper | UploadCloud | ContractMapperSection | Upload & map PDFs |
| Auto Fill Anchor | Zap | AutoFillSection | Process PDFs |
| Provider List | Radio | ProviderListSection | Manage providers |
| Word to PDF | FileOutput | ConverterSection | Convert documents |

### Important Notes
- Dashboard is the default landing page
- All PDF components must be client-side (`'use client'`)
- PDF.js requires dynamic import to avoid SSR issues
- ArrayBuffer must be cloned before passing to PDF.js worker
- Multiple PDFs per provider - anchors belong to specific PDFs
- Word to PDF is 100% client-side (no API needed)

---

**Last Updated:** January 2026
**Author & Developer:** Jommel Hinayon
