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
- Can verify email before voting/commenting counts
- Can log in, log out, reset password, change password (if email/password account)
- Has a public profile: name, photo, one-line bio, links, their products
- Can edit their own profile
- Can vote once per product, and remove their vote
- Cannot vote on their own product
- Can comment on a product, and reply to comments
- Can report a comment or a product
- Can follow other members and follow topics
- Gets a feed from followed members/topics
- Gets in-site notifications (bell, live count) and email notifications
- Can turn individual email notifications on/off

## Founder (member who submitted a product)

- Can submit a product: name, one-line pitch, description, logo, screenshots, website link, up to 3 topics
- Can save a submission as draft and finish later
- Gets notified when the product is approved, rejected, or sent back for changes
- Can pick a launch day after approval, and change it until launch (limited slots per day)
- Can edit description and links after launch (nothing else)
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
- Can suspend a member
- Can take down a product
- Can feature a product on the front page
- Can view the full audit log (who did what, when)

## Not in this version

- Payments
- Jobs board
- Private messages
- Other languages
- Public stats for products that aren't yours
