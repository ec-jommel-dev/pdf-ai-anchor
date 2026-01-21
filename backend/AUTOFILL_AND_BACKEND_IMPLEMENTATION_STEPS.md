# PDF Anchor Mapper - Backend Implementation Guide

**Author & Developer:** Jommel Hinayon

**Status: ✅ BACKEND COMPLETE & CONNECTED TO FRONTEND**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   PDF ANCHOR MAPPER SYSTEM FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. CONTRACT MAPPER (Setup Phase)                                       │
│     ├── User selects Provider                                           │
│     ├── User uploads PDF → Stored in backend/uploads/                   │
│     ├── Each provider can have MULTIPLE PDFs                            │
│     ├── User clicks on PDF to place anchors                             │
│     └── Anchors saved to SPECIFIC PDF: text, x, y, page, canvas dims    │
│                                                                         │
│  2. ANCHOR SETTINGS (Management)                                        │
│     ├── Select PDF from dropdown                                        │
│     ├── View anchors for selected PDF only                              │
│     ├── Edit anchor with live preview + zoom                            │
│     ├── Preview fetches PDF from backend by pdfId                       │
│     └── Delete anchors with confirmation                                │
│                                                                         │
│  3. AUTO-FILL PROCESS                                                   │
│     ├── User selects Provider                                           │
│     ├── User selects PDF template (with anchors)                        │
│     ├── User uploads PDF for processing                                 │
│     ├── Backend: Places anchor text at saved coordinates                │
│     ├── Preview mode: RED text (for verification)                       │
│     ├── Clean mode: WHITE text (for signing)                            │
│     └── Returns filled PDF → Auto-download                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │   Next.js App    │  Port 3000                               │
│  │   (Frontend)     │                                          │
│  ├──────────────────┤                                          │
│  │ • Dashboard      │                                          │
│  │ • Contract Mapper│───────┐                                  │
│  │ • Auto Fill      │       │ HTTP/JSON                        │
│  │ • Provider List  │       │                                  │
│  │ • Word to PDF*   │       │  *Client-side only               │
│  └──────────────────┘       │                                  │
│                             ▼                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   Flask API      │  │   MySQL DB       │  Port 3308        │
│  │   (Backend)      │  │   (MariaDB)      │                   │
│  ├──────────────────┤  ├──────────────────┤                   │
│  │ Port 5001        │  │ • providers      │                   │
│  │ • /api/providers │──│ • provider_pdfs  │ (1:N)             │
│  │ • /api/pdfs      │  │ • anchor_settings│ (PDF:N)           │
│  │ • /api/anchors   │  └──────────────────┘                   │
│  │ • /api/autofill  │                                          │
│  │ • PyMuPDF        │  ┌──────────────────┐                   │
│  │                  │──│   uploads/       │ File Storage      │
│  └──────────────────┘  │ • provider_4_*.pdf│                   │
│                        │ • provider_5_*.pdf│                   │
│                        └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend (Python/Flask)
| Technology | Purpose |
|------------|---------|
| Flask | Web framework |
| Flask-CORS | Cross-origin requests |
| Flask-SQLAlchemy | ORM |
| PyMuPDF (fitz) | PDF manipulation |
| PyMySQL | MySQL connector |
| python-dotenv | Environment variables |

### Why Flask/PyMuPDF?
- ✅ **Superior PDF libraries** - PyMuPDF handles complex PDFs
- ✅ **Faster processing** - Native C library
- ✅ **Precise text placement** - Sub-pixel accuracy
- ✅ **Future AI ready** - Easy OCR/ML integration

---

## Database Schema

