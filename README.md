# FieldPour Logger

A mobile-friendly web app for logging concrete pours in the field. Crews record each truck's ticket number, mix design, volume, slump, temperature, cylinders cast, and pass/reject status, and can attach a photo of the delivery ticket. A dashboard tracks progress against the pour target.

It works offline: logs are saved on the device and sync to the database automatically when the connection returns.

**Live demo:** https://fieldpour-logger.vercel.app/

## Features

- **Log entry form** with large touch targets, a slump stepper, cylinder quick-picks, and PASS / REJECT buttons
- **Temperature warning** when concrete temp exceeds the project's max allowable
- **Delivery ticket photos**, resized on the device before upload
- **Offline queue** with auto-sync on reconnect and a manual **Sync Now** button
- **Simulate Offline** switch for demoing the queue without disconnecting
- **Dashboard** with poured vs. target cubic yards, pass rate, truck count, cylinders cast, and a live feed
- **CSV export** of the daily log
- **Settings** for project name, target volume, max temp, and mix designs
- **Mock mode**: with no Supabase keys the app runs entirely on `localStorage`, seeded with sample data

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, Supabase (Postgres + Storage), lucide-react icons.

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). With no `.env` file the app starts in **mock mode**, and the header reads "Local mock mode".

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Type-check with `tsc`, then build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**, paste in all of [`supabase_schema.sql`](supabase_schema.sql), and run it. It is safe to re-run. It creates:
   - the `pour_logs` table, with table grants and row-level security policies
   - a public `tickets` storage bucket for photos, with its policies
3. In **Project Settings → API**, copy the project URL and the anon / publishable key.
4. Copy `.env.example` to `.env` and fill it in:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

5. Restart the dev server. Vite reads `.env` only at startup. The header should now read "Supabase connected".

The variable names must start with `VITE_`, or Vite will not expose them to the app and it will silently fall back to mock mode. The URL and anon key are designed to be public. Never put a `service_role` key in a `VITE_` variable.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel. The Vite preset is detected automatically (build command `npm run build`, output directory `dist`).
2. Before the first deploy, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Environment Variables**. If Vercel warns about the public prefix, mark them as plain (Config) variables and keep the names.
3. Deploy. Variables are baked in at build time, so changing them later requires a redeploy.

## How offline sync works

Every new log is written to `localStorage` first, marked as unsynced, and then pushed to Supabase if the device is online. Anything that fails to push stays queued and is retried on the next sync. Syncing uses `upsert` keyed on the log's UUID, so retries never create duplicates. Photos are stored as small JPEG data URLs while queued, then uploaded to the `tickets` bucket on sync.

## Security notice

The policies in `supabase_schema.sql` are **demo policies**: they allow anyone holding the anon key to read, insert, and update every row in `pour_logs` and to upload to the `tickets` bucket. That is fine for a demo with fake data. Before storing real project records, add Supabase Auth and replace the policies with ones scoped to `auth.uid()`.

## Project structure

```
src/
  App.tsx                  App shell, tabs, online/offline state, sync orchestration
  components/
    Header.tsx             Connection status, queue count, Sync Now, offline simulator
    LogForm.tsx            Pour entry form
    Dashboard.tsx          Stats and live feed
    SettingsPanel.tsx      Project settings
  lib/storage.ts           localStorage + Supabase persistence, sync, CSV export
  types/pour.ts            Shared types
supabase_schema.sql        Database schema, grants, policies, storage bucket
```
