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
│                        │ pdf_id (FK)      │ ⭐ Anchors belong  │
│                        │ text             │    to PDFs now     │
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

### Table: `providers`
```sql
CREATE TABLE providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Table: `provider_pdfs` ⭐ UPDATED
```sql
CREATE TABLE provider_pdfs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    total_pages INT,
    canvas_width INT,
    canvas_height INT,
    content_hash VARCHAR(64),
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);
```

### Table: `anchor_settings` ⭐ UPDATED
```sql
CREATE TABLE anchor_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pdf_id INT NOT NULL,              -- Changed from provider_id
    text VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    page VARCHAR(50) NOT NULL DEFAULT '1',
    canvas_width INT,
    canvas_height INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pdf_id) REFERENCES provider_pdfs(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Provider API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List all providers with PDFs and anchors |
| GET | `/api/providers/<id>` | Get single provider with all data |
| POST | `/api/providers` | Create provider |
| PUT | `/api/providers/<id>` | Update provider (name, active) |
| DELETE | `/api/providers/<id>` | Soft delete (is_active=0) |

### PDF API ⭐ UPDATED (Multiple PDFs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/<id>/pdfs` | List all PDFs for provider |
| POST | `/api/providers/<id>/pdfs` | Upload new PDF (supports multiple) |
| GET | `/api/pdfs/<pdf_id>` | Download specific PDF |
| GET | `/api/pdfs/<pdf_id>/info` | Get PDF metadata |
| PUT | `/api/pdfs/<pdf_id>` | Update PDF metadata |
| DELETE | `/api/pdfs/<pdf_id>` | Soft delete PDF |
| DELETE | `/api/pdfs/<pdf_id>/hard-delete` | Permanently delete |
| GET | `/api/pdfs/<pdf_id>/page/<num>` | Get page as image |
| POST | `/api/pdf/check-duplicate` | Check if PDF exists |

### Anchor API ⭐ UPDATED (Belongs to PDF)

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
preview: boolean       - true=red text, false=white text ⭐ NEW
```

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
│   ├── providers.py      # Provider CRUD
│   ├── anchors.py        # Anchor CRUD (by PDF)
│   ├── pdfs.py           # PDF upload/download (multiple per provider)
│   └── autofill.py       # Auto-fill processing (with preview mode)
└── uploads/              # PDF storage folder
```

---

## Core Implementation

### PDF Service (`services/pdf_service.py`)

```python
import fitz  # PyMuPDF
import hashlib

def place_anchors_on_pdf(pdf_bytes: bytes, anchors: list, 
                         canvas_width: int, canvas_height: int,
                         preview: bool = False) -> bytes:
    """Place anchor text on PDF at specified coordinates.
    
    Args:
        preview: If True, text is RED (for verification)
                 If False, text is WHITE (for signing)
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    
    # Color based on mode
    text_color = (1, 0, 0) if preview else (1, 1, 1)  # Red or White
    
    for anchor in anchors:
        pages = determine_pages(anchor['page'], total_pages)
        
        for page_num in pages:
            page = doc[page_num - 1]
            
            # Get canvas dimensions from anchor or use provided
            anchor_canvas_w = anchor.get('canvasWidth') or canvas_width
            anchor_canvas_h = anchor.get('canvasHeight') or canvas_height
            
            # Convert coordinates
            pdf_x, pdf_y = convert_coordinates(
                anchor['x'], anchor['y'],
                anchor_canvas_w, anchor_canvas_h,
                page.rect.width, page.rect.height
            )
            
            # Insert text
            page.insert_text(
                (pdf_x, pdf_y),
                anchor['text'],
                fontsize=10,
                color=text_color
            )
    
    return doc.tobytes()


def convert_coordinates(canvas_x, canvas_y, canvas_w, canvas_h, pdf_w, pdf_h):
    """Convert canvas coordinates to PDF coordinates."""
    scale_x = pdf_w / canvas_w
    scale_y = pdf_h / canvas_h
    
    pdf_x = canvas_x * scale_x
    pdf_y = pdf_h - (canvas_y * scale_y)  # Flip Y axis
    
    return pdf_x, pdf_y


def determine_pages(page_setting: str, total_pages: int) -> list:
    """Resolve page setting to list of page numbers."""
    if page_setting == 'global':
        return list(range(1, total_pages + 1))
    elif page_setting == 'last':
        return [total_pages]
    else:
        return [int(p.strip()) for p in page_setting.split(',')]


def get_pdf_page_count(pdf_bytes: bytes) -> int:
    """Get total page count from PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return len(doc)


def get_pdf_content_hash(pdf_bytes: bytes) -> str:
    """Generate SHA-256 hash for duplicate detection."""
    return hashlib.sha256(pdf_bytes).hexdigest()
```

### Auto-Fill Route (`routes/autofill.py`)

```python
@autofill_bp.route('/autofill', methods=['POST'])
def autofill():
    """Process PDF with anchor settings and return filled PDF."""
    pdf_file = request.files['pdf']
    anchors = json.loads(request.form['anchors'])
    canvas_width = int(request.form.get('canvasWidth', 1224))
    canvas_height = int(request.form.get('canvasHeight', 1584))
    
    # NEW: Preview mode parameter
    preview = request.form.get('preview', 'false').lower() == 'true'
    
    pdf_bytes = pdf_file.read()
    
    result_pdf = place_anchors_on_pdf(
        pdf_bytes, anchors, canvas_width, canvas_height, preview
    )
    
    # Dynamic filename based on mode
    filename = 'preview_contract.pdf' if preview else 'filled_contract.pdf'
    
    return send_file(
        io.BytesIO(result_pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )
```

### Provider Model (`models/provider.py`)

```python
class Provider(db.Model):
    __tablename__ = 'providers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # One provider has many PDFs
    pdfs = db.relationship('ProviderPDF', backref='provider', 
                          lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        # Aggregate all anchors from all PDFs
        all_anchors = []
        for pdf in self.pdfs:
            if pdf.is_active:
                for anchor in pdf.anchors:
                    anchor_dict = anchor.to_dict()
                    anchor_dict['pdfFilename'] = pdf.filename
                    all_anchors.append(anchor_dict)
        
        return {
            'id': str(self.id),
            'name': self.name,
            'active': self.is_active,
            'pdfs': [pdf.to_dict() for pdf in self.pdfs if pdf.is_active],
            'pdfCount': len([p for p in self.pdfs if p.is_active]),
            'anchors': all_anchors
        }
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

### MySQL Connection String Format
```
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

| Part | Value | Description |
|------|-------|-------------|
| Driver | `mysql+pymysql` | MySQL with PyMySQL |
| Username | `root` | Database user |
| Password | `secret` | Database password |
| Host | `127.0.0.1` | MySQL server |
| Port | `3308` | Local port (3306 = staging) |
| Database | `provider_contract_anchor` | Database name |

---

## Requirements

### `requirements.txt`
```
flask==3.0.0
flask-cors==4.0.0
flask-sqlalchemy==3.1.1
pymupdf==1.23.8
python-dotenv==1.0.0
gunicorn==21.2.0
pymysql==1.1.0
cryptography==42.0.0
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

# List providers (includes PDFs and anchors)
curl http://127.0.0.1:5001/api/providers

# Create provider
curl -X POST http://127.0.0.1:5001/api/providers \
  -H "Content-Type: application/json" \
  -d '{"name": "Pacific Gas & Electric"}'
```

---

## Features Implemented

### ✅ Provider Management
- Create, read, update, delete providers
- Soft delete (is_active flag)
- Returns PDFs and aggregated anchors

### ✅ Multiple PDFs per Provider ⭐ NEW
- Upload multiple PDFs for each provider
- Each PDF has its own anchor settings
- Soft delete PDFs (is_active flag)
- Duplicate detection via content hash

### ✅ Anchor Management
- Anchors belong to specific PDFs (not providers)
- Create anchors with coordinates
- Edit anchors with live preview
- Delete anchors with confirmation
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

---

## Coordinate System

### Canvas vs PDF Coordinates

```
Canvas (HTML):              PDF (PyMuPDF):
┌─────────────┐            ┌─────────────┐
│ (0,0)    →  │            │          ▲  │
│ ↓           │            │          │  │
│             │            │             │
│             │            │ (0,0) →     │
└─────────────┘            └─────────────┘

Canvas: Origin top-left, Y increases downward
PDF:    Origin bottom-left, Y increases upward
```

### Conversion Formula
```python
pdf_x = canvas_x * (pdf_width / canvas_width)
pdf_y = pdf_height - (canvas_y * (pdf_height / canvas_height))
```

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
- [x] `routes/providers.py` - Provider CRUD
- [x] `routes/anchors.py` - Anchor CRUD (by PDF)
- [x] `routes/pdfs.py` - Multiple PDFs per provider
- [x] `routes/autofill.py` - Auto-fill with preview/clean modes
- [x] `uploads/` - File storage folder

### Frontend Integration ✅ COMPLETE
- [x] `lib/api.ts` - API service (PDF by ID, anchors by PDF)
- [x] `useProviderStore.ts` - currentPdfId, PDF/anchor selection
- [x] All sections updated for multiple PDFs
- [x] Toast notifications
- [x] Loading states

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
