# AT3B Walkthrough Video Script

## 1. Video objective and scope

This video demonstrates the **final Part B version** of Better Bible Guesser. It only covers features that were **added or substantially changed during the AT3B development period** (measured from base commit `a9373c353c053fbd34117b6ad1a31771917063e2` to the current `HEAD`).

- The focus is on **what the finished application does and how a user interacts with it** — not on the development process, Git history, or any coding assistance used along the way.
- **No Part A content** (diagrams, DFDs, pseudocode, IPO models, or Part A planning) is included.
- Pre-existing (pre-AT3B) functionality — e.g. Normal Mode, Custom/Create Mode, Daily Challenge, the core multiplayer lobby engine — is only shown briefly where it is needed to **navigate to** or **provide context for** an AT3B feature. It is not presented as new AT3B work.
- The video is structured around the five Part B categories: **User Interface, Core Features, Data Management, Security Features, AI/Advanced Features**, followed by a short testing/evaluation section.
- Total runtime target: **~12–13 minutes**, safely under the 15-minute limit.

---

## 2. Features included

| Category | Feature to demonstrate | Evidence it belongs to AT3B | Completion status |
|---|---|---|---|
| User Interface | Quest Map hub (`/quest`) with icon navigation to Racetrack/Academy/Marketplace/Castle | New files: `quest-mode.component.ts/html/css`, new assets `quest-map.png`, `racetrack-icon.png`, `academy-icon.png`, `marketplace-icon.png`, `castle-icon.png` | Complete (Castle icon leads to an "under development" notice — see below) |
| User Interface | Shared design system (page shell, page header, quest header, cards, buttons, modal, tables) applied across new pages | New: `src/styles/tokens.css`, `buttons.css`, `cards.css`, `modal.css`, `quest.css`, `tables.css`, `layout.css`, `header.css`, `floating-actions.css`; new `shared/page-shell`, `shared/page-header`, `shared/quest-header`, `shared/modal`, `shared/floating-action-button` components | Complete |
| User Interface | Improved Settings page — high contrast, font scale, theme, audio toggles | New: `src/app/features/improved-settings/*`, routed at `/settings` in `app-routing.module.ts` | Complete (accessibility toggles have a visible effect; "hide other player names" is stored but not yet wired into multiplayer views — see limitation note) |
| Core Features | Racetrack — daily timed verse challenges (Easy/Medium/Hard) with Scroll rewards | New: `racetrack.service.ts`, `quest-mode/racetrack/*`, reward logic added in `results.component.ts` | Complete |
| Core Features | Academy — curated video lesson + 5-question multiple-choice quiz | New: `quest-mode/academy/*`, `academy-video-sets.config.ts` | Complete (does not currently award Scrolls — known, documented limitation) |
| Core Features | Marketplace — deterministic daily cosmetic shop spending Scrolls | New: `quest-mode/marketplace.component.*`, `marketplace-bitmask.ts`, `marketplace-daily.service.ts` | Complete |
| Core Features | Profile Customisation — name colour/effect/nameplate/icon, gated by Marketplace ownership | Changed: `profile-customization.component.ts/html/css` now reads `BitMarket` bitmask via `marketplace-bitmask.ts` | Complete |
| Core Features | Verse/Question-set board — community list of shared sets with plays/rounds/author | New: `sets.service.ts`, `sets.model.ts` (documented in new `wiki/Verse-Board.md`) | Complete |
| Core Features | Multiplayer lobby waiting-room mini-game | New: `features/lobby-mini-game/*`, embedded in `multiplayer/lobby.component.html` | Complete (needs a second browser/session to view as non-host) |
| Data Management | Firestore data model for Scrolls, BitMarket, Racetrack/Daily stats, question sets, daily seeds | New/changed: `scrolls.service.ts`, `stats.model.ts`, `sets.model.ts`, `auth.service.ts` (`updateUserCollection`) | Complete |
| Data Management | Deterministic bitmask + seeded-random data design (compact ownership storage, no per-user daily writes) | New: `marketplace-bitmask.ts` | Complete |
| Data Management | Realtime Database presence for multiplayer lobbies (pre-existing engine, shown briefly for RTDB evidence) | Unchanged: `lobby.service.ts`; rules file `database.rules.json` | Pre-existing — shown only as RTDB evidence, not claimed as new AT3B work |
| Security Features | Firebase Authentication (anonymous → Google/email upgrade, stat merging, reauthentication) | Changed: `auth.service.ts` (scrolls/BitMarket initialisation added to sign-up/sign-in flows) | Complete |
| Security Features | Input sanitisation service (XSS-pattern stripping, format validation) | New: `features/input-sanitisation/*`; wired into `classic-input.component.ts` and `home.component.ts` (game code join) | Partially complete — two entry points wired in, `validateDisplayName()` not yet used on the display-name fields |
| Security Features | Global error handling service (severity levels, safe user messages vs technical messages) | New: `features/error-handling/*`; registered as Angular's `ErrorHandler` in `app.module.ts` | Partially complete — active in the background, no visible banner UI yet |
| Security Features | Firestore security rules — currently fully open to any reader/writer | Changed: `firestore.rules` | Known gap — must be disclosed honestly, not claimed as secure |
| Security Features | Realtime Database rules — require authentication | `database.rules.json` (`auth != null` for read/write) | Complete, contrasted against the Firestore gap |
| Security Features | Cloud Function keeps the Gemini API key server-side, never sent to the client | New: `functions/src/index.ts` | Complete |
| Security Features | Client-side admin gating (hardcoded UID allow-list) | Changed: `auth.service.ts` `isAdmin()`, `admin/admin-panel/*` | Partially complete — enforced only in the Angular client, not backed by matching Firestore rules |
| AI/Advanced Features | AI chatbot (Gemini via Cloud Function), page/stat-aware, spoiler-safe system prompt | New: `chat-bot/*`, `chat.service.ts`, `functions/src/index.ts` | Complete (depends on a live external API key — see backup plan) |
| AI/Advanced Features | Deterministic daily Racetrack sets + reward formula (score/stars/speed weighting) | New: `racetrack.service.ts` | Complete |
| AI/Advanced Features | Deterministic per-user daily Marketplace item selection (seeded PRNG) | New: `marketplace-bitmask.ts`, `marketplace-daily.service.ts` | Complete |
| AI/Advanced Features | Admin "Reset Shop" control (regenerates the shared daily seed) | Changed: `admin-panel.component.ts` | Complete (requires an admin account) |
| — | "Castle of Champions" quest icon | Present in `quest-mode.component.ts` (`movePage` shows an alert) | Unsuitable for demonstration — not implemented beyond a placeholder notice; mention only in passing |
| — | Offline capabilities scaffold (online/offline detection, localStorage cache helper) | New: `features/offline-capabilities/*` | Partially complete — no visible UI hook yet; excluded from the timed demo for lack of visible evidence |

