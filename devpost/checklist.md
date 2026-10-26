---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Project scaffold, design system, and first-run welcome view**
  Becomes usable: A running web app with our custom theme, typography, cards, and the first-run Welcome screen with an *"Add my first exam"* call-to-action.
  Why now: Bootstraps the project scaffold and visual tokens so every later slice renders into a polished, responsive container.
  PRD ref: `prd.md > Screens and Layout (1. Welcome View)`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > File Structure`
  Build: Create `index.html` with semantic structure, header navigation pills, and welcome container; create `styles.css` with CSS custom properties (calm teal, off-white, amber diffs, card elevation, responsive layout).
  Verify (mechanical): Start local server and fetch `index.html`; verify HTTP 200, valid markup structure, and that CSS tokens load without errors.
  Learner check: Open the browser at `http://localhost:8000` (or `npx serve`) and verify the clean, calm greeting and *"Add my first exam"* button.
  Commit: `Scaffold project and create welcome screen with design system`

- [x] **2. LocalStorage persistence and exam management modal**
  Becomes usable: Clicking *"Add my first exam"* opens a modal where you can add, edit, and delete exams with dates, chapters, and difficulty, plus set daily study hours. Data survives page refreshes.
  Why now: Data entry and persistence are the foundation for the entire scheduling engine; proving localStorage now prevents data bugs later.
  PRD ref: `prd.md > Screens and Layout (2. Add / Edit Exams)`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components (3. Exam Form & Manager Modal)`, `spec.md > Data Model`
  Build: Create `js/storage.js` to manage localStorage for settings and exams; wire modal form in `js/app.js` with validation (positive chapters, difficulty 1-5, relative exam days).
  Verify (mechanical): Execute automated script/test to save Calculus, Physics, and Economics; reload storage and assert that all 3 exams and daily hours setting (4.0h) match stored JSON.
  Learner check: Open the app, add Calculus (6d, 8ch, diff 4), Physics (8d, 6ch, diff 5), and Economics (10d, 5ch, diff 2). Refresh the page and confirm all 3 cards remain in the list.
  Commit: `Implement exam management modal and localStorage persistence`

- [x] **3. Pure scheduling engine and worked example verification**
  Becomes usable: The pure mathematical algorithm that calculates weighted study allocations, enforces the day-before light revision cap (1.0h), handles exam day cutoffs, and calculates shortfall.
  Why now: Risk-first engineering: verifying the core mathematics against the worked example before wiring complex UI interactions guarantees the numbers on screen will be 100% accurate.
  PRD ref: `prd.md > Features and Behavior (1. Weighted Plan Generation)`, `prd.md > Features and Behavior (4. Shortfall Calculation)`
  Spec ref: `spec.md > Scheduling Rules`, `spec.md > Worked Example: Day-by-Day Walkthrough`
  Build: Create `js/scheduler.js` with `generatePlan(exams, dailyHours)`, `calculateWeights()`, `applyLightRevision()`, and `detectShortfall()`.
  Verify (mechanical): Run an automated node script asserting that generated hours for Calculus (12h), Physics (12h), and Economics (5h) across Days 1–10 match the exact numbers in the spec table.
  Learner check: Review the automated test output confirming Day 5 has Calculus light revision, Day 6 has 0h Calculus, Day 7 has Physics light revision, and Day 8 has 0h Physics.
  Commit: `Implement weighted scheduling engine and light revision logic`

- [x] **4. Full plan timeline view and Today screen checklist**
  Becomes usable: The main daily workspace. A student sees the full 10-day timeline with subject color tags and light revision badges, plus the Today screen showing Day 1 tasks with checkboxes, countdown badge, and a real-time progress bar.
  Why now: Delivers the core student workflow: viewing the plan and ticking off daily tasks.
  PRD ref: `prd.md > Screens and Layout (3. Today View)`, `prd.md > Screens and Layout (4. Full Plan View)`
  Spec ref: `spec.md > Components (4. Today View)`, `spec.md > Components (5. Full Plan Timeline View)`
  Build: Implement timeline rendering in `js/app.js` and Today checklist view with checkbox handlers, progress counter (*"2 of 4 tasks done"*), and countdown badge.
  Verify (mechanical): Programmatically check 2 tasks on Day 1; assert that storage reflects `completed: true` and that progress indicator text updates.
  Learner check: Switch between Today and Full Plan tabs. Tick 2 tasks on Today, watch the progress bar animate, and refresh the browser to confirm ticks persist.
  Commit: `Build Full Plan timeline view and interactive Today checklist`

- [x] **5. The Rebound moment: Missed-day diff preview, apply, and undo**
  Becomes usable: Tapping *"I missed today"* calculates remaining workload shifts, displays the preview modal showing only changed days with before/after hours and amber tags, commits on Apply, highlights updated days, and provides Undo.
  Why now: Implements the unique kernel of the product—the anxiety-reducing, non-punitive re-planner.
  PRD ref: `prd.md > Features and Behavior (3. 'I Missed Today' Re-Plan)`, `prd.md > Screens and Layout (5. Missed-Day Preview)`
  Spec ref: `spec.md > Scheduling Rules (4. Missed-Day Re-Plan Rules)`, `spec.md > Components (6. Missed-Day Preview Modal)`
  Build: Implement `scheduler.previewMissedDay()`, diff generator, preview modal dialog with Apply/Cancel handlers, visual pulse on changed days in timeline, and floating Undo action.
  Verify (mechanical): Simulate missing Day 1 with 1 task unticked; verify diff object contains only changed days (Days 7 and 8) with amber added hours; assert that Apply updates plan and Undo restores previous state.
  Learner check: Leave Economics unticked on Day 1, click *"I missed today"*, inspect the amber preview diff, click *"Apply"*, see changed days highlighted in the full plan, then click *"Undo"* to verify rollback.
  Commit: `Implement missed-day diff preview modal, apply commit, and undo support`

- [x] **6. Reality check shortfall alert and mobile responsive polish**
  Becomes usable: Lowering daily hours triggers the calm shortfall alert explaining the exact hour deficit and trimmed chapters; the entire UI is optimized and responsive down to mobile viewports.
  Why now: Final integration slice: satisfies the remaining demo script steps (reality check and mobile width) before final review.
  PRD ref: `prd.md > Screens and Layout (6. Reality Check Alert)`, `prd.md > Demo Script Outline`
  Spec ref: `spec.md > Components (7. Shortfall Alert Banner)`, `spec.md > Look and Feel`
  Build: Wire daily study hours update listener to trigger shortfall banner when hours < required work; add responsive media queries for phone widths (<600px), tap target spacing, and smooth transitions.
  Verify (mechanical): Set daily hours to 2.0; assert shortfall banner renders with 9-hour deficit text; inspect computed styles at 375px width to confirm no horizontal scrollbar.
  Learner check: Edit daily study hours from 4h to 2h to view the calm shortfall message. Shrink your browser window to mobile width and walk through the entire 2-minute demo flow.
  Commit: `Add shortfall reality check alert and mobile responsive styling`

- [x] **7. Reality Check Forecast (What-If Simulator)**
  Becomes usable: A third tab "Forecast" allows students to simulate study workloads with an interactive hours slider (1 to 10h/day). Cards show per-subject coverage bars, needed vs. scheduled hours, and non-amber status badges (On track / Tight / Behind). The app calculates the exact minimum hours needed to cover all work, provides instant comparisons, and allows applying the simulated hours without ever mutating saved state during simulation.
  Why now: Extra hackathon feature strengthening Rebound's value proposition: lets students explore "what would it take?" before committing, reducing anxiety with clarity.
  PRD ref: `prd.md > Screens and Layout (7. Forecast View)`, `prd.md > Features and Behavior (6. Reality Check Forecast)`
  Spec ref: `spec.md > Components (8. Reality Check Forecast View)`, `spec.md > Scheduling Rules (6. Forecast Simulation Rules)`, `spec.md > Forecast What-If Simulation: Worked Example`
  Build: Implement pure function `scheduler.simulateForecast()`, `scheduler.findMinimumDailyHours()`, add Forecast tab and container in `index.html`, render forecast view in `js/app.js` with dynamic slider input, coverage bars, non-amber status badges, and "Use X hours/day" confirmation modal.
  Verify (mechanical): Run automated test asserting that at 4h/day all 3 subjects show 100% coverage with 0h shortfall, at 2h/day shortfall is 10h, and minimum needed hours is 3.5h for clean start and 3.0h after Day 1.
  Learner check: Open Forecast tab. Confirm cards show 100% On track at 4h/day. Drag slider to 2h/day and verify live update to Tight/Behind and 10h short without saving to localStorage. Verify "The minimum you need" sentence says 3.5 hours/day. Click "Use 5.0 hours/day", click Cancel, click again and Apply, and verify plan updates with existing ticked tasks preserved.
  Commit: `Implement Reality Check Forecast what-if simulator and minimum hours calculator`

- [x] **8. Calendar Export (.ics)**
  Becomes usable: A button on the Full Plan screen, "Add to my calendar", generates and downloads `rebound-plan.ics`. Unticked study sessions become all-day calendar events with clear titles, light-revision designations, exam day events, and subject descriptions. Completed tasks are omitted, and format follows RFC 5545.
  Why now: Enables seamless transfer of the study plan to external calendar clients (Google Calendar, Outlook, Apple Calendar) without backend dependencies.
  PRD ref: `prd.md > Features and Behavior (7. Calendar Export)`
  Spec ref: `spec.md > Scheduling Rules (7. Calendar Export Rules)`, `spec.md > Ordered Build Slices (8. Slice 8)`
  Build: Implement pure function `scheduler.generateICS(plan)`, download helper, and "Add to my calendar" button on the Full Plan header.
  Verify (mechanical): Generate ICS from demo plan, assert valid VCALENDAR headers, CRLF line endings, correct event summaries, and exclusion of completed tasks.
  Learner check: Click "Add to my calendar", inspect downloaded `rebound-plan.ics` in a text editor to verify event dates and titles.
  Commit: `Implement iCalendar .ics plan export for Full Plan view`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Slice 2 (Exams entered and persisted in localStorage)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 6 (Full 2-minute demo dry run)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded upon completion]
Route and stops: [to be recorded upon completion]
Edit outcome: [to be recorded upon completion]
Reflection: [to be recorded upon completion]
Activity mode: [to be recorded upon completion]

## Revisions
