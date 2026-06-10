# 🛡️ HalShield — LLM Hallucination Detection & RAG-Based Fact Verification

<div align="center">

**AI-powered platform that detects hallucinations in Large Language Model responses using NLI, RAG, and semantic evidence verification.**

![Version](https://img.shields.io/badge/version-2.0.0-7c5cfc?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-06b6d4?style=flat-square)
![Python](https://img.shields.io/badge/python-3.11+-22c55e?style=flat-square)
![React](https://img.shields.io/badge/react-19-61dafb?style=flat-square)

</div>

---

## 📋 Overview

HalShield is a production-quality AI platform designed to detect hallucinations in LLM-generated text. It combines **Natural Language Inference (NLI)** with **Retrieval-Augmented Generation (RAG)** to verify claims against reference documents and knowledge bases.

### Key Features

- 🧠 **NLI-based Detection** — DeBERTa-v3 cross-encoder for entailment/contradiction classification
- 📄 **RAG Pipeline** — Upload documents, chunk text, generate embeddings, and retrieve evidence via FAISS
- 🎯 **Claim-level Verification** — Each sentence is individually analyzed and color-coded
- ✏️ **Auto-Correction** — Generates evidence-based corrections for hallucinated claims
- 📊 **Analytics Dashboard** — Track history, model usage, and risk trends
- 🔐 **JWT Authentication** — Secure user accounts and analysis history
- 🎨 **Premium UI** — Dark AI-themed interface with glassmorphism and animations

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React UI  │────▶│   FastAPI Backend │────▶│  NLI Service    │
│  (Vite)     │     │   (JWT Auth)      │     │  (DeBERTa-v3)   │
│  Tailwind   │     │                   │     └─────────────────┘
│  Framer     │     │   ┌────────────┐  │     ┌─────────────────┐
│  Motion     │     │   │ RAG Service│──│────▶│  FAISS Vector   │
└─────────────┘     │   └────────────┘  │     │  Store           │
                    │   ┌────────────┐  │     └─────────────────┘
                    │   │ SQLite DB  │  │     ┌─────────────────┐
                    │   └────────────┘  │     │  Sentence        │
                    └──────────────────┘     │  Transformers    │
                                             └─────────────────┘
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Frontend   | React 19, Tailwind CSS v4, Framer Motion, Recharts |
| Backend    | FastAPI, Python 3.11                               |
| AI / NLP   | DeBERTa-v3 (NLI), Sentence Transformers, FAISS     |
| Database   | SQLite + SQLAlchemy                                |
| Auth       | JWT (python-jose + bcrypt)                         |
| Deployment | Docker, Docker Compose                             |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **pip** and **npm**

### 1. Clone & Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
python -c "import nltk; nltk.download('punkt_tab')"
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings (defaults work for local dev)
```

### 3. Start Backend

```bash
uvicorn main:app --reload --port 8000
```

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open Browser

Navigate to **http://localhost:5173** — you'll see the HalShield login page.

---

## 📡 API Endpoints

| Method | Endpoint              | Auth | Description                |
| ------ | --------------------- | ---- | -------------------------- |
| POST   | `/api/register`       | ❌   | Create new user            |
| POST   | `/api/login`          | ❌   | Login & get JWT token      |
| POST   | `/api/analyze`        | ✅   | Run hallucination analysis |
| POST   | `/api/upload-document`| ✅   | Upload PDF for RAG         |
| GET    | `/api/history`        | ✅   | User's analysis history    |
| GET    | `/api/dashboard-data` | ✅   | Dashboard analytics        |
| GET    | `/health`             | ❌   | System health check        |

---

## 📖 How It Works

1. **User Input** — Enter a question and LLM-generated answer
2. **Document Upload** (optional) — Upload a PDF/TXT for reference
3. **RAG Retrieval** — Documents are chunked, embedded, and indexed in FAISS
4. **Claim Extraction** — Answer is split into individual sentences/claims
5. **NLI Classification** — Each claim is evaluated against evidence using DeBERTa-v3
6. **Scoring** — Claims are classified as Supported (green), Uncertain (yellow), or Hallucinated (red)
7. **Correction** — Evidence-based corrections are generated for hallucinated content

---

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

---

## 📁 Project Structure

```
HalShield/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py             # Configuration management
│   ├── auth/                 # JWT authentication
│   ├── routes/               # API route handlers
│   ├── services/             # AI/ML services (NLI, RAG, correction)
│   ├── rag/                  # RAG pipeline (loader, chunker, embeddings, FAISS)
│   ├── models/               # Pydantic schemas
│   ├── database/             # SQLAlchemy models
│   ├── utils/                # Text processing utilities
│   ├── uploads/              # Uploaded documents
│   └── vectorstore/          # FAISS index files
├── frontend/
│   ├── src/
│   │   ├── pages/            # Login, Main, Result, Dashboard pages
│   │   ├── components/       # Navbar, GlassCard, AnimatedBackground, Loading
│   │   ├── services/         # API client, auth service
│   │   └── hooks/            # State management
│   ├── vite.config.js
│   └── index.html
├── sample_data/              # Sample test documents
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## 🧪 Sample Test Case

**Question:** "Who founded Tesla?"

**LLM Answer (with hallucinations):**
> "Tesla was founded in 2001 by Elon Musk. The company is headquartered in San Francisco."

**Expected Detection:**
- ❌ "Tesla was founded in 2001" → **HALLUCINATED** (founded in 2003)
- ❌ "by Elon Musk" → **HALLUCINATED** (founded by Eberhard & Tarpenning)
- ❌ "headquartered in San Francisco" → **HALLUCINATED** (Austin, Texas)

Upload `sample_data/sample_facts.txt` for evidence-based verification.

---

## 📝 License

MIT License — feel free to use for portfolio, internships, and academic projects.

---

<div align="center">

**Built with ❤️ using FastAPI + React + DeBERTa + FAISS**

</div>
