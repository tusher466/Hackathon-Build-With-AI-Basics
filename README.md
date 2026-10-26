# Rebound 🎯

> **A study plan that bounces back when you miss a day.**  
> *Built for the Devpost "Build With AI: Basics" Hackathon.*

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Pure Vanilla JS](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-success)](https://github.com/tusher466/Hackathon-Build-With-AI-Basics)
[![RFC 5545 Compliant](https://img.shields.io/badge/Calendar-iCalendar%20.ics-orange)](https://datatracker.ietf.org/doc/html/rfc5545)

---

## 💡 The Problem

University students managing overlapping exam periods face constant anxiety. Traditional study timetables are rigid: if life interrupts and you miss a single Tuesday, the entire plan collapses into guilt and disarray. Students either spend hours manually rebuilding schedules in spreadsheets or abandon planning altogether.

## ✨ The Solution: Rebound

**Rebound** is an intelligent, calm, stress-reducing exam study planner. It balances workloads based on subject difficulty and exam urgency, protects exam readiness, and features a non-punitive re-planning engine: **when you miss a day, tap one button to see what moves, with transparent diffs and full undo support.**

---

## 🚀 Key Features

### 1. 🧠 Smart Weighted Scheduling
- Calibrates study time using **perceived difficulty (1–5 scale)** and **days remaining until each exam**.
- Allocates core study hours into structured 0.5-hour to 2.5-hour focused blocks.
- Heavier workloads and nearer exams automatically receive higher priority.

### 2. 🛡️ Day-Before Light Revision & Exam Day Protection
- **Exam Day:** Strictly **0 hours** of study scheduled for that subject.
- **Day Before Exam:** Capped at **1.0 hour of Light Revision** (formula review and summaries), protecting cognitive stamina and rest.

### 3. 🔄 The Rebound Moment (Zero-Guilt Re-Plan & Undo)
- If a day is missed, tap **"I missed today"**.
- Displays an anxiety-free **diff preview modal** showing *only the days that changed*, with before-and-after hours and clear amber tags for added time.
- **Completed work is locked and never deleted.**
- Features an immediate **floating Undo action** to rollback changes with one click.

### 4. 📊 Reality Check Forecast (What-If Simulator)
- A dedicated **Forecast** tab providing proactive what-if simulation before committing to a schedule.
- **Where you stand:** Visual cards for each active subject with needed hours, scheduled hours, coverage bars, and non-amber status badges (*"On track"*, *"Tight"*, *"Behind"*).
- **Interactive Slider (1–10h/day):** Live instant updates showing total hours short or *"Everything fits!"* without ever mutating saved data.
- **The Minimum You Need:** Fast calculator that determines the exact lowest daily study hours required to cover 100% of curriculum.
- **"Use X hours/day":** Safe confirmation dialog that recalculates the plan while keeping all completed task ticks intact.

### 5. 📅 Add to Calendar (.ics Export)
- Directly export your study schedule as a standard **`rebound-plan.ics`** file.
- RFC 5545 compliant with CRLF line endings and plain calendar dates (`VALUE=DATE`) to eliminate time zone shifts.
- Completed tasks are automatically excluded.
- Imports cleanly into Google Calendar, Apple Calendar, and Outlook.

### 6. 📱 Phone-First Responsive Design System
- Custom design tokens with high-contrast accessibility (min 44px touch targets).
- Segmented navigation (`Today`, `Full Plan`, `Forecast`) engineered to fit smoothly on mobile screens without overflow.
- Distinct color coding: Indigo (Calculus), Violet (Physics), Sky (Economics), Green reserved strictly for "Done", and Amber reserved exclusively for "Changed/Added Time".

---

## 🧪 Demo Scenario Walkthrough

Rebound includes a standardized 3-exam test scenario:

| Subject | Days to Exam | Chapters | Difficulty (1–5) | Total Required Work |
| :--- | :--- | :--- | :--- | :--- |
| **Calculus** | 6 days | 8 chapters | 4 (Hard) | **12.0 hours** (11h core + 1h revision on Day 5) |
| **Physics** | 8 days | 6 chapters | 5 (Very Hard) | **12.0 hours** (11h core + 1h revision on Day 7) |
| **Economics** | 10 days | 5 chapters | 2 (Easy) | **5.0 hours** (4h core + 1h revision on Day 9) |

- **At 4.0h/day:** Clean fit (29.0 hours scheduled across 10 days, 0h shortfall, all 3 subjects 100% On track).
- **At 2.0h/day:** Exhibits a 10.0h shortfall with Physics falling behind, triggering the calm reality check shortfall banner.
- **Clean Start Minimum Needed:** **3.5 hours/day**.
- **After Day 1 (Calculus & Physics ticked):** Workload drops to 25.5h, minimum needed drops to **3.0 hours/day**.

---

## 🛠️ Architecture & Technical Rules

- **Client-Side Only:** Runs entirely in the browser using `localStorage`. No database, no user accounts, no tracking.
- **Pure Functional Core:**
  - `scheduler.js`: Pure mathematical scheduler (`generatePlan`, `detectShortfall`, `previewMissedDay`, `simulateForecast`, `findMinimumDailyHours`, `generateICS`).
  - `storage.js`: Clean localStorage abstraction with automatic fallback.
  - `app.js`: Reactive UI controller and view renderer with hash routing (`#today`, `#plan`, `#forecast`).
- **Zero External Dependencies:** Built with pure vanilla HTML, modern CSS variables, and ES6+ JavaScript.

---

## 🏃 Running Locally

Clone the repository and run any local HTTP server:

```bash
# Clone the repository
git clone https://github.com/tusher466/Hackathon-Build-With-AI-Basics.git
cd Hackathon-Build-With-AI-Basics

# Run with Python
python -m http.server 8000

# Or run with Node.js
npx serve .
```

Open your browser at **`http://localhost:8000/`**.

---

## 📂 Project Structure

```
├── index.html           # Main semantic structure, navigation pills, and modal dialogs
├── styles.css           # Complete responsive design system and token variables
├── js/
│   ├── scheduler.js     # Pure algorithmic scheduling, diff generation, and ICS export
│   ├── storage.js       # LocalStorage wrapper (settings, exams, plan, undo snapshots)
│   └── app.js           # UI Controller, hash navigation, task ticking, and modals
├── devpost/             # Hackathon curriculum planning workspace
│   ├── scope.md         # Problem definition, core loop, and POC boundaries
│   ├── prd.md           # Product Requirements Document & test criteria
│   ├── spec.md          # Complete technical blueprint and worked examples
│   └── checklist.md     # Ordered build slices & verification checklist
└── README.md            # Project overview and documentation
```

---

## 📜 Planning & Spec Documents

This project was built following the plan-first curriculum:
- [Product Requirements Document (PRD)](./devpost/prd.md)
- [Technical Specification](./devpost/spec.md)
- [Build Checklist](./devpost/checklist.md)

---

## ⚖️ License

MIT License — Created for the Devpost "Build With AI: Basics" Hackathon.