### Database: `provider_contract_anchor` (MySQL)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
│                    (Multiple PDFs per Provider)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐       ┌──────────────────┐                    │
│  │  providers  │       │  provider_pdfs   │                    │
│  ├─────────────┤       ├──────────────────┤                    │
│  │ id (PK)     │──┐    │ id (PK)          │                    │
│  │ name        │  └───►│ provider_id (FK) │                    │
│  │ is_active   │       │ filename         │                    │
│  │ created_at  │       │ file_path        │                    │
│  │ updated_at  │       │ file_size        │                    │
│  └─────────────┘       │ total_pages      │                    │
│                        │ canvas_width     │                    │
│                        │ canvas_height    │                    │
│                        │ content_hash     │ (duplicate check)  │
│                        │ is_active        │ (soft delete)      │
│                        │ created_at       │                    │
│                        └────────┬─────────┘                    │
│                                 │                               │
│                                 │ 1:N                           │
│                                 ▼                               │
│                        ┌──────────────────┐                    │
│                        │ anchor_settings  │                    │
│                        ├──────────────────┤                    │
│                        │ id (PK)          │                    │
│                        │ pdf_id (FK)      │ Anchors belong     │
│                        │ text             │ to PDFs            │
│                        │ x                │                    │
│                        │ y                │                    │
│                        │ page             │                    │
│                        │ canvas_width     │                    │
│                        │ canvas_height    │                    │
│                        │ created_at       │                    │
│                        │ updated_at       │                    │
│                        └──────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Provider API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List all providers (use `?include_inactive=true`) |
| GET | `/api/providers/<id>` | Get single provider with all data |
| POST | `/api/providers` | Create provider |
| PUT | `/api/providers/<id>` | Update provider (name, active) |
| DELETE | `/api/providers/<id>` | Soft delete (is_active=0) |

### PDF API (Multiple PDFs per Provider)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/<id>/pdfs` | List PDFs (use `?include_inactive=true`) |
| POST | `/api/providers/<id>/pdfs` | Upload new PDF (returns 409 if duplicate) |
| GET | `/api/pdfs/<pdf_id>` | Download specific PDF |
| GET | `/api/pdfs/<pdf_id>/info` | Get PDF metadata |
| PUT | `/api/pdfs/<pdf_id>` | Update PDF (filename, isActive) |
| DELETE | `/api/pdfs/<pdf_id>` | Soft delete PDF |
| DELETE | `/api/pdfs/<pdf_id>/hard-delete` | Permanently delete |
| GET | `/api/pdfs/<pdf_id>/page/<num>` | Get page as image |
| POST | `/api/pdf/check-duplicate` | Check if PDF exists |

### Anchor API (Belongs to PDF)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pdfs/<pdf_id>/anchors` | List anchors for specific PDF |
| POST | `/api/pdfs/<pdf_id>/anchors` | Create anchor for PDF |
| GET | `/api/providers/<id>/anchors` | Get all anchors (aggregated) |
| GET | `/api/anchors/<id>` | Get single anchor |
| PUT | `/api/anchors/<id>` | Update anchor |
| DELETE | `/api/anchors/<id>` | Delete anchor |

### Auto-Fill API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autofill` | Process PDF with anchor settings |

**Auto-Fill Request Parameters:**
```
pdf: File              - PDF file to process
anchors: JSON          - Array of anchor settings
canvasWidth: number    - Canvas width for coordinate conversion
canvasHeight: number   - Canvas height for coordinate conversion
preview: boolean       - true=red text, false=white text
```

---

## Input Validation

### Provider Endpoints
- **POST /providers**: `name` required, non-empty string
- **PUT /providers/<id>**: `name` or `active` required

### PDF Endpoints
- **POST /pdfs**: File required, must be PDF, max 10MB
- **Duplicate Check**: Returns 409 if same PDF content exists for provider

### Anchor Endpoints
- **POST /anchors**: `text` required, `x` and `y` should be positive integers

---

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Dependencies
├── config.py             # Configuration
├── database.py           # SQLAlchemy setup
├── .env                  # Environment variables
├── models/
│   ├── __init__.py       # Model exports
│   ├── provider.py       # Provider model (has many PDFs)
│   ├── anchor.py         # Anchor model (belongs to PDF)
│   └── pdf.py            # PDF model (has many anchors)
├── services/
│   ├── __init__.py
│   └── pdf_service.py    # PDF manipulation (PyMuPDF)
├── routes/
│   ├── __init__.py       # Blueprint exports
│   ├── providers.py      # Provider CRUD (include_inactive param)
│   ├── anchors.py        # Anchor CRUD (by PDF)
│   ├── pdfs.py           # PDF upload/download (duplicate detection)
│   └── autofill.py       # Auto-fill processing (preview mode)
└── uploads/              # PDF storage folder
```

---

## Core Implementation

### PDF Upload with Duplicate Detection

```python
@pdfs_bp.route('/providers/<int:provider_id>/pdfs', methods=['POST'])
def upload_pdf(provider_id):
    """Upload PDF with duplicate detection."""
    # ... validation ...
    
    # Generate content hash for duplicate detection
    pdf_bytes = file.read()
    content_hash = get_pdf_content_hash(pdf_bytes)
    
    # Check for duplicate within SAME provider
    existing_pdf = ProviderPDF.query.filter_by(
        provider_id=provider_id,
        content_hash=content_hash,
        is_active=True
    ).first()
    
    if existing_pdf:
        return jsonify({
            'warning': 'duplicate_found',
            'message': f'This PDF is already uploaded as: {existing_pdf.filename}',
            'existingPdfId': existing_pdf.id
        }), 409  # Conflict
    
    # ... save file and create record ...
