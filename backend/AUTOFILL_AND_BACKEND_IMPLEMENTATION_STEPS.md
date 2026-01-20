# Auto Fill Anchor - Backend Implementation Guide

**Author & Developer:** Jommel Hinayon

**Status: ✅ BACKEND COMPLETE & CONNECTED TO FRONTEND**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ENERGYANCHOR SYSTEM FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. CONTRACT MAPPER (Setup Phase)                                       │
│     ├── User selects Provider                                           │
│     ├── User uploads PDF → Stored in backend/uploads/                   │
│     ├── User clicks on PDF to place anchors                             │
│     └── Anchors saved: text, x, y, page, canvasWidth, canvasHeight      │
│                                                                         │
│  2. ANCHOR SETTINGS (Management)                                        │
│     ├── View all anchors for provider                                   │
│     ├── Edit anchor with live preview + zoom                            │
│     ├── Preview fetches PDF from backend storage                        │
│     └── Delete anchors with confirmation                                │
│                                                                         │
│  3. AUTO-FILL PROCESS                                                   │
│     ├── User selects Provider (must have anchors)                       │
│     ├── User uploads PDF for processing                                 │
│     ├── Backend: Places anchor text at saved coordinates                │
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
│  │ • React UI       │                                          │
│  │ • Zustand Store  │───────┐                                  │
│  │ • API Service    │       │ HTTP/JSON                        │
│  │ • PDF.js Viewer  │       │                                  │
│  └──────────────────┘       │                                  │
│                             ▼                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   Flask API      │  │   MySQL DB       │  Port 3308        │
│  │   (Backend)      │  │   (MariaDB)      │                   │
│  ├──────────────────┤  ├──────────────────┤                   │
│  │ Port 5001        │  │ • providers      │                   │
│  │ • /api/providers │──│ • anchor_settings│                   │
│  │ • /api/anchors   │  │ • provider_pdfs  │                   │
│  │ • /api/pdfs      │  └──────────────────┘                   │
│  │ • /api/autofill  │                                          │
│  │ • PyMuPDF        │  ┌──────────────────┐                   │
│  │                  │──│   uploads/       │ File Storage      │
│  └──────────────────┘  │ • provider_1.pdf │                   │
│                        │ • provider_2.pdf │                   │
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
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐       ┌──────────────────┐                    │
│  │  providers  │       │  anchor_settings │                    │
│  ├─────────────┤       ├──────────────────┤                    │
│  │ id (PK)     │──┐    │ id (PK)          │                    │
│  │ name        │  │    │ provider_id (FK) │◄─┐                 │
│  │ is_active   │  └───►│ text             │  │                 │
│  │ created_at  │       │ x                │  │                 │
│  │ updated_at  │       │ y                │  │                 │
│  └─────────────┘       │ page             │  │                 │
│         │              │ canvas_width     │  │                 │
│         │              │ canvas_height    │  │                 │
│         │              │ created_at       │  │                 │
│         │              │ updated_at       │  │                 │
│         │              └──────────────────┘  │                 │
│         │                                    │                 │
│         │       ┌──────────────────┐         │                 │
│         │       │  provider_pdfs   │         │                 │
│         │       ├──────────────────┤         │                 │
│         └──────►│ id (PK)          │         │                 │
│                 │ provider_id (FK) │◄────────┘                 │
│                 │ filename         │                           │
│                 │ file_path        │                           │
│                 │ file_size        │                           │
│                 │ total_pages      │                           │
│                 │ content_hash     │  (duplicate detection)    │
│                 │ created_at       │                           │
│                 └──────────────────┘                           │
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

### Table: `anchor_settings`
```sql
CREATE TABLE anchor_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    text VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    page VARCHAR(50) NOT NULL DEFAULT '1',
    canvas_width INT,
    canvas_height INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);
```

### Table: `provider_pdfs`
```sql
CREATE TABLE provider_pdfs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    total_pages INT,
    content_hash VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Provider API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List all active providers |
| GET | `/api/providers/<id>` | Get provider with anchors |
| POST | `/api/providers` | Create provider |
| PUT | `/api/providers/<id>` | Update provider (name, active) |
| DELETE | `/api/providers/<id>` | Soft delete (is_active=0) |

### Anchor API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/<id>/anchors` | List anchors for provider |
| GET | `/api/anchors/<id>` | Get single anchor |
| POST | `/api/providers/<id>/anchors` | Create anchor |
| PUT | `/api/anchors/<id>` | Update anchor |
| DELETE | `/api/anchors/<id>` | Delete anchor |

### PDF API ⭐

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/providers/<id>/pdf` | Upload PDF (with duplicate check) |
| GET | `/api/providers/<id>/pdf` | Download provider's PDF |
| GET | `/api/providers/<id>/pdf/info` | Get PDF metadata |
| DELETE | `/api/providers/<id>/pdf` | Delete provider's PDF |
| GET | `/api/providers/<id>/pdf/page/<num>` | Get page as image |
| POST | `/api/pdf/check-duplicate` | Check if PDF exists |

### Auto-Fill API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autofill` | Process PDF with anchor settings |

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
│   ├── provider.py       # Provider model
│   ├── anchor.py         # Anchor model
│   └── pdf.py            # PDF model
├── services/
│   ├── __init__.py
│   └── pdf_service.py    # PDF manipulation (PyMuPDF)
├── routes/
│   ├── __init__.py       # Blueprint exports
│   ├── providers.py      # Provider CRUD
│   ├── anchors.py        # Anchor CRUD
│   ├── pdfs.py           # PDF upload/download
│   └── autofill.py       # Auto-fill processing
└── uploads/              # PDF storage folder
```

---

## Core Implementation

### PDF Service (`services/pdf_service.py`)

```python
import fitz  # PyMuPDF
import hashlib

