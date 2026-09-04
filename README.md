# GA Zee — Live GHL Dashboard (Vercel)

## Structure
```
public/index.html   → frontend (static, no secrets)
api/dashboard.js     → serverless function (holds the token, calls GHL directly)
```

## Step 1 — Get a GHL Private Integration Token
1. In GoHighLevel, go to the **GA Zee** sub-account.
2. **Settings → Private Integrations → Create New Integration.**
3. Give it these read scopes: `contacts.readonly`, `opportunities.readonly`,
   `conversations.readonly`, `locations/tags.readonly`.
4. Copy the generated token — this is your `GHL_API_KEY`.

## Step 2 — Deploy to Vercel (free Hobby plan)
1. Push this folder to a GitHub repo.
2. On vercel.com → **New Project → Import** the repo.
3. Before deploying, open **Settings → Environment Variables** and add:
   - `GHL_API_KEY` = the token from Step 1
   - `GHL_LOCATION_ID` = `Hw7ST31DqGNjsflTCYRL`
4. Deploy. Vercel auto-detects `api/dashboard.js` as a serverless function
   and serves `public/index.html` as the static site — no build step needed.

## Step 3 — Done
Your dashboard is now live at `https://<your-project>.vercel.app`, refreshing
every 45 seconds directly against the GoHighLevel API. The token never
reaches the browser — only your `/api/dashboard` function on Vercel's
servers sees it.

## Notes
- Vercel's free tier serverless functions have a 10s execution limit — this
  function makes ~7 GHL calls, which normally finishes well under that.
- If you rotate the GHL token, just update the environment variable in
  Vercel's dashboard and redeploy (no code changes needed).