---

## 3. Pre-recording setup checklist

**Decide localhost vs deployed site**
- Recommended: **deployed Firebase Hosting site** (`https://better-bibleguesser.web.app`), because the AI chatbot depends on a deployed Cloud Function with a working `GEMINI_API_KEY`, which is simpler to guarantee on the live site than on a freshly-started emulator. [Verify before recording: confirm the live Cloud Function currently returns a chatbot response — the load-test logs in `testing/load/results/` show many failed automated checks against the live site, which may be script/selector issues rather than app breakage, but confirm manually first.]
- If you use **localhost** instead, you must run the app locally and, if you want the chatbot to work, configure `functions/.env` (or `firebase functions:config:set`) with a valid `GEMINI_API_KEY` first. Do not show or read out this key on screen.

**Terminal commands to run beforehand**
```bash
npm install
```
Then, depending on your choice above:
```bash
# Option A: local dev server only (chatbot/admin features need Firebase project access anyway)
npm start          # runs "ng serve" on http://localhost:4200

# Option B: local dev server + Firebase emulators (auth, firestore, RTDB, functions, hosting)
export NODE_TLS_REJECT_UNAUTHORIZED=0
firebase emulators:start
```
- Firebase emulators are **only required** if you are demonstrating locally and want Firestore/RTDB/Functions to run against emulated (not production) data.
- If demonstrating on the deployed site, **no local server or emulator is required** — just open the live URL in the browser.

**Test accounts to prepare (do not record real passwords)**
- One **email/password test account** you can sign in with on screen (create it ahead of time; type the password quickly and do not say it aloud).
- One account whose UID is already present in `auth.service.ts`'s `adminUids` list, so the admin panel and "Reset Shop" button are visible. [Verify before recording: confirm which of your accounts, if any, matches one of the five UIDs already hard-coded in `adminUids`. If none of your accounts match, you cannot create a new admin account without modifying application code, so the admin segment must be marked "skip" or demonstrated read-only via code reference instead of live interaction.]
- A small amount of **Scrolls balance** on the demo account before recording, earned by playing one Racetrack set ahead of time, so the Marketplace purchase flow has something to spend without waiting on-camera.

