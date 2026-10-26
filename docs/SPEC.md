# Spec: Kloudspot Crowd Management Dashboard

Status: implemented · Deadline: Tue 27 Oct 2026, 7:00 PM IST

## Problem Statement

Operators at a venue (mall, airport, station) cannot quickly answer basic crowd questions:

- How crowded is the site right now?
- Is today busier than yesterday?
- How long do people stay?
- Who is still inside?

The data exists behind Kloudspot's backend APIs and a Socket.IO stream, but there is no single authenticated interface that shows live occupancy, footfall, dwell, demographics and visit-level entry/exit records together.

## Solution

A single-page web app with three screens, built to the Kloudspot Figma prototype:

1. **Login**: email and password, a password visibility toggle, and an inline error on failure.
2. **Overview**: the summary cards, the occupancy timeline with a LIVE marker, and demographics as a donut and a timeline. Live values update from the socket without polling.
3. **Crowd Entries**: a paginated table of visits (name, sex, entry, exit, dwell). Visitors still inside are visible at a glance.

A global site picker sets which site every screen shows. A global day picker sets the day. An Alerts drawer streams entry/exit alerts for the selected site in real time.

## User Stories

### Authentication
1. As an operator, I want to log in with my email and password, so that only authorised people see venue data.
2. As an operator, I want my password masked with a toggle to reveal it, so that I can check what I typed without exposing it by default.
3. As an operator, I want an inline error when my credentials are wrong, so that I know to retry without losing what I typed.
4. As an operator, I want the login button disabled and showing progress while it submits, so that I don't send duplicate requests.
5. As an operator, I want to land on the Overview after logging in, so that I reach key insights in one step.
6. As an operator, I want to stay logged in across page refreshes, so that I don't log in again every time.
7. As an operator, I want to be sent back to login when my session expires or is rejected, so that I'm never stuck on a broken, half-authenticated screen.
8. As an operator, I want a Logout action in the sidebar, so that I can end my session on a shared machine.
9. As an operator who visits a protected URL while logged out, I want to be redirected to login, so that protected data is never shown.
10. As a security reviewer, I want tokens and credentials never written to logs or URLs, so that they can't leak.

### Site and day context
11. As an operator, I want to pick a site from the top bar, so that I can monitor any venue I'm responsible for.
12. As an operator, I want my chosen site remembered between visits, so that I don't reselect it every time.
13. As an operator, I want every metric, chart, table and alert to follow the selected site, so that I never mix data from two venues.
14. As an operator, I want "today" to mean the site's local calendar day, so that a Dubai venue viewed from India still shows Dubai's day.
15. As an operator, I want a day picker that defaults to Today, so that I can review a past day.
16. As an operator, I want the Overview and Crowd Entries to share the selected day, so that switching pages keeps my context.

### Overview: summary cards
17. As an operator, I want to see Live Occupancy, so that I know how many people are on site right now.
18. As an operator, I want Live Occupancy to update in real time from the stream, so that it's accurate without refreshing.
19. As an operator, I want a sensible occupancy figure before the first live event arrives, so that the card is never blank.
20. As an operator, I want Today's Footfall, so that I know how many entries happened so far today.
21. As an operator, I want footfall to count up as entry alerts arrive, so that it stays live.
22. As an operator, I want Average Dwell Time shown as minutes and seconds, so that I can read it at a glance.
23. As an operator, I want each card to show the percentage more or less than yesterday with an up or down indicator, so that I can tell whether today is busier.
24. As an operator, I want the comparison to use the same elapsed window yesterday, so that a partial day isn't unfairly compared with a full day.
25. As an operator viewing a past day, I want the cards to show that day's totals compared with the day before, and Live Occupancy relabelled as an average, so that nothing claims to be live when it isn't.

### Overview: charts
26. As an operator, I want an hourly occupancy area chart for the selected day, so that I can see how the crowd built up.
27. As an operator, I want a LIVE marker at the current time on today's chart, so that I can see where "now" is on the timeline.
28. As an operator, I want the current hour's point to update from the live stream, so that the chart and the card agree.
29. As an operator, I want the x-axis to span the whole site-local day, so that I can see how far into the day we are.
30. As an operator, I want a demographics donut showing male and female share, so that I understand who is visiting.
31. As an operator, I want a male vs female hourly area chart, so that I can see demographic shifts over the day.
32. As an operator, I want chart tooltips with the exact hour and values, so that I can read precise numbers.
33. As an operator, I want loading skeletons, empty states and error states with a retry option on each card and chart, so that one failing endpoint doesn't blank the whole dashboard.

