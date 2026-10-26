---
doc: prd
status: approved
---

# Rebound — Product Requirements Document

> *"A study plan that bounces back when you miss a day."*
> 
> Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`
> 
> **Change log:** Feature *"Reality Check Forecast"* added after Slice 6 to provide proactive what-if simulation, letting students explore "what would it take?" before committing hours.

Rebound is an intelligent, stress-reducing study planner for university students managing overlapping exam periods. It balances study workloads based on exam urgency and subject difficulty, and features a gentle, transparent re-planning preview that recalculates and visualizes shifts whenever a day of study is missed.

---

## The Core Journey

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`

1. **Arrival & Setup:** On first launch, the student sees a clean welcome screen and taps *"Add my first exam"*.
2. **Input Exams:** The student adds each upcoming exam with its relative date (days until exam), chapter count, and difficulty rating (1 to 5), then sets their daily available study hours (default 4h/day).
3. **Plan Generation:** Tapping *"Generate Plan"* creates a weighted schedule across the days leading up to each exam.
4. **Daily Execution (Today Screen):** Each day, the student opens the app to see today's allocated subject tasks, ticking them off as they study. A progress bar updates in real time.
5. **The Rebound Moment:** If life interrupts and study hours are missed, the student taps *"I missed today"*. 
6. **Preview & Confirm:** The app displays a non-destructive preview modal with a headline (e.g., *"Moved 3h of unfinished work across the next 4 days"*), before-and-after hours per changed day, and amber indicators for added time. The student taps *"Apply"*.
7. **Schedule Update & Undo:** The full plan view briefly highlights the updated days. Ticked tasks remain completed; nothing is deleted. An *"Undo"* option is readily available.
8. **Reality Check (Shortfall):** If total required work exceeds the available study hours before exam dates, a calm alert explains the exact hours deficit and which lower-priority study sessions were trimmed first.
9. **Forecast & What-If Exploration:** The student opens the *"Forecast"* tab to explore how different study habits (1 to 10h/day) would impact subject coverage without risking their saved plan, discovering the exact minimum hours needed to cover 100% of their work.

---

## Screens and Layout

The application consists of a single responsive web interface with a top segmented navigation bar switching between **Today**, **Full Plan**, and **Forecast**, with a settings/exam manager access point:

1. **Welcome View (First-Run Only):**
   - Clean, friendly greeting introducing Rebound.
   - Prominent single call-to-action: *"Add my first exam"*.
2. **Add / Edit Exams Modal & Settings:**
   - Form inputs: Subject Name (text), Exam Date (date picker or days from today), Chapters (number), Difficulty (1 to 5 scale).
   - Card list of added subjects showing edit and delete controls.
   - Global setting: *"Hours I can study per day"* (numeric stepper/input, default: 4).
   - Action: *"Generate / Update Study Plan"*.
3. **Today View (Main Daily Workspace):**
   - Header with current date and days remaining until the nearest exam countdown badge.
   - Progress bar: *"X of Y tasks done"*.
   - Task Cards: Subject color tag, subject name, targeted chapter focus, planned study hours, interactive completion checkbox.
   - Primary action: Prominent, friendly button labeled *"I missed today"*.
   - Next-day prompt banner: Appears if yesterday had unfinished tasks, offering: *"You have unfinished tasks from yesterday. Would you like to re-plan?"*
4. **Full Plan View (Timeline):**
   - Chronological list/grid of all days from today until the final exam date.
   - Each day card shows total planned hours and broken-down subject blocks color-coded by subject.
   - Exam days highlighted with prominent "EXAM DAY" pill tags.
   - The day before each subject's exam is explicitly marked with a badge: *"Light Revision Only"*.
   - Visual flash/pulse highlighting on days modified by a re-plan.
5. **Missed-Day Preview Sheet / Modal:**
   - Headline summarizing the adjustment: *"Moved X hours of unfinished work across the next Y days"*.
   - Filtered diff list displaying **only the days that changed**.
   - Before-and-after hour breakdown per day (e.g., `2h → 3h`), using subject color accents and warm amber for added hours.
   - Actions: Primary *"Apply Changes"* and secondary *"Cancel"*.
   - Persistent *"Undo"* floating bar appears after applying.
