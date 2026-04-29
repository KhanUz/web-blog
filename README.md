# Web Blog

Workspace scaffold for a split frontend and backend application.

## Repository

Remote repository:

```bash
https://github.com/KhanUz/web-blog
```

## Installation

### Requirements

- Node.js `>= 20`
- npm
- MongoDB

### Clone and install

```bash
git clone https://github.com/KhanUz/web-blog.git
cd web-blog
npm install
```

### Start MongoDB

If `mongod` is installed locally, you can use the prepared `db/` directory:

```bash
cd apps/backend
npm run db:start
```

MongoDB is expected to run at:

```bash
mongodb://127.0.0.1:27017/web-blog
```

### Run the project

From the project root:

```bash
npm run dev:all
```

Or run frontend and backend separately:

```bash
npm run dev:backend
npm run dev:frontend
```

### Build and type-check

```bash
npm run build
npm run check
```

## Apps

- `apps/frontend`: Vite + TypeScript + HTMX + Tailwind CSS
- `apps/backend`: Express + Mongoose + TypeScript

## Scripts

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run dev:all`
- `npm run build`
- `npm run check`

## Notes

- Frontend is ready to start immediately.
- Backend now includes article, comment, tag, archive, search, and about/profile APIs with Mongoose models and seed data.
- MongoDB is expected to run locally at `mongodb://127.0.0.1:27017/web-blog`.
- A local data directory is prepared at `db/`. If `mongod` is installed, start it from `apps/backend` with `npm run db:start`.
- `npm run dev:all` launches MongoDB, backend, and frontend together, prints the local links, and streams prefixed logs while also writing them to `.logs/`.
- Handlebars is not installed yet. If you decide to render server-side templates later, it can be added cleanly to the backend without changing the workspace layout.