### Crowd Entries
34. As an operator, I want a table of visits with name, sex, entry time, exit time and dwell time, so that I can audit individual movements.
35. As an operator, I want each visitor to have an initials avatar, so that the list is easy to scan.
36. As an operator, I want visitors still inside shown with "--" for exit and dwell, so that I can see who is on site.
37. As an operator, I want dwell shown as HH:MM, so that it matches the design and is easy to compare.
38. As an operator, I want times shown in the site's local time, so that they match what staff on site see.
39. As an operator, I want numbered pagination with previous/next and an ellipsis for long ranges, so that I can browse thousands of records quickly.
40. As an operator, I want the page to reset to 1 when I change site or day, so that I don't land on a page that no longer exists.
41. As an operator, I want the previous page kept on screen while the next one loads, so that the table doesn't flash empty.
42. As an operator, I want an empty state when the selected day has no visits, so that an empty table isn't mistaken for a bug.

### Alerts
43. As an operator, I want a bell in the top bar with an unread indicator, so that I know new alerts have arrived.
44. As an operator, I want a right-side Alerts drawer listing recent alerts, so that I can review movement activity without leaving the page.
45. As an operator, I want each alert to show date and time, "<Name> Entered" or "<Name> Exited", the zone and a High/Medium/Low chip, so that I can judge urgency.
46. As an operator, I want the newest alert visually highlighted, so that I can spot what just happened.
47. As an operator, I want only the selected site's alerts, so that other venues don't flood me.
48. As an operator, I want high-severity alerts to also appear as a toast, so that I notice them even with the drawer closed.
49. As an operator, I want the list capped at the most recent 50, so that the app stays fast during a long shift.
50. As an operator, I want opening the drawer to mark alerts as read, so that the indicator reflects what I haven't seen.
51. As an operator, I want a visible connection state with automatic reconnect, and a refetch of the metrics after reconnecting, so that dropped connections don't leave stale numbers.

### Layout and accessibility
52. As an operator, I want a collapsible sidebar, so that I get more room for charts on smaller desktop screens.
53. As an operator, I want the layout to scale cleanly across standard desktop viewports and still work on a laptop, so that I can use it anywhere.
54. As a keyboard user, I want every control reachable and labelled, with focus trapped in the open drawer, so that I can use the app without a mouse.
55. As an operator, I want an En/ع language toggle in the top bar matching the design, so that the interface has a clear place for Arabic later.
56. As a reviewer, I want a README with setup, architecture, decisions and known gaps, so that I can evaluate the work quickly.

## Implementation Decisions

**Stack:** Vite, React and TypeScript SPA, using React Router, TanStack Query, Recharts, socket.io-client and Tailwind. Deployed as a static site on Vercel with an SPA fallback rewrite. The API allows any origin (CORS `*`), so no proxy is needed. The API base URL comes from build-time config, and the socket uses the same origin.

**Modules (deep modules with small interfaces):**

- **API client**: one function per endpoint, returning typed results. It attaches the bearer token and maps a 401 to a single "unauthenticated" signal that the session reacts to. It never logs request headers or bodies.
- **Session**: holds the token in localStorage, checks the JWT `exp` claim on load and on a timer, and exposes `login(email, password)`, `logout()` and an `isAuthenticated` status. Protected routes depend only on this module.
- **Site context**: loads `GET /api/sites`, holds the selected site (id, name, timezone, zones) and persists the selection. Every data hook reads `siteId` and `timezone` from it.
- **Time windows**: a pure module. Given a site timezone, a selected day and "now", it returns the epoch-millisecond windows:
  - the selected-day window (local midnight to now if today, otherwise local midnight to the next midnight)
  - the comparison window (the same elapsed span one day earlier)
  - the axis domain covering the full local day

  It also formats dwell minutes as `08min 30sec` (cards) and `HH:MM` (table), and formats local times.
- **Live stream**: a single Socket.IO connection, authenticated with the token. It exposes subscriptions filtered by site for `live_occupancy` and `alert`. `sim:event` duplicates `alert` and is ignored. The socket factory is injectable so tests can drive it.
- **Overview data hooks**: footfall, dwell and occupancy for the selected and comparison windows, plus demographics. Live overlays merge socket data into the query cache: the current occupancy, the current-hour bucket, and footfall incremented on `zone-entry`.
- **Alerts store**: a list of the 50 most recent alerts per site, an unread count, mark-read, and a toast trigger for `severity === "high"`.
- **UI shell**: the sidebar, the top bar (site picker, day picker, language toggle, bell, avatar) and the Alerts drawer.

**API contract, as observed on staging on 26 Oct 2026:**

- `POST /api/auth/login {email, password}` returns `{token}`. Failure returns 401 `{errorMessage}`.
- `GET /api/sites` returns `[{siteId, name, city, country, timezone, zones:[{zoneId, name, securityLevel}]}]`. There are 5 sites.
- Every analytics `POST` requires `siteId`, `fromUtc` and `toUtc` (epoch milliseconds). Without `siteId`, it returns `{"error":"siteId required"}`.
  - `/analytics/footfall` returns `{footfall}`, a count of entry events, not unique visitors.
  - `/analytics/dwell` returns `{avgDwellMinutes, dwellRecords}`.
  - `/analytics/occupancy` returns `{timezone, buckets:[{utc, local, avg}]}`, bucketed by hour.
  - `/analytics/demographics` returns `{timezone, buckets:[{utc, local, male, female}]}`, bucketed by hour.
  - `/analytics/entry-exit {pageNumber, pageSize}` returns `{totalRecords, totalPages, pageNumber, pageSize, records:[{personId, personName, gender, zoneName, severity, entryUtc, entryLocal, exitUtc|null, exitLocal|null, dwellMinutes|null}]}`.
