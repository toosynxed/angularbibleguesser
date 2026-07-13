# Section 4 — Testing and Maintaining: Paragraph Plans

Ordered dot points to expand into your own written answers. Follow each numbered list in sequence.

---

## Key requirements to reference (Part A)

- Essential objectives (1.3): database security, session management, error handling, webpage speed (≤2s), input sanitisation, real-time database (≤3s lobby load), offline capabilities.
- Performance criteria (1.4): ≤2s load, ≤200ms RTDB round-trip, ≤3 clicks to join a game, mean post-game rating ≥4/5; 1,000 concurrent users and 99.9% uptime as stretch targets.
- IPO rules (1.5): verse guess format, score = 100 − distance, password complexity, display name ≤20 chars, lobby code validation, scroll balance before purchase.

## Important evidence/issues to mention

- `firestore.rules` is currently wide open; `database.rules.json` only checks auth, not ownership.
- Password validation weaker than Part A spec; sanitisation and error handling only partly wired.
- Offline caching service exists but is not connected end-to-end; `hidePlayerNames` saves but does not apply in multiplayer.
- Quest mode, scrolls/marketplace, AI chat-bot and profile customisation are working; only limited automated tests in the repo.

---

## 1. 4.1 Acceptance Testing

Use this table as the core structure for 4.1. Keep evidence screenshots beside each row in your final report.

| Requirement | Completed? | Evaluation/analysis |
|---|---|---|
| Database security (Essential, HIGH) | No | - Firestore rules are currently open and do not enforce ownership.<br>- RTDB rules are broad (auth-only), so access control is incomplete.<br>- Fails Part A expectation of preventing unauthorised read/write changes. |
| Session management (Essential, HIGH) | Partially | - Login/profile session flow works and users can remain signed in.<br>- Need explicit session/cookie persistence evidence capture in testing.<br>- Password validation is weaker than Part A complexity intent (currently 6-char minimum). |
| Error handling (Essential, HIGH) | Partially | - `ErrorHandlingService` exists as a central service.<br>- Not all user-facing flows are wired to consistent safe messages yet.<br>- Need manual checks for invalid code, failed read/write, and offline errors. |
| Webpage speed improvements (Essential, HIGH) | Partially | - Local automated load tests (01:16) measured 1800 ms baseline; all local 1/3/5-user runs were ≤2 s.<br>- Hosted read-only tests (03:46) measured 383 ms baseline on `https://better-bibleguesser.web.app`; all hosted runs were ≤2 s.<br>- Cold-cache and end-to-end game-start timing were not measured. |
| Input sanitisation (Essential, HIGH) | Partially | - Sanitisation service exists and covers key input types.<br>- It is only wired into some input points, not all user-entry paths.<br>- Need targeted malicious input checks (for example script payloads). |
| Real-time database (Essential, MEDIUM) | Not checked | - Lobby and RTDB communication timing is pending 4.2 measurement.<br>- Need evidence for lobby load performance and RTDB latency. |
| Offline capabilities (Essential, MEDIUM) | Partially | - Offline service foundation exists (status + cache helpers).<br>- End-to-end offline gameplay support is not fully connected yet.<br>- Requires manual offline-mode verification in browser tools. |
| New game mode (Non-essential, HIGH) | Yes | - Additional game mode content is present and reachable in UI.<br>- Supports claim that non-essential feature expansion has started. |
| Improved settings menu incl. hide player names (Non-essential, LOW) | Partially | - Settings options are present and stored.<br>- `hidePlayerNames` is saved but not fully applied across multiplayer display paths. |
| User profile shop / scroll spending (Non-essential, LOW) | Partially | - Marketplace and purchase flow are available from Quest mode.<br>- Need a final acceptance check that insufficient scrolls reliably prevents purchases every time. |

---

## 2. 4.2 Load Testing

**Testing scope**

- Automated tests used `testing/load/run-local-load.js` at two targets:
  - **Local (standard mode):** `http://localhost:4200` — includes game navigation clicks.
  - **Hosted (read-only mode):** `https://better-bibleguesser.web.app` — page load, public routes, visible rendering only; no writes or state changes.
