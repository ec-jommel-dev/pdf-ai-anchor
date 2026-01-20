# EnergyAnchor Next.js Implementation Guide

**Author & Developer:** Jommel Hinayon

## Overview
This guide documents the complete Next.js 14+ frontend implementation for the EnergyAnchor PDF Contract application. The application allows users to map anchor coordinates on PDF contracts for automated text placement.

**Status: ✅ FULLY INTEGRATED** - Frontend connected to Flask backend API

---

## Phase 1: Project Setup ✅

### Step 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Step 1.2: Install Dependencies
```bash
npm install lucide-react pdfjs-dist zustand
```

**Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.511.0 | Icon library |
| `pdfjs-dist` | ^5.2.133 | PDF rendering |
| `zustand` | ^5.0.5 | State management |

### Step 1.3: Final Project Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme script
│   ├── page.tsx            # Main page component
│   ├── globals.css         # Theme variables + global styles
│   └── favicon.ico
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Desktop navigation
│   │   ├── MobileHeader.tsx    # Mobile hamburger menu
│   │   └── MainLayout.tsx      # Layout wrapper
│   ├── sections/
│   │   ├── ContractMapperSection.tsx   # PDF upload + mapper
│   │   ├── AutoFillSection.tsx         # Auto-fill PDF upload
│   │   ├── ProviderListSection.tsx     # Provider table
│   │   └── ProviderProfileSection.tsx  # Provider details + anchors
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

### Step 2.3: Anchor Input Styling
```css
/* Anchor Input Container - {{ key }} format */
.anchor-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  margin: 8px 0 16px;
  padding: 0 12px;
}

.anchor-bracket {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 600;
  color: var(--gh-blue);
  font-size: 15px;
}

.anchor-input-container input.form-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'SF Mono', monospace;
}
```

### Step 2.4: Theme Hook (`hooks/useTheme.ts`)
**Features:**
- Reads initial theme from `localStorage`
- Toggles between light/dark
- Persists preference to `localStorage`
- Applies `data-theme` attribute to body
- Returns `{ theme, toggleTheme, isDark, mounted }`

### Step 2.5: Theme Flash Prevention (`layout.tsx`)
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
  text: string;           // e.g., "{{signature_1}}"
  x: number;              // X coordinate on PDF canvas
  y: number;              // Y coordinate on PDF canvas
  page: string;           // 'global' | 'last' | comma-separated pages
  canvasWidth?: number;   // Canvas width when anchor was placed
  canvasHeight?: number;  // Canvas height when anchor was placed
}

// Provider with associated anchor settings
export interface Provider {
  id: string;
  name: string;
  active: boolean;        // true = Active, false = Inactive
  anchors: Anchor[];
}

// Navigation tabs
export type TabType = 'upload' | 'autofill' | 'list' | 'profile';

// Modal state management
export type ModalType = 
  | 'provider' 
  | 'anchor' 
  | 'preview' 
  | 'nextStep' 
  | 'confirmDelete'
  | 'warning'
  | 'success'
  | null;

// PDF viewer state
export interface PDFState {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
}
```

---

## Phase 4: State Management ✅

### Step 4.1: Zustand Store (`stores/useProviderStore.ts`)

```typescript
interface ProviderStore {
  // State
  providers: Provider[];
  currentProviderId: string | null;
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
  getActiveProviders: () => Provider[];
  getProviderById: (id: string) => Provider | undefined;
  getCurrentProvider: () => Provider | undefined;

  // Anchor Actions (async - connected to API)
  addAnchor: (providerId: string, anchor: Omit<Anchor, 'id'>) => Promise<void>;
  updateAnchor: (providerId: string, anchorId: number, data: Partial<Anchor>) => Promise<void>;
  deleteAnchor: (providerId: string, anchorId: number) => Promise<void>;
  getAnchorById: (providerId: string, anchorId: number) => Anchor | undefined;

  // Navigation Actions
  setActiveTab: (tab: TabType) => void;
  setCurrentProvider: (id: string | null) => void;
  viewProfile: (id: string) => void;

