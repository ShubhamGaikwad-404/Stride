# Stride — personal health tracker

A mobile-first training, nutrition and recovery tracker built with Next.js, TypeScript and Supabase. It includes a local-only mode for trying the app immediately; add Supabase credentials to enable private, cross-device account sync.

## What’s included

- Daily dashboard for calorie and macro targets, steps, hydration, sleep, meals and the planned workout.
- Weekly training split, return-to-training guidance, progression notes, cardio, yoga and recovery reminders.
- Vegetarian Indian food reference with customizable calorie and macro targets.
- Weight trend, body measurement baseline and JSON export.
- Responsive layouts, installable PWA manifest, local storage and Supabase email magic-link authentication.
- Supabase Postgres migration with row-level security.

Targets are estimates for a personal starting point, not medical advice. The app encourages weight-trend calibration over 2–3 weeks.

## Run locally

1. Install Node.js 20.9 or newer.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase values to enable accounts. Leave it absent to use local-only mode.
4. Run `npm run dev` and open `http://localhost:3000`.

Available checks: `npm run lint`, `npm run typecheck`, and `npm run build`.

## Supabase setup

1. Create a Supabase project and copy its Project URL and anon/public key into `.env.local`.
2. In the Supabase SQL Editor, run `supabase/migrations/0001_stride.sql`.
3. In Authentication → URL Configuration, set the Site URL to your local URL during development. Add your Vercel production URL and preview URLs to the redirect allow list.
4. Email magic links use Supabase Auth. Configure the project’s email provider and templates before inviting regular use.
5. Restart the Next.js dev server after changing environment values.

The browser only uses the anon/public key. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable or ship it to the browser. Row-level security limits stored profile rows to their signed-in owner.

## GitHub and Vercel

1. Import this repository into Vercel. Framework preset should be Next.js.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project environment variables for Production and Preview.
3. Deploy, then add the production domain to Supabase Auth’s Site URL and redirect URL allow list.
4. Confirm a magic-link sign-in and data update on both desktop and mobile.

## Storage and privacy

Without Supabase credentials, entries are saved only in the current browser’s local storage and do not sync between devices. With Supabase, the app syncs one JSON profile row for the authenticated user. Export downloads a JSON backup. Clearing browser storage deletes the local-only copy, so export periodically if you are not using account sync.

## Notes

This is a personal wellness tracker, not a clinical tool. Calories and maintenance estimates are starting estimates only. Steam-room and massage-gun notes are general comfort guidance; stop if you feel unwell and consult a qualified professional for injury or health concerns.