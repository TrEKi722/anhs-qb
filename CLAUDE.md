# AAV Quote Book

A web app for browsing, uploading, and creating quote images organized by year.

## Architecture

**Frontend** — single-page app hosted on Cloudflare Pages
- `index.html` — UI: gallery, modals (login, upload, create quote)
- `script.js` — all client-side logic
- `style.css` — dark-themed styling; fonts: Tektur (Google Fonts, UI), Sigher (local OTF, quote canvas text)

**Pages Functions** (serverless, deployed with the site)
- `functions/api/upload.js` — accepts `POST multipart/form-data`, verifies Supabase JWT, writes to R2 at `qb/{folder}/{filename}`
- `functions/api/signup.js` — accepts `POST JSON`, validates an access code env var, then creates a Supabase user via the Admin API (email auto-confirmed)

**Cloudflare Worker** (`worker/`)
- `worker/src/index.js` — deployed separately; exposes `GET /list?prefix=` to list R2 objects publicly
- Live at `https://list-cdn-objects.722kinney.workers.dev`
- Bound to R2 bucket `cdn` via `wrangler.toml`

## Infrastructure

| Service | Purpose |
|---|---|
| Supabase (`pdvxvgcigowwnfqpjjni`) | Auth (email/password) |
| Cloudflare R2 (`cdn` bucket) | Image storage |
| `cdn.ekinney.com` | Public CDN for R2 images |
| `explorer.cdn.ekinney.com` | R2 file browser (linked from download button) |
| Cloudflare Pages | Hosting + Functions |

## Key Concepts

**Folder routing** — `?folder=2026` in the URL selects which R2 prefix to show. Defaults to `2026` if no param is set. Images live at `qb/{folder}/` in R2.

**Auth flow** — Supabase JS client handles login. Signup requires an access code (server-side env var `ACCESS_CODE`) so registration is invite-only. On auth, the action buttons (upload, create, download) become visible.

**Upload** — Sends `multipart/form-data` with the file and current folder to `/api/upload`. The Pages Function verifies the Supabase session token before writing to R2.

**Quote creation (canvas pipeline)**
1. User picks one of 6 PNG templates, a photo, a quote, and attribution text
2. `script.js` composites everything on an HTML `<canvas>`:
   - Draws the template PNG
   - Clips and rotates the user photo into the template's photo zone
   - Draws wrapped, centered text using the Sigher font
3. Canvas is exported as a PNG blob and uploaded via the same `/api/upload` endpoint
4. `TEMPLATES` object in `script.js` defines per-template layout zones (photo: center, size, rotation angle; quote/attribution: center, max width, font size, color)

## Environment Variables

Pages Functions expect these secrets (set in Cloudflare Pages dashboard):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ACCESS_CODE`

## Debug Files

The `debug-template*` images and `debug-template.html` in the project root are development artifacts from building the canvas compositing pipeline — not part of the deployed app.
