# 🎯 PDF Anchor Mapper

> A full-stack application for mapping anchor coordinates on PDF contracts for automated text placement. Built with **Next.js 14+**, **Flask**, and **PyMuPDF**.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![Flask](https://img.shields.io/badge/Flask-3.0-green?style=flat-square&logo=flask)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.9+-yellow?style=flat-square&logo=python)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)

---

## ✨ Features

### 📊 Dashboard
- Quick overview with stats (Providers, Contracts, Anchors)
- Quick action cards for Contract Mapper and Auto Fill
- Provider overview table with status and counts

### 📤 Contract Mapper
- Upload PDF contracts and assign to providers
- **Multiple PDFs per provider** - Upload different contract templates
- Click-to-place anchor markers on PDF pages
- Live preview with zoom controls (50% - 250%)
- Precise coordinate capture for text placement

### ⚡ Auto-Fill Anchor
- Select provider and **specific PDF template**
- Automatically place anchor text on PDFs
- 👁️ **Preview Mode** - Red text to verify positions
- 📥 **Clean Download** - White text for signing
- Batch processing ready

### 📄 Anchor Settings
- Edit anchors with real-time PDF preview
- Click on preview to adjust coordinates
- Zoom in/out for precision
- Page settings: Global, Last Page, or Specific Pages
- **Filter by PDF** - View anchors for specific contract

### 📋 Provider Management
- Create, edit, and manage providers
- Active/Inactive status management
- View all PDFs and anchors per provider

### 📝 Word to PDF Converter
- **100% Client-side** - Files never leave your browser
- Convert .docx and .doc files to PDF
- Drag & drop or click to upload
- No API or database required

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js App    │────▶│   Flask API      │────▶│   MySQL DB       │
│   (Port 3000)    │◀────│   (Port 5001)    │◀────│   (Port 3308)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │
        │                        ▼
        │                ┌──────────────────┐
        │                │   uploads/       │
        │                │   (PDF Storage)  │
        └───────────────▶└──────────────────┘
```

### Data Model
```
Provider (1) ──► (N) PDFs (1) ──► (N) Anchors
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.9+
- **MySQL** 8.0+ (or MariaDB)

### 1. Clone the Repository

```bash
git clone https://github.com/jommel1998/pdf-ai-anchor.git
cd pdf-ai-anchor
```

### 2. Setup Database

```sql
-- Create database
CREATE DATABASE provider_contract_anchor;
```

### 3. Setup Backend (Flask)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials
```

**Configure `backend/.env`:**
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/provider_contract_anchor
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-here
```

**Start the backend:**
```bash
python app.py
# Running on http://127.0.0.1:5001
```

### 4. Setup Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local if needed
```

**Configure `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

**Start the frontend:**
```bash
npm run dev
# Running on http://localhost:3000
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
pdf-ai-anchor/
├── frontend/                 # Next.js 14+ App
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   │   ├── layout/      # Sidebar, Header
│   │   │   ├── sections/    # Dashboard, Mapper, AutoFill, etc.
│   │   │   ├── modals/      # Modal dialogs
│   │   │   ├── pdf/         # PDF components
│   │   │   └── ui/          # UI primitives
│   │   ├── stores/          # Zustand state
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities & API
│   │   └── types/           # TypeScript types
│   ├── IMPLEMENTATION_STEPS.md
│   └── FUTURE_PLANS.md
│
├── backend/                  # Flask API
│   ├── models/              # SQLAlchemy models
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── uploads/             # PDF storage
│   ├── app.py               # Main application
│   ├── requirements.txt
│   └── AUTOFILL_AND_BACKEND_IMPLEMENTATION_STEPS.md
│
└── README.md
```

---

## 🔌 API Endpoints

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List all providers with PDFs |
| POST | `/api/providers` | Create provider |
| PUT | `/api/providers/:id` | Update provider |
| DELETE | `/api/providers/:id` | Delete provider |

### PDFs (Multiple per Provider)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/pdfs` | List all PDFs for provider |
| POST | `/api/providers/:id/pdfs` | Upload new PDF |
| GET | `/api/pdfs/:id` | Download PDF |
| GET | `/api/pdfs/:id/info` | Get PDF metadata |
| DELETE | `/api/pdfs/:id` | Delete PDF |

### Anchors (Belong to PDFs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pdfs/:id/anchors` | List anchors for PDF |
| POST | `/api/pdfs/:id/anchors` | Create anchor |
| PUT | `/api/anchors/:id` | Update anchor |
| DELETE | `/api/anchors/:id` | Delete anchor |

### Auto-Fill
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autofill` | Process PDF with anchors |

**Auto-Fill Parameters:**
- `pdf` - File to process
- `anchors` - JSON array of anchor settings
- `preview` - `true` for red text, `false` for white text

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **PDF.js** - PDF rendering
- **Lucide React** - Icons
- **mammoth.js** - Word to HTML (for converter)
- **html2pdf.js** - HTML to PDF (for converter)

### Backend
- **Flask** - Python web framework
- **Flask-SQLAlchemy** - ORM
- **PyMuPDF (fitz)** - PDF manipulation
- **PyMySQL** - MySQL connector
- **Flask-CORS** - Cross-origin requests

### Database
- **MySQL 8.0** / MariaDB

---

## 📋 Database Schema

```sql
-- Providers table
CREATE TABLE providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Provider PDFs table (multiple per provider)
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

-- Anchor settings table (belong to PDFs)
CREATE TABLE anchor_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pdf_id INT NOT NULL,
    text VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    page VARCHAR(50) DEFAULT '1',
    canvas_width INT,
    canvas_height INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pdf_id) REFERENCES provider_pdfs(id) ON DELETE CASCADE
);
```

---

## 🎨 Screenshots

### Dashboard
*Landing page with quick stats and actions*

### Contract Mapper
*Upload PDF and click to place anchor markers*

### Anchor Settings
*View and manage anchor positions with live preview*

### Auto-Fill
*Process PDFs with saved anchor settings (preview/clean modes)*

### Word to PDF Converter
*Client-side document conversion*

---

## 🔧 Development

### Run in Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
gunicorn app:app -b 0.0.0.0:5001
```

---

## 📝 Documentation

- [Frontend Implementation Steps](frontend/IMPLEMENTATION_STEPS.md)
- [Backend Implementation Steps](backend/AUTOFILL_AND_BACKEND_IMPLEMENTATION_STEPS.md)
- [Future Plans & Enhancements](frontend/FUTURE_PLANS.md)

---

## 🆕 Recent Updates

### January 2026
- ✅ **Dashboard** - New default landing page with stats and quick actions
- ✅ **Multiple PDFs per Provider** - Upload different contract templates
- ✅ **Anchors belong to PDFs** - Better data organization
- ✅ **PDF Template Selection** - Choose which PDF to use in Auto-Fill
- ✅ **Word to PDF Converter** - Client-side document conversion
- ✅ **Preview/Clean Modes** - Red text for verification, white for signing
- ✅ **New Icons** - Crosshair logo, Radio icon for providers

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Jommel Hinayon**

- GitHub: [@jommel1998](https://github.com/jommel1998)

---

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [PyMuPDF](https://pymupdf.readthedocs.io/) - PDF manipulation
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Lucide](https://lucide.dev/) - Beautiful icons
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) - Word to HTML
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) - HTML to PDF