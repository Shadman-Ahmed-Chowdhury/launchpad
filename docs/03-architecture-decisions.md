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

## ADR-029: Vote-casting/retraction endpoint, and ADR-014's partial unique index emulated with a generated column (resolves the deferral in ADR-024/ADR-014)

- **Date:** 2026-11-05
- **Status:** Accepted
- **Decision:** Builds the vote-casting/retraction half of ADR-024's
  deferral list.
  - `POST /api/products/{slug}/votes` (`VoteController::store()`) and
    `DELETE /api/products/{slug}/votes` (`::destroy()`), both behind
    `auth:sanctum` and a new `voting` rate limiter (20/minute per user —
    AGENTS.md flags vote manipulation as an explicit risk). A new
    `ProductPolicy::vote()`/`unvote()` pair gates them: not the founder, the
    product is `launched`, the member's email is verified (ADR-010/020),
    and they don't already have an active vote (for `vote()`) / do have one
    (for `unvote()`).
  - ADR-014 called for "unique among active votes only", but MySQL (ADR-016)
    has no partial/filtered unique index the way Postgres does. Resolved
    with a generated column, `votes.active_user_id`
    (`case when retracted_at is null then user_id else null end`), and a
    unique index on `(product_id, active_user_id)` — a unique index allows
    any number of `NULL`s, so retracted votes (where the generated column is
    `NULL`) never collide, but at most one active vote per member per
    product can exist. Retracting still only sets `retracted_at` (never
    deletes the row, per ADR-014); recasting after a retraction inserts a
    new row rather than reusing the old one, keeping the vote/retract/recast
    pattern intact as a future anti-abuse signal.
  - `votes_count` (wherever `ProductResource` reports it) now counts only
    active votes (`Product::activeVotes()`, `whereNull('retracted_at')`)
    instead of every row ever inserted — without this, retracting a vote
    wouldn't visibly change the count, which is the whole point of "members
    can remove their vote."
  - `ProductResource` gained `voted_by_viewer`, populated only where the
    controller eager-loaded `activeVotes` scoped to the viewer (`index()`,
    `show()`, and the vote endpoints themselves) — true N+1 avoidance
    instead of a per-product query. This also surfaced that
    `isFounderOrStaff`/`latest_review` read `$request->user()` (default
    `web` guard), which never resolves on `index()`/`show()` since neither
    route carries `auth:sanctum` middleware to flip the default guard to
    `sanctum` — fixed alongside this change to `$request->user('sanctum')`,
    the same explicit-guard pattern `ProductController::show()` already used
    for its own optional-auth check.