- Loads were limited to 1, 3 and 5 simulated users (baseline, small, medium).
- This provides comparative small-scale evidence rather than production-scale certification.
- Valid local result files: `load-1u-2026-07-11T01-16-33-885Z`, `load-3u-2026-07-11T01-16-37-472Z`, `load-5u-2026-07-11T01-16-41-364Z`.
- Valid hosted read-only result files: `load-1u-2026-07-11T03-46-07-027Z`, `load-3u-2026-07-11T03-46-08-321Z`, `load-5u-2026-07-11T03-46-09-980Z`.

### Local automated testing (`http://localhost:4200`, standard mode)

#### Scenario 1 — App/page load flow

| Step | Response time |
|---|---|
| Initial page load — 1 user baseline | 1800 ms |
| Initial page load — 3 concurrent users (user 1) | 1238 ms |
| Initial page load — 3 concurrent users (user 2) | 1222 ms |
| Initial page load — 3 concurrent users (user 3) | 1719 ms |
| Initial page load — 5 concurrent users (user 1) | 1927 ms |
| Initial page load — 5 concurrent users (user 2) | 1331 ms |
| Initial page load — 5 concurrent users (user 3) | 1908 ms |
| Initial page load — 5 concurrent users (user 4) | 1316 ms |
| Initial page load — 5 concurrent users (user 5) | 1365 ms |

**Analysis of outcome**

- This scenario tested initial home-page readiness at `/` after network idle and UI marker detection.
- The 1-user baseline was 1800 ms; 3-user timings ranged 1222–1719 ms; 5-user timings ranged 1316–1927 ms.
- Against Part A initial load target (≤2 s), all measured runs passed, but the 5-user maximum (1927 ms) is close to the limit.
- Fastest measured step in this scenario: 1222 ms (3 concurrent users, user 2).
- Slowest measured step in this scenario: 1927 ms (5 concurrent users, user 1).
- Response times did not worsen consistently with load; 3-user runs were often faster than the 1-user baseline, likely due to warm local caching.
- RTDB communication (≤200 ms), multiplayer lobby load (≤3 s), and signed-in click-count targets were not measured in this automated run.
- The application remained stable for this scenario (all rows passed, no script errors).
- 1,000 concurrent users and 99.9% uptime were not genuinely verified in this local test scope.
- Recommendation: keep initial bundle/page-load optimisations and re-check under colder cache conditions before claiming production readiness.

### Scenario 2 — Normal game/navigation flow

| Step | Response time |
|---|---|
| Home to game route — 1 user baseline | 176 ms |
| Home to game route — 3 concurrent users (user 1) | 129 ms |
| Home to game route — 3 concurrent users (user 2) | 138 ms |
| Home to game route — 3 concurrent users (user 3) | 114 ms |
| Home to game route — 5 concurrent users (user 1) | 178 ms |
| Home to game route — 5 concurrent users (user 2) | 274 ms |
| Home to game route — 5 concurrent users (user 3) | 214 ms |
| Home to game route — 5 concurrent users (user 4) | 260 ms |
| Home to game route — 5 concurrent users (user 5) | 162 ms |

**Analysis of outcome**

- This scenario tested navigation from home to Normal Mode and route readiness at `/game`.
- The 1-user baseline was 176 ms; 3-user timings ranged 114–138 ms; 5-user timings ranged 162–274 ms.
- This flow is much faster than Part A initial-load criteria and does not directly measure RTDB round-trip (≤200 ms).
- Fastest measured step in this scenario: 114 ms (3 concurrent users, user 3).
- Slowest measured step in this scenario: 274 ms (5 concurrent users, user 2).
- Response times increased modestly at 5 users compared with the 1-user baseline, but all values remained low.
- Full in-game start timing (verse load + first playable round) was not automated and remains a manual check.
- The application remained stable for this scenario (all rows passed, no script errors).
- 1,000 concurrent users and 99.9% uptime were not genuinely verified in this local test scope.
- Recommendation: add one manual timing from click-to-first-verse-render to confirm end-to-end game-start performance.

### Scenario 3 — Quest/marketplace flow

| Step | Response time |
|---|---|
| Quest to marketplace ready — 1 user baseline | 1320 ms |
| Quest to marketplace ready — 3 concurrent users (user 1) | 1331 ms |
| Quest to marketplace ready — 3 concurrent users (user 2) | 1373 ms |
| Quest to marketplace ready — 3 concurrent users (user 3) | 1325 ms |
| Quest to marketplace ready — 5 concurrent users (user 1) | 1335 ms |
| Quest to marketplace ready — 5 concurrent users (user 2) | 1368 ms |
| Quest to marketplace ready — 5 concurrent users (user 3) | 1272 ms |
| Quest to marketplace ready — 5 concurrent users (user 4) | 1331 ms |
| Quest to marketplace ready — 5 concurrent users (user 5) | 1417 ms |

