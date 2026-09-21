# Agent instructions — Launchpad

Conventions for any coding agent (Claude, Copilot, Cursor, etc.) working in this repo.
Claude-specific notes are in [`CLAUDE.md`](CLAUDE.md), which points back here.

## Read first

- [`docs/01-client-brief.md`](docs/01-client-brief.md) – what we're building, in the client's words
- [`docs/02-features.md`](docs/02-features.md) – features per user role
- [`docs/03-architecture-decisions.md`](docs/03-architecture-decisions.md) – why things are built the way they are
- [`docs/04-db-diagram.md`](docs/04-db-diagram.md) – database schema (DBML)

## Project shape

- `launchpad-backend/` – Django + Django REST Framework
- `launchpad-frontend/` – Next.js (TypeScript)
- Postgres for data, Redis for cache/real-time, RabbitMQ + Celery for background jobs

## General rules

- Keep changes small and focused. One task, one PR.
- Don't add features, config, or abstractions the current task doesn't need.
- Match existing patterns in the file you're editing before inventing a new one.
- No secrets in code or commits. Use `.env` files (never committed) and a documented `.env.example`.
- Every model field, endpoint, or role check should trace back to something in `docs/02-features.md` or the client brief. If it doesn't, ask first.

## Backend (Django)

- One Django app per domain area (e.g. `products`, `votes`, `comments`, `accounts`, `notifications`) — not one giant `core` app.
- Use DRF serializers + viewsets/generic views. Keep business logic out of views — put it in services/model methods.
- All list endpoints are paginated.
- Permissions are explicit per view (visitor/member/founder/reviewer/admin) — never rely on the frontend to hide something.
- Migrations are committed with the code that needs them. Never hand-edit a migration that's already been applied on a shared branch.
- Background/slow work (email, digest generation, export files) goes through Celery — never block a request on it.
- Format/lint with `black`, `isort`, `ruff` (or `flake8`). Tests with `pytest` + `pytest-django`.
- New env var → add it to `.env.example` with a one-line comment.

## Frontend (Next.js)

- TypeScript everywhere, no untyped `any` unless there's a real reason.
- App Router. Server components by default; `"use client"` only where interactivity is needed.
- One typed API client layer — pages/components don't call `fetch` directly against raw URLs.
- Match role-based UI to the backend permissions (visitor/member/founder/reviewer/admin) — don't render actions a role can't use.
- Format/lint with `Prettier` + `ESLint`.
- Mobile-first CSS. The brief requires the site to work well on a phone.

## Security (the brief calls this out explicitly)

- Hash passwords properly (Django's default hasher is fine — don't roll your own).
- Email must be verified before a member's vote/comment counts.
- Rate-limit voting, signup, and login endpoints — the brief expects vote manipulation attempts.
- Every staff action (approve, reject, suspend, feature, take down) writes to the audit log. No exceptions.
- File uploads (logos, screenshots, avatars) are validated by type/size and served from S3, not the app server.

## Docs upkeep

- Changed the schema? Update `docs/04-db-diagram.md` in the same change.
- Changed scope (added/removed a feature)? Update `docs/02-features.md`.
- Made or changed an architectural decision (new service, new library, changed a flow)? Add/update an entry in `docs/03-architecture-decisions.md`.

## Commits

- Small, present-tense commit messages (`add vote endpoint`, not `added` / `adds`).
- Don't bundle unrelated changes in one commit.