**Second browser/private window requirements**
- Needed for the **multiplayer lobby mini-game** segment only: open the app in a second browser profile or private/incognito window, join the same lobby code as a non-host, so the mini-game is visible on the "waiting for host" screen.

**Routes/pages to preload (open as tabs ahead of time)**
1. `/` (Home)
2. `/quest` (Quest Map)
3. `/racetrack`
4. `/academy`
5. `/marketplace`
6. `/profile`
7. `/settings`
8. `/multiplayer` (plus the second window/tab for the joined lobby)

**Recommended tab/window order for smooth switching**
- **Window 1, left-to-right tabs:** Home → Quest Map → Racetrack → Academy → Marketplace → Profile → Settings → Multiplayer (host).
- **Window 2 (private/second profile):** Multiplayer (joined as guest) — used only during the multiplayer mini-game segment, then switch back to Window 1.
- Keep the Firebase Console tab (if used for Data Management evidence) in a **separate third window** so it is not accidentally shown during the main app tour.

**Test data and values to prepare**
- A known verse reference you can type quickly and correctly for the Racetrack demo (e.g. one from Genesis or John), so the round completes with a good score on the first try.
- Confirm at least one Academy lesson set has a working embedded video (check `academy-video-sets.config.ts` list) before recording, and pick that set specifically. [Verify before recording.]
- Confirm your demo account's Scroll balance is high enough to afford at least one Marketplace item on screen.

**Browser tabs / notifications / privacy preparation**
- Close unrelated tabs, mute or disable OS/browser notifications, and turn off any bookmarks bar or extensions that reveal personal information.
- Set browser zoom to 100–110% so on-screen text is readable in a recording.
- Sign out of any personal Google account not intended for the demo, so the Google sign-in popup (if shown) does not expose a real email address unintentionally.

**Fallback screenshots for unreliable live features**
- Prepare one fallback screenshot of a successful chatbot reply, in case the live Gemini call fails or times out during recording.
- Prepare one fallback screenshot of the admin panel / Reset Shop confirmation, in case the demo account is not on the admin allow-list at recording time.

---

## 4. Timed walkthrough plan

| Approximate time | Category or feature | What to show | Key explanation | Rubric evidence |
|---|---|---|---|---|
| 0:00–0:35 | Introduction | Home page | What the app is and what this video covers | Video objective/scope |
| 0:35–1:30 | User Interface | Quest Map (`/quest`), point out shared header/cards/icons | Redesigned navigation hub and shared design system | UI category, "clear and engaging video" |
| 1:30–2:30 | Core Features | Racetrack (`/racetrack`) — pick a difficulty, play, finish | Daily timed challenges and Scroll reward on completion | Core Features category |
| 2:30–3:45 | Core Features | Academy (`/academy`) — pick a set, skip/play video, complete quiz | Video lesson + multiple-choice quiz flow | Core Features category |
| 3:45–4:45 | Core Features | Marketplace (`/marketplace`) then Profile → Customize | Spend Scrolls, then apply the unlocked cosmetic | Core Features category |
| 4:45–5:30 | User Interface / Core Features | Settings (`/settings`) — toggle high contrast and font scale | Accessibility preferences with a visible effect | UI category (accessibility) |
| 5:30–6:15 | Core Features | Multiplayer lobby, second window joins as guest | Waiting-room mini-game while non-host waits | Core Features category |
| 6:15–7:45 | Data Management | Briefly narrate Firestore collections (users/sets/racetrack_sets/daily_market_seeds) and RTDB lobby presence | What data lives where, and why | Data Management category |
| 7:45–9:45 | Security Features | Auth upgrade, input validation, Firestore rules gap, RTDB rules, Cloud Function secret | What protections exist and what still needs work | Security Features category (teacher-required) |
| 9:45–11:15 | AI/Advanced Features | Chatbot conversation, admin Reset Shop | AI assistant and deterministic daily-content algorithms | AI/Advanced Features category |
| 11:15–12:15 | Testing and evaluation | Brief mention of acceptance tests and one honest limitation | Final judgement of the finished app | Overall demonstration quality |
| 12:15–12:45 | Conclusion | Home page | Wrap-up | Overall demonstration quality |

---

## 5. Full spoken script with screen cues

### Segment 1 — Introduction

**On screen**
- Route: `/` (Home)
- Action: Sit on the home page for a few seconds, no clicking yet.
- Successful result: Home page loads with the game's mode selection visible.

**What to say**
"Hi, I'm going to walk you through the final version of my Software Engineering Part B project, Better Bible Guesser. This video covers the features I built and finished during this development phase — the Quest Mode system with Racetrack, Academy and the Marketplace, the updated interface, how data is stored, the security protections I added, and an AI chatbot feature. I'll go through each part of the application and show how it actually works, rather than just describing it."