**Analysis of outcome**

- This scenario tested route readiness for `/quest` then `/marketplace`.
- The 1-user baseline was 1320 ms; 3-user timings ranged 1325–1373 ms; 5-user timings ranged 1272–1417 ms.
- Against Part A multiplayer lobby target (≤3 s), these route timings are within range, but this is not a true multiplayer lobby join test.
- Fastest measured step in this scenario: 1272 ms (5 concurrent users, user 3).
- Slowest measured step in this scenario: 1417 ms (5 concurrent users, user 5).
- Response times stayed relatively stable as user load increased, with only a small upward trend at 5 users.
- Marketplace purchase interaction timing and insufficient-scroll blocking were not automated in this script run.
- The application remained stable for this scenario (all rows passed, no script errors).
- 1,000 concurrent users and 99.9% uptime were not genuinely verified in this local test scope.
- Recommendation: run a separate manual multiplayer lobby join timing test to validate real-time database behaviour under concurrent users.

### Hosted read-only automated testing (`https://better-bibleguesser.web.app`)

Read-only mode: initial page load, public route navigation (`/quest`, `/marketplace`), and visible home rendering only. All 15 hosted rows passed (pass=15, fail=0).

#### Scenario 1 — App/page load flow (hosted)

| Step | Response time |
|---|---|
| Initial page load — 1 user baseline | 383 ms |
| Initial page load — 3 concurrent users (user 1) | 499 ms |
| Initial page load — 3 concurrent users (user 2) | 489 ms |
| Initial page load — 3 concurrent users (user 3) | 489 ms |
| Initial page load — 5 concurrent users (user 1) | 436 ms |
| Initial page load — 5 concurrent users (user 2) | 422 ms |
| Initial page load — 5 concurrent users (user 3) | 421 ms |
| Initial page load — 5 concurrent users (user 4) | 428 ms |
| Initial page load — 5 concurrent users (user 5) | 425 ms |

**Analysis of outcome**

- This scenario tested initial home-page readiness on the deployed Firebase Hosting URL.
- The 1-user baseline was 383 ms; 3-user timings ranged 489–499 ms; 5-user timings ranged 421–436 ms.
- Against Part A initial load target (≤2 s), all hosted runs passed with large margin.
- Fastest measured step in this scenario: 383 ms (1 user baseline).
- Slowest measured step in this scenario: 499 ms (3 concurrent users, user 1).
- Response times increased at 3 users then decreased slightly at 5 users compared with the 3-user peak.
- RTDB communication, multiplayer lobby join, and signed-in click-count were not measured in read-only mode.
- The application remained stable (all rows passed, no script errors).
- 1,000 concurrent users and 99.9% uptime were not genuinely verified.
- Recommendation: use these hosted page-load figures as deployment evidence; pair with manual RTDB/lobby tests for full Part A coverage.

#### Scenario 2 — Public route navigation (hosted read-only)

| Step | Response time |
|---|---|
| Quest to marketplace routes ready — 1 user baseline | 164 ms |
| Quest to marketplace routes ready — 3 concurrent users (user 1) | 224 ms |
| Quest to marketplace routes ready — 3 concurrent users (user 2) | 299 ms |
| Quest to marketplace routes ready — 3 concurrent users (user 3) | 279 ms |
| Quest to marketplace routes ready — 5 concurrent users (user 1) | 578 ms |
| Quest to marketplace routes ready — 5 concurrent users (user 2) | 624 ms |
| Quest to marketplace routes ready — 5 concurrent users (user 3) | 622 ms |
| Quest to marketplace routes ready — 5 concurrent users (user 4) | 583 ms |
| Quest to marketplace routes ready — 5 concurrent users (user 5) | 611 ms |

**Analysis of outcome**

