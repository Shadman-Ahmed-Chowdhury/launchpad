# Architecture decisions

Short log of decisions and why we made them. Not a full ADR template — keep entries short.

**Rule for Claude/agents:** whenever you make or change an architectural decision
(new service, new library, changed a flow, new background job, new external
integration), add or update an entry here in the same change. Newest entry at the
bottom. Don't delete old entries — mark them superseded instead.

---

## ADR-001: Django + DRF for backend/API

- **Date:** 2026-09-21
- **Status:** Superseded by [ADR-015](#adr-015-laravel-for-backendapi-supersedes-adr-001)
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
- **Status:** Superseded by [ADR-016](#adr-016-mysql-instead-of-postgresql-supersedes-adr-003)
- **Decision:** PostgreSQL for all persistent data.
- **Why:** Client chose it. Strong fit for relational data (products, votes, comments)
  and has full-text search built in, which we can use before reaching for a
  dedicated search engine.

## ADR-004: Redis for cache and real-time

- **Date:** 2026-09-21
- **Status:** Partially superseded by [ADR-019](#adr-019-pusher-instead-of-django-channels-supersedes-the-real-time-portion-of-adr-004)
  — real-time layer only. Redis's caching role (rankings, hot pages) is unchanged.
- **Decision:** Redis for caching (rankings, hot pages) and as the Django Channels
  layer for WebSocket connections.
- **Why:** Client chose it. Brief requires vote counts and the notification bell to
  update live without a page refresh — needs a fast pub/sub layer.

## ADR-005: RabbitMQ + Celery for background jobs

- **Date:** 2026-09-21
- **Status:** Superseded by [ADR-018](#adr-018-redis-backed-laravel-queues-instead-of-rabbitmq--celery-supersedes-adr-005)
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
- **Status:** Superseded by [ADR-017](#adr-017-mysql-fulltext-search-first-supersedes-adr-008)
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
- **Status:** Partially superseded by [ADR-020](#adr-020-laravel-sanctum--socialite-for-auth-amends-the-framework-portion-of-adr-010)
  — framework/mechanism only. The brief requirements below (verify-before-counts,
  hashed passwords, Google OAuth) are unchanged.
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

## ADR-012: Email verification + password reset via an `auth_tokens` table

- **Date:** 2026-10-17
- **Status:** Accepted
- **Decision:** Both flows share one `auth_tokens` table (`kind`: verify_email or
  reset_password) instead of a single `verify_token` column on `users`. Only the
  token's hash is stored, each row has `expires_at`, and `used_at` is set once
  consumed so a link can't be replayed.
- **Why:** A bare column on `users` can't expire, can't be reused for password reset,
  and leaves a live secret sitting in the users table if leaked. A table gives both
  flows expiry and single-use for free, and keeps `users` to profile/auth state only.

## ADR-013: Rankings split into `daily_rankings` (frozen per day) + `period_rankings` (week/month/all-time)

- **Date:** 2026-10-17
- **Status:** Accepted — refines ADR-009, doesn't reverse it
- **Decision:** `daily_rankings` holds one frozen row per product per day (global
  front page only — the brief doesn't ask for a topic-specific daily board).
  `period_rankings` holds weekly/monthly/all-time boards, each optionally scoped to a
  topic (`topic_id` null = global board), built by summing already-frozen
  `daily_rankings` rows — never recomputed from live votes. Score:
  `score = (votes_count - 1) / (hours_since_launch + 2)^1.5`. Order: score desc,
  frozen votes desc, product_id asc.
- **Why:** The single `product_daily_rankings` table mixed two different jobs (the
  permanent daily snapshot, and derived weekly/monthly/all-time boards) behind one
  `period_type`/`period_key` string. Splitting them makes the frozen-day guarantee
  (ADR-009) explicit in the schema and makes it structurally impossible for a
  week/month/all-time board to include an unfinished today.

## ADR-014: Votes are soft-retracted, not hard-deleted

- **Date:** 2026-10-17
- **Status:** Accepted
- **Decision:** Taking back a vote sets `votes.retracted_at` instead of deleting the
  row. The one-vote-per-member-per-product rule becomes a partial unique index on
  `(product_id, user_id)` where `retracted_at is null`.
- **Why:** Brief flags vote manipulation (fake accounts, one person with many logins,
  scripts) as something we need to catch. Deleting a retracted vote throws away the
  exact pattern (rapid vote/retract cycles) an anti-abuse check would need later.

## ADR-015: Laravel for backend/API (supersedes ADR-001)

- **Date:** 2026-10-18
- **Status:** Accepted
- **Decision:** Laravel (PHP) replaces Django + DRF for all backend logic and the API.
  Role-based permissions (visitor/member/founder/reviewer/admin) move to Laravel
  Policies/Gates in place of DRF permission classes.
- **Why:** Team decision to move off Django. Laravel's batteries-included set
  (Eloquent ORM, migrations, queues, Sanctum) still fits a content + moderation heavy
  app the way Django did.

## ADR-016: MySQL instead of PostgreSQL (supersedes ADR-003)

- **Date:** 2026-10-18
- **Status:** Accepted
- **Decision:** MySQL for all persistent data.
- **Why:** Follows from the Laravel move (ADR-015) — MySQL is the Laravel install's
  default. The schema is relational either way; the one Postgres-specific feature it
  used (full-text search) moves to MySQL's own equivalent — see ADR-017.

## ADR-017: MySQL FULLTEXT search first (supersedes ADR-008)

- **Date:** 2026-10-18
- **Status:** Accepted
- **Decision:** Use MySQL `FULLTEXT` indexes (InnoDB) for product search. Revisit with
  Meilisearch/Elasticsearch only if it's not fast enough at scale.
- **Why:** Same reasoning as ADR-008 — brief wants search to "feel instant," but a
  dedicated search engine on day one is more than this scope needs. MySQL `FULLTEXT`
  is the direct equivalent of Postgres `tsvector`/`tsquery` for this.

## ADR-018: Redis-backed Laravel Queues instead of RabbitMQ + Celery (supersedes ADR-005)

- **Date:** 2026-10-18
- **Status:** Accepted
- **Decision:** Laravel's queue system, Redis driver, for email sending, digest
  generation, and export file generation, monitored with Laravel Horizon. Laravel's
  Scheduler (cron-driven `schedule:run`) replaces Celery beat for the daily top-5,
  weekly best-of, and launch-reminder jobs.
- **Why:** Laravel has no native RabbitMQ driver (would need a third-party package);
  Redis is already in the stack for caching, and Laravel Queue + Horizon gives
  retries and monitoring without adding another broker to operate. Trade-off: a Redis
  queue isn't disk-durable the way RabbitMQ is — acceptable because Redis persistence
  (AOF) plus Horizon's retry-on-failure still covers an hour-long email-provider
  outage, and jobs that exhaust retries land in `failed_jobs` for manual replay
  instead of being silently dropped.

## ADR-019: Pusher instead of Django Channels (supersedes the real-time portion of ADR-004)

- **Date:** 2026-10-18
- **Status:** Accepted
- **Decision:** Pusher (hosted WebSocket service) + Laravel's broadcasting system for
  live vote counts and the notification bell. Redis keeps its caching role (rankings,
  hot pages) from ADR-004 unchanged.
- **Why:** Laravel has no built-in equivalent to Django Channels. Pusher is Laravel's
  standard hosted broadcasting driver and needs no self-hosted WebSocket server to
  operate — simplest path to the same "update live, no page refresh" requirement.

## ADR-020: Laravel Sanctum + Socialite for auth (amends the framework portion of ADR-010)

- **Date:** 2026-10-18
- **Status:** Accepted
- **Decision:** Email+password (hashed with Laravel's default bcrypt hasher) or
  Google OAuth (via Laravel Socialite) to sign up. Laravel Sanctum issues the API
  tokens the Next.js frontend uses. A vote or comment only counts once the email is
  verified — unchanged from ADR-010.
- **Why:** Framework swap only — the brief's requirements (verified email before a
  vote/comment counts, hashed passwords, Google OAuth, rate-limiting + audit logging
  as the other anti-abuse layers) don't change. Sanctum + Socialite are Laravel's
  standard tools for the same job Django sessions/JWT + django-allauth did.

## ADR-021: Google sign-in is a single token-exchange endpoint, not a server redirect (refines ADR-020)

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decision:** One endpoint, `POST /api/auth/google`, takes an OAuth2 **access token**
  the Next.js frontend already obtained from Google's own client-side SDK. The backend
  verifies it by calling `Socialite::driver('google')->stateless()->userFromToken()`
  (which hits Google's userinfo API), then finds-or-creates the user by `google_id` and
  returns a Sanctum token — no server-side redirect/callback pair, no shared session
  between frontend and backend.
- **Why:** Frontend and backend are separate apps (and a native mobile app is planned
  for next year per the brief) — a classic Socialite redirect flow needs session/state
  shared across domains, which doesn't fit either. A single token-exchange endpoint
  works the same way for a web SPA and a future mobile app. Using an OAuth access token
  (not Google Identity Services' JWT `id_token`) keeps this on Socialite as already
  decided in ADR-020, instead of adding a separate JWT-verification dependency.

## ADR-022: One success/error envelope for every API response

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decision:** Every endpoint responds in one of these shapes:
  - Success: `{"data": ..., "message": ...}` — `data` holds the payload (a Resource,
    a list, or `null` for an action with nothing to return), `message` is `null`
    unless there's a human-readable note (e.g. "Password reset."). List endpoints get
    pagination `meta`/`links` for free from Laravel's `AnonymousResourceCollection`
    (`UserResource::collection($paginator)`) — no extra work needed there.
  - Validation error (422): `{"message": "...", "errors": {"field": ["..."]}}` —
    Laravel's default `ValidationException` shape, unchanged.
  - Any other error (401/403/404/429/500): `{"message": "..."}` — Laravel's default
    exception JSON, unchanged.
  Controllers build the success shape with a `respond($data, $message, $status)`
  helper on the base `Controller` — not by hand-rolling `response()->json([...])`.
- **Why:** Without a shared helper, early endpoints (register/login/profile) each
  picked their own top-level keys (`user`, `token`, `message`) — fine alone, but it
  means the frontend's API client can't treat every response the same way. One
  envelope, defined once on the base controller, costs nothing extra per endpoint and
  keeps every future controller consistent by default. The error shapes need no
  custom exception handling at all — they're already Laravel's defaults.

## ADR-023: Frontend holds the Sanctum token in an httpOnly cookie, set by Server Actions

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decision:** Next.js Server Actions (`src/app/actions/auth.ts`) are the only code
  that calls the auth endpoints for mutations (register, login, logout, forgot/reset
  password, verify/resend email, change password). On success they write the Sanctum
  plain-text token to an httpOnly, `secure` (in production), `sameSite: lax` cookie
  (`src/lib/session.ts`) — the token never reaches client-side JS. Reads go through a
  small DAL (`src/lib/auth.ts`'s `getCurrentUser()`), which sends the cookie's token as
  a Bearer header to `GET /api/me` and is memoized per request with React's `cache()`.
  `requireUser()` wraps it for pages that need a signed-in member and redirects to
  `/login?next=<path>` otherwise. No Next.js API routes (`route.ts`) were added — the
  Server Actions call the Laravel API directly, so there's no second REST surface to
  keep in sync with the backend's.
  Route protection is done per-page (`/dashboard`, `/settings` each call
  `requireUser()`) rather than in `proxy.ts` (Next 16's renamed `middleware.js`) —
  with only two protected routes today, a project-wide proxy is more than the current
  scope needs; the Next.js auth guide calls per-route DAL checks sufficient on their
  own and proxy-level checks strictly optional.
- **Why:** ADR-021 already ruled out a shared session between frontend and backend, so
  there's no cookie Laravel itself can read — the frontend's cookie is purely a Next.js
  session concern, sent back to Laravel as a Bearer token on every request. httpOnly
  keeps the token out of reach of an XSS payload (the brief's security section calls
  out hardening the auth surface), and Server Actions mean forms post straight to
  server-side code without a client-side fetch layer or a parallel set of Next API
  routes just to proxy requests.

## ADR-024: Products CRUD API ships ahead of the review/launch workflow and the vote-casting endpoint

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decision:** `/api/products` (index/show public, store/update/destroy behind
  `auth:sanctum`) is the first slice of the Products domain. It intentionally does not
  implement: reviewer approval, launch-day scheduling, the per-day launch-slot limit,
  or a vote-casting/retraction endpoint — `store` always creates a `draft`, `update`
  only allows editing after launch per `docs/02-features.md` (description/website_url),
  and vote counts come only from rows a seeder inserts directly. `index` orders by raw
  `votes_count` (via `withCount('votes')`), not the ADR-009/013 decay score — there's no
  ranking job yet to produce that. The `votes` table's unique index on
  `(product_id, user_id)` is a plain unique, not the partial/retract-aware unique
  ADR-014 describes, since nothing retracts a vote yet.
- **Why:** The frontend needed real products with real vote counts to replace its
  static JSON fixture now. Building the full review/scheduling/ranking/voting
  machinery in the same change would be far more than that need requires (see
  AGENTS.md: "don't add features... the current task doesn't need"). Each deferred
  piece is a separate, already-scoped feature (reviewer queue, launch scheduling,
  ADR-009/013 ranking, member voting) that can land as its own change without
  reshaping what's built here — `status`, `retracted_at`, and the resource shape are
  already in place for them.

## ADR-025: Submit-for-review + reviewer approve/reject/changes-requested flow

- **Date:** 2026-10-31
- **Status:** Accepted
- **Decision:** Builds the review half of ADR-024's deferral list.
  - A founder submits a `draft` (or resubmits a `changes_requested` product) via
    `POST /api/products/{slug}/submit`, which sets `status = pending_review` and a
    new `submitted_at` timestamp (used to order the queue — `created_at` is
    draft-creation time, not submission time).
  - A new `ProductReviewController` under `/api/reviewer/products` gives
    reviewers/admins the queue (`GET`, oldest `submitted_at` first) and three
    decisions (`approve`, `reject`, `requestChanges`), each writing an immutable
    `product_reviews` row (reviewer, action, notes) and an `audit_logs` row in one
    transaction — both tables were already drafted in `docs/04-db-diagram.md` but
    unbuilt until now.
  - Status machine: `pending_review` → `approved` | `rejected` | `changes_requested`.
    `changes_requested` lets the founder edit and resubmit (back to
    `pending_review`); `rejected` is terminal — only "send back for changes" in the
    brief implies a resubmission loop. A founder can't edit while `pending_review`
    (new `ProductPolicy::update()` check), so a reviewer never reviews a moving
    target.
  - Role checks are plain `User::isReviewer()`/`isAdmin()`/`isStaff()` helpers plus
    new `ProductPolicy` abilities (`submit`, `reviewAny`, `review`) — no new
    middleware, same Policy-per-action pattern `update`/`delete` already used.
  - The founder sees the outcome via a `latest_review` field added to
    `ProductResource` (action + notes), visible only to the founder or staff — not
    a real notification.
- **Why:** ADR-024 explicitly deferred this; the brief requires every submission to
  be reviewed before anything else can happen to it (launch scheduling, the front
  page). Deliberately **out of scope** here: email/in-site notifications (no
  notification infrastructure exists yet — building it now would be far more than
  this slice needs; the dashboard's `latest_review` field covers "the founder is
  told the outcome" well enough until that infrastructure lands) and launch-day
  scheduling (what a founder does with an `approved` product — still ADR-024's
  deferral, untouched here).

## ADR-026: Admins provision reviewer accounts directly — no self-promotion path

- **Date:** 2026-10-31
- **Status:** Accepted
- **Decision:** `POST /api/admin/reviewers` (admin-only, gated by a new
  `UserPolicy::manageReviewers()` ability) creates a brand-new `User` with
  `role = 'reviewer'` directly — same shape as `RegisterController` (first/last
  name, email, password), but the admin sets the initial password and the
  account is created with `email_verified_at` already set, skipping the public
  email-verification flow (ADR-010) since the admin is vouching for the account.
  `GET /api/admin/reviewers` lists existing reviewers. Both actions are
  audit-logged (`create_reviewer`) per ADR-011. `role` stays out of `User`'s
  `#[Fillable]` list, same as before — the new user is built with `forceFill()`
  inside the controller, not by loosening mass-assignment guarding.
  Frontend: `/staff/reviewers` (admin-only via a new `requireAdmin()` helper,
  same 404-not-redirect pattern as `requireStaff()`) lists reviewers and has a
  create form; linked from `/staff` only when `role === "admin"`.
- **Why:** There's no public signup path to the reviewer role (nor should there
  be — reviewers are internal staff), and no "promote an existing member"
  listing/search feature exists or was asked for. Creating the account directly
  is the smallest change that lets an admin actually produce a reviewer login
  through the app instead of a one-off `tinker`/seeder call — the gap this ADR
  closes is that ADR-025 added `isStaff()`/`isReviewer()` checks everywhere but
  never gave anyone a way to become a reviewer in the first place.

## ADR-027: Launch-day scheduling as its own endpoint, with a per-day slot cap

- **Date:** 2026-11-04
- **Status:** Accepted
- **Decision:** Builds the launch-scheduling half of ADR-024's deferral list.
  `POST /api/products/{slug}/schedule` (`ProductController::scheduleLaunch()`)
  lets a founder set/change `launch_date` on their own product. New
  `ProductPolicy::schedule()` only allows this while `status` is `approved`
  or `scheduled` — not before approval, not once `launched`. A new
  `ScheduleProductRequest` validates `launch_date` is a real, non-past date,
  and its `after()` hook rejects the date if the number of other products
  already `scheduled`/`launched` on it has reached `config('launchpad.max_
  launches_per_day')` (default 2, env `LAUNCH_SLOTS_PER_DAY` — see
  docs/01-client-brief.md "two to start with"). On success the product's
  `status` moves to `scheduled` — the first time anything in the codebase
  actually writes that status.
- **Why:** Kept separate from the generic `PATCH /api/products/{slug}`
  (`update()`/`UpdateProductRequest`) instead of adding `launch_date` to that
  endpoint's rules — picking a launch day is its own action with its own
  status transition and its own cross-record cap check, the same reasoning
  ADR-025 used to give submit/approve/reject their own endpoints rather than
  folding them into `update()`. The slot-cap check lives in the Form
  Request's `after()` hook rather than the controller, matching how
  `UpdateProfileRequest`/other requests already express cross-field/DB-
  dependent rules, and keeps the error on the standard ADR-022 validation
  envelope (`{"errors": {"launch_date": [...]}}`) instead of a one-off shape.

## ADR-028: Admin member suspend/unsuspend, and reviewer edit/revoke (not delete)

- **Date:** 2026-11-04
- **Status:** Accepted
- **Decision:** Two small additions to staff account management, both
  audit-logged per ADR-011:
  - `GET /api/admin/users` lists plain members (`UserController::index()`,
    gated by new `UserPolicy::manageMembers()`); `POST .../suspend` and
    `.../unsuspend` flip `is_suspended` (gated by new `UserPolicy::suspend()`,
    which refuses a target that `isStaff()` or is the admin themselves).
    `is_suspended` stays outside `User`'s `#[Fillable]` allowlist (same as
    `role`), so both actions write it with `forceFill()`, not a mass-assigned
    `update()`.
  - `ReviewerController::update()`/`destroy()` complete the reviewer CRUD
    ADR-026 only took to create+list. `destroy()` **revokes** reviewer
    access by setting `role` back to `member` — it does not delete the
    `User` row.
- **Why:** `is_suspended` and the `suspended()` factory state already
  existed (docs/02-features.md's "can suspend a member" was already
  scoped), just with no API/UI to reach them — this closes that gap, the
  same shape of gap ADR-026 closed for reviewer creation. Hard-deleting a
  reviewer would either cascade-delete or orphan their `product_reviews`
  and `audit_logs` rows (`reviewer_id`/`actor_id` FKs) — exactly what the
  brief's "a record of every action our staff took... we will be asked
  about this" rules out. Reverting `role` to `member` keeps that history
  attached to a real account while removing their staff access, the same
  soft-removal instinct behind `votes.retracted_at` (ADR-014) and
  `is_suspended` itself rather than a hard delete.