**Evidence checkpoint**
- Establishes scope: Part B application only, under 15 minutes, sets up all five categories.

---

### Segment 2 — User Interface: Quest Map and design system

**On screen**
- Route: `/quest`
- Action: Click through from Home into Quest Mode; hover/point at the icons for Racetrack, Academy, Marketplace and Castle without clicking Castle yet.
- Successful result: Quest map image loads with four icon buttons and a Scroll balance visible in the header.

**What to say**
"This is the Quest Map, the hub for a set of mini-game modes I added this phase. Each icon takes you to a different activity — Racetrack, Academy, and the Marketplace — and along the top you can see my Scroll balance, which is the currency these modes share. I rebuilt the visual design around a consistent set of shared components — a page header, page shell and card styles — so every one of these new screens looks and behaves the same way instead of each being a one-off page. There's also a fourth icon, Castle of Champions, which is still marked as under development, so I won't be demonstrating it today."

**Evidence checkpoint**
- User Interface category: navigation hub, shared design system, honest acknowledgement of an unfinished feature rather than overstating completeness.

---

### Segment 3 — Core Features: Racetrack

**On screen**
- Route: `/racetrack`
- Action: Click the Racetrack icon from the Quest Map. Choose the **Easy** set. Play through the 5 verses using a known reference. Reach the results screen.
- Successful result: Results screen shows score/stars and a Scroll reward line.

**What to say**
"Racetrack is the main way to earn Scrolls. Every day the app generates three sets of five verses — Easy, Medium and Hard — each with its own time limit and base reward. I'll play the Easy set... [play round] ...and once I finish, the results screen calculates my reward. That reward isn't just the flat base amount — it's weighted by my average score, my average stars, and how much time I had left, so playing well and quickly earns more Scrolls. Only one reward is given per set, per account, per day, so you can't replay the same set to farm currency."

**Evidence checkpoint**
- Core Features category: a complete, reliable workflow with a visible result (Scroll reward), plus an explanation of the underlying reward logic.

---

### Segment 4 — Core Features: Academy

**On screen**
- Route: `/academy`
- Action: Click the Academy icon. Select a lesson set with a working embed. Click "Skip/Continue" past the video (or let it play briefly). Answer the 5 multiple-choice rounds. View local results.
- Successful result: Results stage shows a total score out of the maximum possible.

**What to say**
"Academy is a different kind of learning activity. You pick a topic — this one covers [set topic] — watch a short lesson video, and then answer five multiple-choice questions about verses from that passage, instead of typing a reference like in Normal Mode. Answering correctly and quickly earns more points, up to a maximum of 100 per round. One thing I'll be upfront about: Academy currently shows your Scroll balance in the interface, but it doesn't actually award Scrolls for finishing yet — that's a feature I've documented as a known limitation rather than something I've claimed is finished."

**Evidence checkpoint**
- Core Features category: demonstrates a distinct workflow, explains the scoring rule, and honestly flags an incomplete reward hook instead of overclaiming.

---

### Segment 5 — Core Features: Marketplace and Profile Customisation

**On screen**
- Route: `/marketplace` then `/profile`
- Action: Show the 5 daily item slots, purchase one affordable item, confirm the Scroll balance drops. Navigate to Profile → Customize, apply the newly-purchased cosmetic, save.
- Successful result: Marketplace shows the item as "Owned"; profile preview shows the new name effect/nameplate/icon applied.

**What to say**
"The Marketplace shows five cosmetic item slots that reset once a day. These aren't randomised every time you open the page — they're calculated deterministically from today's date and my account, so I see the same five items all day even if I navigate away and back. I'll buy this one... [purchase] ...my Scroll balance drops by its price, and it's marked Owned so I can't buy it twice. Now in my Profile, under Customize, that cosmetic is available to actually equip on my display name — so purchasing and customising are two separate steps: buying unlocks it, customising applies it."

**Evidence checkpoint**
- Core Features category: two connected user-facing workflows (purchase → equip) with a visible successful result each.

---

### Segment 6 — User Interface: Settings and accessibility

**On screen**
- Route: `/settings`
- Action: Toggle **High Contrast** on, then toggle **Font Scale** up, then Save.
- Successful result: Page colours/contrast and text size visibly change immediately.

**What to say**
"The Settings page lets me adjust accessibility and comfort options that are stored on this device. High contrast changes the colour scheme for better readability, and font scale lets me increase text size across the app — you can see the change happen live as I move the slider. These preferences persist after I refresh, because they're saved to local storage on my device rather than needing an account."