  // PDF Actions
  setPdfData: (data: ArrayBuffer | null) => void;
  setPdfTotalPages: (pages: number) => void;
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;

  // Toast Actions
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;

  // Hydration
  hydrateFromStorage: () => Promise<void>;
}
```

### Step 4.2: Navigation State Persistence

```typescript
// Storage keys
const STORAGE_KEYS = {
  ACTIVE_TAB: 'pdfAnchor_activeTab'
};

// Hydration after mount to avoid SSR mismatch
useEffect(() => {
  hydrateFromStorage();
}, [hydrateFromStorage]);
```

---

## Phase 5: UI Components ✅

### Step 5.1: Button Component
Variants: `default`, `primary`, `danger`

### Step 5.2: Badge Component
Variants: `active` (green), `inactive` (red), `default`

### Step 5.3: Input Component
Styled form input with label

### Step 5.4: Select Component
Dropdown with placeholder support:
```tsx
<Select
  placeholder="-- Select Provider --"
  options={providerOptions}
  value={currentProviderId || ''}
  onChange={handleProviderChange}
/>
```

### Step 5.5: Modal Component
Reusable modal wrapper with customizable `maxWidth`

### Step 5.6: Toast Component
- Success (green) / Error (red) variants
- Auto-fade after 3 seconds
- Slide-in animation
- Manual close button

---

## Phase 6: Layout Components ✅

### Step 6.1: Sidebar (`components/layout/Sidebar.tsx`)
- ProviderHub logo with shield icon
- Navigation items:
  - Contract Mapper (`upload-cloud` icon)
  - Auto Fill Anchor (`zap` icon)
  - Provider List (`users` icon)
- Theme toggle at bottom (Sun/Moon icons)

### Step 6.2: Mobile Header (`components/layout/MobileHeader.tsx`)
- Hamburger menu button
- Logo
- Shows only on mobile (< 768px)

### Step 6.3: Main Layout (`components/layout/MainLayout.tsx`)
- Combines Sidebar + MobileHeader + Main content
- Responsive grid layout

---

## Phase 7: PDF Components ✅

### Step 7.1: PDF.js Configuration
**Critical: Uses dynamic import for SSR compatibility**
```typescript
// Dynamic import to avoid "DOMMatrix is not defined" SSR error
type PDFJSLib = typeof import('pdfjs-dist');
let pdfjsLib: PDFJSLib | null = null;

// Worker from unpkg CDN (more reliable than cdnjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
```

### Step 7.2: PDF Upload Box (`components/pdf/PDFUploadBox.tsx`)
- Drag & drop zone with visual feedback
- **Validation callback:** `onBeforeUpload` prop to validate before upload
- Accepts only PDF files

### Step 7.3: PDF Viewer (`components/pdf/PDFViewer.tsx`)
**Features:**
- Canvas rendering at 2x scale (RENDER_SCALE = 2.0)
- Page navigation (prev/next buttons)
- Click handler with coordinate scaling
- Render task cancellation
- ArrayBuffer cloning to prevent detachment

**Key Implementation:**
```typescript
// Clone ArrayBuffer before passing to worker
const doc = await pdfjsLib.getDocument({ data: pdfData.slice(0) }).promise;

