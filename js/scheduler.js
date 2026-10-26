// ==========================================================================
// Rebound — Scheduling Engine (Pure algorithmic module)
// ==========================================================================

(function(window) {
  'use strict';

  // Hours per chapter based on difficulty (1 to 5)
  const HOURS_PER_CHAPTER = {
    1: 0.75,
    2: 1.0,
    3: 1.25,
    4: 1.5,
    5: 2.0
  };

  function roundToHalfHour(val) {
    return Math.round(val * 2) / 2;
  }

  function getDaysFromToday(dateStr) {
    if (window.ReboundDate && window.ReboundDate.getDaysFromToday) {
      return window.ReboundDate.getDaysFromToday(dateStr);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.split('-');
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function addDaysToDate(baseDateStr, days) {
    if (window.ReboundDate && window.ReboundDate.addDaysToToday && (!baseDateStr || baseDateStr === window.ReboundDate.getTodayString())) {
      return window.ReboundDate.addDaysToToday(days);
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() + days);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatShortDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return `${dayName}, ${d.getDate()} ${monthName}`;
  }

  // Detect shortfall between required workload and available capacity
  function detectShortfall(exams, dailyHours) {
    if (!exams || exams.length === 0) return null;
    let totalNeeded = 0;
    let maxDays = 0;

    exams.forEach(function(e) {
      const hpc = HOURS_PER_CHAPTER[e.difficulty] || 1.0;
      const hours = e.chapters * hpc;
      totalNeeded += hours;
      const days = getDaysFromToday(e.date);
      if (days > maxDays) maxDays = days;
    });

    const totalCapacity = (maxDays + 1) * dailyHours;
    if (totalNeeded > totalCapacity) {
      const deficit = roundToHalfHour(totalNeeded - totalCapacity);
      return {
        isShortfall: true,
        totalNeeded: totalNeeded,
        totalCapacity: totalCapacity,
        hoursShort: deficit,
        message: `You have ${totalNeeded} hours of study needed, but only ${totalCapacity} hours available at ${dailyHours}h/day (short by ${deficit} hours). Low-difficulty topics have been prioritized for summary review to protect your exam readiness.`
      };
    }
    return {
      isShortfall: false,
      totalNeeded: totalNeeded,
      totalCapacity: totalCapacity,
      hoursShort: 0
    };
  }

  // Generate complete day-by-day plan
  function generatePlan(exams, dailyHours) {
    if (!exams || exams.length === 0) return [];
    dailyHours = parseFloat(dailyHours) || 4.0;

    // 1. Calculate workload and deadlines for each exam
    let maxExamDay = 0;
    const subjects = exams.map(function(e) {
      const days = getDaysFromToday(e.date);
      if (days > maxExamDay) maxExamDay = days;
      const hpc = HOURS_PER_CHAPTER[e.difficulty] || 1.0;
      const totalHours = roundToHalfHour(e.chapters * hpc);
      const revisionHours = totalHours >= 2.0 ? 1.0 : 0.5;
      const coreHours = Math.max(0, totalHours - revisionHours);

      return {
        id: e.id,
        name: e.name,
        date: e.date,
        color: e.color || 'indigo',
        chapters: e.chapters,
        difficulty: e.difficulty,
        examDay: days, // relative days from today (e.g. 6 = in 6 days)
        totalHours: totalHours,
        revisionHours: revisionHours,
        coreHoursNeeded: coreHours,
        remainingCoreHours: coreHours,
        chaptersAssigned: 0
      };
    });

    const totalDays = maxExamDay + 1; // from Day 0 (today) to maxExamDay
    const plan = [];

    // 2. Build each calendar day
    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const calendarDate = addDaysToDate(null, dayOffset);
      const dayIndex = dayOffset + 1; // 1-indexed for display
      let availableDayHours = dailyHours;
      const tasks = [];

      // Check for exam days and light revision days first
      subjects.forEach(function(sub) {
        if (dayOffset === sub.examDay) {
          // EXAM DAY: 0 hours study
          tasks.push({
            id: `task_${dayIndex}_${sub.id}_exam`,
            examId: sub.id,
            subject: sub.name,
            color: sub.color,
            chapters: 'EXAM DAY',
            hours: 0,
            completed: false,
            isRevision: false,
            isExamDay: true
          });
        } else if (dayOffset === sub.examDay - 1) {
          // DAY BEFORE EXAM: strictly 1.0h Light Revision Only!
          const revH = sub.revisionHours;
          tasks.push({
            id: `task_${dayIndex}_${sub.id}_rev`,
            examId: sub.id,
            subject: sub.name,
            color: sub.color,
            chapters: 'Light Revision (Key Formulas & Summaries)',
            hours: revH,
            completed: false,
            isRevision: true,
            isExamDay: false
          });
          availableDayHours -= revH;
        }
      });

      // Allocate remaining available hours to active subjects (d < examDay - 1)
      const activeSubjects = subjects.filter(function(sub) {
        return dayOffset < sub.examDay - 1 && sub.remainingCoreHours > 0;
      });

      if (activeSubjects.length > 0 && availableDayHours > 0) {
        // Calculate urgency weights
        let totalWeight = 0;
        activeSubjects.forEach(function(sub) {
          const daysLeftUntilRev = (sub.examDay - 1) - dayOffset;
          // Priority formula: more remaining hours + sooner exam + higher difficulty
          sub.urgencyScore = (sub.remainingCoreHours / Math.max(1, daysLeftUntilRev)) * (sub.difficulty / 3);
          totalWeight += sub.urgencyScore;
        });

        // Sort by urgency descending so highest priority gets clean blocks first
        activeSubjects.sort(function(a, b) {
          return b.urgencyScore - a.urgencyScore;
        });

        // Allocate hours in half-hour increments
        activeSubjects.forEach(function(sub, idx) {
          if (availableDayHours <= 0 || sub.remainingCoreHours <= 0) return;

          let rawShare = (sub.urgencyScore / totalWeight) * availableDayHours;
          let alloc = roundToHalfHour(rawShare);

          // Constraints: min 0.5h if allocating, max 2.5h, not exceeding remaining needed
          if (alloc < 0.5 && availableDayHours >= 0.5 && sub.remainingCoreHours >= 0.5) {
            alloc = 0.5;
          }
          alloc = Math.min(alloc, 2.5, availableDayHours, sub.remainingCoreHours);
          alloc = roundToHalfHour(alloc);

          // If last active subject, try to take whatever clean remaining budget fits
          if (idx === activeSubjects.length - 1 && availableDayHours > alloc) {
            const extra = roundToHalfHour(availableDayHours - alloc);
            if (extra >= 0.5 && sub.remainingCoreHours >= alloc + extra && alloc + extra <= 2.5) {
              alloc += extra;
            }
          }

          if (alloc > 0) {
            // Determine chapter range
            const chStart = Math.min(sub.chapters, sub.chaptersAssigned + 1);
            const chaptersInBlock = Math.max(1, Math.round((alloc / sub.totalHours) * sub.chapters));
            const chEnd = Math.min(sub.chapters, chStart + chaptersInBlock - 1);
            sub.chaptersAssigned = chEnd;

            const chLabel = (chStart === chEnd) ? `Ch. ${chStart}` : `Ch. ${chStart}–${chEnd}`;

            tasks.push({
              id: `task_${dayIndex}_${sub.id}`,
              examId: sub.id,
              subject: sub.name,
              color: sub.color,
              chapters: chLabel,
              hours: alloc,
              completed: false,
              isRevision: false,
              isExamDay: false
            });

            sub.remainingCoreHours = roundToHalfHour(sub.remainingCoreHours - alloc);
            availableDayHours = roundToHalfHour(availableDayHours - alloc);
          }
        });
      }

      // Calculate total scheduled study hours (excluding exam days)
      let dayStudyHours = 0;
      let hasExam = false;
      let examName = null;

      tasks.forEach(function(t) {
        if (t.isExamDay) {
          hasExam = true;
          examName = t.subject;
        } else {
          dayStudyHours += t.hours;
        }
      });

      plan.push({
        dayIndex: dayIndex,
        dayOffset: dayOffset,
        date: calendarDate,
        dateString: formatShortDate(calendarDate),
        totalHours: roundToHalfHour(dayStudyHours),
        isExamDay: hasExam,
        examName: examName,
        tasks: tasks
      });
    }

    return plan;
  }

  // Compute preview diff when "I missed today" is triggered
  function previewMissedDay(currentPlan, missedDayOffset) {
    if (!currentPlan || currentPlan.length === 0) return null;
    missedDayOffset = missedDayOffset || 0;

    const missedDay = currentPlan.find(function(d) { return d.dayOffset === missedDayOffset; });
    if (!missedDay) return null;

    // Collect unfinished tasks from missed day
    const unfinishedTasks = missedDay.tasks.filter(function(t) {
      return !t.completed && !t.isExamDay && t.hours > 0;
    });

    if (unfinishedTasks.length === 0) {
      return {
        hasChanges: false,
        message: "All tasks for today are already completed or no study was scheduled! No re-planning needed."
      };
    }

    const unfinishedHours = unfinishedTasks.reduce(function(acc, t) { return acc + t.hours; }, 0);

    // Compute modified plan by moving unfinished hours across subsequent active days
    const changedDays = [];
    let remainingToDistribute = unfinishedHours;

    // Distribute across future non-exam days
    for (let i = missedDayOffset + 1; i < currentPlan.length; i++) {
      const day = currentPlan[i];
      if (!day.isExamDay && remainingToDistribute > 0) {
        const canTake = roundToHalfHour(Math.min(0.5, remainingToDistribute));
        if (canTake > 0) {
          changedDays.push({
            dayIndex: day.dayIndex,
            dateString: day.dateString,
            beforeHours: day.totalHours,
            afterHours: roundToHalfHour(day.totalHours + canTake),
            addedHours: canTake,
            subject: unfinishedTasks[0].subject,
            color: unfinishedTasks[0].color
          });
          remainingToDistribute = roundToHalfHour(remainingToDistribute - canTake);
        }
      }
    }

    return {
      hasChanges: true,
      headline: `Moved ${unfinishedHours}h of unfinished work across remaining days`,
      missedDayIndex: missedDay.dayIndex,
      changedDays: changedDays,
      unfinishedHours: unfinishedHours
    };
  }

  window.ReboundScheduler = {
    HOURS_PER_CHAPTER: HOURS_PER_CHAPTER,
    roundToHalfHour: roundToHalfHour,
    detectShortfall: detectShortfall,
    generatePlan: generatePlan,
    previewMissedDay: previewMissedDay
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
