# GhostWatch

Electoral fraud detection system backed by **TigerGraph**. This repository contains:

- **`backend/`** — Python **FastAPI** service: REST API, TigerGraph client, seed scripts, and GSQL under `queries/`.
- **`frontend/`** — **React** (Vite + TypeScript) UI: dashboards, search, and graph visualizations.

## Layout

| Path | Role |
|------|------|
| `backend/main.py` | FastAPI app entrypoint and route registration. |
| `backend/graph_client.py` | TigerGraph connection and query execution. |
| `backend/seed_data.py` | Load demo electoral data into the graph. |
| `backend/queries/schema.gsql` | Graph DDL (vertices, edges, graph definition). |
| `backend/queries/fraud_detection.gsql` | Fraud/anomaly GSQL queries. |
| `frontend/src/App.tsx` | Root React component. |
| `frontend/src/components/*` | UI modules (search, map, charts, graph view, dashboard). |
| `frontend/src/api/tigergraph.ts` | Typed HTTP client to the backend API. |

## Setup (placeholder)

1. Configure `backend/.env` from `backend/.env.example`.
2. Install backend deps and run the API (commands TBD in `main.py`).
3. Install frontend deps and run Vite dev server (see `frontend/package.json`).

Implementation is not filled in yet; see file-level comments for intended behavior.
