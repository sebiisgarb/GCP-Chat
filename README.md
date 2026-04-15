# Gemini Chat

Full-stack chat application powered by Google Vertex AI (Gemini), with streaming responses and Markdown rendering.

## Tech Stack

- **Backend**: Python + FastAPI, streaming via `StreamingResponse`
- **Frontend**: React 19 + Vite, real-time chunk rendering via `ReadableStream`
- **AI**: Vertex AI SDK (`google-cloud-aiplatform`) — Gemini 2.5 Flash

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A GCP project with Vertex AI API enabled
- Google Cloud CLI authenticated with ADC:

```bash
gcloud auth application-default login
```

---

## Setup & Run (manual)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
```

Start the server:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Setup & Run (Docker Compose)

Requires Docker and Docker Compose.

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

GCP credentials are mounted automatically from `~/.config/gcloud` (ADC).

> Make sure you've run `gcloud auth application-default login` on the host before starting containers.

---

## Environment Variables

| Variable         | Description                        | Example          |
|------------------|------------------------------------|------------------|
| `GCP_PROJECT_ID` | Your GCP project ID                | `my-project-123` |
| `GCP_LOCATION`   | Vertex AI region                   | `us-central1`    |
