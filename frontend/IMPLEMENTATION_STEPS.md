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
│   │   ├── DashboardSection.tsx      # Dashboard landing page
│   │   ├── ContractMapperSection.tsx # PDF upload + mapper
│   │   ├── AutoFillSection.tsx       # Auto-fill PDF upload
│   │   ├── ProviderListSection.tsx   # Provider table with search
│   │   ├── ProviderProfileSection.tsx# Provider details + anchors
│   │   └── ConverterSection.tsx      # Word to PDF converter
│   ├── pdf/
│   │   ├── PDFViewer.tsx       # Canvas PDF renderer
│   │   ├── PDFUploadBox.tsx    # Drag & drop upload (10MB limit)
│   │   └── IndicatorLayer.tsx  # Anchor dot overlay
│   ├── modals/
│   │   ├── ProviderModal.tsx       # Add/Edit provider with validation
│   │   ├── AnchorModal.tsx         # Map anchor with validation + preview
│   │   ├── PreviewModal.tsx        # Preview anchor on PDF
│   │   ├── NextStepModal.tsx       # Post-placement options
│   │   ├── ConfirmDeleteModal.tsx  # Delete confirmation
│   │   ├── WarningModal.tsx        # Validation warning popup
│   │   └── SuccessModal.tsx        # Success completion modal
│   └── ui/
│       ├── Button.tsx      # Button variants (disabled state)
│       ├── Badge.tsx       # Status badges (active/inactive)
│       ├── Input.tsx       # Form input with error display
│       ├── Select.tsx      # Dropdown select
│       ├── Modal.tsx       # Modal wrapper
│       └── Toast.tsx       # Toast notifications (4s duration)
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
  --gh-yellow: #d29922;
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
  --gh-yellow: #d29922;
  --gh-purple: #a371f7;
  --gh-orange: #d29922;
  --btn-bg: #21262d;
  --btn-hover: #30363d;
  --input-bg: #0d1117;
  --row-archived: rgba(110, 118, 129, 0.15);
}
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
  anchors: Anchor[];
  anchorCount: number;
}

// Provider with multiple PDF templates
export interface Provider {
  id: string;
  name: string;
  active: boolean;
  pdfs: ProviderPDF[];
  pdfCount: number;
  anchors: Anchor[];
}

