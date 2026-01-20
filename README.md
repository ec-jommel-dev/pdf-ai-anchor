# 📄 EnergyAnchor - PDF Contract Anchor Mapping System

> A full-stack application for mapping anchor coordinates on PDF contracts for automated text placement. Built with **Next.js 14+**, **Flask**, and **PyMuPDF**.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![Flask](https://img.shields.io/badge/Flask-3.0-green?style=flat-square&logo=flask)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.9+-yellow?style=flat-square&logo=python)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)

---

## ✨ Features

### Contract Mapper
- 📤 Upload PDF contracts and assign to providers
- 🖱️ Click-to-place anchor markers on PDF pages
- 🔍 Live preview with zoom controls
- 📍 Precise coordinate capture for text placement

### Anchor Settings
- ✏️ Edit anchors with real-time PDF preview
- 🎯 Click on preview to adjust coordinates
- 🔎 Zoom in/out for precision (50% - 250%)
- 📄 Page settings: Global, Last Page, or Specific Pages

### Auto-Fill
- ⚡ Automatically place anchor text on PDFs
- 👁️ **Preview Mode** - Red text to verify positions
- 📥 **Clean Download** - White text for signing
- 🔄 Batch processing ready

### Provider Management
- ➕ Create, edit, and manage energy providers
- 🏷️ Active/Inactive status management
- 📋 Anchor settings per provider

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
│   │   │   ├── sections/    # Main sections
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
| GET | `/api/providers` | List all providers |
| POST | `/api/providers` | Create provider |
| PUT | `/api/providers/:id` | Update provider |
| DELETE | `/api/providers/:id` | Delete provider |

### Anchors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/anchors` | List anchors |
| POST | `/api/providers/:id/anchors` | Create anchor |
| PUT | `/api/anchors/:id` | Update anchor |
| DELETE | `/api/anchors/:id` | Delete anchor |

### PDF
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/providers/:id/pdf` | Upload PDF |
| GET | `/api/providers/:id/pdf` | Download PDF |
| GET | `/api/providers/:id/pdf/info` | Get PDF info |

### Auto-Fill
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autofill` | Process PDF with anchors |

---

## 🎨 Screenshots

### Contract Mapper
*Upload PDF and click to place anchor markers*

### Anchor Settings
*View and manage anchor positions with live preview*

### Auto-Fill
*Process PDFs with saved anchor settings*

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **PDF.js** - PDF rendering
- **Lucide React** - Icons

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

-- Anchor settings table
CREATE TABLE anchor_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    text VARCHAR(255) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    page VARCHAR(50) DEFAULT '1',
    canvas_width INT,
    canvas_height INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Provider PDFs table
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