- This scenario tested navigation to `/quest` then `/marketplace` on the hosted site without triggering purchases or writes.
- The 1-user baseline was 164 ms; 3-user timings ranged 224–299 ms; 5-user timings ranged 578–624 ms.
- All runs were well under Part A’s 3 s lobby-load proxy, but this is route navigation only, not a true multiplayer lobby join.
- Fastest measured step in this scenario: 164 ms (1 user baseline).
- Slowest measured step in this scenario: 624 ms (5 concurrent users, user 2).
- Response times increased clearly as concurrent load rose from 1 to 5 users.
- Marketplace purchase and insufficient-scroll checks were not run in read-only mode.
- The application remained stable (all rows passed, no script errors).
- 1,000 concurrent users and 99.9% uptime were not genuinely verified.
- Recommendation: run manual multiplayer lobby join timing separately for real RTDB behaviour.

#### Scenario 3 — Visible page rendering (hosted read-only)

| Step | Response time |
|---|---|
| Home visible render ready — 1 user baseline | 67 ms |
| Home visible render ready — 3 concurrent users (user 1) | 73 ms |
| Home visible render ready — 3 concurrent users (user 2) | 56 ms |
| Home visible render ready — 3 concurrent users (user 3) | 69 ms |
| Home visible render ready — 5 concurrent users (user 1) | 190 ms |
| Home visible render ready — 5 concurrent users (user 2) | 170 ms |
| Home visible render ready — 5 concurrent users (user 3) | 181 ms |
| Home visible render ready — 5 concurrent users (user 4) | 184 ms |
| Home visible render ready — 5 concurrent users (user 5) | 168 ms |

**Analysis of outcome**

- This scenario tested that key home UI elements (buttons, logo) render visibly on the hosted site.
- The 1-user baseline was 67 ms; 3-user timings ranged 56–73 ms; 5-user timings ranged 168–190 ms.
- All values are far below Part A load-time targets; this confirms UI becomes visible quickly after navigation.
- Fastest measured step in this scenario: 56 ms (3 concurrent users, user 2).
- Slowest measured step in this scenario: 190 ms (5 concurrent users, user 1).
- Response times increased at 5 users compared with 1 and 3 users, but remained low overall.
- Full game interaction and verse rendering were not tested in read-only mode.
- The application remained stable (all rows passed, no script errors).
- 1,000 concurrent users and 99.9% uptime were not genuinely verified.
- Recommendation: treat this as UI responsiveness evidence; manual game-start timing still needed for complete coverage.

### Manual testing (Part A criteria not covered by Playwright)

#### Manual scenario — Clicks to join a game

| Step | Response time/result |
|---|---|
| Signed-in click count from home to joined game | [Enter measured result] |

**Analysis points**

- Part A target: no more than 3 clicks while signed in.
- Sign in, then count every click from home until you are in an active game (for example: Online Modes → Multiplayer → Join lobby).
- Screenshot the click path and final game/lobby screen with the click count noted.
- Result placeholder: `[Enter measured result]`.
- Limitation: click path can vary by mode and tutorial prompts, so test one consistent signed-in path and state it clearly.

#### Manual scenario — Multiplayer lobby load time

| Step | Response time/result |
|---|---|
| Click join/create lobby to lobby fully loaded | [Enter measured result] |

**Analysis points**

- Part A target: multiplayer lobby accessible and loaded within 3 seconds (standardised 20 Mb/s connection).
- Time from join/create action until lobby UI is fully interactive; repeat 3 times and record average.
- Screenshot or screen recording with visible timer/stopwatch and loaded lobby state.
- Result placeholder: `[Enter measured result]`.
- Limitation: local `localhost` timing may differ from deployed network conditions.

#### Manual scenario — Realtime database communication

| Step | Response time/result |
|---|---|
| RTDB write/read round-trip (lobby or stats update) | [Enter measured result] |

**Analysis points**

- Part A target: database-client communication approximately 200 ms on standardised connection (20 Mb/s, ~25 ms ping).
- Use browser DevTools Network/Firebase request timing for one representative RTDB read and one write during multiplayer or stats flow.
- Screenshot DevTools timing panel showing request duration.
- Result placeholder: `[Enter measured result]`.
- Limitation: emulator/local Firebase behaviour may not match production latency exactly.

#### Manual scenario — Firebase read/write usage

| Step | Response time/result |
|---|---|
| Reads during one normal session | [Enter measured result] |
| Writes during one normal session | [Enter measured result] |
| Comparison to documented quota | [Enter measured result] |

**Analysis points**