def place_anchors_on_pdf(pdf_bytes: bytes, anchors: list, 
                         canvas_width: int, canvas_height: int) -> bytes:
    """Place anchor text on PDF at specified coordinates."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    
    for anchor in anchors:
        pages = determine_pages(anchor['page'], total_pages)
        
        for page_num in pages:
            page = doc[page_num - 1]
            
            # Convert canvas coordinates to PDF coordinates
            pdf_x, pdf_y = convert_coordinates(
                anchor['x'], anchor['y'],
                canvas_width, canvas_height,
                page.rect.width, page.rect.height
            )
            
            # Insert text at position
            page.insert_text(
                (pdf_x, pdf_y),
                anchor['text'],
                fontsize=10,
                color=(1, 0, 0)  # Red
            )
    
    return doc.tobytes()


def convert_coordinates(canvas_x, canvas_y, canvas_w, canvas_h, pdf_w, pdf_h):
    """Convert canvas coordinates to PDF coordinates."""
    scale_x = pdf_w / canvas_w
    scale_y = pdf_h / canvas_h
    
    pdf_x = canvas_x * scale_x
    # Flip Y axis (PDF origin is bottom-left)
    pdf_y = pdf_h - (canvas_y * scale_y)
    
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
from flask import Blueprint, request, send_file
from services.pdf_service import place_anchors_on_pdf
import io
import json

autofill_bp = Blueprint('autofill', __name__)

@autofill_bp.route('/autofill', methods=['POST'])
def autofill():
    """Process PDF with anchor settings and return filled PDF."""
    pdf_file = request.files['pdf']
    anchors = json.loads(request.form['anchors'])
    canvas_width = int(request.form.get('canvasWidth', 1224))
    canvas_height = int(request.form.get('canvasHeight', 1584))
    
    pdf_bytes = pdf_file.read()
    
    result_pdf = place_anchors_on_pdf(
        pdf_bytes, anchors, canvas_width, canvas_height
    )
    
    return send_file(
        io.BytesIO(result_pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='filled_contract.pdf'
    )
```

### PDF Upload with Duplicate Detection (`routes/pdfs.py`)

```python
@pdfs_bp.route('/providers/<int:provider_id>/pdf', methods=['POST'])
def upload_pdf(provider_id):
    """Upload PDF with duplicate detection."""
    provider = Provider.query.get_or_404(provider_id)
    file = request.files['pdf']
    
    pdf_bytes = file.read()
    content_hash = get_pdf_content_hash(pdf_bytes)
    
    # Check for duplicate
    existing = ProviderPDF.find_by_hash(content_hash)
    if existing and existing.provider_id != provider_id:
        return jsonify({
            'warning': 'duplicate_found',
            'message': f'PDF already exists for: {existing.provider.name}'
        }), 409
    
    # Save file
    filename = secure_filename(file.filename)
    file_path = os.path.join('uploads', f'provider_{provider_id}_{filename}')
    
    with open(file_path, 'wb') as f:
        f.write(pdf_bytes)
    
    # Save to database
    provider_pdf = ProviderPDF(
        provider_id=provider.id,
        filename=filename,
        file_path=file_path,
        file_size=len(pdf_bytes),
        total_pages=get_pdf_page_count(pdf_bytes),
        content_hash=content_hash
    )
    db.session.add(provider_pdf)
    db.session.commit()
    
    return jsonify(provider_pdf.to_dict()), 201
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

# List providers
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
- List active/all providers

### ✅ Anchor Management
- Create anchors with coordinates
- Edit anchors with live preview
- Delete anchors with confirmation
- Page settings: global, last, specific

### ✅ PDF Storage
- Upload PDF for each provider
- Store in `uploads/` folder
- Duplicate detection via content hash
- Download for preview feature
- Delete when no longer needed

### ✅ Auto-Fill Processing
- Receive PDF + anchor settings
- Place text at coordinates
- Handle coordinate conversion
- Return filled PDF for download

### ✅ Frontend Integration
- All CRUD operations connected
- Toast notifications
- Loading states
- Error handling

---

## Coordinate System

### Important: Canvas vs PDF Coordinates

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
- [x] `models/provider.py` - Provider model
- [x] `models/anchor.py` - Anchor model
- [x] `models/pdf.py` - PDF model with hash
- [x] `services/pdf_service.py` - PDF manipulation
- [x] `routes/providers.py` - Provider CRUD
- [x] `routes/anchors.py` - Anchor CRUD
- [x] `routes/pdfs.py` - PDF upload/download
- [x] `routes/autofill.py` - Auto-fill endpoint
- [x] `uploads/` - File storage folder

### Frontend Integration ✅ COMPLETE
- [x] `lib/api.ts` - API service
- [x] `useProviderStore.ts` - Async operations
- [x] All modals with async save
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