6. **Reality Check Alert (Shortfall State):**
   - Triggered when total study hours required exceed capacity.
   - Displays a supportive, calm banner/card: *"You're short by X hours based on your daily limit. Here is what was trimmed to protect your rest and highest-priority exams."* Lists trimmed low-weight chapters.
7. **Forecast View (Reality Check Simulator):**
   - **Where you stand:** Card per active subject showing subject color tag, days left, hours still needed (excluding completed ticks), scheduled hours, visual coverage bar (capped at 100%), and status label with icon + text: *"On track"* (100%), *"Tight"* (80–99%), or *"Behind"* (<80%). Status labels use distinct non-clashing slate/teal/rose hues without using reserved amber.
   - **What if I study...:** Interactive slider from 1.0 to 10.0 hours/day (0.5h steps), initialized to current setting. Moving the slider dynamically recalculates coverage and shortfalls instantly without mutating saved data. Shows comparison summary: *"At Xh/day: all Y subjects covered (now: Z of Y)"*.
   - **The minimum you need:** Direct calculation of the smallest daily hours (0.5 to 12.0h) where every subject reaches 100% coverage, shown as a clear reassuring sentence: *"To cover everything you need about X hours a day."*
   - **Action:** *"Use X hours/day"* button (disabled if slider matches current setting) that prompts confirmation and updates the plan while preserving all completed tasks.
   - **Advisory note:** *"This estimates how much of your planned study fits. It is not a prediction of your exam score."*

---

## Look and Feel

- **Mood & Tone:** Calm, encouraging, focused, academic yet friendly. Zero punitive phrasing, no harsh alarms or red error alerts. Supportive copy: *"Plans change. Here's your updated plan."*
- **Color Palette:**
  - Background: Soft warm off-white (`#F8FAFC` or `#FBFBFA`) avoiding blinding pure white.
  - Primary / Brand: Deep calming teal or indigo (`#0F766E` / `#312E81`).
  - Subject Accent Colors: Distinct, muted jewel tones (e.g., Indigo for Calculus, Teal/Cyan for Physics, Coral/Emerald for Economics).
  - State Colors: Warm amber (`#D97706` / `#F59E0B`) for shifted/increased hours; soothing soft green (`#10B981`) for completed tasks; no aggressive red warnings.
- **Typography:** Clean, modern, highly legible sans-serif (e.g., Inter or Outfit) with clear hierarchy and generous line heights.
- **Components:** Generously rounded cards (`12px` - `16px`), comfortable whitespace, clear elevation shadows, minimum `44px` mobile tap targets.

---

## Features and Behavior

### 1. Weighted Plan Generation
- **Source:** `scope.md > The Unique Kernel`, `scope.md > The POC Boundary`
- **Behavior:**
  - Exam urgency weight: Days closer to an exam receive progressively higher priority.
  - Difficulty weight: Subjects rated 4 or 5 receive more hours per chapter than subjects rated 1 or 2.
  - Exam cutoff rule: Once an exam date passes, zero hours are scheduled for that subject.
  - Light revision rule: The calendar day immediately preceding an exam is strictly capped as light revision for that subject (e.g., max 1 hour review, no heavy new chapters).
  - Daily hour constraint: Total scheduled hours per day cannot exceed the user's daily study limit (default 4h).
- **Acceptance Criteria:**
  - [ ] Generates daily study blocks for all entered exams within the user's daily hour limit.
  - [ ] Physics (diff 5, in 8d) and Calculus (diff 4, in 6d) receive significantly higher daily hours than Economics (diff 2, in 10d).
  - [ ] Day immediately preceding an exam is tagged *"Light Revision"* and assigned reduced hours.

### 2. Today Screen & Interactive Task Tracking
- **Behavior:**
  - Displays tasks assigned to the current calendar day.
  - Clicking a task checkbox marks it completed, strikethroughs the task title, and updates the progress indicator.
  - Ticked tasks stay locked in completed state; refreshing or re-planning never unchecks or deletes completed work.
- **Acceptance Criteria:**
  - [ ] Ticking 2 of 4 tasks updates the progress bar to show *"2 of 4 tasks done"*.
  - [ ] Checked state persists across page refreshes.

