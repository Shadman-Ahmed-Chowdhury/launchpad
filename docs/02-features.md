# Features by role

Minimal list, grouped by who does what. Source: [`01-client-brief.md`](01-client-brief.md).
Keep this file in sync with scope — update it whenever a feature is added, dropped, or changed.

## Visitor (no account)

- Can browse the front page (today's launches, best first)
- Can view a product page (description, screenshots, votes, comments)
- Can view a member's public profile
- Can view past days, weekly / monthly / all-time top lists per topic
- Can search products by name/description, filter by topic, sort by newest or most voted
- Cannot vote, comment, follow, or submit a product

## Member (signed up, verified)

- Can sign up with email + password, or Google
- Must verify email before logging in (password accounts only — Google
  accounts are verified by Google already); sent to the login page once
  verified
- Can log in, log out, reset password, change password (if email/password account)
- Has a public profile: name, photo, one-line bio, links, their products
- Can edit their own profile
- Can vote once per product, and remove their vote
- Cannot vote on their own product
- Can comment on a product, and reply to comments
- Can like a comment or reply
- Can report a comment or a product
- Can follow other members and follow topics
- Gets a feed from followed members/topics
- Gets in-site notifications (bell, live count) and email notifications
- Can turn individual email notifications on/off

## Founder (member who submitted a product)

- Can submit a product: name, one-line pitch, description, logo, up to 3 screenshots,
  website link, up to 3 topics
- Can save a submission as draft and finish later
- Submits a draft into the review queue when it's ready; can resubmit after changes are requested (rejected is final — no resubmit)
- Can edit a product while it's in the review queue (pending review) — a reviewer
  may already be looking at it, but a founder can still fix it in the meantime
- Sees the outcome and the reviewer's reason on their dashboard (email/in-site notifications aren't built yet — see ADR-025)
- Gets notified when the product is approved, rejected, or sent back for changes
- Can pick a launch day after approval, and change it until launch (limited slots per day)
- Can edit anything while `approved` or `scheduled` — doing so sends it back to the
  reviewer queue (and clears the picked launch day, since it needs re-approval first)
- Can edit description and links after launch (nothing else)
- Can't edit a rejected or taken-down product (terminal)
- Gets notified the day before launch, and when the product goes live
- Gets notified when someone comments on their product
- Has a dashboard for their own product: views, votes over the day, traffic sources, rank
- Can export their dashboard data as a file (prepared async, notified when ready)

## Reviewer (staff)

- Can see a queue of pending submissions, oldest first
- Can approve, reject, or send a submission back for changes (with reason)
- Can see reported comments and reported products, and resolve reports
- Every review action is recorded in the audit log

## Admin (staff)

- Everything a Reviewer can do, plus:
- Can see a list of members and suspend/unsuspend one
- Can take down a product
- Can feature a product on the front page
- Can view the full audit log (who did what, when)
- Can create a reviewer account directly (no public signup path to that role), see the list of current reviewers, edit one, or revoke their reviewer access (revoking returns the account to a plain member, it isn't deleted — keeps their past review/audit history intact)

## Not in this version

- Payments
- Jobs board
- Private messages
- Other languages
- Public stats for products that aren't yours
