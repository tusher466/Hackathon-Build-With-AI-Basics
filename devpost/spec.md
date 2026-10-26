---
doc: spec
status: approved
---

# Rebound — Technical Specification

> *"A study plan that bounces back when you miss a day."*
> 
> Implements `prd.md > Rebound — Product Requirements Document`

---

## How This Works, In Plain Language

Rebound is a lightweight, zero-dependency single-page web app built with standard HTML, CSS, and modern JavaScript. It runs locally in any browser with zero installation steps, zero build pipelines, and zero backend databases.

1. **State & Storage (`storage.js`):** Everything—the student's exams, daily study limit, generated schedule, completed task ticks, and undo history—lives in the browser's `localStorage`. When the user closes or refreshes the page, their full study progress is restored instantly.
2. **Scheduling Engine (`scheduler.js`):** A standalone, pure mathematical engine completely separate from the UI. It calculates study hours per chapter based on difficulty (1–5), weights daily allocations by urgency (exam date proximity), caps the day before an exam at light revision (1.0h), and guarantees zero study on or after exam day.
3. **Re-Plan & Diff Logic (`scheduler.js`):** When *"I missed today"* is clicked, the engine takes only the unfinished tasks from today and rebalances their hours across future days before each subject's exam. It computes a diff object containing **only the days that changed** with before-and-after hours, so the interface can show an amber preview before anything is applied.
4. **User Interface (`app.js`, `index.html`, `styles.css`):** Handles rendering the Today checklist, the Full Plan timeline, the Add/Edit Exam modal, the Missed-Day Preview modal with Apply/Cancel/Undo, and the responsive mobile layout.

Why this shape? It eliminates 100% of network failures, database errors, and build toolchain crashes. It guarantees a flawless, fast, repeatable ~2-minute hackathon demo.

---

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`, `prd.md > Demo Script Outline`

1. **First-run check:** App loads `storage.getExams()`. If empty, renders the Welcome screen with *"Add my first exam"*.
2. **Adding exams:** User submits Calculus (+6d, 8ch, diff 4), Physics (+8d, 6ch, diff 5), and Economics (+10d, 5ch, diff 2) with 4h/day study limit. `storage.saveExams()` persists them.
3. **Plan generation:** User clicks *"Generate Plan"*. `scheduler.generatePlan()` computes the 10-day schedule and saves it to storage. `app.renderFullPlan()` renders the day-by-day timeline.
4. **Today screen execution:** User switches to the Today tab. `app.renderToday()` displays Day 1 tasks (4 tasks totaling 4.0h). User ticks 2 tasks. `storage.toggleTask()` persists completed state; the progress bar updates to *"2 of 4 tasks done"*.
5. **Missed-day trigger:** User clicks *"I missed today"*. `scheduler.previewMissedDay(currentPlan, todayIndex)` generates a preview diff. `app.showMissedDayModal(diff)` opens showing the headline and affected days with amber before/after hour changes.
6. **Apply & Undo:** User clicks *"Apply"*. A snapshot is pushed to `undoStack`, the new plan is saved, and changed days flash in the full plan view. An Undo bar appears. Clicking *"Undo"* pops the snapshot and restores the previous plan.
7. **Persistence check:** Page reload calls `app.init()`, reading all saved data from `localStorage`—all ticks and plans remain intact.
8. **Shortfall detection:** User edits daily limit from 4h to 2h. `scheduler.generatePlan()` detects that required study hours (29h) exceed available capacity (20h). `app.renderShortfallAlert()` displays a calm message explaining the 9-hour deficit and how lower-priority chapters were trimmed.

---

## Stack

- **HTML5:** Semantic markup (`<main>`, `<section>`, `<dialog>` or accessible modals, `<button>`, `<input>`).
- **Vanilla CSS3:** Native CSS custom properties (variables) for theme tokens, Flexbox and Grid layouts, clean card elevation, responsive media queries, and transition animations. No Tailwind or CSS processors.
- **Modern JavaScript (ES6+):** Modular JS (`scheduler.js`, `storage.js`, `app.js`). Pure functions for calculation, event-driven UI updates.
- **Browser LocalStorage API:** Client-side synchronous persistence.
- **Local Dev Server:** Runs via standard command (e.g., `npx serve .` or Python `python -m http.server 8000`). Opening `index.html` directly in modern browsers also works smoothly when using classic script tags.

**Documentation references:**
- MDN LocalStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- MDN CSS Custom Properties: https://developer.mozilla.org/en-US/docs/Web/CSS/--*

---

## Where It Runs and How Someone Tries It

- **Runtime:** Any modern desktop or mobile browser (Chrome, Edge, Firefox, Safari).
- **Start Command (Demo Day):**
  ```powershell
  # Option A (Recommended lightweight server):
  npx serve .
  # Option B (Python built-in):
  python -m http.server 8000
  ```
  Then open `http://localhost:3000` (or `http://localhost:8000`).