- **Why:** ADR-024 explicitly deferred vote casting until real products
  existed to vote on; they now do (ADR-025/027). Rate-limiting and the
  verified-email gate are the other anti-abuse layers AGENTS.md calls for
  alongside the vote/retract history ADR-014 already preserves. Real-time
  vote-count updates (the brief's "no refreshing") stay out of scope here —
  Pusher/broadcasting isn't wired into any flow yet, and wiring up the
  real-time layer is a separate, already-flagged piece of work (ADR-004/019),
  not something this endpoint needs to add on its own.

## ADR-030: Login itself requires a verified email (amends ADR-010/ADR-020)

- **Date:** 2026-11-06
- **Status:** Accepted
- **Decision:** `SessionController::store()` now rejects a password-account
  login (422, same validation shape as a bad password) when
  `email_verified_at` is null — previously verification only gated voting
  and commenting (ADR-010), login itself was unrestricted. `RegisterController`
  no longer issues a Sanctum token on sign-up, since there's nothing for a
  pre-verification session to do now. `EmailVerificationController::send()`
  (resend) moved out of the `auth:sanctum` route group and accepts an `email`
  field for an anonymous caller — a password-account user who still needs a
  new link can no longer be signed in to ask for one the old authenticated
  way. Same enumeration-safe response either way, matching
  `PasswordResetController::store()`. Google accounts are unaffected —
  `GoogleAuthController` already sets `email_verified_at` at creation, since
  Google has already verified that address.
- **Why:** Product decision: a confirmation email is only worth sending if an
  unconfirmed account can't do anything yet, including sign in — closes the
  gap where someone could register with an email they don't control and
  still use the account immediately. Frontend: sign-up now redirects to
  `/login?registered=1` ("check your email") instead of auto-logging in, and
  the login form offers a "Resend verification email" action (calling the
  now-public resend endpoint) when a login attempt comes back unverified.

## ADR-031: Public profile stats + a member's-products endpoint

- **Date:** 2026-11-06
- **Status:** Accepted
- **Decision:** `PublicProfileResource` gained `products_count` (via a new
  `User::launchedProducts()` relation — same `launched`-only visibility
  `ProductController::index()` uses for the front page) and
  `votes_received_count` (a new `User::votesReceivedCount()` helper: active
  votes summed across the member's launched products). The member's product
  list itself is a separate endpoint, `GET /api/users/{handle}/products`
  (`ProfileController::products()`), not nested in `show()`'s payload — same
  reasoning as `/me` vs `/me/products`: a `ProductResource::collection()`
  only gets pagination `meta`/`links` for free from Laravel when it's the
  top-level response (ADR-022), which a combined payload couldn't do without
  hand-rolling pagination.
- **Why:** The brief's public profile ("shows name, photo, one-line bio,
  links · lists the member's products," plus "add some stats like how many
  products") needed a real page — the frontend route existed only as a
  placeholder stub until now. The product list needed its own paginated
  endpoint for the same reason `/me/products` does; the two stats reuse
  existing `launched`/`activeVotes` concepts (ADR-009, ADR-029) rather than
  introducing new ones.

## ADR-032: Uploads fall back to the local "public" disk when S3 isn't configured (refines ADR-007)

- **Date:** 2026-11-06
- **Status:** Accepted
- **Decision:** A new `config('filesystems.uploads')` resolves to `s3` when
  `AWS_BUCKET` is set, otherwise `public` (Laravel's local disk, the
  framework default — see `config/filesystems.php`). Every upload call site
  (`User::avatarUrl()`, `Product::logoUrl()`, `ProfileController::update()`,
  `ProductController::store()`/`update()`) reads/writes through this one
  resolved disk instead of hard-coding `Storage::disk('s3')`, so a write and
  a later read always agree on where the file actually lives. Requires
  `php artisan storage:link` once per environment using the local fallback,
  so the "public" disk is reachable at `/storage/...`.
- **Why:** ADR-007 chose S3 for the reasons it gives (stateless app
  servers, deploy/scale independence) — that's still the right call for
  production and hasn't changed. But a local dev setup with no AWS
  credentials configured can't resolve the `s3` driver at all (it throws
  immediately, not a slow/flaky request), which made every file-upload
  feature untestable by hand outside of CI's `Storage::fake()`. One
  resolved-disk indirection keeps S3 as the real target wherever it's
  configured, while local development gets a working upload for free
  instead of a hard dependency on AWS credentials just to click through the
  app.

## ADR-033: Screenshots table built; editing an approved/scheduled product resubmits it for review

- **Date:** 2026-11-06
- **Status:** Accepted
- **Decision:** Two related product-page fixes:
  - `product_screenshots` (already drafted in `docs/04-db-diagram.md` but
    unbuilt, same gap ADR-025 closed for `product_reviews`/`audit_logs`) is
    now a real table/model. `StoreProductRequest`/`UpdateProductRequest`
    accept `screenshots` (array, max 3, image, max 4096kb). Each save
    **replaces the whole set** — `ProductController::replaceScreenshots()`
    deletes the product's existing rows and re-creates them in upload order
    — there's no per-image add/remove/reorder endpoint, matching the brief's
    "up to three screenshots" rather than a general gallery manager.
  - `ProductPolicy::update()` changes from "anything except `pending_review`"
    to an explicit allow-list: `draft`/`changes_requested` (unrestricted),
    `approved`/`scheduled` (unrestricted, but see below),
    `launched` (`description`/`website_url` only, unchanged from ADR-024).
    This closes a real gap: `rejected`/`taken_down` were previously editable
    too, contradicting `docs/02-features.md`'s "rejected is final."
  - Editing an `approved` or `scheduled` product is allowed to touch
    anything, but `ProductController::update()` then flips `status` back to
    `pending_review`, stamps `submitted_at` (so it reorders into the queue
    correctly), and clears `launch_date` — a reviewer already signed off on
    the content that just changed, and a `scheduled` product keeping its
    launch day while unreviewed content sits behind it would let a founder
    dodge review entirely by scheduling first, then editing.
- **Why:** Founder feedback: there was no way to fix an approved/scheduled
  product's content short of it launching as-is, and no screenshot upload
  existed at all despite being in the original brief and DB diagram.
  Treating `scheduled` the same as `approved` (not just `approved` alone)
  keeps the review gate from having a hole in it.

## ADR-034: One product detail page, not two — the dashboard product list links to `/products/[slug]`

- **Date:** 2026-11-06
- **Status:** Accepted
- **Decision:** `/dashboard/products/[slug]` (a second, plainer product
  detail view — name/tagline/description/topics/votes/edit link, no
  screenshots) is removed. The dashboard product list
  (`/dashboard/products`) now links each product's name straight to its
  real page, `/products/[slug]` — already viewable by its own founder at
  any status (`ProductController::show()`, ADR-024/029) — and
  `updateProductAction` redirects there after a save instead of to the
  now-deleted page. `/products/[slug]` gains two small adjustments so it
  reads correctly as both the public page and the founder's own preview:
  the vote button only renders once `launched` (voting on a draft makes no
  sense and `ProductPolicy::vote()` would just reject it); everywhere else
  it's replaced, for the owner only, with a small "Only you can see this"
  status pill (reusing the `STATUS_LABELS` map `src/lib/products.ts`
  already exported).
- **Why:** Founder feedback: two differently-designed pages for the same
  product was confusing, and the plainer one didn't have the new
  screenshots/topic-tags/Edit-button work from ADR-033. Submitting for
  review and picking/changing a launch day stay on the dashboard list
  (`SubmitForReviewButton`/`ScheduleLaunchForm` already live there, inline
  per row) — those are founder-workflow actions with no public-facing
  equivalent, unlike viewing the product itself.

## ADR-035: A founder can edit a product while it's pending review (amends ADR-025/ADR-033)

- **Date:** 2026-11-06
- **Status:** Accepted
- **Decision:** `ProductPolicy::update()` adds `pending_review` to its
  allow-list. It behaves like `draft`/`changes_requested` — anything may
  change, with no status effect (`ProductController::update()` needed no
  change: `pending_review` already fell through its `$isLaunched`/
  `$backToReview` branches untouched). The product stays in the reviewer
  queue at its original `submitted_at` position.
- **Why:** Founder feedback: ADR-025 blocked editing during review so "a
  reviewer never reviews a moving target," but in practice a founder
  spotting a typo or broken link had no way to fix it without waiting for a
  decision first. Leaving `submitted_at` untouched (unlike the
  approved/scheduled → pending_review resubmit in ADR-033, which does bump
  it) keeps the queue's "oldest first" order fair to other founders — the
  product isn't re-entering the queue, just being corrected in place.

## ADR-036: Screenshots become their own add-one/remove-one endpoints (supersedes the replace-wholesale part of ADR-033)

- **Date:** 2026-11-07
- **Status:** Accepted
- **Decision:** `PATCH /api/products/{slug}` no longer touches screenshots
  at all (`UpdateProductRequest` drops the field, `ProductController::
  update()` no longer calls anything screenshot-related). Two new endpoints
  take over, gated by a new `ProductPolicy::manageScreenshots()` ability
  (same founder-owned statuses as `update()` minus `launched`, where it
  denies outright instead of silently no-op'ing — a dedicated endpoint
  succeeding with no effect would read as a bug to the frontend):
  - `POST /api/products/{slug}/screenshots` (`addScreenshots()`,
    `AddScreenshotsRequest`) appends 1+ images, positioned after whatever
    already exists. Its `after()` hook rejects anything that would push the
    total past 3, counting the product's existing screenshots the same way
    `ScheduleProductRequest` counts taken launch slots.
  - `DELETE /api/products/{slug}/screenshots/{screenshot}`
    (`destroyScreenshot()`) removes one and re-numbers the rest so
    `position` stays contiguous (0..n-1) for the carousel.
  - Both call a new shared `resubmitIfReviewed()` — the same
    approved/scheduled → pending_review transition `update()` already had,
    now a private helper used by all three endpoints instead of duplicated.
  - `store()` (product creation) is unaffected — screenshots still arrive
    bundled with the rest of the create payload, since there's no product
    id yet to attach them to individually.
  - `ProductResource`'s `screenshots` entries become `{id, url}` objects
    instead of bare URL strings — the frontend needs the id to target the
    delete endpoint.
  Frontend: the dashboard edit form's screenshot block becomes
  `ScreenshotManager` (`src/components/screenshot-manager.tsx`) for an
  existing product — each thumbnail has its own remove (×) button that
  calls `removeScreenshotAction` immediately via its own `useActionState`
  (one instance per thumbnail), and an "Add screenshot" control (shown
  while under 3) calls `addScreenshotAction` immediately on file selection
  — neither is bundled into the form's "Save changes". Clicking a thumbnail
  (there, on the product page's carousel, and in the reviewer queue) opens
  it full-size in a new shared `ImageLightbox`. The create-product form has
  no product id yet to call these endpoints against, so it keeps a
  local-only staging picker (`StagedScreenshotsPicker`) with the same
  view/remove-before-save interaction, submitted with the rest of the form.
- **Why:** Founder feedback: the replace-the-whole-set model from ADR-033
  meant fixing one bad screenshot required re-selecting every file again,
  and there was no way to just look at one full-size. Per-image endpoints
  make "remove this one, then add a replacement" an actual two-click
  workflow instead of a full re-upload, and match how the rest of the
  product's sub-resources (topics, votes) already have their own
  endpoints rather than being folded into `update()`.

## ADR-037: Comments + one level of replies, founder notified by a queued email

- **Date:** 2026-11-07
- **Status:** Accepted
- **Decision:** `comments` (already drafted in `docs/04-db-diagram.md` but
  unbuilt, same gap ADR-025/033/036 each closed for a different drafted
  table) is now a real model. `GET /api/products/{slug}/comments`
  (`CommentController::index()`) returns top-level comments on a `launched`
  product, newest first, each with its replies eager-loaded oldest-first
  (`Comment::replies()`) — pagination comes for free the same way every
  other list endpoint gets it (AGENTS.md). `POST
  /api/products/{slug}/comments` (`store()`, behind `auth:sanctum`) creates
  a top-level comment or, with `parent_comment_id` set, a reply. A new
  `CommentPolicy` gates both: `create()` requires the product to be
  `launched` (same gating as `ProductPolicy::vote()` — a draft/pending
  product has no public audience to comment on) and a verified email
  (ADR-010/020); `reply()` adds one more check — the comment being replied
  to must itself be top-level (`parent_comment_id === null`), enforcing
  "one level of reply only" server-side, not just in the UI. Unlike voting,
  a founder can comment on their own product. On a successful comment, the
  founder is notified by a new `NewCommentNotification`
  (`App\Notifications\Comments`, `ShouldQueue` — a background job per
  ADR-018, mirroring `VerifyEmailNotification`'s shape) — skipped when the
  commenter is the founder themselves. `Product::comments()` (all comments,
  top-level and replies) backs a new `comments_count` on `ProductResource`,
  loaded everywhere `votes_count` already is.
  Frontend: `src/app/products/[slug]/page.tsx` drops its `DUMMY_COMMENTS`
  placeholder for real data (`src/lib/comments.ts`, `src/app/actions/
  comments.ts`). A `CommentForm` (`src/components/comment-form.tsx`) only
  renders for a signed-in member on a `launched` product — a signed-out
  visitor gets a "Log in to comment" link instead, same pattern
  `VoteButton`'s `readOnly` link uses. `CommentThread`
  (`src/components/comment-thread.tsx`) renders one top-level comment with
  a "Reply" toggle and its replies indented underneath; a reply renders with
  no further "Reply" button, keeping the one-level rule honest in the UI
  too (the backend still enforces it either way).
- **Why:** The brief and `docs/02-features.md` already scope exactly this —
  "comment on a product, reply to comments, founder told when somebody
  comments" — and nothing was built yet. Deliberately **out of scope**
  here, same reasoning ADR-025 used for the review-outcome notification:
  comment reporting (`docs/02-features.md`'s "report a comment," a
  reviewer-facing feature with its own `comment_reports` table, not blocked
  by this change) and the general in-site notification
  bell/`notification_preferences` toggle (no notification infrastructure
  exists yet beyond the two auth emails; building it now for one email
  would be far more than this slice needs). A plain queued email is
  "founder is told" well enough until that infrastructure lands.

## ADR-038: Comment likes (new) + comment reporting (resolves the deferral in ADR-037)

- **Date:** 2026-11-07
- **Status:** Accepted
- **Decision:** Two member-facing actions on a comment or reply, both
  gated by a verified email (ADR-010/020, same posture as
  `CommentPolicy::create()`):
  - **Likes** — not in `docs/01-client-brief.md`; added on direct
    product request. A new `comment_likes` table (`comment_id`, `user_id`,
    unique pair) backs `POST`/`DELETE /api/comments/{comment}/likes`
    (`CommentLikeController`), gated by new `CommentPolicy::like()`/
    `unlike()` abilities that mirror `ProductPolicy::vote()`/`unvote()` —
    except liking your own comment is allowed (no ranking it could skew,
    unlike self-voting on your own product). Unlike `Vote`'s soft-retract
    (ADR-014), a `CommentLike` is hard-deleted on unlike — there's no
    anti-fraud reason to keep a like/unlike history the way there is for
    product votes.
  - **Reports** — closes the gap `ADR-037` left open: `comment_reports`
    (already drafted in `docs/04-db-diagram.md`, unbuilt until now) is a
    real table, plus a unique `(comment_id, reporter_id)` index beyond what
    the DBML specified — one report per member per comment, so repeated
    flagging doesn't look like independent reports once a reviewer queue
    exists to read them. `POST /api/comments/{comment}/reports`
    (`CommentReportController`, `StoreCommentReportRequest` — `reason`
    required) is gated by new `CommentPolicy::report()`, which denies a
    comment's own author and a duplicate report. This only covers a member
    *filing* a report — the reviewer-facing queue/resolve flow
    (`docs/02-features.md`'s "sees reported comments... resolves reports")
    stays deferred, same scope cut ADR-025 made for the review flow before
    a dashboard existed for it.
  - `CommentResource` gained `likes_count`, `liked_by_viewer`, and
    `reported_by_viewer` — the latter two only accurate when the
    controller eager-loaded the viewer-scoped `likes`/`reports` relations
    (same `voted_by_viewer` convention as `ProductResource`, ADR-029).
    `CommentController::index()` eager-loads both for top-level comments
    *and* nested replies via a shared `viewerScopedRelations()` helper, so
    a reply's own like/report state renders correctly without an N+1 query.
  Frontend: `CommentThread` gained a like toggle (filled/outline heart +
  count) and a "Report" toggle that reveals an inline reason form — both
  rendered for top-level comments and replies alike (reply only omits the
  existing "Reply" toggle, per ADR-037's one-level rule). New
  `HeartIcon`/`FlagIcon` in `src/components/icons.tsx`.
- **Why:** Direct request to add like/report/time to every comment and
  reply. Reporting was already fully scoped by the brief and only needed
  building; liking is new scope this ADR documents since nothing in
  `docs/01-client-brief.md` calls for it. Both follow the vote feature's
  already-established shape (toggle action, policy-gated, resource fields
  mirroring `voted_by_viewer`) rather than inventing a new pattern. Time
  display needed no backend change — `CommentResource.created_at` and the
  frontend's relative-time rendering already existed from ADR-037.

## ADR-039: Product list search, topic filter, and sort (resolves the ADR-017 deferral; refines ADR-024's placeholder ordering)

- **Date:** 2026-11-07
- **Status:** Accepted
- **Decision:** `GET /api/products` (`ProductController::index()`) gains
  three optional, validated query params, all scoped to the already-existing
  `status = 'launched'` list — no change to what's visible, only to its
  order/subset:
  - `q` — matched against `name`, `tagline`, and `description` (the brief's
    "search by name" and "search by what a product does"). A new migration
    adds a MySQL `FULLTEXT` index on those three columns (ADR-017's "revisit
    with a dedicated search engine only if it's not fast enough" — this is
    that first MySQL FULLTEXT pass). Two new `Product` query scopes carry
    the logic instead of the controller: `scopeSearch()` uses
    `whereFullText()` on MySQL, and falls back to an `orWhere(... 'like' ...)`
    group on any other driver — needed because the Pest suite runs on
    sqlite (`phpunit.xml`), which has no FULLTEXT support at all, so both
    the migration and the scope are driver-guarded.
  - `topic` — matched by **topic slug** (`scopeInTopic()`, a
    `whereHas('topics', ...)` check), not id. `GET /api/topics` already
    returns slugs, and matching the brief's prospective
    `/topics/productivity`-style URL keeps the param human-readable — though
    that per-topic route itself stays deferred (see below).
  - `sort` — `newest` (`orderByDesc('launched_at')`) or `votes`
    (`orderByDesc('votes_count')`, the existing default, unchanged from
    ADR-024's placeholder ordering).
  All three are validated inline in the controller (`$request->validate([...])`,
  `sort` via `Rule::in(['newest', 'votes'])`) rather than a dedicated Form
  Request — a three-field GET filter didn't warrant a new class the way a
  mutation's validation does elsewhere in this codebase. `paginate()` gained
  `->withQueryString()` so pagination links keep `q`/`topic`/`sort` attached.
- **Why:** `docs/02-features.md`'s visitor row and the client brief already
  scope exactly this ("search products by name/description, filter by
  topic, sort by newest or most voted") for the product list page only — the
  user explicitly deferred a per-topic search route (e.g.
  `/topics/productivity`) to a later change, so nothing here builds that.
  Query scopes (not inline controller logic) keep this consistent with
  AGENTS.md's "business logic... in services/model methods," and are a
  reusable building block if a future topic-scoped endpoint needs the same
  filters.

## ADR-040: Topic filter becomes multi-select (OR-matched), plus a launch-date range filter (amends ADR-039)

- **Date:** 2026-11-07
- **Status:** Accepted
- **Decision:** Two additions to the product list endpoint, neither in
  `docs/01-client-brief.md` — both added on direct product request, the same
  "not in the brief, built because asked for" pattern ADR-038 used for
  comment likes:
  - `topic` (single slug) is replaced by `topics` — a comma-separated list
    of slugs, OR-matched (`Product::scopeInTopics()`, a `whereIn('slug', ...)`
    inside the existing `whereHas('topics', ...)` check, superseding
    `scopeInTopic()`). A product matches if it carries *any* of the selected
    topics, the standard reading of a multi-select filter. Comma-separated
    in one param (not repeated `topics[]` keys) keeps the URL simple to
    build/read on the frontend; the controller splits and trims it before
    filtering.
  - `from`/`to` filter on `products.launch_date` (not `launched_at`) —
    it's a plain `date` column already on the table, so a date-picker range
    needs no time-of-day/timezone handling the way comparing against a
    `timestamp` would. Both are validated as real dates, and `to` must be
    `after_or_equal:from` (422 otherwise, per ADR-022's validation
    envelope).
  Frontend: the topic chip row (ADR-039) is replaced by a searchable
  multi-select dropdown (`ProductSearchBar`) — a text input inside the
  dropdown filters the already-fetched `Topic[]` list client-side (only
  ~20 topics, same reasoning `TopicController::index()`'s page-size-100
  comment already gives for treating the whole taxonomy as one small,
  fully-loaded list), and each checkbox toggle applies immediately, same
  "no Apply button" immediacy the topic chips and sort toggle already had.
  Two `<input type="date">` fields (From/To) sit alongside it, each
  updating the URL on change.
- **Why:** Direct request to let the topic filter select more than one
  topic and to narrow results to a launch-date window. Multi-select reuses
  the same `topics`-as-filter shape ADR-039 established rather than
  inventing a parallel param, and OR-matching is what a visitor expects
  from a multi-select filter (narrowing with AND would make adding a
  second topic only shrink results, which isn't how this kind of filter
  reads to a user). The per-topic search route deferral from ADR-039 is
  unchanged by this.
