# Employee Directory

A full-stack employee management app with role-based access control. Admins can create, edit, and delete employees and departments; viewers can browse and search the directory. The interface supports real-time search with debounced API calls, dark/light mode, pagination, and JWT-based authentication with silent token refresh.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS, shadcn/ui |
| Auth | next-auth v5 (JWT strategy, credentials provider) |
| Backend | NestJS 11, Prisma 6 |
| Database | PostgreSQL 16 |

---

## Prerequisites

- Docker & Docker Compose

That's it for running with Docker. For local development without Docker you also need Node.js **v20+** and npm.

---

## Run with Docker (recommended)

```bash
docker-compose up --build
```

This will:
1. Start PostgreSQL and wait until it is healthy
2. Build and start the backend — pushes the schema, seeds the database, then starts the server
3. Build and start the frontend

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |

Log in with one of the seeded accounts:

| Email | Password | Role |
|---|---|---|
| admin@company.com | password | ADMIN |
| viewer@company.com | password | VIEWER |

---

## Local Development (without Docker)

### 1. Start the database

```bash
docker-compose up postgres -d
```

### 2. Configure environment variables

```bash
cp app/server/.env.example app/server/.env
cp app/client/.env.example app/client/.env.local
```

Fill in the values — see [Environment Variables](#environment-variables) below.

### 3. Install dependencies

```bash
cd app/server && npm install
cd ../client && npm install
```

### 4. Set up the database

```bash
cd app/server
npx prisma db push
npm run seed
```

### 5. Start the servers

```bash
# Terminal 1 — backend (http://localhost:3001)
cd app/server && npm run start:dev

# Terminal 2 — frontend (http://localhost:3000)
cd app/client && npm run dev
```

---

## Environment Variables

### Backend — `app/server/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb?schema=public
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m

REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=7d
```

### Frontend — `app/client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
API_URL=http://localhost:3001/api

AUTH_SECRET=your-nextauth-secret
AUTH_URL=http://localhost:3000
```

> Generate secrets with: `openssl rand -base64 32`

---

## Database

```bash
# Push schema changes
cd app/server && npx prisma db push

# Seed departments, employees, and users
npm run seed

# Open Prisma Studio (optional)
npx prisma studio
```

---

## Architectural Decisions

**Two JWT tokens** — Access token expires in 15 minutes; a refresh token (7 days) is stored server-side in the next-auth encrypted session cookie. The Axios 401 interceptor calls `getSession()` which triggers the next-auth JWT callback server-side, refreshes the token transparently, and retries the original request. This avoids exposing the refresh token to client-side JavaScript.

**RBAC at the controller level** — A custom `RolesGuard` + `@Roles('ADMIN')` decorator protects write endpoints. Viewers can only `GET`.

**Soft delete** — Employees have an `isDeleted` flag and `deletedAt` timestamp. Records are never removed from the database.

**Hybrid search** — Typing immediately filters the already-loaded page client-side. After a 300 ms debounce, the API is called and results are merged into the pool (existing records are never replaced, only new ones appended) to avoid unnecessary re-renders.

**Folder structure** — `app/server` is a standard NestJS monolith. `app/client/src` holds all application code; `app/client/src/api` has service files per resource, keeping fetch logic out of components.

---

## Tests

Integration tests are written in Python (pytest) and live in `test/`. They run against the live API at `http://localhost:3001/api`.

```bash
cd test
pip install -r requirements.txt
pytest -v
```

Covered: auth, employees CRUD + RBAC, departments, and activity log pagination + filtering.

---

## Known Limitations & Next Steps

- **No pagination on departments** — departments are fetched in full; fine for now but would need pagination at scale.
- **No email verification or password reset** — would add before any real deployment.
- **Redis is provisioned but unused** — the next step would be to cache employee list responses and invalidate on mutations.
