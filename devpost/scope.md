---
doc: scope
status: approved
---

# Exam Study Planner (Crunch-Time Rebalancer)

An intelligent, anxiety-reducing study scheduler for university students facing tight exam periods that dynamically rebalances remaining work and clearly visualizes changes when a day is missed.

## The Unique Kernel
A transparent, non-punitive re-planning preview: instead of instantly rewriting the schedule when a study session is missed, the app shows a calm diff ("Moved 3h of unfinished work across the next 4 days") highlighting exact before-and-after hours per day in subject colors (with amber for added time), requiring user confirmation and offering full Undo support.

## Who It's For
University students juggling several exams close together. Today they rely on rigid spreadsheets, paper planners, or static to-do lists that collapse the moment a day is missed, triggering guilt, confusion, and planning paralysis.

## The Core Loop
1. Open the app to the **Today** screen and check off completed study tasks ("X of Y done").
2. When life happens or a day is missed, tap **"I missed today"** (or accept the gentle next-day banner).
3. Inspect the **Re-plan Preview** showing the headline, affected days, before/after hours, and subject color tags.
4. Tap **Apply** to update the plan (with changed days temporarily highlighted) or **Undo** if desired.
5. If total available hours cannot fit the remaining chapters, receive a calm shortfall notification stating the exact deficit and what was trimmed first.

## Inspiration & Identity
- **Tone:** Empathetic, supportive, reassuring (*"Plans change. Here's your updated plan."*).
- **Aesthetic:** Clean, modern, distraction-free with distinct subject colors and clear amber indicators for added study time.
- **Form factor:** Fully responsive, polished on desktop and mobile screens.

## Why This Matters to the Learner
The learner wants to build a complete, highly polished proof of concept within an afternoon that solves the real-world anxiety of exam crunches, engineered to deliver an airtight ~2 minute demo video for the hackathon.

## What "Working" Looks Like
A crisp, 2-minute walkthrough executed on a fresh browser:
1. **Empty State:** Clean first-run screen with "Add my first exam".
2. **Add Exams:** Enter Calculus (in 6d, 8ch, diff 4), Physics (in 8d, 6ch, diff 5), Economics (in 10d, 5ch, diff 2), set 4 daily hours, and generate the plan.
3. **Plan View:** Balanced schedule where harder and sooner exams get more weight, and the day before each exam is reserved for light revision.
4. **Today Screen:** Check off 2 of 3 tasks with real-time progress update.
5. **The Re-Plan Moment:** Tap "I missed today", review preview diff with amber before-and-after hours, tap Apply, show highlighted days, retain completed tasks, and demonstrate Undo.
6. **Persistence:** Page refresh maintains full state via local storage.
7. **Reality Check:** Reduce daily hours from 4 to 2 to trigger the calm shortfall message and explanation of trimmed work.
8. **Mobile View:** Shrink browser to phone width to show responsive Today screen layout.

## The POC Boundary
- **Included (Now):**
  - First-run empty state & "Add my first exam" trigger.
  - Exam creation form (subject name, relative exam date, chapter count, difficulty 1–5).
  - Configurable daily study hours setting.
  - Weighted study planner algorithm (accounts for difficulty, urgency, and day-before light revision).
  - Today screen with task checkboxes, progress counter, and "I missed today" action.
  - Next-day gentle prompt banner if yesterday had unfinished tasks.
  - Re-plan diff preview modal/sheet (headline, affected days only, before -> after hours, subject colors, amber highlights, Apply/Cancel, Undo).
  - Shortfall calculation and calm advisory message explaining hours deficit and prioritized trimming.
  - LocalStorage persistence for all inputs, completed tasks, and schedule revisions.
  - Responsive mobile and desktop styling.

## Later
- Google Calendar and iCal sync.
- Browser push notifications and daily study reminders.
- Pomodoro timer or integrated study stopwatches.
- Multi-term / multi-semester archiving and subject history.
- Canvas / Blackboard LMS syllabus ingestion.
- Cloud authentication and multi-device sync.

## Explicitly Cut
- **Automated sample data button:** Omitted because live typing in the demo proves the input forms function properly.
- **Complex user accounts / login:** Unnecessary complexity for single-user local proof of concept.
- **Social features / study buddy sharing:** Distracts from individual scheduling and rebalancing logic.
