# Meditation Journal

An iPhone home-screen web app (PWA) for tracking a Dr Joe Dispenza-style meditation practice.
One focus screen: pick a track from the Files app, press the dial, and when the track ends
rate the session with one tap and jot a note. Pull up the sheet at the bottom to rehearse
your old-self / new-self script before you sit. Stats live behind the bars icon, and the
sparkle button asks Claude for an honest read on how your practice is going.

Two people can use it, each with their own email account. Sessions, script and reviews are
private per account. The audio track stays on the phone.

## Stack

- Vite + React + TypeScript, installable PWA (`vite-plugin-pwa`)
- Supabase: email/password auth, Postgres with row-level security, one edge function
- Anthropic API (Claude Opus 5) inside the edge function for the journal review
- The chosen track is kept in IndexedDB on the device, so it survives restarts

## Setup

### 1. Supabase project

1. Create a project at supabase.com.
2. SQL editor: paste and run `supabase/schema.sql`.
3. Authentication → Providers: keep **Email** enabled.
   Under Email, turn **Confirm email** off if you would rather skip the confirmation
   step for the two of you (you can leave it on; the sign-up screen tells you to check your inbox).
4. Once both accounts exist, Authentication → Settings → turn **Allow new users to sign up** off
   so nobody else can create an account.

### 2. AI review function

Requires the Supabase CLI (`npm i -g supabase`) and an Anthropic API key.

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ai-review
```

The function runs as the signed-in user, reads that user's last 60 days of sessions plus
their script, and stores the review in `ai_reviews`. It uses server-side refusal fallbacks
so a review always comes back.

### 3. Build the app

```bash
cp .env.example .env     # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Project Settings → API)
npm install
npm run build            # output in dist/
```

`npm run dev` runs it locally. `npm run icons` regenerates the app icons.

### 4. Host it

Any static host works: Vercel, Netlify, Cloudflare Pages, GitHub Pages. Point it at the repo,
set the two `VITE_` environment variables in the host's dashboard, build command `npm run build`,
output directory `dist`. It must be served over HTTPS for the service worker and home-screen install.

### 5. Put it on your iPhone

Open the site in Safari → Share → **Add to Home Screen**. Launch it from the icon; it runs
full-screen. Tap **Choose from Files** to pick your meditation audio from the Files app.

## How sessions are counted

- A session starts the first time you press play and ends when the track finishes or you
  tap **End session**. Only time actually played counts; pauses do not.
- Sessions under 5 seconds are ignored (accidental taps).
- Streak: consecutive days with at least one session, ending today or yesterday.
- If the phone is offline when you save, the session is kept locally and synced next time
  the app opens with a connection.

## iOS notes

- Audio keeps playing when you lock the screen from the installed app on current iOS versions.
  If it does not on yours, keep the screen on or play from Safari instead.
- Safari clears site storage for sites you have not visited in a while. The installed
  home-screen app is exempt, but if the track ever disappears, just choose it again.

## Design

The three layout directions explored before building are in `design/`, with the chosen one
(Option C, "Focus") implemented here.
