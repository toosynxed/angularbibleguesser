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

### Navigation findability survey (give to testers)

**Purpose:** Measure how easy it is to discover **new and improved features built for this assessment** (Part A 1.3 non-essential + essential UX goals). Useful for analysing whether navigation meets the ≤3-click target and supports user satisfaction (≥4/5).

**Instructions for testers:** Start on the home page. For each task, find the feature **without step-by-step help**. When you reach it, rate ease of finding: **0 = very hard/confusing**, **10 = very easy and intuitive**.

| # | Task (find this feature) | Assessment feature tested | Ease (0–10) | Notes (optional) |
|---|---|---|---|---|
| 1 | Open **Quest Mode** and reach the **quest map** | New game mode (town/quest progression) | [ ] | |
| 2 | From the quest map, open the **Marketplace / Shop** | User Profile Shop (scroll spending) | [ ] | |
| 3 | Open **Improved Settings** and locate **Hide other player names** | Improved settings menu | [ ] | |
| 4 | Open **Improved Settings** and locate **High contrast mode** | Contrast/accessibility option | [ ] | |
| 5 | Open **Profile customisation** (name colour, effects, background, or logo options) | Profile personalisation | [ ] | |
| 6 | Open the **AI Assistant** chat-bot and send one test message | AI-Assistant feature | [ ] | |
| 7 | Open the **Verse Board** (community verse sets) | Online Question Set “Board” | [ ] | |
| 8 | Reach **Multiplayer** (create or join a lobby) from the home screen | Real-time multiplayer / RTDB feature | [ ] | |

**Optional follow-up (for analysis):**
- Which **new feature** was hardest to find, and why?
- Did any button label feel unclear (for example “Online Modes”, “Quest Mode”, “Verse Board”)?
- How many clicks did Task 8 take? (Part A target: ≤3 while signed in)
- After finishing a multiplayer game, rate your experience **1–5 stars** (Part A target: mean ≥4/5)
- What one change would make new features easier to discover?

**How to use results in your write-up:**
- Compare average ease scores for **core new features** (Quest, Marketplace, Settings, AI) vs **secondary features** (Verse Board, Profile customisation).
- Link low scores to planned refinements (for example clearer labels, fewer nested menus, applying `hidePlayerNames` in multiplayer views).
- Use Task 8 click count + star rating together to evaluate Part A navigation and satisfaction criteria.

**Part A link:** Compare average ease scores and post-multiplayer star ratings against the ≥4/5 user-satisfaction target where applicable.

1. Start by stating that feedback was gathered during testing to improve UX against the client goals in Part A 1.1, using the post-multiplayer star rating and informal tester observations.
2. Then explain what useful feedback was found — e.g. confusion around errors, weak password acceptance, settings not visibly changing multiplayer, or positive comments on quest mode and the AI chat-bot.
3. Use evidence such as the star-rating pop-up screenshot and any tester comments; evaluate whether ratings meet the ≥4/5 target from Part A 1.4 if you have data.
4. Then describe refinements already made or planned in response, starting with the highest-priority Part A requirements: tightening Firestore/RTDB rules, strengthening password validation, extending input sanitisation.
5. Mention planned refinements for error handling visibility, wiring offline caching into verse loading, and applying `hidePlayerNames` in multiplayer views.
6. Then note lower-priority refinements such as question-board upvotes or broader settings polish.
7. Evaluate each refinement by saying what user problem or Part A objective it addresses, not just what code would change.
8. Conclude that refinements are prioritised by essential-objective importance first, with cosmetic features last.

---

## 4. Final Evaluation

1. Start by stating that this section judges the finished application against the original client scenario and objectives from Part A 1.1 and 1.3.
2. Then briefly restate the original problem (slow loading, weak security, limited scalability, no offline support) so your evaluation has a clear before-and-after comparison.
3. Then evaluate each essential objective as met, partially met or not met, using your 4.1 and 4.2 results — especially database security, sanitisation, offline support and load-time improvements.
4. Mention the main limitations honestly: open security rules, partial sanitisation/error handling, offline not end-to-end, `hidePlayerNames` not applied, no formal load test for 1,000 users.
5. Then describe the strongest successes — core scoring/multiplayer gameplay, quest mode with scrolls/marketplace, AI chat-bot, profile customisation, and improved load times over the original app.
6. Then state the most important future improvements in priority order, tied back to HIGH-priority Part A requirements.
7. Evaluate performance criteria from Part A 1.4 against what you could realistically measure, acknowledging limits of school-project testing.
8. Conclude with an honest overall judgement on whether the application meets the client's vision — improved engagement and functionality, but not yet fully meeting every essential security and offline objective.
