# 🎬 Clipr

Turn any X (Twitter) video into a clean, downloadable MP4 clip in seconds.

Paste a link. Pick your timestamps. Get your clip.

No editors. No timelines. No friction.

---

## ✂️ What is this?

**CLipr** is a full-stack tool that lets you extract precise video segments from videos embedded in X/Twitter posts.

Whether it’s:
- a 10-second viral moment  
- a highlight worth saving  
- or just the best part of a long video  

…you can clip it instantly and download it as an MP4.

With longer videos now commonly appearing on X, timelines often include everything from short clips to multi-hour uploads like sports broadcasts or live recordings.

**Clipr** makes it easy to trim exactly what you need from these videos.

Whether you're:
- creating content for reels & shorts  
- saving useful snippets  
- or grabbing that one specific moment from a long video  

…it helps you turn long content into clean, shareable clips in seconds.

---

## Features

- Paste any X/Twitter post URL containing a video
- Set start and end timestamps (seconds or MM:SS format)
- Real-time progress tracking as the clip is processed
- Thumbnail preview generated from the middle of the clip
- Download the finished MP4 clip
- Full clip history with status tracking
- Duplicate submission detection — same URL + timestamps returns the existing clip

---

### Request lifecycle

1. User submits URL + timestamps via the frontend form
2. FastAPI creates a `Clip` and `Job` record in PostgreSQL, then pushes the job ID to Redis
3. The Dramatiq worker picks up the job and runs the processing pipeline
4. The frontend polls `GET /clips/{clip_id}` every 2 seconds to track progress
5. Once the job is `done`, the result card appears with a thumbnail and download button

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | FastAPI, Pydantic, SQLAlchemy, Alembic |
| Database | PostgreSQL 16 |
| Queue | Redis 8, Dramatiq |
| Media | yt-dlp, FFmpeg |
| Language | Python 3.12, Node.js 23 |

---

## Prerequisites

Check whether the following stuff is installed on your machine:

| Tool | Version | Check |
|---|---|---|
| Python | 3.12+ | `python3 --version` |
| Node.js | 20+ | `node --version` |
| PostgreSQL | 16 | `psql --version` |
| Redis | 7+ | `redis-cli --version` |
| FFmpeg | 6+ | `ffmpeg -version` |
| Git | any | `git --version` |

I use a macOS, so Homebrew got it done for me. You can use Pip/UV/docker/whatever you prefer

```bash
brew install postgresql@16 redis ffmpeg
brew services start postgresql@16
brew services start redis
```

Make sure that Redis and Postgres are running in the background at all times. You can change these settings anytime as you wish. 
---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/a1zen77/social_video_clipper.git
cd social_video_clipper
```

### 2. Configure environment variables

Create `.env` and fill in your values — set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `REDIS_URL` with some values.

### 3. Set up the database

```bash
psql postgres
```

```sql
CREATE USER clipper WITH PASSWORD \'clipperpass\';
CREATE DATABASE clipperdb OWNER clipper;
GRANT ALL PRIVILEGES ON DATABASE clipperdb TO clipper;
\\q
```

### 4. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

### 5. Set up the frontend

```bash
cd frontend
npm install
```

---

## Running the app

You need **three terminal tabs** running simultaneously.
Make sure that the virtual environment is activated in all 3 tabs.

**Tab 1 — API server:**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Tab 2 — Worker:**

```bash
cd backend
source .venv/bin/activate
dramatiq app.tasks --processes 1 --threads 1
```

**Tab 3 — Frontend:**

```bash
cd frontend
npm run dev
```

Then open http://localhost:3000 in any browser. Make sure that your can access devtools.

---

## API Reference

The FastAPI backend auto-generates interactive docs at http://localhost:8000/docs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/clips` | Submit a new clip request |
| `GET` | `/clips` | List all clips |
| `GET` | `/clips/{clip_id}` | Get clip details and job status |
| `DELETE` | `/clips/{clip_id}` | Delete a clip |
| `GET` | `/files/clips/{clip_id}` | Download the MP4 clip |
| `GET` | `/files/thumbnails/{clip_id}` | Get the thumbnail image |

### Example request

```bash
curl -X POST http://localhost:8000/clips \\
  -H "Content-Type: application/json" \\
  -d \'{
    "url": "https://x.com/NASA/status/1649816829826940928",
    "start_time": 0,
    "end_time": 10
  }\'
```

### Job status values

| Status | Meaning |
|---|---|
| `pending` | Job is queued, worker has not picked it up yet |
| `processing` | Worker is actively downloading or encoding |
| `done` | Clip is ready to download |
| `failed` | Processing failed — see `error` field for details |

---

## Known Limitations

- **Storage** — clips are stored on the local filesystem. For production, replace with Amazon S3 or similar object storage.
- **No authentication** — all clips are visible to anyone with access to the API. Add auth before deploying publicly.
- **X/Twitter only** — yt-dlp supports many platforms but the URL validator only accepts X/Twitter URLs. This is intentional for 2 reasons: 1]MVP scope and 2] I'm addicted to the Bird app.
- **Single worker** — the worker runs with one process and one thread. YOu can add more dramatiq workers if needed. 
- **No cleanup** — source videos and clips are never automatically deleted. Add a scheduled cleanup job for production.

---

## Skills Demonstrated

- Full-stack development with a modern Python + TypeScript stack
- REST API design with FastAPI and Pydantic validation
- Asynchronous background job processing with Redis and Dramatiq
- Database modelling and migrations with SQLAlchemy and Alembic
- Media processing with yt-dlp and FFmpeg
- Real-time UI updates with TanStack Query polling
- Clean error handling across the full stack