- Part A reference quota (Blaze): 100,000 reads/day (10,000/hour) and 20,000 writes/day (5,000/hour).
- Run one normal test session (login, one game, one multiplayer attempt), then check Firebase console usage before/after.
- Screenshot Firebase usage panel with date/time and read/write counts visible.
- Result placeholders: `[Enter measured result]` for session reads, writes, and quota comparison.
- Limitation: short school testing sessions will not stress quota limits; this is evidence of normal usage only.

#### Manual scenario — Uptime and 1,000 concurrent users

| Step | Response time/result |
|---|---|
| School-hours uptime (8:00–16:00) | Not fully verifiable at school-project scale |
| 1,000 concurrent users support | Not fully verifiable at school-project scale |

**Analysis points**

- Part A targets: 99.9% uptime during school hours and support for at least 1,000 concurrent users.
- Explain that these require production monitoring and enterprise load infrastructure, not available in this project scope.
- Optional evidence: hosting/Firebase status page screenshot plus statement that only 1/3/5 local and hosted read-only simulated users were tested.
- Result placeholders are intentionally marked as not fully verifiable rather than invented.
- Limitation: local 1–5 user tests cannot certify uptime or large-scale concurrency.

---

## 3. User Feedback and Refinements

### Navigation findability survey — summary of responses

**Method:** 4 testers started on the home page and rated ease of finding each assessment feature (0 = very hard, 10 = very easy). Scores from `Better Bible Guesser - User Feedback Form.csv`.

| # | Task | Assessment feature | T1 | T2 | T3 | T4 | Average |
|---|---|---|---|---|---|---|---|
| 1 | Locate and toggle **High contrast mode** | Contrast / accessibility | 8 | 8 | 9 | 7 | **8.00** |
| 2 | Locate and open the **Marketplace / Shop** | User Profile Shop (scrolls) | 1 | 7 | 1 | 8 | **4.25** |
| 3 | Locate, open and play one game from the **Verse Board** | Online Question Set Board | 8 | 10 | 9 | 8 | **8.75** |
| 4 | Locate and open the **Quest Map** | New game mode (Quest) | 8 | 10 | 10 | 9 | **9.25** |
| 5 | Locate and open **Profile customisation** | Profile personalisation | 8 | 8 | 4 | 9 | **7.25** |
| 6 | Locate and toggle **Hide other player names** | Improved settings menu | 8 | 8 | 9 | 7 | **8.00** |
| 7 | Locate and create/join a **Multiplayer** game | Real-time multiplayer / RTDB | 8 | 10 | 8 | 9 | **8.75** |
| 8 | Locate the **AI Assistant**, send a message and get a reply | AI-Assistant | 7 | 10 | 10 | 8 | **8.75** |

**Overall average across all tasks:** **7.88 / 10** (n = 4 testers).

**Highest-scoring task:** Quest Map (9.25).  
**Lowest-scoring task:** Marketplace / Shop (4.25).

---

### Per-question analysis and proposed refinements

#### Q1 — High contrast mode (avg 8.00)

- Scores were consistently high (7–9), so most testers could find Settings and the high-contrast toggle.
- Possible issue: Settings is a secondary button on the home page, so slightly lower scores may reflect one extra navigation step rather than a confusing label.
- Proposed change: keep Settings on the home screen; optionally add a short accessibility note in the Settings subtitle so the contrast option is more obvious once inside.

#### Q2 — Marketplace / Shop (avg 4.25) — priority refinement

- Two testers scored **1/10**, which dragged the average far below every other task.
- Likely issues: Marketplace is nested inside Quest Mode as a map icon (not labelled as “Shop” on the home page), so users who do not open Quest first may never discover it; the map-icon interaction may also be unclear on desktop/mobile.
- Proposed changes: add a direct “Marketplace” or “Shop” entry from Quest header or home; add a visible label/tooltip on the marketplace map icon; optionally deep-link `/marketplace` from a home or profile button.

#### Q3 — Verse Board (avg 8.75)

- Strong findability; Verse Board is reachable from the home header actions and testers could also start a game from a set.
- Possible issue: the header icon may still be less obvious than primary mode buttons for first-time users.
- Proposed change: keep current placement; if expanding later, add a short “Play community sets” hint under Online Modes.

#### Q4 — Quest Map (avg 9.25) — strongest result