- Socket.IO is on the same origin as the API.
  - `alert` sends `{ts, eventId, direction:"zone-entry"|"zone-exit", personName, severity, zoneName, zoneId, siteId, siteName}`.
  - `live_occupancy` sends `{ts, siteId, siteOccupancy, zoneId, zoneOccupancy, genderCount:{male, female}}`.
  - Events are broadcast for all sites, about 1 per second.
- `GET /api/sim/start` returns 403 for the test account. The simulator is already running on staging, so the app does not try to control it.

**Metric semantics:**

- **Live Occupancy:** the latest `siteOccupancy`. Before the first event, it falls back to the latest occupancy bucket. Its comparison is against the bucket for the same hour yesterday.
- **Footfall and dwell comparisons:** the selected window against the comparison window. The percentage is rounded to a whole number, and an arrow shows the direction.
- **Demographics donut:** the male and female share summed over the day's buckets. It is labelled as a share, not a headcount, because the buckets are hourly averages.

**Freshness without polling:**

- Socket events drive live values.
- Dwell refetches on window focus.
- All queries refetch when the socket reconnects.
- Past days are fetched once and cached.

**Crowd Entries:**

- 10 rows per page, matching the Figma curl. Pages are fetched server-side.
- Numbered pagination with an ellipsis.
- Previous data is kept while the next page loads.
- The page resets when the site or day changes.

**Decisions from the Figma review (Q16–Q20):** These follow the recommended answers, adopted without explicit confirmation.

- There is one shared single-day picker.
- Alerts appear in a right-side drawer of cards.
- The Entries table follows the design exactly: no Zone column and no page-size control.
- There is no yesterday line on the chart.
- The En/ع toggle switches the UI between English and Arabic with full RTL support (added after the initial spec).

## Testing Decisions

**What makes a good test here:** It checks what the operator sees and does, such as text on screen, clicks, and navigation, given network and socket inputs. It never asserts on hook internals, query keys or component structure. Tests should survive a refactor that leaves behaviour unchanged.

**Proposed seams (fewest possible):**

1. **App harness (primary, highest seam).** It renders the whole app in jsdom. HTTP is intercepted at the network layer with MSW, using fixtures shaped like the real responses above. The live stream is replaced through its injectable socket factory with a fake emitter, so a test can push `alert` and `live_occupancy` events. Almost every behaviour is tested here, including:
   - login success and failure
   - redirecting on 401 or token expiry
   - switching site re-scoping every panel
   - live occupancy and footfall updating from the socket
   - alerts filtered by site, the drawer, the high-severity toast and the 50 cap
   - Entries pagination and "--" for visitors still inside
   - per-panel error states with retry
2. **Time-window module (secondary, pure).** It tests site-timezone day boundaries directly with a fixed "now":
   - Asia/Dubai, America/Los_Angeles and Asia/Kolkata
   - today vs a past day
   - the same-elapsed-window comparison
   - dwell formatting edge cases (0, under 1 minute, over 60 minutes, null)

   This is a separate seam only because timezone edge cases are cheaper to cover as a table than through the UI.

**Tooling:** Vitest, React Testing Library, user-event and MSW.

**Prior art:** none. This is a new standalone project with no existing tests to follow.

## Out of Scope

- Dark mode.
- E2E browser tests.
- Pixel-perfect styling beyond the Figma's layout, colours and type scale.
- Starting or stopping the simulator (the test account is not authorised).
- Admin user creation (`/api/user/create`).
- Zone-level drill-down. `zoneOccupancy` is received but not shown.
- Multi-day date ranges.
- Exporting the table.
- Mobile-first layouts. The brief targets desktop viewports, but the layout must not break on a laptop.

## Further Notes

- Figma: `figma.com/design/z5i2Uq31VuHTQvtbhIbZS6` (frames Login, Home, Crowd Entries, Notifications). The comments confirm that alerts come from Socket.IO and that the socket URL equals the server URL.
- Visual tokens from Figma: teal brand and sidebar gradient, page background `#F7F8FA`, white cards with 16px padding and 1px borders. Frames are 1440px wide.
- A Figma comment reports staging endpoints timing out. The app should use request timeouts and per-panel retry rather than failing the whole page.
- Deliverables: a public GitHub repo with a README, a live Vercel URL, and a resume link. Submitted through the Kloudspot Google Form by Tue 27 Oct, 7 PM IST.