**Evidence checkpoint**
- User Interface category: an accessibility feature with a real, visible effect on the application, not just a cosmetic toggle.

---

### Segment 7 — Core Features: Multiplayer lobby mini-game

**On screen**
- Route: `/multiplayer` in both windows
- Action: In Window 1, create a lobby as host. In Window 2 (private window), join using the lobby code as a guest.
- Successful result: Window 2 shows "Waiting for host to start the game..." plus a small interactive mini-game.

**What to say**
"The existing multiplayer lobby lets friends join with a short code before a game starts. What I added this phase is this small mini-game in the waiting room — while a non-host player waits for the host to start, they can click the moving target for a bit of fun and a locally-saved high score, instead of just staring at a static waiting message. It's intentionally simple and disabled once the real game starts, and the score isn't sent anywhere important — it's just a small quality-of-life addition to an existing screen."

**Evidence checkpoint**
- Core Features category: a substantial, self-contained addition to an existing (pre-AT3B) screen, clearly scoped as new work rather than claiming the whole lobby system as new.

---

### Segment 8 — Data Management

**On screen**
- Route: stay on any app page; optionally show the Firebase Console Firestore tab (no private user data visible) for `users`, `sets`, `racetrack_sets`, and `daily_market_seeds` collections at a glance.
- Action: Narrate over the app UI rather than deep-diving into the console.
- Successful result: Collections are visible with anonymised/aggregate-looking documents (no personal data read aloud).

**What to say**
"Behind these features, data is split across a few places. Firestore holds structured data: each user's document stores their Scroll balance, their unlocked-items bitmask, their profile customisation, and per-mode statistics like Racetrack challenges completed. Separate collections hold the daily Racetrack sets and the daily Marketplace seed, so the same challenges and shop items are shared by every player on a given day rather than being regenerated per user. The multiplayer lobby system, which already existed before this phase, uses the Realtime Database instead, because it needs fast presence tracking — knowing instantly when a player disconnects. And a few small things, like my settings and the lobby mini-game high score, are only saved in this browser's local storage, not in the cloud."

**Evidence checkpoint**
- Data Management category: distinguishes Firestore vs Realtime Database vs local storage, and explains one real synchronisation reason (presence) for the RTDB choice.

---

### Segment 9 — Security Features (part 1: authentication and input handling)

