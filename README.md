# Web Blog

Workspace scaffold for a split frontend and backend application.

## Apps

- `apps/frontend`: Vite + TypeScript + HTMX + Tailwind CSS
- `apps/backend`: Express + Mongoose + TypeScript

## Scripts

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build`
- `npm run check`

## Notes

- Frontend is ready to start immediately.
- Backend includes database and environment wiring, but uses a safe optional MongoDB connection so the server can boot before a database is configured.
- Handlebars is not installed yet. If you decide to render server-side templates later, it can be added cleanly to the backend without changing the workspace layout.
