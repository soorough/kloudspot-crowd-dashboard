# Crowd Management Dashboard

A single-page dashboard for Kloudspot's Crowd Management System. It covers login, live occupancy and footfall, dwell time, demographics, visit-level entry/exit records, and real-time alerts over Socket.IO.

**Live demo:** https://kloudspot-crowd-dashboard.vercel.app · **Spec:** [`docs/SPEC.md`](docs/SPEC.md)

Sign in with one of the staging test accounts from the assessment brief.

## What it does

| Screen | What you get |
|---|---|
| **Login** | Email + password with a reveal toggle, inline "Invalid credentials" errors, client-side validation, and a pending state that blocks double submits. |
| **Overview** | **Live Occupancy** (from the socket), **Today's Footfall** (counts up on each entry alert) and **Avg Dwell Time**, each with a "% vs yesterday" indicator. Also an hourly occupancy chart with a LIVE marker, and demographics as a donut and a male/female timeline. |
| **Crowd Entries** | Paginated visits (name, sex, entry, exit, dwell). Visitors still inside show `--`, and times are in the site's local time. |
| **Alerts** | A bell with an unread count, a right-side drawer of entry/exit alerts with a severity chip, and toasts for high-severity events. |

A site picker in the top bar re-scopes everything. A day picker lets you look back at earlier days.

## Decisions worth knowing

- **"Today" means the site's day, not the viewer's.** Dubai Mall viewed from India shows Dubai's midnight-to-now. All windows are computed in the site's IANA timezone, and the US daylight-saving changeover is handled (see `src/lib/time.ts`).
- **"vs yesterday" compares the same elapsed window.** At 14:30, today's 00:00–14:30 is compared with yesterday's 00:00–14:30, not with all of yesterday. Otherwise every partial day looks like a drop.
- **No polling.** Live numbers come from the socket:
  - `live_occupancy` drives the occupancy card and the current-hour point on the chart.
  - `alert` with `zone-entry` increments footfall.
  - Everything refetches after a socket reconnect. Dwell refetches on window focus.
- **The socket is shared and filtered on the client.** The staging socket broadcasts events for every site, so one connection is opened and events are filtered by `siteId`.
- **The demographics donut shows share, not a headcount.** The API's demographic buckets are hourly averages, so summing them as people would be wrong.
- **Staging is slow under load.** Analytics calls measured 9–27s on 26 Oct 2026. To cope, requests time out at 45s, retry once, and each panel shows a "taking longer than usual" hint after 4s. One slow or failing endpoint doesn't blank the page: every card has its own loading, error/retry and empty state.
- **The simulator is not controlled from the UI.** `/api/sim/start` returns 403 for the test account, and the simulator already runs on staging.

## Design fidelity, responsiveness and motion

- **Figma values.** Sizes, weights, radii and colours were read from the Figma inspector, not eyeballed. Examples: 8px cards, 16px alert cards on a 320px drawer with a rounded top-left corner, `#0A5D5C` brand teal, and the 24/16/14px type scale.
- **Responsive layout.**
  - Phones (under 768px) get an off-canvas menu and a compact top bar.
  - Tablets (768–1023px) get an icon-only sidebar rail.
  - Desktops get the full sidebar.
  - The page never scrolls sideways, and the entries table scrolls inside its card.
- **Small touches.**
  - Numbers count up, and live values flash softly when they change.
  - Cards enter in a stagger, and the LIVE dot pulses.
  - The bell wiggles and its badge pops on new alerts.
  - The login card shakes on wrong credentials.
  - All of it is disabled when the OS asks for reduced motion.

## Stack

Vite · React 19 · TypeScript (strict) · React Router · TanStack Query · Recharts · socket.io-client · Tailwind CSS v4 · Vitest + Testing Library + MSW.

```
src/
  app/          composition root, routing, shell (sidebar + top bar)
  auth/         session: token storage, JWT expiry, API client wiring
  sites/        selected site + day → time windows for every query
  live/         one Socket.IO connection, useLiveEvent(event, handler, siteId)
  lib/          typed API client, API types, time-window maths
  features/     login · overview · entries · alerts
  test/         MSW handlers, fake socket, renderApp() harness
```

## Testing

```bash
npm test
```

There are 68 tests, built around two seams:

1. **`renderApp()`** renders the real app with real providers and routing, with MSW at the network layer and a fake Socket.IO client that tests push events into. Login, redirects, live updates, alerts, pagination and error states are all tested the way a user sees them.
2. **`src/lib/time.test.ts`** is a table of timezone boundaries (Dubai, Kolkata, Los Angeles, Tokyo, the DST changeover), comparison windows and duration formatting.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional; defaults to the staging API
npm run dev
```

`npm run build` outputs a static site in `dist/`. `vercel.json` rewrites every path to `index.html` for client-side routing.

## Not done

- **Arabic / RTL.** The En/ع toggle from the design is present, but Arabic is disabled.
- **Dark mode and end-to-end browser tests.**
- **Zone-level drill-down.** `zoneOccupancy` arrives on the socket but isn't shown yet.
- **Page size.** The Crowd Entries page uses a fixed 10 per page, matching the design.

## Credits

- Kloudspot logo, sidebar and login-card line patterns, the bell (Solar Linear), location pin and trend glyphs (Hugeicons) are exported unchanged from Kloudspot's Figma file. Typography follows the Figma inspector values (IBM Plex Sans 300–600, self-hosted).
- Login background photo: [Pexels #20988575](https://www.pexels.com/photo/monitors-on-desks-in-office-20988575/) (Pexels License). It's converted to greyscale WebP to match the Figma treatment. The original Figma photo is an image fill that view-only accounts can't export.
