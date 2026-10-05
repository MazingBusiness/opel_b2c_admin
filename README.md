# OPEL B2C Admin

Basic admin web app scaffold for OPEL B2C (Vite + React 19 + Tailwind 4).

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the Laravel API origin (e.g. `http://127.0.0.1:8000`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port **5174**) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

## Stack

- Vite 8 + React 19 (JSX)
- Tailwind CSS 4 (`@tailwindcss/vite`)
- React Router 7
- Zustand (persisted Sanctum admin session)
- TanStack Query + axios (Bearer from store)

Staff login: `POST /api/v1/admin/auth/login` (email + password). Token persisted in `localStorage` (`opel-admin-auth`).