// Navigation tabs
export type TabType = 'dashboard' | 'upload' | 'autofill' | 'list' | 'converter' | 'profile';
```

---

## Phase 4: Human Error Protection ✅ NEW

### Step 4.1: Form Validation

**Provider Modal:**
- ✅ Name field required - shows error if empty
- ✅ Loading state on Save button ("Saving...")
- ✅ Confirmation when deactivating provider

**Anchor Modal:**
- ✅ Anchor key required - shows error if empty
- ✅ X/Y coordinates must be positive (0-10000)
- ✅ Specific pages format validated (e.g., "1", "1,2,3", "1-5")
- ✅ Loading state on Save button

### Step 4.2: File Upload Protection

**PDF Upload Box:**
- ✅ File size limit: 10MB max
- ✅ File type validation: PDF only
- ✅ Clear error messages with file size info

**Word Converter:**
- ✅ Only .docx files accepted (not .doc)
- ✅ File size limit: 10MB max
- ✅ Clear error messages

### Step 4.3: Confirmation Dialogs

| Action | Confirmation |
|--------|--------------|
| Deactivate Provider | ✅ Warning modal with impact list |
| Delete Anchor | ✅ Confirmation modal |
| Delete PDF | ✅ Confirmation with anchor count warning |
| Toggle PDF Status | ✅ Confirmation when deactivating |
| Start Over (Mapper) | ✅ Confirmation modal |

### Step 4.4: Disabled States

- ✅ View button disabled for inactive providers
- ✅ Dashboard View link disabled for inactive providers
- ✅ Auto Fill only shows providers with active PDFs
- ✅ Auto Fill only shows active PDFs for selection

### Step 4.5: Data Refresh

- ✅ Refresh button on Dashboard to reload data
- ✅ Toast notification on refresh success/failure

### Step 4.6: Search & Filter

**Provider List:**
- ✅ Search input - filter by name
- ✅ Status filter dropdown (All/Active/Inactive)
- ✅ Results count display
- ✅ Clear filters button

### Step 4.7: Toast Notifications

- ✅ Duration: 4 seconds (increased from 3s)
- ✅ Success/Error variants
- ✅ Dismiss button

---

## Phase 5: Navigation & Layout ✅

### Step 5.1: Sidebar Navigation Items
```typescript
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { id: 'upload', label: 'Contract Mapper', icon: <UploadCloud /> },
  { id: 'autofill', label: 'Auto Fill Anchor', icon: <Zap /> },
  { id: 'list', label: 'Provider List', icon: <Radio /> },
  { id: 'converter', label: 'Word to PDF', icon: <FileOutput /> },
];
```

### Step 5.2: Logo
- Icon: `Crosshair` (lucide-react) - green color
- Text: "PDF Anchor Mapper"
- Favicon: Custom SVG crosshair (`app/icon.svg`)

---

## Phase 6: Section Components ✅

### Step 6.1: Dashboard Section

**Features:**
- Welcome header with Refresh button
- Quick stats cards (Providers, Active, Contracts, Anchors)
- Quick action cards for Contract Mapper and Auto Fill
- Provider overview table (top 5)
- View link disabled for inactive providers

### Step 6.2: Contract Mapper Section

**Flow:**
1. Select provider from dropdown (active only)
2. Select PDF file (staged - not uploaded yet)
3. **Confirmation view** - Shows file info with "Upload & Continue"
4. Click "Upload & Continue" → PDF uploaded to backend
5. Interactive mapper with click-to-place anchors
6. **"Start Over" requires confirmation**
7. Finish → Success Modal → Navigate to Anchor Settings

**Validation:**
- File size limit: 10MB
- Duplicate PDF detection (409 error with message)

### Step 6.3: Auto Fill Section

**Flow:**
1. Select provider (only those with active PDFs)
2. Select PDF template (only active PDFs)
3. Upload PDF to process (staged)
4. Click "Preview (Red Text)" or "Download Clean (White Text)"
5. Auto-downloads processed PDF

**Validation:**
- Provider required before upload
- PDF template required before upload
- Anchors required (warns if none configured)

### Step 6.4: Provider List Section ✅ UPDATED

**Features:**
- Search input (filter by name)
- Status filter (All/Active/Inactive)
- Results count
- Clear filters button
- View button disabled for inactive providers

### Step 6.5: Provider Profile Section

**Features:**
- PDF management table (all PDFs, active and inactive)
- Toggle PDF status with confirmation
- Delete PDF with confirmation (shows anchor count)
- Anchor settings filtered by selected PDF

### Step 6.6: Word to PDF Converter

**Features:**
- 100% client-side conversion
- Only .docx files supported (with clear message)
- File size limit: 10MB
- Uses mammoth.js + html2pdf.js

---

## Phase 7: Modal Components ✅

### Step 7.1: Provider Modal

**Validation:**
- Name required (shows error message)
- Loading state on buttons
- Confirmation when changing Active → Inactive

### Step 7.2: Anchor Modal

**Validation:**
- Anchor key required
- X coordinate: 0-10000
- Y coordinate: 0-10000
- Specific pages format: "1" or "1,2,3" or "1-5"
- Loading state on Save button

### Step 7.3: PDFViewer (Contract Mapper)

**Features:**
- "Start Over" button shows confirmation modal
- Confirms anchors are saved before closing

---

## Phase 8: Input Component ✅

### Step 8.1: Enhanced Input (`ui/Input.tsx`)

```typescript
interface InputProps {
  label?: string;
  error?: string | null;  // NEW: Error message display
  // ... other props
}

// Error styling:
// - Red border when error present
// - Error message shown below input
```

---

## Phase 9: API Integration ✅

### Step 9.1: API Service (`lib/api.ts`)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Provider API - includes inactive providers
export const providerAPI = {
  getAll: () => fetchAPI('/providers?include_inactive=true'),
  // ...
};

// PDF API - handles 409 duplicate error
export const pdfAPI = {
  upload: async (providerId, file) => {
    // Returns 409 with message if duplicate
    // "This PDF already exists for [provider]"
  },
  // ...
};
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
| Empty validation feedback | Error messages + red borders |
| Accidental data loss | Confirmation modals |
| Stale data | Refresh button on Dashboard |

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

### Human Error Protection Summary
| Protection | Status |
|------------|--------|
| Form validation with error messages | ✅ |
| File size limits (10MB) | ✅ |
| Confirmation dialogs | ✅ |
| Loading states on buttons | ✅ |
| Disabled states for inactive items | ✅ |
| Search/filter for providers | ✅ |
| Toast notifications (4s) | ✅ |
| Refresh button for stale data | ✅ |

---

**Last Updated:** January 2026
**Author & Developer:** Jommel Hinayon
