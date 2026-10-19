# PERN Task Manager

A deliberately small PostgreSQL + Express + React + Node.js app for practising DevOps and CI/CD.
Users register / log in (JWT), then add tasks and mark them completed. No Docker, no cloud resources, no workflows included.

```
pern-task-manager/
  backend/    Express API + pg + schema SQL
  frontend/   React (Vite) app
  deploy/     Example Nginx config
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+

## 1. Database

```bash
sudo -u postgres psql
```
```sql
CREATE USER taskmanager_user WITH PASSWORD 'choose_a_real_password';
CREATE DATABASE taskmanager OWNER taskmanager_user;
\q
```

## 2. Backend

```bash
cd backend
cp .env.example .env        # then edit .env with real values (never commit it)
npm install
npm run migrate             # creates tables if missing; never drops anything
npm run dev                 # development (auto-restart)
# npm start                 # production
npm test                    # backend tests (no database needed)
```

Generate a JWT secret: `openssl rand -hex 32`

### Environment variables (backend/.env)

| Variable | Purpose |
| --- | --- |
| `PORT` | Port the API listens on (default 5000) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `DB_SSL` | `true` if the database needs SSL |
| `JWT_SECRET` | Required. Server refuses to start without it |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma separated |

### API

| Method & path | Auth | Description |
| --- | --- | --- |
| `GET /health` | no | Liveness: backend is running |
| `GET /health/db` | no | Readiness: 200 if DB reachable, 503 otherwise (no credentials exposed) |
| `POST /api/auth/register` | no | `{ email, password }` returns `{ token, user }` |
| `POST /api/auth/login` | no | `{ email, password }` returns `{ token, user }` |
| `GET /api/tasks` | Bearer | List your tasks |
| `POST /api/tasks` | Bearer | `{ title }` creates a task |
| `PATCH /api/tasks/:id` | Bearer | `{ completed: true }` (default) updates a task |

Status codes used: 200, 201, 400 (validation), 401 (auth), 404, 409 (duplicate email), 503 (database down), 500.

Quick check:
```bash
curl localhost:5000/health
curl localhost:5000/health/db
```

## 3. Frontend

```bash
cd frontend
cp .env.example .env        # set VITE_API_BASE_URL (http://localhost:5000 for local dev)
npm install
npm run dev                 # http://localhost:5173
npm test                    # component tests
npm run build               # static files in frontend/dist
```

`VITE_API_BASE_URL` is baked in at build time. In production you can leave it empty so the app calls the same origin, and let Nginx proxy `/api` to the backend. Nothing is hardcoded.

## 4. Deploying (practice ideas)

Serve `frontend/dist` with Nginx using `deploy/nginx.conf.example`:

```bash
cd frontend && npm ci && npm run build
sudo mkdir -p /var/www/task-manager
sudo rsync -a --delete dist/ /var/www/task-manager/
sudo cp ../deploy/nginx.conf.example /etc/nginx/sites-available/task-manager
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Run the backend with `npm ci --omit=dev && npm run migrate && npm start`, ideally under systemd or pm2 with the environment variables set on the server.

Good CI/CD pipeline stages to build yourself: `npm ci` then `npm test` (both folders), `npm run build` (frontend), run `npm run migrate`, deploy, then smoke test `GET /health` and `GET /health/db`.

## Security notes

- Real secrets live only in untracked `.env` files; `.env.example` has placeholders.
- All SQL is parameterized. Passwords are hashed with bcrypt.
- Tasks are scoped per user, so one user cannot read or change another's tasks.
- For real production, serve over HTTPS and consider rate limiting on `/api/auth`.
