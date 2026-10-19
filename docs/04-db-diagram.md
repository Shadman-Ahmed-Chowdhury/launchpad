# Database schema

Initial tables based on the client brief, written in DBML (paste into
[dbdiagram.io](https://dbdiagram.io) to view). This will grow as features are built —
update this file in the same change whenever a model changes.

```dbml
// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id bigint [primary key]
  first_name varchar
  last_name varchar
  email varchar [unique] // case-insensitive comparison needed so Foo@x.com and foo@x.com can't both sign up
  handle varchar [unique] // public profile slug, e.g. /u/amina
  auth_provider varchar // 'password' or 'google' — exactly one, enforced by a CHECK constraint
  password_hash text // required if auth_provider='password', else null
  google_id varchar [unique] // required if auth_provider='google' (Google's sub claim), else null
  avatar varchar // file path/key in S3
  role varchar [default: 'member'] // member/reviewer/admin
  email_verified_at timestamp // nullable; null = not verified, votes/comments blocked until set
  is_suspended bool [default: false]
  bio varchar // one line, shown on public profile
  created_at timestamp
  updated_at timestamp

  Note: 'CHECK: auth_provider=password requires password_hash and forbids google_id, and vice versa for google.'
}

Table user_links {
  id bigint [primary key]
  user_id bigint
  label varchar // e.g. "Twitter", "Website"
  url varchar
  created_at timestamp
}
Ref: users.id < user_links.user_id

Table auth_tokens {
  id bigint [primary key]
  user_id bigint
  kind varchar // verify_email/reset_password
  token_hash varchar [unique] // hash of the token emailed to the user; raw token is never stored
  expires_at timestamp
  used_at timestamp // nullable, set once consumed so the same link can't be replayed
  created_at timestamp
}
Ref: users.id < auth_tokens.user_id

Table topics {
  id bigint [primary key]
  name varchar
  slug varchar [unique]
  created_at timestamp
}

Table products {
  id bigint [primary key]
  founder_id bigint // users.id
  name varchar
  slug varchar [unique]
  tagline varchar // one-line pitch
  description text
  logo varchar // S3 key
  website_url varchar
  status varchar [default: 'draft'] // draft/pending_review/changes_requested/rejected/approved/scheduled/launched/taken_down
  launch_date date // nullable until scheduled
  launched_at timestamp // nullable, set when it actually goes live
  is_featured bool [default: false]
  created_at timestamp
  updated_at timestamp
}
Ref: users.id < products.founder_id

Table product_topics {
  id bigint [primary key]
  product_id bigint
  topic_id bigint
  created_at timestamp
}
Ref: products.id < product_topics.product_id
Ref: topics.id < product_topics.topic_id

Table product_screenshots {
  id bigint [primary key]
  product_id bigint
  image varchar // S3 key
  position int [default: 0]
  created_at timestamp
}
Ref: products.id < product_screenshots.product_id

Table product_reviews {
  id bigint [primary key]
  product_id bigint
  reviewer_id bigint // users.id, role=reviewer/admin
  action varchar // approved/rejected/changes_requested
  notes text // nullable, shown to founder
  created_at timestamp
}
Ref: products.id < product_reviews.product_id
Ref: users.id < product_reviews.reviewer_id

Table votes {
  id bigint [primary key]
  product_id bigint
  user_id bigint
  created_at timestamp
  retracted_at timestamp // nullable; set when they take their vote back instead of deleting the row

  indexes {
    (product_id, user_id) [unique] // partial: only among active votes (retracted_at is null)
  }
}
Ref: products.id < votes.product_id
Ref: users.id < votes.user_id

Table comments {
  id bigint [primary key]
  product_id bigint
  user_id bigint
  parent_comment_id bigint // nullable, self-ref for replies
  body text
  deleted_at timestamp // nullable; set after a report is upheld (soft-delete)
  created_at timestamp
  updated_at timestamp
}
Ref: products.id < comments.product_id
Ref: users.id < comments.user_id
Ref: comments.id < comments.parent_comment_id

Table product_reports {
  id bigint [primary key]
  product_id bigint
  reporter_id bigint // users.id
  reason varchar
  status varchar [default: 'pending'] // pending/resolved/dismissed
  resolved_by bigint // users.id, nullable
  resolved_at timestamp // nullable
  created_at timestamp
}
Ref: products.id < product_reports.product_id
Ref: users.id < product_reports.reporter_id

Table comment_reports {
  id bigint [primary key]
  comment_id bigint
  reporter_id bigint // users.id
  reason varchar
  status varchar [default: 'pending'] // pending/resolved/dismissed
  resolved_by bigint // users.id, nullable
  resolved_at timestamp // nullable
  created_at timestamp
}
Ref: comments.id < comment_reports.comment_id
Ref: users.id < comment_reports.reporter_id

Table user_follows {
  id bigint [primary key]
  follower_id bigint // users.id
  followee_id bigint // users.id
  created_at timestamp

  indexes {
    (follower_id, followee_id) [unique]
  }
}
Ref: users.id < user_follows.follower_id
Ref: users.id < user_follows.followee_id

Table topic_follows {
  id bigint [primary key]
  user_id bigint
  topic_id bigint
  created_at timestamp

  indexes {
    (user_id, topic_id) [unique]
  }
}
Ref: users.id < topic_follows.user_id
Ref: topics.id < topic_follows.topic_id

Table notification_preferences {
  id bigint [primary key]
  user_id bigint
  notification_type varchar // e.g. product_approved, new_comment, weekly_digest
  is_enabled bool [default: true]

  indexes {
    (user_id, notification_type) [unique]
  }
}
Ref: users.id < notification_preferences.user_id

Table notifications {
  id bigint [primary key]
  user_id bigint // recipient
  type varchar // matches notification_type above
  data json // context, e.g. product_id, comment_id
  read_at timestamp // nullable; null = unread
  created_at timestamp
}
Ref: users.id < notifications.user_id

Table daily_rankings {
  id bigint [primary key]
  product_id bigint
  rank_date date // the day being frozen, e.g. '2026-09-21'
  position int
  score decimal
  votes_count int
  frozen_at timestamp // set once at the UTC day boundary, never recalculated after

  indexes {
    (product_id, rank_date) [unique]
    (rank_date, position) [unique] // position is unique within a day, never globally
  }
}
Ref: products.id < daily_rankings.product_id

Table period_rankings {
  id bigint [primary key]
  period_type varchar // weekly/monthly/all_time
  period_start date // week starts Monday, month starts day 1; null only for all_time
  topic_id bigint // nullable; null = global board, set = that topic's board
  product_id bigint
  position int
  score decimal
  votes_count int
  through_date date // last completed day included in this board
  computed_at timestamp // when this board was last rebuilt

  indexes {
    (period_type, period_start, topic_id, product_id) [unique] // nulls treated as equal, not distinct
    (period_type, period_start, topic_id, position) [unique]
  }
}
Ref: products.id < period_rankings.product_id
Ref: topics.id < period_rankings.topic_id

Table audit_logs {
  id bigint [primary key]
  actor_id bigint // users.id, staff who performed the action
  action varchar // approve_product, reject_product, suspend_user, feature_product, takedown_product, resolve_report
  target_type varchar // product/user/comment
  target_id bigint
  notes text // nullable
  created_at timestamp
}
Ref: users.id < audit_logs.actor_id
```

## Notes

- `product_reports` and `comment_reports` are separate tables instead of one
  polymorphic `reports` table — keeps foreign keys real instead of a loose
  type+id pair. Same reasoning applies to `user_follows`/`topic_follows`: kept as two
  tables rather than one polymorphic `follows` table, on purpose.
- `daily_rankings` and `period_rankings` are snapshot tables, not something
  recalculated on read — that's what makes past-day pages permanent and keeps
  week/month/all-time boards built only from frozen days (see ADR-009 and ADR-013 in
  [`03-architecture-decisions.md`](03-architecture-decisions.md)).
- `votes.retracted_at` is a soft-delete, not a hard delete — keeps a retracted vote's
  history around as a future anti-fraud signal (see ADR-014). IP/device-fingerprint
  signals still aren't modeled — add a table here once that anti-abuse approach is
  decided, and log it as an ADR.
- The `votes` migration implements the `(product_id, user_id)` unique index as a plain
  unique for now, not the partial/retract-aware version ADR-014 describes — there's no
  vote-casting/retraction endpoint yet to exercise retract-then-recast, so there's
  nothing to allow around. Revisit when that endpoint is built (see ADR-024).
- `email`/`handle` on `users` need case-insensitive comparison so two accounts can't
  differ only by case — MySQL's default collation (`utf8mb4_0900_ai_ci` /
  `utf8mb4_unicode_ci`) already compares case-insensitively, so this falls out for
  free as long as the migration doesn't force a case-sensitive `_bin`/`_cs` collation
  on these columns.
- `id` and foreign-key columns are `bigint` to match Laravel/Eloquent's default
  migration helpers (`id()` / `foreignId()`), which use unsigned big integers.