```

### PDF Service with Preview Mode

```python
def place_anchors_on_pdf(pdf_bytes: bytes, anchors: list, 
                         canvas_width: int, canvas_height: int,
                         preview: bool = False) -> bytes:
    """Place anchor text on PDF.
    
    Args:
        preview: If True, text is RED (for verification)
                 If False, text is WHITE (for signing)
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    # Color based on mode
    text_color = (1, 0, 0) if preview else (1, 1, 1)  # Red or White
    
    for anchor in anchors:
        pages = determine_pages(anchor['page'], len(doc))
        
        for page_num in pages:
            page = doc[page_num - 1]
            pdf_x, pdf_y = convert_coordinates(...)
            
            page.insert_text(
                (pdf_x, pdf_y),
                anchor['text'],
                fontsize=10,
                color=text_color
            )
    
    return doc.tobytes()
```

---

## Environment Configuration

### `backend/.env`
```env
# MySQL Database Connection
DATABASE_URL=mysql+pymysql://root:secret@127.0.0.1:3308/provider_contract_anchor

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-here
UPLOAD_FOLDER=uploads
```

---

## Quick Start

### 1. Setup Database
```bash
# Start MariaDB (Docker)
docker start local-mariadb-1

# Create database
mysql -u root -p -P 3308 -h 127.0.0.1
CREATE DATABASE provider_contract_anchor;
```

### 2. Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run Backend
```bash
cd backend
source venv/bin/activate
python app.py
# Running on http://127.0.0.1:5001
```

### 4. Run Frontend
```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

### 5. Test API
```bash
# Health check
curl http://127.0.0.1:5001/api/health

# List providers (includes inactive)
curl "http://127.0.0.1:5001/api/providers?include_inactive=true"
```

---

## Features Implemented

### ✅ Provider Management
- Create, read, update, delete providers
- Soft delete (is_active flag)
- Returns PDFs and aggregated anchors
- `include_inactive` query param

### ✅ Multiple PDFs per Provider
- Upload multiple PDFs for each provider
- Each PDF has its own anchor settings
- Soft delete PDFs (is_active flag)
- **Duplicate detection via content hash (409 error)**

### ✅ Anchor Management
- Anchors belong to specific PDFs (not providers)
- Create anchors with coordinates
- Edit anchors
- Delete anchors
- Page settings: global, last, specific

### ✅ Auto-Fill Processing
- Receive PDF + anchor settings
- Place text at coordinates
- **Preview mode**: Red text (for verification)
- **Clean mode**: White text (for signing)
- Handle coordinate conversion

### ✅ Frontend Integration
- All CRUD operations connected
- PDF selection dropdown
- Toast notifications
- Loading states
- Error handling
- **409 duplicate error with user-friendly message**

---

## File Checklist

### Backend Files ✅ COMPLETE
- [x] `app.py` - Main Flask app with welcome page
- [x] `config.py` - Configuration
- [x] `database.py` - SQLAlchemy setup
- [x] `.env` - Environment variables
- [x] `requirements.txt` - Dependencies
- [x] `models/provider.py` - Provider model (has many PDFs)
- [x] `models/anchor.py` - Anchor model (belongs to PDF)
- [x] `models/pdf.py` - PDF model (has many anchors)
- [x] `services/pdf_service.py` - PDF manipulation with preview mode
- [x] `routes/providers.py` - Provider CRUD (include_inactive)
- [x] `routes/anchors.py` - Anchor CRUD (by PDF)
- [x] `routes/pdfs.py` - Multiple PDFs, duplicate detection (409)
- [x] `routes/autofill.py` - Auto-fill with preview/clean modes
- [x] `uploads/` - File storage folder

---

## Remaining Tasks

- [ ] Production deployment (Railway/Render)
- [ ] Request logging/monitoring
- [ ] PDF validation (encrypted, malformed)
- [ ] Rate limiting
- [ ] File cleanup job (old uploads)

---

**Last Updated:** January 2026
**Author & Developer:** Jommel Hinayon
