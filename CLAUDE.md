# CLAUDE.md

This project follows [`AGENTS.md`](AGENTS.md) — read that first for stack, conventions,
and coding rules. This file only holds Claude-specific behavior.

## Always do this

- **After any change that affects architecture** (new service, new library, changed a
  flow, new background job, new external integration) — add or update an entry in
  [`docs/03-architecture-decisions.md`](docs/03-architecture-decisions.md) in the same
  turn. Don't wait to be asked.
- **After any schema change** — update [`docs/04-db-diagram.md`](docs/04-db-diagram.md)
  (DBML) to match.
- **After any scope change** (feature added/removed/changed) — update
  [`docs/02-features.md`](docs/02-features.md).
- Before starting non-trivial work, check `docs/02-features.md` and
  `docs/03-architecture-decisions.md` so new work fits what's already decided instead
  of contradicting it.

## Source of truth, in order

1. [`docs/01-client-brief.md`](docs/01-client-brief.md) — what the client asked for
2. [`docs/02-features.md`](docs/02-features.md) — features by role, current scope
3. [`docs/03-architecture-decisions.md`](docs/03-architecture-decisions.md) — why the system is built this way
4. [`docs/04-db-diagram.md`](docs/04-db-diagram.md) — current schema

If code and docs disagree, treat it as a bug — fix whichever is wrong, don't just pick one.

## Working style for this repo

- Keep language simple and answers short — this repo's docs are written in plain,
  low-word-count bullets on purpose. Match that style in docs, PR descriptions, and
  explanations.
- Don't scaffold backend/frontend boilerplate speculatively — build what the current
  task needs.
- Everything else (formatting, testing, security rules, commit style) is in
  [`AGENTS.md`](AGENTS.md).