// Cancel any ongoing render before starting new one
if (renderTaskRef.current) {
  renderTaskRef.current.cancel();
}
```

### Step 7.4: Indicator Layer (`components/pdf/IndicatorLayer.tsx`)
- Renders anchor dots with labels
- Filters anchors by current page (handles 'global', 'last', specific pages)
- Accurate coordinate conversion

---

## Phase 8: Section Components ✅

### Step 8.1: Contract Mapper Section
**Flow:**
1. Select provider from dropdown
2. Select PDF file (staged - not uploaded yet)
3. **Confirmation view** - Shows file info with "Upload & Continue" button
4. Click "Upload & Continue" → PDF uploaded to backend
5. Interactive mapper view with click-to-place anchors
6. Finish → Success Modal → Navigate to Anchor Settings

**Features:**
- **Staged file confirmation** prevents accidental uploads
- PDF stored in backend `uploads/` folder
- PDF saved to database for preview feature
- Warning modal if no provider selected

### Step 8.2: Auto Fill Section
**Flow:**
1. Select provider (must have anchors configured)
2. Select PDF file (staged)
3. **Confirmation view** - Shows file info with "Process & Download" button
4. Click "Process & Download" → Backend processes PDF
5. Auto-downloads filled PDF

**Features:**
- Shows anchor count for selected provider
- Warning modal if no provider or no anchors
- Staged file prevents wrong file processing

### Step 8.3: Provider List Section
- Header with "Add New Provider" button
- Table: Name, Status, Actions
- Status badge: Active (green) / Inactive (red)
- Action buttons: View, Edit (5px gap)
- Loading state during API fetch

### Step 8.4: Provider Profile Section
**Sections:**
1. **Provider Info Card** - Name, ID, Status
2. **Anchor Settings Table** - Text, Coordinates, Page, Actions

**Anchor Actions:**
- Preview (fetches PDF from backend)
- Edit (live preview with zoom)
- Delete (confirmation modal)

---

## Phase 9: Modal Components ✅

### Step 9.1: Provider Modal
- Mode: "Add Provider" / "Edit Provider"
- Fields: Company Name (placeholder: "e.g. Pacific Gas & Electric")
- Edit mode includes: Status select (Active/Inactive)
- Async save with toast notification

### Step 9.2: Anchor Modal ⭐ NEW FEATURES
**Standard Form:**
- Anchor Key input with `{{ }}` visual brackets
- X/Y Coordinate inputs
- Page Location select (Global/Last/Specific)

**Live Preview Panel:**
- Toggle button: "Show Preview & Adjust"
- Full PDF preview (fetched from backend)
- **Click to adjust** coordinates visually
- **Zoom controls** (50% - 250%)
- **Tiny 4px indicator** for precise placement
- Real-time coordinate updates

```
┌──────────────────┬────────────────────────────────────┐
│ Form (320px)     │ Live Preview (click to adjust)     │
│                  │                    [- 100% + ↺]    │
│ {{ day     }}    │ ┌─────────────────────────────┐    │
│                  │ │                             │    │
│ X: 564  Y: 302   │ │    PDF Page (scrollable)   │    │
│                  │ │                             │    │
│ Page: [▼]        │ │         🔴 {{day}}         │    │
│ [1]              │ │                             │    │
│                  │ └─────────────────────────────┘    │
│ [Hide Preview]   │ 🖱️ Click to adjust position       │
└──────────────────┴────────────────────────────────────┘
                      [Cancel]  [Save Anchor]
```

### Step 9.3: Preview Modal
- Fetches PDF from **backend storage** (not browser memory)
- Shows PDF page with anchor indicator
- Scrolls to anchor position after render
- Works even after page refresh!

### Step 9.4: Next Step Modal
- "Keep Mapping" - Continue adding anchors
- "Finish & Review" - Show Success Modal

### Step 9.5: Success Modal ⭐ NEW
- Green checkmark icon
- "Mapping Complete!" message
- Primary: "View Anchor Settings" → Navigate to profile
- Secondary: "Map Another PDF" → Reset

### Step 9.6: Confirm Delete Modal
- Warning icon
- "Delete" button (danger variant)

### Step 9.7: Warning Modal
- Yellow warning icon
- Customizable title and message
- Used for validation warnings

---

## Phase 10: API Integration ✅

### Step 10.1: API Service (`lib/api.ts`)

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

// Anchor API
export const anchorAPI = {
  getAll: (providerId: string) => fetchAPI(`/providers/${providerId}/anchors`),
  create: (providerId: string, anchor) => fetchAPI(`/providers/${providerId}/anchors`, { method: 'POST', ... }),
  update: (providerId: string, anchorId: number, data) => fetchAPI(`/anchors/${anchorId}`, { method: 'PUT', ... }),
  delete: (providerId: string, anchorId: number) => fetchAPI(`/anchors/${anchorId}`, { method: 'DELETE' }),
};

// PDF API ⭐ NEW
export const pdfAPI = {
  upload: async (providerId: string, file: File) => { /* FormData upload */ },
  download: async (providerId: string): Promise<ArrayBuffer> => { /* Get PDF */ },
  getInfo: (providerId: string) => fetchAPI(`/providers/${providerId}/pdf/info`),
  delete: (providerId: string) => fetchAPI(`/providers/${providerId}/pdf`, { method: 'DELETE' }),
  checkDuplicate: async (file: File) => { /* Check if PDF exists */ },
};

// Autofill API
export const autofillAPI = {
  process: async (file: File, anchors, canvasWidth, canvasHeight) => {
    // Returns blob for download
  },
};
```

