# Ahoum — Development README

Quick setup and run notes for local development.

Clone

```bash
git clone <repo-url> ~/Desktop/ahoum
cd ~/Desktop/ahoum
```

Prerequisites

- Git
- Docker & Docker Compose
- Python and node

Environment variables

Backend (create `backend/.env` or set environment variables):

```env
SECRET_KEY=replace-me
DEBUG=False
# Postgres
DB_NAME=sessions_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
# OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
# MinIO
USE_MINIO=True
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=ahoum-media
MINIO_INTERNAL_ENDPOINT=http://minio:9000
MINIO_PUBLIC_ENDPOINT=http://localhost/media
SEED_DEMO_DATA=1
```

Frontend (create `frontend/.env`):

```env
VITE_API_URL=http://localhost/api
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

Docker

Build and run all services:

```bash
sudo docker compose up --build
```

Stop all services:

```bash
sudo docker compose down
```

Notes

- nginx is exposed on port 80. If that port is in use, stop the occupying service or change the compose ports.
- MinIO console is available internally at container port 9001; the setup proxies only `/media/` for browser access.
- On startup, the backend seeds 2 demo creators and 6 demo sessions by default. Set `SEED_DEMO_DATA=0` in `backend/.env` to disable that.

OAuth client setup (GitHub)

1. Go to GitHub Developer Settings -> OAuth Apps -> New OAuth App.
2. Application name: Ahoum (or whatever).
3. Homepage URL: `http://localhost`
4. Authorization callback URL: `http://localhost/login`
5. Save and copy the Client ID and Client Secret into `backend/.env` (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).
   Also put the client id into `frontend/.env` as `VITE_GITHUB_CLIENT_ID`.

Production

- Use a real domain (https). Set `MINIO_PUBLIC_ENDPOINT` to `https://your-domain.com/media` and `VITE_API_URL` to `https://your-domain.com/api`.
- Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in the backend environment.

Example demo flow

1. Open `http://localhost/` in your browser.
2. Click "Continue with GitHub" — GitHub will redirect back to `http://localhost/login?code=...&provider=github`.
3. Frontend exchanges the code with the backend and receives JWTs.
4. Browse the seeded marketplace sessions from the 2 demo creators: `maya_wave` and `leo_afterglow`.
5. Use the frontend UI to create a session (via the app UI which POSTs to `${VITE_API_URL}/sessions/`).
6. Book a session from another user account or via the UI to hit `${VITE_API_URL}/bookings/`.

Role Management

- To change your role between USER (Viewer) and CREATOR, simply re-login via GitHub OAuth and select the desired role during the login flow.

Troubleshooting

- If avatars/media return internal MinIO URLs, ensure `MINIO_PUBLIC_ENDPOINT` is set to `http://localhost/media` and restart the backend.
- If nginx fails to start because port 80 is in use, set a different mapping in `docker-compose.yml`.