**On screen**
- Route: `/login` or `/profile`
- Action: Show signing in with a prepared test account (type password quickly, don't narrate it). Then go to the Home page's "Join Game" box and type an invalid game code (e.g. with a symbol) to trigger a validation message.
- Successful result: Signed-in state updates the header; invalid code shows an inline error instead of crashing or submitting.

**What to say**
"For accounts, the app uses Firebase Authentication. New visitors are automatically signed in anonymously so they can play straight away, and if they later create a full account with Google or email and password, their anonymous stats are merged into the new account rather than lost. For input, I added a sanitisation service that strips obviously dangerous patterns — like script tags or `javascript:` links — from anything a user types, and validates formats like game codes and verse guesses before they're used. Watch what happens if I type an invalid code here... [type bad code] ...it's rejected with a clear message instead of being sent anywhere."

**Evidence checkpoint**
- Security Features category: demonstrates real authentication behaviour and a real input-validation rejection, addressing account security and basic XSS/format risks.

---

### Segment 10 — Security Features (part 2: honest gaps and backend protections)

**On screen**
- Route: none required — talking segment; optionally show `firestore.rules` and `database.rules.json` briefly as read-only text (not editing).
- Action: No interaction; narrate over a static view of the two rules files or the app.
- Successful result: N/A — informational segment.

**What to say**
"I also want to be upfront about where security still needs work, because that's just as important as showing what's finished. My Realtime Database rules require a signed-in user for any read or write, which is appropriate for the multiplayer presence data. My Firestore rules, on the other hand, are currently open to any reader or writer — I used a wide-open rule while actively building and testing this phase, and it has not been locked down yet. That means, right now, anyone with the project's configuration could technically read or write Firestore data directly, bypassing the app entirely. Before any real deployment, this needs proper rules that check authentication and ownership per collection. Similarly, admin access — like the Reset Shop button — is currently only checked in the Angular app itself, against a hard-coded list of admin account IDs; it isn't backed up by matching database rules yet, so it's a client-side convenience rather than a real server-side guarantee. On the other hand, one thing that is properly protected is my AI chatbot's API key — it never reaches the browser at all. The chatbot calls a Cloud Function, and that function holds the Gemini API key on the server side, so it can't be read out of the page's source code."

**Evidence checkpoint**
- Security Features category (teacher-required section): explains a real, deployed vulnerability honestly, contrasts it with a correctly-configured protection (RTDB rules, server-side secret), and states what must be fixed before production — without demonstrating an actual exploit against live data.

---

### Segment 11 — AI/Advanced Features: Chatbot

**On screen**
- Route: any page
- Action: Click the floating chat button, type a short in-game question (e.g. "How do I join multiplayer?"), send it, wait for a reply.
- Successful result: Bot responds with a short, relevant answer within a few seconds.

**What to say**
"On every page there's a floating chat button. It opens an assistant that can answer short questions about how to play — like how multiplayer works, or what a mode does — and it's specifically instructed not to reveal any Bible verse answers, since that would defeat the point of the game. It also receives some context automatically, like which page I'm on and my basic stats, so its answers can be a little more relevant to what I'm actually doing. If the connection to the server fails, it shows an error message instead of hanging silently — [only mention if this actually happens on camera] ..."

**Evidence checkpoint**
- AI/Advanced Features category: a working, page-aware AI feature with a visible request/response interaction.

---

### Segment 12 — AI/Advanced Features: Admin controls and deterministic daily content

**On screen**
- Route: `/` (Home, admin panel is visible to admin accounts) — [Verify before recording: only if signed in with an admin-listed account]
- Action: Click "Reset Shop", confirm the browser dialog, observe the confirmation alert.
- Successful result: Confirmation alert appears; Marketplace items would reshuffle for all users on next load.

**What to say**
"Signed in on an admin account, I also have access to a small admin panel, including this Reset Shop control. Pressing it generates a brand new shared daily seed, which changes which five Marketplace items every player sees for the rest of the day. What's interesting under the hood is that this doesn't rewrite every user's data — because each player's five items are calculated on the fly from their account ID, today's date, and this shared seed using a deterministic random function, changing one small seed value is enough to reshuffle the shop for everyone at once, without a expensive database write per player."

**Evidence checkpoint**
- AI/Advanced Features category: demonstrates an admin-only control and explains the deterministic algorithm that makes daily content generation efficient — evidence of non-trivial logic beyond basic CRUD.

---

### Segment 13 — Testing and final evaluation

**On screen**
- Route: none required — talking segment, optionally show a testing results file briefly (e.g. `testing/load/results/*.summary.txt`) without reading private data aloud.
- Action: No interaction.
- Successful result: N/A — informational segment.

**What to say**
"During testing, I ran a small local load-testing script that opens the app and times things like initial page load and navigating into Quest Mode and the Marketplace, comparing the results against my performance targets. I also manually tested edge cases like invalid game codes, purchasing without enough Scrolls, and replaying a Racetrack set to confirm the one-reward-per-day rule actually holds — all of which behaved correctly and gave a clear error or message instead of failing silently. The biggest limitation I found, and the one I've already talked about, is that my Firestore rules aren't locked down yet — that's the main thing I'd fix next if this were going further. Overall, I think the finished application meets what I set out to build this phase: a working Quest Mode economy, a cleaner interface, and an AI feature layered on top of the existing guessing game, with a few honestly-documented gaps rather than hidden ones."

**Evidence checkpoint**
- Demonstrates acceptance testing evidence and an honest overall evaluation, satisfying the assessment's testing/evaluation expectations without turning into a long report readout.

---

### Segment 14 — Conclusion

**On screen**
- Route: `/`
- Action: Return to the Home page.
- Successful result: N/A — closing shot.

**What to say**
"That covers the interface, core features, data storage, security, and the AI feature I built and finished during this development phase. Thanks for watching."

**Evidence checkpoint**
- Closes the video within the time limit, reinforcing that only the completed Part B application was shown.

---

## 6. User Interface demonstration

Strongest AT3B-era UI evidence, in order of visual impact:

- **Quest Map hub** (`/quest`) — new icon-based navigation replacing a flat list, using new artwork (`quest-map.png`, and per-mode icons).
- **Shared design system** — `page-shell`, `page-header`, `quest-header`, `modal`, and `floating-action-button` components plus a token/CSS layer (`tokens.css`, `buttons.css`, `cards.css`, `layout.css`) applied consistently across Quest Mode, Marketplace, Racetrack and Academy.
- **Improved Settings page** (`/settings`) — high contrast and font-scale toggles have a real, visible effect on the whole app, which is the kind of accessibility feature worth spending screen time on (rather than alt text, per teacher clarification).
- Excluded from the UI demo: the "hide other player names" toggle exists in Settings but is not yet wired into any multiplayer display — do not claim it visibly works.

## 7. Core Features demonstration

Strongest AT3B workflows, each starting from a clear route and ending on a visible successful result:

1. **Racetrack** (`/racetrack` → play a set → results screen with Scroll reward).
2. **Academy** (`/academy` → pick set → video → 5-question quiz → local results).
3. **Marketplace → Profile Customisation** (`/marketplace` purchase → `/profile` equip).
4. **Multiplayer lobby mini-game** (brief, second-window segment only).
5. Optionally, if time allows and it demos reliably: the **Verse/question-set board** on Home, showing a shared set with its author, play count and rounds. [Verify before recording: confirm at least one populated set exists to show; if the board is empty, skip this rather than showing an empty state.]

Not included: Normal Mode, Custom/Create Mode, and the core multiplayer game loop itself are pre-existing and are not treated as AT3B core feature evidence, beyond the brief navigation needed to reach the lobby mini-game.

## 8. Data Management demonstration

- **Firestore** stores: user profile and stats (`users` collection — Scrolls, `BitMarket` bitmask, customisation, per-mode stats), community question sets (`sets`), daily Racetrack challenge sets (`racetrack_sets`), and the shared daily Marketplace seed (`daily_market_seeds`).
- **Realtime Database** stores multiplayer lobby state and presence (`/lobbies/{id}/presence/{uid}` with `onDisconnect()`), which pre-dates AT3B and is shown only briefly as evidence of RTDB usage, not as new work.
- **Local/session storage** stores app settings (`bbg_app_settings`), the lobby mini-game's high score, and a scaffolded offline-cache helper that currently has no UI hook (not demonstrated).
- Visible flows that retrieve/update data live on screen: purchasing a Marketplace item (writes Scrolls + BitMarket), and completing a Racetrack set (writes Scrolls + racetrack stats), both of which persist after navigating away and back.
- Realtime sync worth mentioning: multiplayer presence updates instantly when a tab disconnects, which is the reason that data lives in the Realtime Database rather than Firestore.

## 9. Security demonstration

Included because the teacher explicitly required a dedicated security section. Cover, in order of strength:

1. **Firebase Authentication** — anonymous-by-default sign-in, upgrade path to Google/email accounts, and anonymous-stat merging on upgrade.
2. **Input sanitisation** — regex-based stripping of script/HTML patterns and format validation, demonstrated live via an invalid game code.
3. **Cloud Function secret protection** — the Gemini API key lives only in `functions/src/index.ts` on the server, never in client-side code.
4. **Realtime Database rules** — require `auth != null`, shown as a correctly-scoped example.
5. **Known gap: Firestore rules** — currently open to any reader/writer (`firestore.rules`), disclosed honestly as unfinished, with a clear statement of what must change before production (per-collection rules checking authentication and document ownership).
6. **Known gap: admin gating** — enforced only client-side via a hard-coded UID list, not yet backed by matching Firestore rules.

Do not demonstrate reading or writing another user's data live, even though the open rules would technically allow it — describe the risk instead of exploiting it.

## 10. AI and Advanced Features demonstration

- **AI chatbot** — floating button on every page, calls a Cloud Function wrapping the Gemini API, receives page/stat context, and is prompt-instructed not to reveal verse answers.
- **Deterministic daily content generation** — both Racetrack's daily challenge sets and the Marketplace's daily item selection use a shared seed plus a seeded pseudo-random function so results are consistent per user/day without extra per-user writes.
- **Racetrack reward formula** — a weighted combination of score, stars and remaining time, calculated in `racetrack.service.ts` and applied in `results.component.ts`.
- **Admin Reset Shop control** — regenerates the shared seed, instantly changing what every player sees without rewriting per-user documents.

## 11. Testing and final evaluation

Keep this brief on camera (see Segment 13 script). Cover only:

- One or two manual acceptance-testing examples (invalid game code rejected; one-reward-per-day rule holds on a repeat Racetrack attempt).
- One load/performance data point: local load-testing script results in `testing/load/results/` (cite the general approach, not raw private log contents).
- One issue found through testing: the open Firestore rules, already flagged in the Security section — reuse it here as the "what would I fix next" answer rather than introducing a new topic.
- One honest limitation: Academy does not yet award Scrolls; the "hide player names" setting isn't wired into multiplayer views; the error-handling service has no visible banner yet.
- One overall judgement: the Quest Mode economy, redesigned interface, and AI chatbot are functionally complete for this phase, with clearly identified next steps rather than hidden gaps.

## 12. Recording cue sheet

| Cue # | Screen or route | Action | Speaking point | Expected result |
|---|---|---|---|---|
| 1 | `/` | Sit on Home | Intro + scope | Home loads |
| 2 | `/quest` | Open Quest Map | New hub + design system | Map with 4 icons + Scroll balance |
| 3 | `/racetrack` | Pick Easy, play 5 rounds | Daily challenges + reward formula | Results with Scroll reward |
| 4 | `/academy` | Pick set, skip video, answer 5 Qs | Video+quiz flow, honest no-Scrolls limitation | Local results screen |
| 5 | `/marketplace` | Buy one affordable item | Deterministic daily shop | Item shows "Owned", Scrolls drop |
| 6 | `/profile` | Open Customize, equip item, save | Purchase vs equip are separate steps | Preview updates |
| 7 | `/settings` | Toggle high contrast + font scale | Accessibility with real effect | Visible page change |
| 8 | `/multiplayer` (2 windows) | Host + guest join | Lobby mini-game addition | Mini-game visible to guest |
| 9 | any page | Narrate over UI / Firebase Console | Firestore vs RTDB vs local storage | No interaction needed |
| 10 | Home → Join box | Type invalid game code | Input sanitisation | Inline validation error |
| 11 | static | Show rules files briefly | Firestore gap vs RTDB rules vs Cloud Function secret | No interaction needed |
| 12 | any page | Open chat, ask a game question | AI chatbot, spoiler-safe | Bot reply appears |
| 13 | `/` (admin account) | Click Reset Shop, confirm | Admin control + seeded algorithm | Confirmation alert |
| 14 | static | Mention testing results + limitation | Testing/evaluation | No interaction needed |
| 15 | `/` | Return home | Closing line | Video ends |

## 13. Failure backup plan

| Feature | Likely failure | Backup evidence | Fallback explanation | Keep or skip segment |
|---|---|---|---|---|
| AI chatbot | Cloud Function/Gemini API times out or key missing | Prepared screenshot of a successful chat exchange | "Here's a reply I captured earlier from the same feature, in case the live API is slow right now." | Keep — show fallback screenshot briefly, do not fake a live response |
| Admin Reset Shop | Signed-in account is not on the hard-coded admin UID list | Prepared screenshot of the admin panel and confirmation alert | "This control is restricted to admin accounts — here's what it looks like when triggered." | Keep with fallback screenshot, or skip if no admin account is available at all |
| Multiplayer lobby mini-game | Second window/lobby code join fails, or lobby expires (~30 min) mid-recording | Re-create the lobby immediately before recording this segment, not earlier | Keep the segment short and record it in one take right after creating the lobby | Keep — but record this segment last-minute, not at the start of the session |
| Firestore/Firebase Console data view | Console requires a Google login not intended to be shown, or exposes real user data | Skip the console entirely; narrate over the app UI instead (Segment 8 already does this) | "I'll describe the data model without opening the console, to avoid showing any account details." | Keep app-only version; skip console entirely if unsure |
| Racetrack/Academy verse content | A curated verse/embed fails to load (e.g. missing video for a set) | Pre-check the specific set you intend to use before recording | Pick a different, working set from the list rather than troubleshooting live | Keep — just pre-verify the set choice |
| Firestore open-rules disclosure | Concern about revealing "how to exploit" the app | Describe the risk in words only; do not demonstrate reading/writing another account's data | State the risk and the fix, nothing more | Keep — required by the teacher, but words-only |

## 14. Final submission checklist

- [ ] Total video runtime is under 15 minutes (target ~12–13 minutes)
- [ ] Audio is clear and consistent throughout
- [ ] Browser zoom/text size is readable on the intended playback device
- [ ] No private information, real passwords, API keys, or personal notifications are visible on screen
- [ ] User Interface features are demonstrated (Quest Map, design system, accessibility settings)
- [ ] Core Features are demonstrated (Racetrack, Academy, Marketplace, Profile Customisation, lobby mini-game)
- [ ] Data Management is explained (Firestore collections, Realtime Database, local storage)
- [ ] Security is explained, including the honest Firestore-rules gap (teacher-required section)
- [ ] AI/Advanced Features are demonstrated (chatbot, deterministic daily content, admin control)
- [ ] Testing and evaluation is concise and includes one honest limitation
- [ ] Only Part B application content is included
- [ ] No Part A diagrams, planning, or documentation appear
- [ ] No mention of coding assistants or development assistance
- [ ] The final application is shown visibly working, not just described
- [ ] The submitted video file or link has been checked to open and play correctly before submission