- **Direct File Open:** Opening `index.html` directly works as well since scripts are structured without external module CORS restrictions.
- **Optional Deployment:** 100% static files. Pushing to a GitHub repo and enabling GitHub Pages in Settings takes under 30 seconds with zero configuration.

---

## Look and Feel

Carried forward from `prd.md > Look and Feel`:
- **Theme Tokens:**
  - `--bg-canvas`: `#F8FAFC` (soft off-white)
  - `--bg-surface`: `#FFFFFF` (clean white cards)
  - `--color-primary`: `#0F766E` (deep calm teal)
  - `--color-primary-hover`: `#115E59`
  - `--color-accent-amber`: `#D97706` (warm, non-punitive re-plan & added-time indicator)
  - `--color-accent-amber-light`: `#FEF3C7` (amber highlight background)
  - `--color-success`: `#10B981` (soothing task completed green)
  - `--color-text`: `#0F172A` (slate black)
  - `--color-text-muted`: `#64748B` (slate gray)
  - `--border-subtle`: `#E2E8F0`
- **Subject Color Badges:**
  - Calculus: Indigo (`#4F46E5`, bg `#EEF2FF`)
  - Physics: Teal (`#0D9488`, bg `#CCFBF1`)
  - Economics: Coral/Emerald (`#059669`, bg `#D1FAE5`)
