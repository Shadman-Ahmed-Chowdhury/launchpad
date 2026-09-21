# Architecture decisions

Short log of decisions and why we made them. Not a full ADR template — keep entries short.

**Rule for Claude/agents:** whenever you make or change an architectural decision
(new service, new library, changed a flow, new background job, new external
integration), add or update an entry here in the same change. Newest entry at the
bottom. Don't delete old entries — mark them superseded instead.

---

## ADR-001: Django + DRF for backend/API

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Django + Django REST Framework for all backend logic and the API.
- **Why:** Client chose it. Batteries-included (auth, admin, ORM, migrations) fits a
  content + moderation heavy app like this one.

## ADR-002: Next.js for frontend

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Next.js (TypeScript, App Router) as the frontend, talking to Django over REST.
- **Why:** Client chose it. Server-side rendering helps SEO for public product pages,
  and the brief wants the site fast and mobile-friendly.

## ADR-003: PostgreSQL as the database

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** PostgreSQL for all persistent data.
- **Why:** Client chose it. Strong fit for relational data (products, votes, comments)
  and has full-text search built in, which we can use before reaching for a
  dedicated search engine.

## ADR-004: Redis for cache and real-time

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Redis for caching (rankings, hot pages) and as the Django Channels
  layer for WebSocket connections.
- **Why:** Client chose it. Brief requires vote counts and the notification bell to
  update live without a page refresh — needs a fast pub/sub layer.

## ADR-005: RabbitMQ + Celery for background jobs

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** RabbitMQ as the task broker, Celery as the worker/scheduler, for all
  email sending, digest generation, and export file generation.
- **Why:** Brief says "if our email provider goes down for an hour, nothing should go
  missing" — that needs a durable queue with retry, not a fire-and-forget request.
  RabbitMQ persists messages to disk and survives a worker or provider outage better
  than an in-memory broker. Celery beat handles the scheduled jobs (daily top-5,
  Monday best-of-week, launch reminders).

## ADR-006: AWS SES for outbound email

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** AWS SES for all transactional and digest email.
- **Why:** Cheap, reliable, integrates with the rest of the AWS stack (S3). Each send
  goes through Celery so an SES outage just delays the retry, doesn't drop the email.

## ADR-007: AWS S3 for file storage

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Product logos, screenshots, and profile photos are stored in S3, not
  on the app server.
- **Why:** App servers are stateless and disposable; files need to survive deploys and
  scale independently of the app.

## ADR-008: Postgres full-text search first

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Use Postgres full-text search (`tsvector`/`tsquery`) for product
  search. Revisit with Meilisearch/Elasticsearch only if it's not fast enough at scale.
- **Why:** Brief wants search to "feel instant," but adding a separate search engine
  on day one is more than this scope needs. Postgres FTS is good enough for the
  expected data size and keeps the stack smaller.

## ADR-009: Ranking uses a decaying score, frozen per day

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Front page rank is by a time-decayed score (like Hacker News' formula:
  votes weighted down as they age), not raw vote count. Once a day ends, that day's
  order is frozen and stored (`product_daily_rankings`), never recalculated again.
- **Why:** Brief is explicit: "twenty votes in the first hour beats thirty across the
  whole day," and "every past day keeps its own page, and the order on it never
  changes again."

## ADR-010: Auth — Django sessions/JWT + Google OAuth, email verification required

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Email+password (hashed with Django's default hasher) or Google OAuth
  to sign up. A vote or comment only counts once the email is verified.
- **Why:** Brief: "we only want real people voting, so confirm the email address is
  theirs." Also flags vote manipulation (fake accounts, scripted votes) as a real risk
  — verification is the first line of defense, rate-limiting and audit logging are the
  others (see AGENTS.md security section).

## ADR-011: Every staff action is audit-logged

- **Date:** 2026-09-21
- **Status:** Accepted
- **Decision:** Approvals, rejections, suspensions, takedowns, and featuring all write
  to an `audit_logs` table (actor, action, target, timestamp).
- **Why:** Brief: "a record of every action our staff took, with who and when. We will
  be asked about this."
