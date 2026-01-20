# EnergyAnchor - Future Plans & Enhancements

**Author & Developer:** Jommel Hinayon

---

## 🚀 Quick Wins (Easy to Add)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Duplicate Anchor** | "Copy" button on anchor row to quickly create similar anchors | ⭐⭐⭐ |
| **Bulk Delete** | Checkbox selection + "Delete Selected" for anchors | ⭐⭐⭐ |
| **Search Providers** | Filter providers by name in the list | ⭐⭐⭐ |
| **Keyboard Shortcuts** | `Esc` to close modals, `Enter` to save | ⭐⭐ |
| **Empty State Graphics** | Nice illustrations when no providers/anchors exist | ⭐⭐ |

---

## ⭐ Medium Priority

| Feature | Description | Priority |
|---------|-------------|----------|
| **Drag to Reposition** | Drag anchor dots on PDF instead of clicking | ⭐⭐⭐ |
| **Zoom in Contract Mapper** | Zoom controls while mapping (like in edit preview) | ⭐⭐⭐ |
| **Anchor Templates** | Save common anchors as presets (e.g., "Standard Contract Set") | ⭐⭐ |
| **Export/Import Settings** | Download provider + anchors as JSON, import to another instance | ⭐⭐⭐ |
| **Recent Providers** | Quick access to last 3-5 used providers | ⭐⭐ |

---

## 🔐 Future / Advanced

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Authentication** | Login system, multiple users | ⭐⭐⭐ |
| **Audit Log** | Track who changed what and when | ⭐⭐ |
| **Batch Processing** | Upload multiple PDFs at once for auto-fill | ⭐⭐⭐ |
| **PDF History** | Keep versions of uploaded PDFs | ⭐ |
| **Dashboard** | Stats like "10 providers, 45 anchors, 23 PDFs processed" | ⭐⭐ |

---

## 🎨 Nice-to-Have UI Polish

| Feature | Description | Priority |
|---------|-------------|----------|
| **Onboarding Tour** | First-time user walkthrough | ⭐⭐ |
| **Drag & Drop Reorder** | Reorder anchors in the table | ⭐ |
| **Anchor Color Coding** | Different colors for different anchor types | ⭐ |
| **Mini-map** | Small PDF thumbnail showing current position | ⭐ |

---

## 💡 Top Recommendations

### 1. Duplicate Anchor ⭐⭐⭐
**Why:** Super useful when creating similar anchors (e.g., {{signature_1}}, {{signature_2}})
**Effort:** ~30 minutes
**Implementation:**
- Add "Copy" button to anchor table row
- Opens AnchorModal with pre-filled values
- User just changes the key name

### 2. Search Providers ⭐⭐⭐
**Why:** Essential when you have 20+ providers
**Effort:** ~1 hour
**Implementation:**
- Add search input above provider table
- Filter providers by name (case-insensitive)
- Show "No results" message if empty

### 3. Export/Import Settings ⭐⭐⭐
**Why:** Backup/restore or share configs between environments
**Effort:** ~2 hours
**Implementation:**
- Export: Download JSON file with provider + anchors
- Import: Upload JSON, validate, create providers/anchors
- Backend endpoints needed

### 4. Zoom in Contract Mapper ⭐⭐⭐
**Why:** Precise anchor placement on detailed PDFs
**Effort:** ~2 hours
**Implementation:**
- Reuse zoom controls from AnchorModal preview
- Add to PDFViewer component
- Handle scroll position on zoom

### 5. Batch Auto-Fill ⭐⭐⭐
**Why:** Process multiple contracts at once
**Effort:** ~3 hours
**Implementation:**
- Multi-file upload in AutoFillSection
- Backend processes each file
- Returns ZIP with all filled PDFs

---

## 📋 Implementation Checklist

### Phase 1: Quick Wins
- [ ] Duplicate Anchor button
- [ ] Search/filter providers
- [ ] Keyboard shortcuts (Esc, Enter)
- [ ] Empty state illustrations

### Phase 2: Core Enhancements
- [ ] Zoom controls in Contract Mapper
- [ ] Export/Import provider settings
- [ ] Bulk delete anchors
- [ ] Recent providers dropdown

### Phase 3: Advanced Features
- [ ] User authentication (login/register)
- [ ] Batch PDF processing
- [ ] Dashboard with statistics
- [ ] Audit log

### Phase 4: Polish
- [ ] Onboarding tour for new users
- [ ] Drag to reposition anchors
- [ ] Anchor color coding
- [ ] PDF mini-map

---

## 🛠️ Technical Debt / Improvements

| Item | Description |
|------|-------------|
| **Error Boundaries** | Add React error boundaries for graceful error handling |
| **Unit Tests** | Add Jest tests for critical components |
| **E2E Tests** | Add Cypress/Playwright tests for user flows |
| **API Validation** | Add Zod or Yup validation for API requests |
| **Loading Skeletons** | Replace spinners with skeleton loaders |
| **Optimistic Updates** | Update UI before API response for snappier feel |
| **Caching** | Add React Query or SWR for API caching |

---

## 📅 Suggested Roadmap

### Week 1-2: Quick Wins
- Duplicate anchor
- Search providers
- Keyboard shortcuts

### Week 3-4: Core Features
- Zoom in mapper
- Export/Import
- Bulk operations

### Month 2: Authentication
- Login/Register
- User management
- Role-based access

### Month 3: Advanced
- Batch processing
- Dashboard
- Audit log

---

**Last Updated:** January 2026
**Author & Developer:** Jommel Hinayon
