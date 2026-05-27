# CV AI Pro

AI-powered CV analysis platform (React + Express).

## Project structure

```
tusul.test/
├── frontend/     # React + Vite UI
├── backend/      # Express API + AI + PDF
│   ├── src/
│   └── data/     # local JSON database (dev)
└── package.json  # npm workspaces
```

## Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (frontend + API on one port).

Environment variables: copy `.env.example` → `backend/.env`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Build frontend to `frontend/dist` |
| `npm run start` | Production (build frontend first) |
| `npm run typecheck` | TypeScript check |

## Main API

- `GET /api/health`
- `POST /api/auth/register` · `POST /api/auth/login`
- `POST /api/career/analyze` (multipart: cvFile + fields)
- `POST /api/career/export-pdf`
- `GET /api/career/history`