- **Typography:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif`).
- **Elevation & Radius:** Card border-radius `12px` to `16px`, soft box-shadow `0 4px 6px -1px rgba(0,0,0,0.05)`.

---

## Components

PRD ref: `prd.md > Screens and Layout`, `prd.md > Features and Behavior`

### 1. Navigation & View Switcher (`app.js`)
- Renders segmented pill toggle between **Today** and **Full Plan**, plus an **Exams & Settings** button.
- Manages active tab state without page refreshes.

### 2. Welcome Component (`app.js`)
- Implements `prd.md > Screens and Layout (1. Welcome View)`.
- Visible only when `storage.getExams().length === 0`.
- Renders single CTA: *"Add my first exam"*.

### 3. Exam Form & Manager Modal (`app.js`)
- Implements `prd.md > Screens and Layout (2. Add / Edit Exams)`.
- Inputs: Subject Name, Relative Exam Date (days from today, e.g. 6), Chapter Count, Difficulty (1–5 slider/buttons).
- Global Setting: Daily study hours (default: 4, step: 0.5).
- Displays list of configured subjects with edit/delete actions and *"Generate Plan"* button.

### 4. Today View (`app.js`)
- Implements `prd.md > Screens and Layout (3. Today View)`.
- Countdown badge showing days to nearest exam.
- Progress bar and counter (*"X of Y tasks done"*).
- Daily task checklist: subject color badge, chapter focus, estimated hours, interactive tick box.
- Prominent button: *"I missed today"*.
- Gentle next-day banner: Appears if previous day had incomplete tasks.

### 5. Full Plan Timeline View (`app.js`)
- Implements `prd.md > Screens and Layout (4. Full Plan)`.
- Renders chronological Day cards (Day 1 to final exam day).
- Badges: *"EXAM DAY"*, *"Light Revision Only"*.
- Visual pulse/highlight on days updated by a re-plan.

### 6. Missed-Day Preview Modal (`app.js`, `scheduler.js`)
- Implements `prd.md > Screens and Layout (5. Missed-Day Preview)`.
- Renders modal over dimmed backdrop.
- Headline: *"Moved X hours of unfinished work across next Y days"*.
- Diff list: Displays **only changed days** with before-and-after hours in subject colors and amber tag for added hours.
- Action buttons: *"Apply"* and *"Cancel"*.
- Floating *"Undo"* toast/banner upon applying.

### 7. Shortfall Alert Banner (`app.js`)
- Implements `prd.md > Screens and Layout (6. Reality Check Alert)`.
- Renders calm informative card if required hours > available capacity.
- Explains hours deficit and lists which low-priority chapters were trimmed.

---

## Data Model

All stored under key `rebound_app_data_v1` in `localStorage`:

```javascript
{
  "settings": {
    "dailyHours": 4.0
  },
  "exams": [
    {
      "id": "exam_calc",
      "name": "Calculus",
      "examDay": 6,          // Relative day index (Day 6 = exam day)
      "chapters": 8,
      "difficulty": 4,       // 1 to 5
      "color": "indigo"
    },
    {
      "id": "exam_phys",
      "name": "Physics",
      "examDay": 8,
      "chapters": 6,
      "difficulty": 5,
      "color": "teal"
    },
    {
      "id": "exam_econ",
      "name": "Economics",
      "examDay": 10,
      "chapters": 5,
      "difficulty": 2,
      "color": "emerald"
    }
  ],
  "plan": [
    {
      "dayIndex": 1,
      "dateString": "Day 1",
      "isExamDay": false,
      "examName": null,
      "tasks": [
        {
          "id": "task_1_1",
          "examId": "exam_calc",
          "subject": "Calculus",
          "chapters": "Ch. 1–2",
          "hours": 1.5,
          "completed": true,
          "isRevision": false
        },
        {
          "id": "task_1_2",
          "examId": "exam_phys",
          "subject": "Physics",
          "chapters": "Ch. 1",
          "hours": 1.5,
          "completed": true,
          "isRevision": false
        },
        {
          "id": "task_1_3",
          "examId": "exam_econ",
          "subject": "Economics",
          "chapters": "Ch. 1",
          "hours": 1.0,
          "completed": false,
          "isRevision": false
        }
      ]
    }
    // Days 2 to 10...
  ],
  "undoSnapshot": null  // Previous plan JSON string for 1-click rollback
}
```

---

## Scheduling Rules (Plain English & Exact Numbers)

### 1. Hours Per Chapter by Difficulty
Difficulty represents conceptual density. Hours per chapter are scaled as:
- **Difficulty 1:** 0.75h per chapter
- **Difficulty 2:** 1.0h per chapter (Economics: 5 ch × 1.0h = 5.0h total)
- **Difficulty 3:** 1.25h per chapter
- **Difficulty 4:** 1.5h per chapter (Calculus: 8 ch × 1.5h = 12.0h total)
- **Difficulty 5:** 2.0h per chapter (Physics: 6 ch × 2.0h = 12.0h total)

Total workload for the 3 demo subjects: **29.0 hours**.

### 2. Exam Day & Light Revision Rules
- **Exam Day (Day $E$):** Exactly 0 hours of study for that subject.
- **Day Before Exam (Day $E-1$):** Reserved strictly for **Light Revision** (formula review, summary sheets). Capped at **1.0 hour** for that subject.
- **Active Study Days:** From Day 1 through Day $E-2$.

### 3. Priority & Daily Allocation Formula
For any given day $d$:
1. Determine active subjects that haven't reached their exam day ($d < E$).
2. Calculate urgency score: $U_s = \frac{\text{Remaining Study Hours}}{\text{Days Left Until Exam}}$.
3. Allocate available daily hours (e.g. 4.0h) proportionally to urgency scores.
4. Round each task to the nearest **0.5 hour** (minimum task: 0.5h, maximum single block: 2.5h) such that the day’s sum equals `dailyHours`.

### 4. Missed-Day Re-Plan Rules
When *"I missed today"* is triggered on Day $d$:
1. **Preserve Completed Work:** Any task with `completed: true` is locked and remains in Day $d$.
2. **Collect Unfinished Hours:** Sum hours of all incomplete tasks on Day $d$.
3. **Re-distribute:** Add unfinished hours back to each respective subject's remaining budget. Re-run priority allocation over remaining days $(d+1)$ up to the exam cutoffs.
4. **Compute Diff Object:** Compare total planned hours per day between old plan and new plan. Include only days where `newHours !== oldHours`.
5. **Undo Snapshot:** Save current plan to `undoSnapshot` before applying. Clicking *"Undo"* reverts the plan immediately.

### 5. Shortfall Rule (Capacity vs. Demand)
- **Total Capacity** = $(\text{Total Remaining Study Days}) \times \text{dailyHours}$.
- If $\text{Total Workload} > \text{Total Capacity}$:
  - Calculate deficit: $\Delta = \text{Workload} - \text{Capacity}$.
  - **Trimming Priority:** Trim lowest difficulty subjects first (Economics, diff 2), and furthest exams first.
  - Trimmed chapters are converted to high-level review blocks.
  - Renders calm message: *"You have X hours of study needed but only Y hours available at Z h/day (short by Δ hours). We prioritized your upcoming Calculus and Physics exams and trimmed Economics Ch. 4–5 to core summaries."*

---

## Worked Example: Day-by-Day Walkthrough

### Setup
- Daily hours: **4.0h**
- Calculus (Exam Day 6, 8 ch, diff 4): **12.0h total** (11h core + 1h light revision on Day 5)
- Physics (Exam Day 8, 6 ch, diff 5): **12.0h total** (11h core + 1h light revision on Day 7)
- Economics (Exam Day 10, 5 ch, diff 2): **5.0h total** (4h core + 1h light revision on Day 9)
- Total study load: **29.0 hours** across 10 calendar days. Total available capacity at 4h/day = **40.0 hours**.

---

### Initial Plan (Days 1 to 10)

| Day | Calculus (Exam Day 6) | Physics (Exam Day 8) | Economics (Exam Day 10) | Day Total | Focus Notes |
|:---|:---|:---|:---|:---|:---|
| **Day 1** | 1.5h (Ch. 1–2) | 1.5h (Ch. 1) | 1.0h (Ch. 1) | **4.0h** | 3 tasks; balanced kickoff |
| **Day 2** | 2.5h (Ch. 3–4) | 1.5h (Ch. 2) | — | **4.0h** | Calculus weighted high (urgency) |
| **Day 3** | 2.5h (Ch. 5–6) | 1.5h (Ch. 3) | — | **4.0h** | Calculus push |
| **Day 4** | 2.5h (Ch. 7–8) | 1.5h (Ch. 4) | — | **4.0h** | Calculus core complete |
| **Day 5** | **1.0h (Light Revision)** | 2.0h (Ch. 5) | 1.0h (Ch. 2) | **4.0h** | **Calculus Day-Before Light Rev** |
| **Day 6** | **0h (CALCULUS EXAM)** | 2.5h (Ch. 6) | 1.5h (Ch. 3) | **4.0h** | Calculus Exam Day; Physics push |
| **Day 7** | — | **1.0h (Light Revision)** | 1.5h (Ch. 4) | **2.5h** | **Physics Day-Before Light Rev** |
| **Day 8** | — | **0h (PHYSICS EXAM)** | 1.0h (Ch. 5) | **1.0h** | Physics Exam Day; Economics core done |
| **Day 9** | — | — | **1.0h (Light Revision)** | **1.0h** | **Economics Day-Before Light Rev** |
| **Day 10** | — | — | **0h (ECONOMICS EXAM)** | **0h** | **Economics Exam Day** |
| **Total**| **12.0h** | **12.0h** | **5.0h** | **29.0h** | All requirements satisfied |

---

### Scenario: Day 1 Missed Re-Plan
On Day 1:
- Student ticks Calculus Ch. 1–2 (1.5h) → **Done**
- Student ticks Physics Ch. 1 (1.5h) → **Done**
- Economics Ch. 1 (1.0h) is left **Unticked**
- Student taps *"I missed today"*. 
- Unfinished work to move: **1.0h of Economics**.

#### Re-Plan Diff Preview Modal:
- **Headline:** *"Moved 1.0h of unfinished Economics work across the next 3 days."*
- **Changed Days Only:**
  - **Day 2:** 4.0h → **4.0h** (No change)
  - **Day 3:** 4.0h → **4.0h** (No change)
  - **Day 4:** 4.0h → **4.0h** (No change)
  - **Day 7 (Economics):** 1.5h → **2.0h** *(+0.5h amber)*
  - **Day 8 (Economics):** 1.0h → **1.5h** *(+0.5h amber)*
- Tapping **Apply** updates the schedule. Completed tasks on Day 1 stay checked. Day 7 and Day 8 flash with subtle amber highlight. **Undo** button appears.

---

### Reality Check: Shortfall Scenario at 2h / day
When user edits daily limit to **2.0 hours/day**:
- Available capacity over 10 days = $10 \times 2.0\text{h} = \mathbf{20.0\text{ hours}}$.
- Total required work = **29.0 hours**.
- **Deficit:** $29.0 - 20.0 = \mathbf{9.0\text{ hours short}}$.

#### Calm Reality Check Banner Displayed:
> *"You have 29 hours of study needed across 3 subjects, but only 20 hours available at 2.0h/day (short by 9 hours).*
> 
> *To protect your upcoming exams and rest, we prioritized Calculus (8.0h) and Physics (8.0h), and trimmed Economics (Ch. 3–5 converted to key concept summaries, saving 3h) and light revision blocks (saving 6h)."*

---

## File Structure

```
e:\my-hackathon-app\
├── index.html           # Single entry point: UI containers, modals, templates
├── styles.css           # Complete design system: theme variables, cards, diff colors, responsive media queries
├── js/
│   ├── storage.js       # LocalStorage wrapper: get/save exams, plan, settings, undo
│   ├── scheduler.js     # Pure scheduling algorithm, priority weights, diff generator, shortfall calculation
│   └── app.js           # UI Controller: renders views, handles user interactions, modals, undo
├── devpost/             # Hackathon curriculum planning workspace
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   └── spec.md
└── .gitignore
```

---

## Manual Test Cases

1. **Empty First Run:** Launch app in clean incognito browser. Confirm Welcome screen appears with *"Add my first exam"*.
2. **Add Subjects:** Add Calculus, Physics, Economics with demo parameters. Verify list shows 3 cards with correct colors.
3. **Plan Generation:** Click *"Generate Plan"*. Verify Calculus has light revision on Day 5 and 0h on Day 6. Verify Physics light revision on Day 7 and 0h on Day 8.
4. **Today Task Ticking:** On Today screen, tick 2 tasks. Verify progress bar updates to *"2 of 4 tasks done"*. Refresh browser; verify tasks remain checked.
5. **Missed-Day Preview:** Tap *"I missed today"*. Verify modal opens with headline, affected days list, and amber indicator for added hours. Verify canceling does not change the plan.
6. **Apply & Undo:** Click *"Apply"*. Verify changed days highlight in full plan. Click *"Undo"*; verify plan restores immediately.
7. **Shortfall Check:** Lower hours to 2.0h. Verify calm shortfall alert appears explaining 9-hour deficit without application error.
8. **Mobile Viewport:** Resize browser to 375px width. Verify no horizontal overflow, buttons remain easy to tap (min 44px), and cards stack cleanly.

---

## Ordered Build Slices

Every slice produces an immediately runnable, verifiable deliverable:

1. **Slice 1: Foundation & Design System (`index.html`, `styles.css`)**
   - Implement theme tokens, layout structure, header navigation pills, and empty state welcome screen.
   - *How to verify:* Open browser. Inspect clean styling, responsive canvas, and *"Add my first exam"* button.
2. **Slice 2: Storage & Exam Management (`storage.js`, `app.js`)**
   - Implement localStorage read/write and the Add/Edit Exam modal with input validation.
   - *How to verify:* Add the 3 demo exams. Refresh page; confirm exams persist and display in the list.
3. **Slice 3: The Scheduling Engine (`scheduler.js`)**
   - Implement weighted schedule generation, day-before light revision, exam day cutoffs, and shortfall calculation.
   - *How to verify:* Run test script/console check against the worked example. Verify Day 1–10 allocations match the table numbers.
4. **Slice 4: Plan Timeline & Today Workspace (`app.js`)**
   - Render the Full Plan view and the Today checklist with interactive checkboxes and progress counter.
   - *How to verify:* View full schedule; verify badges. Tick 2 tasks on Today view; confirm counter updates and persists on reload.
5. **Slice 5: Missed-Day Preview & Undo (`scheduler.js`, `app.js`)**
   - Implement *"I missed today"* button, preview diff modal with amber tags, Apply commit, and floating Undo action.
   - *How to verify:* Leave 1 task unticked, click *"I missed today"*, verify preview diff, click Apply, observe highlighted days, click Undo.
6. **Slice 6: Reality Check (Shortfall) & Polish (`app.js`, `styles.css`)**
   - Implement shortfall alert on hour reductions, mobile responsive adjustments, and final visual polish.
   - *How to verify:* Lower daily hours to 2h and observe calm shortfall banner. Shrink window to phone width and run the complete 2-minute demo sequence.