### 3. "I Missed Today" Re-Plan & Diff Preview
- **Behavior:**
  - Tapping *"I missed today"* calculates how to reallocate unfinished hours from today across remaining study days before each subject's exam.
  - Opens the preview modal showing the diff headline and list of modified days with before/after hours and amber indicators.
  - Clicking *"Apply"* updates the active schedule and renders an *"Undo"* button.
  - Clicking *"Cancel"* dismisses the preview without modifying the plan.
- **Acceptance Criteria:**
  - [ ] Tapping *"I missed today"* does not mutate data until *"Apply"* is pressed.
  - [ ] Only changed days appear in the diff list with clear before-and-after values.
  - [ ] Applying highlights changed days in the full plan and provides an immediate *"Undo"* option that restores the exact previous state.
  - [ ] Ticked tasks remain completed; unfinished tasks are redistributed.

### 4. Shortfall Calculation & Reality Check
- **Behavior:**
  - When daily study hours are lowered (e.g. from 4h to 2h) or when accumulated missed days cause total required study hours to exceed remaining capacity.
  - The app displays a supportive notification stating the deficit (e.g., *"Short by 4 hours"*) and clearly lists which chapters/sessions were trimmed or deferred to protect core review.
- **Acceptance Criteria:**
  - [ ] Lowering daily study hours below required workload immediately triggers the calm shortfall message.
  - [ ] Explains the exact number of hours short and identifies trimmed topics without throwing an application error.

### 5. Persistence
- **Behavior:**
  - All exams, settings, completion states, schedule changes, and history are saved to the browser's `localStorage`.
- **Acceptance Criteria:**
  - [ ] Full page reload preserves all entered exams, checked tasks, and current schedule state.

### 6. Reality Check Forecast (What-If Simulator)
- **Behavior:**
  - Dedicated "Forecast" tab lets students simulate study hours (1.0 to 10.0h/day in 0.5h steps) to evaluate workload coverage without altering saved data.
  - "Where you stand" cards display days left, hours still needed (excluding completed ticks), scheduled hours, visual coverage bar %, and status labels ("On track" [100%], "Tight" [80–99%], "Behind" [<80%]). Status uses non-amber, accessible icons and text.
  - "What if I study..." slider updates coverage, shortfalls, and comparison text instantly without lag.
  - "The minimum you need" calculates the lowest half-hour step (0.5 to 12.0h) achieving 100% coverage across all active subjects.
  - "Use X hours/day" button prompts confirmation and updates the plan safely, preserving all completed task ticks.
  - Prominent advisory note: *"This estimates how much of your planned study fits. It is not a prediction of your exam score."*
- **Acceptance Criteria:**
  - [ ] Moving slider instantly updates subject coverage percentages and status labels without mutating `localStorage`.
  - [ ] Slider displays the exact minimum daily hours needed (e.g. 3.5h/day for demo scenario).
  - [ ] Clicking "Use X hours/day" and confirming updates the saved hours setting and regenerates the schedule while preserving all checked tasks.
  - [ ] Clicking Cancel in confirmation leaves the plan and saved settings completely unchanged.
  - [ ] "Use X hours/day" button is disabled when slider equals current setting.

---

## States and Boundaries

- **Empty / First-Run State:** No exams exist in storage. Renders Welcome screen with *"Add my first exam"* button.
- **Active Plan State:** Exams exist, schedule generated, Today view shows active tasks.
- **Forecast State:** Interactive simulation view with slider and live coverage cards.
- **Preview State:** Modal active during re-plan calculation showing proposed changes.
- **Shortfall State:** Available hours < required workload. Shows calm capacity alert.
- **All Tasks Completed State:** All tasks for today checked off. Shows celebratory encouragement (*"All done for today! Take a break."*).
- **Mobile Responsive State:** Screen width under 600px. Single-column stacked cards, full-width touch targets.

---

## Edge Cases