### Step 10.2: Connected Endpoints

| Endpoint | Method | Frontend Action |
|----------|--------|-----------------|
| `/api/providers` | GET | `fetchProviders()` on app load |
| `/api/providers` | POST | `addProvider(name)` |
| `/api/providers/:id` | PUT | `updateProvider(id, name, active)` |
| `/api/providers/:id` | DELETE | `deleteProvider(id)` |
| `/api/providers/:id/anchors` | POST | `addAnchor(providerId, anchor)` |
| `/api/anchors/:id` | PUT | `updateAnchor(...)` |
| `/api/anchors/:id` | DELETE | `deleteAnchor(...)` |
| `/api/providers/:id/pdf` | POST | Upload PDF |
| `/api/providers/:id/pdf` | GET | Download PDF |
| `/api/autofill` | POST | Process PDF with anchors |

---

## Phase 11: Bug Fixes & Optimizations ✅

### 11.1: PDF.js SSR Error
**Solution:** Dynamic import of pdfjs-dist in client components

### 11.2: PDF Worker Loading
**Solution:** Use unpkg.com CDN with `.mjs` extension

### 11.3: ArrayBuffer Detached Error
**Solution:** Clone ArrayBuffer: `pdfData.slice(0)`

### 11.4: Canvas Render Conflict
**Solution:** Track and cancel ongoing render tasks with `renderTaskRef`

### 11.5: Coordinate Accuracy
**Solution:** Use consistent display dimensions for calculations

### 11.6: Preview Canvas Null Error
**Solution:** Always render canvas (use opacity for loading state)

### 11.7: API Route Mismatch
**Solution:** Anchor update/delete use `/anchors/:id` not `/providers/:pid/anchors/:id`

---

## Phase 12: Key User Flows

### Contract Mapping Flow
```
1. Select Provider
2. Select PDF file → Confirmation view
3. Click "Upload & Continue"
4. PDF uploaded to backend storage
5. Click on PDF → Anchor modal opens
6. Fill anchor details → Save
7. Next Step modal → Keep Mapping or Finish
8. Finish → Success Modal
9. "View Anchor Settings" → Provider Profile
```

### Auto-Fill Flow
```
1. Select Provider (with anchors)
2. Select PDF file → Confirmation view
3. Click "Process & Download"
4. Backend places anchors on PDF
5. Filled PDF auto-downloads
```

### Edit Anchor Flow
```
1. Go to Provider Profile
2. Click "Edit" on anchor
3. Anchor modal opens
4. Click "Show Preview & Adjust"
5. Preview panel shows PDF
6. Click on PDF to adjust position
7. Use zoom for precision
8. Save → Toast notification
```

---

## Environment Setup

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## Quick Reference

### Key Conversions from HTML to React

| Original (HTML/JS) | Next.js Equivalent |
|-------------------|-------------------|
| `onclick="fn()"` | `onClick={fn}` |
| `document.getElementById()` | `useRef()` or state |
| `localStorage` | `useEffect` + `useState` |
| `pdfjsLib.getDocument()` | Dynamic import + `useEffect` |

### Important Notes
- All PDF components must be client-side (`'use client'`)
- PDF.js requires dynamic import to avoid SSR issues
- ArrayBuffer must be cloned before passing to PDF.js worker
- Preview fetches PDF from backend (persists after refresh)

---

**Last Updated:** January 2026
**Author & Developer:** Jommel Hinayon
