# Database schema

Initial tables based on the client brief, written in DBML (paste into
[dbdiagram.io](https://dbdiagram.io) to view). This will grow as features are built —
update this file in the same change whenever a model changes.

```dbml
// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id int [primary key]
  first_name varchar
  last_name varchar
  email varchar [unique]
  password text // null if signed up via Google
  google_id varchar // null if signed up via email/password
  avatar varchar // file path/key in S3
  role varchar [default: 'member'] // member/reviewer/admin
  is_verified bool [default: false]
  verify_token varchar // nullable, used for email confirmation
  is_suspended bool [default: false]
  bio varchar // one line, shown on public profile
  created_at timestamp
  updated_at timestamp
}

Table user_links {
  id int [primary key]
  user_id int
  label varchar // e.g. "Twitter", "Website"
  url varchar
  created_at timestamp
}
Ref: users.id < user_links.user_id

Table topics {
  id int [primary key]
  name varchar
  slug varchar [unique]
  created_at timestamp
}

Table products {
  id int [primary key]
  founder_id int // users.id
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
  id int [primary key]
  product_id int
  topic_id int
  created_at timestamp
}
Ref: products.id < product_topics.product_id
Ref: topics.id < product_topics.topic_id

Table product_screenshots {
  id int [primary key]
  product_id int
  image varchar // S3 key
  position int [default: 0]
  created_at timestamp
}
Ref: products.id < product_screenshots.product_id

Table product_reviews {
  id int [primary key]
  product_id int
  reviewer_id int // users.id, role=reviewer/admin
  action varchar // approved/rejected/changes_requested
  notes text // nullable, shown to founder
  created_at timestamp
}
Ref: products.id < product_reviews.product_id
Ref: users.id < product_reviews.reviewer_id

Table votes {
  id int [primary key]
  product_id int
  user_id int
  created_at timestamp

  indexes {
    (product_id, user_id) [unique] // one vote per member per product
  }
}
Ref: products.id < votes.product_id
Ref: users.id < votes.user_id

Table comments {
  id int [primary key]
  product_id int
  user_id int
  parent_comment_id int // nullable, self-ref for replies
  body text
  is_removed bool [default: false] // soft-delete after a report is upheld
  created_at timestamp
  updated_at timestamp
}
Ref: products.id < comments.product_id
Ref: users.id < comments.user_id
Ref: comments.id < comments.parent_comment_id

Table product_reports {
  id int [primary key]
  product_id int
  reporter_id int // users.id
  reason varchar
  status varchar [default: 'pending'] // pending/resolved/dismissed
  resolved_by int // users.id, nullable
  resolved_at timestamp // nullable
  created_at timestamp
}
Ref: products.id < product_reports.product_id
Ref: users.id < product_reports.reporter_id

Table comment_reports {
  id int [primary key]
  comment_id int
  reporter_id int // users.id
  reason varchar
  status varchar [default: 'pending'] // pending/resolved/dismissed
  resolved_by int // users.id, nullable
  resolved_at timestamp // nullable
  created_at timestamp
}
Ref: comments.id < comment_reports.comment_id
Ref: users.id < comment_reports.reporter_id

Table user_follows {
  id int [primary key]
  follower_id int // users.id
  followee_id int // users.id
  created_at timestamp

  indexes {
    (follower_id, followee_id) [unique]
  }
}
Ref: users.id < user_follows.follower_id
Ref: users.id < user_follows.followee_id

Table topic_follows {
  id int [primary key]
  user_id int
  topic_id int
  created_at timestamp

  indexes {
    (user_id, topic_id) [unique]
  }
}
Ref: users.id < topic_follows.user_id
Ref: topics.id < topic_follows.topic_id

Table notification_preferences {
  id int [primary key]
  user_id int
  notification_type varchar // e.g. product_approved, new_comment, weekly_digest
  is_enabled bool [default: true]

  indexes {
    (user_id, notification_type) [unique]
  }
}
Ref: users.id < notification_preferences.user_id

Table notifications {
  id int [primary key]
  user_id int // recipient
  type varchar // matches notification_type above
  data json // context, e.g. product_id, comment_id
  is_read bool [default: false]
  created_at timestamp
}
Ref: users.id < notifications.user_id

Table product_daily_rankings {
  id int [primary key]
  product_id int
  topic_id int // nullable, set when the row is for a topic-specific list
  period_type varchar // daily/weekly/monthly/all_time
  period_key varchar // e.g. '2026-09-21', '2026-W38', '2026-09'
  rank int
  score decimal
  votes_count int
  created_at timestamp // frozen once the period ends, never recalculated

  indexes {
    (product_id, period_type, period_key, topic_id) [unique]
  }
}
Ref: products.id < product_daily_rankings.product_id
Ref: topics.id < product_daily_rankings.topic_id

Table audit_logs {
  id int [primary key]
  actor_id int // users.id, staff who performed the action
  action varchar // approve_product, reject_product, suspend_user, feature_product, takedown_product, resolve_report
  target_type varchar // product/user/comment
  target_id int
  notes text // nullable
  created_at timestamp
}
Ref: users.id < audit_logs.actor_id
```

## Notes

- `product_reports` and `comment_reports` are separate tables instead of one
  polymorphic `reports` table — keeps foreign keys real instead of a loose
  type+id pair.
- `product_daily_rankings` is a snapshot table, not something recalculated on read —
  it's what makes past-day pages permanent (see ADR-009 in
  [`03-architecture-decisions.md`](03-architecture-decisions.md)).
- Vote-fraud signals (IP, device fingerprint, etc.) aren't modeled yet — add a table
  here once the anti-abuse approach is decided, and log that decision as an ADR.