1. **No exams entered yet:** Prevent schedule generation and present friendly onboarding state; Forecast tab shows clean empty state with *"Add my first exam"*.
2. **Exam date in past or today:** Validation prevents past dates; exam today flags *"Exam Day - Best of luck!"*; passed exams are excluded from Forecast cards.
3. **Multiple exams on same day:** Planner splits available daily hours across both subjects leading up to that shared date; Forecast calculates shared capacity.
4. **More work than available hours:** Trigger the calm shortfall message instead of breaking the layout or scheduling beyond daily limits.
5. **All tasks finished early / all tasks done:** Day status updates to complete; Forecast shows 100% coverage with encouraging completion banner.
6. **Needed hours equal zero for a subject:** Coverage shows 100% without division-by-zero errors.
7. **Very tight deadline (exam in 1-2 days):** Planner allocates immediate revision blocks up to the daily hour limit.
8. **Missing the day before an exam:** Light revision shifts to remaining morning hours if possible, or displays gentle encouragement.
9. **Deleting an exam after plan exists:** Prompts brief confirmation, removes subject, and rebalances remaining schedule cleanly.
10. **Slider at minimum (1.0h) and maximum (10.0h):** Forecast smoothly handles extreme values without freezing or layout overflow.
11. **Even 12h/day cannot cover workload:** Reassuring advisory notes explain the shortfall and display prioritized trimming order.
12. **Page refresh while on Forecast tab:** App restores to the Forecast tab; saved hours setting remains intact.

---

## Product Decisions

- **Preview First, Then Apply:** Rather than immediately modifying the calendar on a click, the user gets an explicit diff preview with Cancel and Undo, removing anxiety.
- **Simulation Isolated From Real State:** Forecast slider moves never mutate saved plans or settings until explicitly confirmed.
- **No Harsh Red Warnings:** Changed days and extra hours use warm amber; errors and shortfalls use calm informational banners.
- **Single-Device Local Storage:** No account registration or external databases needed for the proof of concept, guaranteeing speed, zero setup friction, and reliable demo performance.
- **Strict POC Boundaries:** No calendar sync, external push notifications, or AI chatbots in this phase to guarantee a robust, complete delivery in an afternoon.

---

## Demo Script Outline (Target: ~2 minutes)

1. **First run (~10s):** Open clean browser. Show Welcome screen with *"Add my first exam"*.
2. **Add exams (~20s):** 
   - Calculus: 6 days away, 8 chapters, difficulty 4.
   - Physics: 8 days away, 6 chapters, difficulty 5.
   - Economics: 10 days away, 5 chapters, difficulty 2.
   - Daily hours: 4h/day. Click *"Generate Study Plan"*.
3. **Plan view (~15s):** Inspect full plan. Point out heavier weight for Calculus/Physics and light revision day before exams.
4. **Today screen (~15s):** Show today's tasks. Tick 2 tasks ("2 of 3 tasks done"). Leave remaining tasks unticked.
5. **The Rebound Moment (~25s):** Tap *"I missed today"*. Walk through preview headline, before/after hours in amber. Tap *"Apply"*. Point out highlighted changed days and demonstrate *"Undo"*.
6. **Reality Check Forecast (~25s):** Switch to the new *"Forecast"* tab. Show "Where you stand" coverage bars and status badges. Move slider to 2.5h/day to show tight/behind coverage, then show minimum needed sentence (*"To cover everything you need about 3.5 hours a day"*). Move to 5.0h/day and click *"Use 5.0 hours/day"*. Confirm and verify plan updates smoothly.
7. **Persistence (~5s):** Refresh page. Show all data and states intact.
8. **Phone width (~5s):** Resize browser to mobile viewport width. Show clean responsive layout across Today, Full Plan, and Forecast.

---

## What We're Building (Now)
- First-run welcome view.
- Exam entry and management (Calculus, Physics, Economics worked scenario).
- Configurable daily study hours.
- Urgency + difficulty weighted study schedule generator.
- Today view with checklist, progress counter, and countdown badges.
- "I missed today" action and re-plan diff preview modal with amber highlights.
- Apply, Cancel, and Undo state handling.
- Shortfall capacity detection with supportive messaging.
- Reality Check Forecast what-if simulator tab with live slider and coverage bars.
- Minimum study hours calculator.
- Full responsive styling (mobile + desktop).
- LocalStorage persistence.

## Deferred From the POC
- Google Calendar / iCal export.
- Browser push notification reminders.
- In-depth Pomodoro timer / stopwatch.
- Canvas / Blackboard LMS syllabus sync.
- Cloud authentication & multi-device sync.
- AI chat study assistant.

## Non-Goals
- Building a full university grade tracker or GPA calculator.
- Social study group chat or peer coordination.
- Automated chapter content scraping or flashcard generation.

## Open Questions
- None blocking spec: algorithm mechanics, exact weighting formulas, and day-by-day numbers are detailed in `4-spec`.
