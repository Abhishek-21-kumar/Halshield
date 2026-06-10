# HalShield: Deployment & Run Guide

This guide provides detailed instructions on how to run, deploy, and organize the **HalShield — LLM Hallucination Detection & RAG-Based Fact Verification** system.

---

## 1. How to Run the Project (Detailed Guide)

### Option A: Local Development Environment (Running Separately)

Running the project locally gives you hot-reloading for both front-end (Vite) and back-end (FastAPI) development.

#### System Prerequisites
- **Python 3.10 or 3.11** installed.
- **Node.js v18 or v20** installed.
- **Git** (optional, for cloning).

---

#### Step 1: Run the Backend API Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **Windows (PowerShell):**
     ```powershell
     venv\Scripts\activate.ps1
     ```
   - **Linux / macOS:**
     ```bash
     source venv/bin/activate
     ```
4. Install all python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Initialize the NLTK tokenizer models:
   ```bash
   python -c "import nltk; nltk.download('punkt_tab')"
   ```
6. Copy the environment template and set up your variables:
   ```bash
   copy .env.example .env     # Windows cmd
   # OR: cp .env.example .env  # Linux/Mac/PowerShell
   ```
7. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   > **Note:** The API will run at [http://127.0.0.1:8000](http://127.0.0.1:8000). The Swagger docs will be visible at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

#### Step 2: Run the Frontend App

1. In a new command prompt / shell, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Copy/create a `.env` file (optional, as defaults proxy to `http://localhost:8000` via Vite):
   ```bash
   copy .env.example .env     # Windows cmd
   # OR: cp .env.example .env  # Linux/Mac/PowerShell
   ```
4. Start the Vite local server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to [http://localhost:5173](http://localhost:5173).

---

### Option B: Local Docker Development (One-Command Run)

If you don't want to install Python packages or Node.js modules manually, you can run everything inside containerized microservices.

#### Prerequisites
- **Docker Desktop** installed and running on your system.

#### Running Command
1. Open terminal at the root of the `LLM Hallucination Detection` project directory.
2. Run the build and startup command:
   ```bash
   docker-compose up --build
   ```
3. Once starting complete:
   - **Frontend UI** is accessible at: [http://localhost:3000](http://localhost:3000)
   - **Backend API** is accessible at: [http://localhost:8000](http://localhost:8000)
   - **Interactive API Documentation** is at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. How to Deploy the Project (Production Environment)

For production, it is highly recommended to split your frontend and backend hosting. This ensures fast static delivery of user interfaces and scalability for deep-learning NLI inference workloads.

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│   Vercel / Netlify / Cloudflare│       │       Render / AWS / GCP       │
│                                │       │                                │
│       Static Frontend Files    │       │     FastAPI Application        │
│       - HTML, CSS, JS          ├──────▶│     - NLI / SentenceTransformers │
│       - React App Bundle       │ Axios │     - SQLite / Vectorstore DB  │
│                                │       │     - Uploads Dir              │
└────────────────────────────────┘       └────────────────────────────────┘
```

### 1. Backend Production Deployment

Since the backend downloads large PyTorch model weights (DeBERTa NLI and SentenceTransformers) and uses FAISS/SQLite (local files), you need a VPS, container host, or specialized backend host.

#### Option A: Deploying on Render (Free / Paid tier container platform)
1. **GitHub Repository**: Push your code to a GitHub repository.
2. **Create Render Web Service**:
   - Go to Render dashboard and select **New + -> Web Service**.
   - Connect your GitHub repository.
3. **Configure Service Details**:
   - **Name**: `halshield-backend`
   - **Environment**: `Docker`
   - **Docker Path**: `./Dockerfile.backend` (or leave default if directory is root)
   - **Instance Type**: Select at least the **Starter** or **Standard** tier (NLI models require ~2GB of RAM to initialize and run comfortably without crashing due to Out-Of-Memory limits).
4. **Environment Variables**: Add key-value pairs:
   - `JWT_SECRET_KEY` = `[YOUR_RANDOM_SECURE_PHRASE]`
   - `NLI_MODEL` = `cross-encoder/nli-deberta-v3-base` (or similar NLI model)
   - `PORT` = `8000`
5. **Disk Storage**: Render containers have ephemeral disks. If you want user uploads and FAISS index files to persist across deployments:
   - Add a **Render Disk** mounted at `/app/uploads` and `/app/vectorstore`.

#### Option B: Deploying on AWS EC2 (Virtual Private Server)
1. Launch an EC2 Instance (Ubuntu Server LTS, standard `t3.medium` recommended for RAM).
2. Install Docker & Docker Compose:
   ```bash
   sudo apt-get update
   sudo apt-get install docker.io docker-compose -y
   ```
3. Clone your repository onto the EC2 host.
4. Set up security groups to open ports:
   - Port `80` (HTTP) / `443` (HTTPS)
   - Port `8000` (FastAPI)
5. Run the containers in background daemon mode:
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

---

### 2. Frontend Production Deployment

Because React outputs compiled static assets (HTML/CSS/JS), it can be deployed on high-performance CDN platforms for **free**.

#### Option A: Deploying on Vercel
1. Install Vercel CLI globally or use the Vercel Git integration:
   - Go to [Vercel Dashboard](https://vercel.com).
   - Click **Add New -> Project**. Connect your git repository.
2. **Configure Settings**:
   - **Framework Preset**: `Vite` (or `Other`)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - Add a variable `VITE_API_BASE_URL` pointing to your deployed backend (e.g. `https://halshield-backend.onrender.com`).
4. Click **Deploy**. Vercel will output a live production domain (e.g., `halshield.vercel.app`).

---

## 3. What Code is Deployed Where (Deployment Layout)

The codebase splits responsibilities cleanly between client-side rendering and server-side compute.

### Client-Side (Deployed to Vercel/Netlify CDN)
All code inside the `/frontend` directory is built into optimized static resources.
- **Routing & State (`src/App.jsx`, `src/pages/`)**: Managed strictly within the user's web browser using React Router and local state managers. No server-side rendering (SSR) is performed.
- **Styling (`src/index.css`)**: Tailwind classes compiled into standard CSS stylesheets.
- **API Request Interceptors (`src/services/api.js`)**: Axios Client instantiated in the browser. Emits async HTTP requests to the Backend URL.
- **Authentication Credentials**: JWT tokens returned from the API are saved in the client browser's `localStorage`.

### Server-Side (Deployed to Render Container / AWS VPS)
All code in the `/backend` directory is executed on the python server.
- **API Router Controllers (`main.py`, `routes/`)**: FastAPI application maps incoming requests, decodes HTTP headers, parses JSON request body schemas, and checks authentication headers using python-jose.
- **Claim and Text processing (`utils/text_processing.py`)**: Tokenizes input text paragraphs into lists of clean logical claim statements.
- **Vector database indexing (`services/rag_service.py`)**: Chunked documents are saved in a local **FAISS Index** structure inside `/backend/vectorstore/`.
- **Inference (`services/nli_service.py`)**: Loads the DeBERTa NLI cross-encoder neural network into host CPU/GPU RAM. Calculates entailment, neutral, and contradiction scores on request.
- **System Memory (`halshield.db`)**: A SQLite database file is stored locally on the server volume to keep persistent records of users, password hashes, and analysis runs.
- **Upload Storage (`/backend/uploads/`)**: Holds reference PDF/TXT source files uploaded by users.