- Highest average; the `*NEW* Quest Mode` home button is clearly discoverable.
- Possible issue: little evidence of confusion here; the main remaining risk is what users do after entering the map (see Marketplace).
- Proposed change: once on the map, add short labels under each location icon so nested features inherit Quest’s strong discovery score.

#### Q5 — Profile customisation (avg 7.25)

- Mostly strong, but one tester scored **4/10**, showing inconsistent discoverability.
- Likely issues: customisation is buried behind Profile/Login and a secondary “customise” action; anonymous users may be blocked or redirected into login first.
- Proposed changes: surface a “Customise profile” button more clearly on the profile page; allow preview of options before login where possible; add a Quest/header shortcut to customisation.

#### Q6 — Hide other player names (avg 8.00)

- Similar pattern to High contrast: Settings itself is easy enough to find once testers look for it.
- Possible issue: even if the toggle is found, acceptance testing showed `hidePlayerNames` is saved but not fully applied in multiplayer templates, so findability may outpace actual usefulness.
- Proposed change: wire the setting into multiplayer name rendering so finding and using the option produces a visible result.

#### Q7 — Multiplayer create/join (avg 8.75)

- Testers generally found Online Modes → Multiplayer without major difficulty, supporting Part A’s navigation/satisfaction goals.
- Possible issue: the extra “Online Modes” nesting still adds a click versus a direct Multiplayer button; tutorial prompts for signed-in users may also add friction.
- Proposed change: consider promoting Multiplayer to a top-level home button, or keep Online Modes but make Multiplayer the first/highlighted option.

#### Q8 — AI Assistant chat-bot (avg 8.75)

- Strong scores once testers noticed the floating chat-bot UI.
- Possible issue: a floating widget can be overlooked if it overlaps other controls or looks like non-interactive chrome.
- Proposed change: keep the floating entry point, but add a brief first-visit tooltip (“Ask the AI for verse-set help”) and ensure it does not cover primary home buttons on mobile.

---

### Paragraph-ready summary (expand in order)

1. Start by stating that user feedback was collected through a navigation findability survey with **4 testers**, each rating 8 assessment-feature tasks from 0 (hard) to 10 (easy), producing an overall mean of **7.88/10**.
2. Then present the summary table and highlight the range: Quest Map was easiest (**9.25**), while Marketplace/Shop was hardest (**4.25**), with most other features clustering between about **7 and 9**.
3. Explain that high scores for Quest Mode, Verse Board, Multiplayer and the AI Assistant show that primary home-page and floating entry points are generally intuitive for new assessment features.
4. Analyse Marketplace as the main UX failure: two testers scored **1/10**, suggesting the shop is too nested (only reachable via Quest map icons) and poorly labelled for first-time users.
5. Analyse Profile customisation as a secondary weak spot (**7.25**, including one **4/10**), likely because it is hidden behind Profile/Login rather than presented as a clear customisation destination.
6. Note that Settings tasks (High contrast and Hide player names) scored solidly (**8.00** each), but connect this to the acceptance-testing finding that `hidePlayerNames` is not yet applied in multiplayer views, so discoverability alone does not complete the feature.
7. Link the results to Part A user-satisfaction goals: mean findability near **8/10** supports improved engagement, while Marketplace discoverability fails the client goal of making new modes and shop progression easy to use.
8. Describe planned refinements in priority order: (1) add a clearer Marketplace/Shop entry and map labels, (2) surface Profile customisation more directly, (3) apply `hidePlayerNames` in multiplayer UI, (4) optionally promote Multiplayer / add an AI first-use tip.
9. Conclude that refinements should focus on nested or poorly labelled new features first, while retaining the strong home-page discovery patterns already working for Quest Mode and other primary actions.

---

## 4. Final Evaluation

- Conclude that the testing and maintaining process was effective overall: a structured test plan (acceptance testing, load testing and a user findability survey) was developed, expected outcomes were compared against actual results, and feedback was synthesised into clear refinement priorities.
- State that comparing expected versus actual output showed where the solution succeeded (for example core navigation, major new features and measured page-load performance) and where it fell short (for example nested Marketplace discovery and incomplete wiring of some supporting behaviours).
- Explain that synthesising the four tester responses into averages and per-feature analysis made user feedback usable for decision-making, not just informal comments.
- Finish with a general judgement: the software engineering solution is effective as a tested, feedback-informed prototype, but continued development should focus on the gaps revealed when actual results did not match expected outcomes.
