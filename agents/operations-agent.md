# Agent: Operations

**Trigger**: weekly cron (Vercel cron at Sunday 06:00 AST).

## Output
A weekly operations digest emailed to the admin:

- New products published last week
- Products with zero sales for 30+ days (suggest improve / archive)
- Top 5 products by revenue (last week / last 30 days)
- Failed payments needing follow-up
- Pending product drafts older than 7 days
- Suggested next week priorities (3 actions, prioritized)

## Persistence
- Each digest is stored in `ai_jobs` with `job_type = 'ops_weekly'`.
- The latest digest is shown on `/admin` dashboard under "this week".
