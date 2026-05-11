# Hybrid Hustler Fitness OS

A private fitness tracking dashboard. Tracks cardio + strength workouts, weight, goals, records, and badges. All data stays in your browser via localStorage.

## What's in it

- **Dashboard** — Today's burn, streaks, current weight, 30-day calorie trend, weekly bars, weight chart, lifetime totals
- **Log Workout** — Cardio (treadmill, elliptical, running, etc.) or Strength (with exercise/sets/reps/weight). Tracks calories, time, miles, heart rate, notes
- **History** — Searchable, filterable list of every workout. Delete entries. Export to CSV
- **Weight** — Log weight + waist over time. Trend chart with goal line. Export to CSV
- **Goal Planner** — Enter start weight, goal weight, and timeframe (in months). Calculates daily/weekly calorie burn target. Shows progress against your plan
- **Records** — Auto-tracks personal bests: most calories, longest workout, fastest pace, best HR, biggest day/week. Strength PRs by exercise
- **Badges** — 21 achievements that unlock as you hit milestones
- **Settings** — Profile, daily calorie goal, full JSON backup/restore, clear all data

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — password is `fitness`

## Deploying to Vercel

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com), click "Add New Project", import your GitHub repo
3. Vercel will auto-detect Vite. Just hit Deploy
4. Your site will be live at `your-project.vercel.app`

## Changing the password

Open `src/App.jsx`, find `const PASSWORD = 'fitness';` near the top, change it, redeploy.

**Heads up:** This is a static site, so the password is visible to anyone who views the source code. It keeps casual snoopers out, not determined ones. For real privacy, you'd need to either keep the URL private or add real authentication (Vercel + Supabase Auth, Auth0, etc.) — happy to add this later.

## Backing up your data

Since data lives in your browser, back up regularly:
1. Go to **Settings → Export Full Backup**
2. Save the JSON file somewhere safe (Google Drive, Dropbox, etc.)

To move to a new browser/device or restore: Settings → Import Backup, pick the file.

## What's NOT in it (yet)

- Food/calorie intake tracking — by design (you said calories out only)
- Multi-device sync — would need a database. Easy to add later with Supabase or Vercel KV
- User accounts — single-user app right now

## Tech stack

- Vite + React 18
- Recharts for charts
- Lucide icons
- Plain CSS (no Tailwind)
- localStorage for persistence
