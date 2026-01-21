# Database Migration Guide - Multiple PDFs per Provider

**Author:** Jommel Hinayon

## Overview

This migration changes the data model so that:
- **Before:** Provider → PDF (1) → Anchors (many)
- **After:** Provider → PDFs (many) → Each PDF has Anchors (many)

---

## Step 1: Backup Your Data (Important!)

```sql
-- Export current data before migration
mysqldump -u root -p provider_contract_anchor > backup_before_migration.sql
```

---

## Step 2: Run Migration SQL

```sql
USE provider_contract_anchor;

-- 1. Add new columns to provider_pdfs table
ALTER TABLE provider_pdfs
ADD COLUMN canvas_width INT DEFAULT NULL,
ADD COLUMN canvas_height INT DEFAULT NULL,
ADD COLUMN is_active TINYINT(1) DEFAULT 1;

-- 2. Add pdf_id column to anchor_settings (if not exists)
ALTER TABLE anchor_settings
ADD COLUMN pdf_id INT DEFAULT NULL AFTER provider_id;

-- 3. Migrate existing anchors to link to their provider's PDF
-- This links existing anchors to the first PDF of their provider
UPDATE anchor_settings a
SET a.pdf_id = (
    SELECT p.id 
    FROM provider_pdfs p 
    WHERE p.provider_id = a.provider_id 
    ORDER BY p.id ASC 
    LIMIT 1
)
WHERE a.pdf_id IS NULL;

-- 4. Make pdf_id NOT NULL after migration (only if all anchors have pdf_id)
-- ALTER TABLE anchor_settings MODIFY COLUMN pdf_id INT NOT NULL;

-- 5. Add foreign key constraint
ALTER TABLE anchor_settings
ADD CONSTRAINT fk_anchor_pdf 
FOREIGN KEY (pdf_id) REFERENCES provider_pdfs(id) ON DELETE CASCADE;

-- 6. (Optional) Remove provider_id from anchors if no longer needed
-- ALTER TABLE anchor_settings DROP FOREIGN KEY anchor_settings_ibfk_1;
-- ALTER TABLE anchor_settings DROP COLUMN provider_id;
```

---

## Step 3: Verify Migration

```sql
-- Check that all anchors have pdf_id
SELECT COUNT(*) as orphaned_anchors 
FROM anchor_settings 
WHERE pdf_id IS NULL;

-- Check provider_pdfs structure
DESCRIBE provider_pdfs;

-- Check anchor_settings structure
DESCRIBE anchor_settings;

-- View sample data
SELECT 
    p.name as provider_name,
    pdf.filename,
    a.text as anchor_text,
    a.x, a.y
FROM providers p
JOIN provider_pdfs pdf ON pdf.provider_id = p.id
JOIN anchor_settings a ON a.pdf_id = pdf.id
LIMIT 10;
```

---

## Step 4: Restart Backend

```bash
cd backend
pkill -f "python app.py"
source venv/bin/activate
python app.py
```

---

## New Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEW DATA MODEL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │  providers  │                                               │
│  ├─────────────┤                                               │
│  │ id (PK)     │───┐                                           │
│  │ name        │   │                                           │
│  │ is_active   │   │   1:N (One provider has many PDFs)       │
│  └─────────────┘   │                                           │
│                    │                                           │
│                    ▼                                           │
│         ┌──────────────────┐                                   │
│         │  provider_pdfs   │                                   │
│         ├──────────────────┤                                   │
│         │ id (PK)          │───┐                               │
│         │ provider_id (FK) │   │                               │
│         │ filename         │   │   1:N (Each PDF has anchors) │
│         │ canvas_width     │   │                               │
│         │ canvas_height    │   │                               │
│         │ is_active        │   │                               │
│         └──────────────────┘   │                               │
│                                │                               │
│                                ▼                               │
│                   ┌──────────────────┐                         │
│                   │  anchor_settings │                         │
│                   ├──────────────────┤                         │
│                   │ id (PK)          │                         │
│                   │ pdf_id (FK)      │  ← NEW! (was provider_id)│
│                   │ text             │                         │
│                   │ x, y             │                         │
│                   │ page             │                         │
│                   └──────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## New API Endpoints

### PDF Endpoints (Multiple per Provider)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/pdfs` | List all PDFs for provider |
| POST | `/api/providers/:id/pdfs` | Upload new PDF |
| GET | `/api/pdfs/:id` | Download specific PDF |
| GET | `/api/pdfs/:id/info` | Get PDF info |
| PUT | `/api/pdfs/:id` | Update PDF metadata |
| DELETE | `/api/pdfs/:id` | Soft delete PDF |

### Anchor Endpoints (Belong to PDF)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pdfs/:id/anchors` | List anchors for PDF |
| POST | `/api/pdfs/:id/anchors` | Create anchor for PDF |
| PUT | `/api/anchors/:id` | Update anchor |
| DELETE | `/api/anchors/:id` | Delete anchor |

### Auto-Fill Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autofill` | Process with direct anchors |
| POST | `/api/autofill/pdf/:id` | Process using PDF's anchors |

---

## Frontend Changes Required

After running the migration, update these frontend components:

1. **ProviderProfileSection.tsx** - Add PDF dropdown
2. **ContractMapperSection.tsx** - Track which PDF is being mapped
3. **AutoFillSection.tsx** - Select PDF template
4. **AnchorModal.tsx** - Pass pdfId when creating anchors
5. **PreviewModal.tsx** - Use pdfId for preview

---

## Rollback (If Needed)

```sql
-- Restore from backup
mysql -u root -p provider_contract_anchor < backup_before_migration.sql
```

---

**Last Updated:** January 2026
