# Share a DirectSponsor news link

Decided 2026-10-29. When a recipient publishes a news update on DirectSponsor, ClickForCharity asks its users to paste that link into the social accounts they already have. DirectSponsor's half of this is [social-sharing.md](../directsponsor.net/social-sharing.md). The recipient posts the link themselves. This task is for everyone else.

The card needs no extra work. The task URL is the share link, and the other site draws the title, description, and image.

## Fits the task system we have

Tasks, platforms, and expiry are already documented in [TASK-SYSTEM-DOCS.md](TASK-SYSTEM-DOCS.md).

- Category `engagements` (a share, not a follow).
- One task per platform the user has selected on `my-platforms.html`, so someone only sees the sites they marked. A single task with platform `none` is the smaller version: "post this link on any site you use."
- The Visit URL is `https://directsponsor.net/posts.html?user=X&post_id=Y`.
- The instructions are: open the link, post it on that site, come back and mark the task done.

For now a person can add that task by hand in `admin-simple-tasks.html` when a news post goes out.

## Later, on our own site

Replacing the task can be automated, because the task list is ours (`data/complex-tasks/tasks.json`, written from the admin save API). When a new news post is published:

1. Disable or expire the previous share task for that recipient.
2. Create the new one pointing at the new share URL.

Expiry and the cleanup cron already hide a task after its date and drop it from profiles. See the "Add a Time-Limited Campaign" section in [TASK-SYSTEM-DOCS.md](TASK-SYSTEM-DOCS.md). Nothing here posts to X or anywhere else. It only updates our task list.
