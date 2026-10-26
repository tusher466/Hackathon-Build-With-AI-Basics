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

    const totalStudyDays = Math.max(1, maxDays);
    const totalCapacity = totalStudyDays * dailyHours;
    if (totalNeeded > totalCapacity) {
      const deficit = roundToHalfHour(totalNeeded - totalCapacity);
      const sortedByDiff = exams.slice().sort(function(a, b) {
        return a.difficulty - b.difficulty;
      });
      const trimmedSub = sortedByDiff[0].name;
      const prioritizedSubs = sortedByDiff.slice(1).map(function(s) { return s.name; });
      let trimmedDetail = `trimmed ${trimmedSub} to core summaries`;
      if (prioritizedSubs.length > 0) {
        trimmedDetail = `prioritized your upcoming ${prioritizedSubs.join(' and ')} exams and ${trimmedDetail}`;
      }
      return {
        isShortfall: true,
        totalNeeded: totalNeeded,
        totalCapacity: totalCapacity,
        hoursShort: deficit,
        message: `You have ${totalNeeded} hours of study needed across ${exams.length} subjects, but only ${totalCapacity} hours available at ${dailyHours}h/day (short by ${deficit} hours). We ${trimmedDetail} to protect your exam readiness and rest.`
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
          availableDayHours = roundToHalfHour(availableDayHours - revH);
        }
      });

      // Allocate core hours in 0.5h slices
      while (availableDayHours >= 0.5) {
        const eligible = subjects.filter(function(s) {
          return dayOffset < s.examDay - 1 && s.remainingCoreHours >= 0.5;
        });
        if (eligible.length === 0) break;

        const scored = eligible.map(function(s) {
          const daysLeft = (s.examDay - 1) - dayOffset;
          const taskToday = tasks.find(function(t) { return t.examId === s.id && !t.isRevision && !t.isExamDay; });
          const currentHoursToday = taskToday ? taskToday.hours : 0;
          const maxBlock = (daysLeft === 1) ? Math.min(availableDayHours + currentHoursToday, s.remainingCoreHours + currentHoursToday) : 2.5;
          const canTakeMore = currentHoursToday + 0.5 <= maxBlock;

          let urgency = (s.remainingCoreHours / Math.pow(Math.max(1, daysLeft), 1.5)) * (s.difficulty / 3);
          if (daysLeft === 1) {
            urgency += 100; // Must finish core before revision tomorrow!
          } else if (dayOffset === 0 && currentHoursToday === 0 && s.remainingCoreHours >= 1.0) {
            urgency += 1.0; // Day 1 kickoff representation
          }
          return { s: s, canTakeMore: canTakeMore, score: urgency };
        }).filter(function(x) { return x.canTakeMore; });

        if (scored.length === 0) break;

        scored.sort(function(a, b) { return b.score - a.score; });
        const chosen = scored[0].s;

        let task = tasks.find(function(t) { return t.examId === chosen.id && !t.isRevision && !t.isExamDay; });
        if (!task) {
          task = {
            id: `task_${dayIndex}_${chosen.id}`,
            examId: chosen.id,
            subject: chosen.name,
            color: chosen.color,
            chapters: '',
            hours: 0,
            completed: false,
            isRevision: false,
            isExamDay: false
          };
          tasks.push(task);
        }
        task.hours = roundToHalfHour(task.hours + 0.5);
        chosen.remainingCoreHours = roundToHalfHour(chosen.remainingCoreHours - 0.5);
        availableDayHours = roundToHalfHour(availableDayHours - 0.5);
      }

      // Assign chapter labels for tasks on this day
      tasks.forEach(function(t) {
        if (t.isExamDay || t.isRevision) return;
        const sub = subjects.find(function(s) { return s.id === t.examId; });
        if (!sub) return;
        const chStart = Math.min(sub.chapters, sub.chaptersAssigned + 1);
        const chaptersInBlock = Math.max(1, Math.round((t.hours / sub.totalHours) * sub.chapters));
        const chEnd = Math.min(sub.chapters, chStart + chaptersInBlock - 1);
        sub.chaptersAssigned = chEnd;
        t.chapters = (chStart === chEnd) ? `Ch. ${chStart}` : `Ch. ${chStart}–${chEnd}`;
      });

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
  function previewMissedDay(currentPlan, missedDayOffset, dailyHours) {
    if (!currentPlan || currentPlan.length === 0) return null;
    missedDayOffset = missedDayOffset || 0;
    dailyHours = dailyHours || 4.0;

    const missedDay = currentPlan.find(function(d) { return d.dayOffset === missedDayOffset; });
    if (!missedDay) return null;

    // Collect unfinished tasks from missed day (excluding exam day placeholders and 0h tasks)
    const unfinishedTasks = missedDay.tasks.filter(function(t) {
      return !t.completed && !t.isExamDay && t.hours > 0;
    });

    if (unfinishedTasks.length === 0) {
      return {
        hasChanges: false,
        message: "All tasks for today are already completed! Nothing to re-plan."
      };
    }

    const unfinishedHours = roundToHalfHour(unfinishedTasks.reduce(function(acc, t) { return acc + t.hours; }, 0));
    const newPlan = JSON.parse(JSON.stringify(currentPlan));
    const newMissedDay = newPlan.find(function(d) { return d.dayOffset === missedDayOffset; });

    // Retain strictly completed tasks on the missed day
    newMissedDay.tasks = newMissedDay.tasks.filter(function(t) { return t.completed; });
    newMissedDay.totalHours = roundToHalfHour(newMissedDay.tasks.reduce(function(sum, t) { return sum + t.hours; }, 0));

    // Check if tasks can be rescheduled before exams
    let unplacedHours = 0;
    const changedDaysMap = {};

    unfinishedTasks.forEach(function(task) {
      let hoursLeft = task.hours;

      // Pass 1: Place in days with spare capacity (totalHours < dailyHours)
      for (let i = missedDayOffset + 1; i < newPlan.length; i++) {
        const d = newPlan[i];
        if (hoursLeft <= 0) break;

        // Cannot place on or after exam day for this subject
        const hasSubjectExam = d.tasks.some(function(t) { return t.examId === task.examId && t.isExamDay; });
        const hasSubjectRev = d.tasks.some(function(t) { return t.examId === task.examId && t.isRevision; });
        if (hasSubjectExam || hasSubjectRev) continue;

        const spare = roundToHalfHour(Math.max(0, dailyHours - d.totalHours));
        if (spare >= 0.5) {
          const canTake = roundToHalfHour(Math.min(spare, hoursLeft, 1.0));
          d.tasks.push({
            id: 'task_' + d.dayIndex + '_' + task.examId + '_rebound',
            examId: task.examId,
            subject: task.subject,
            color: task.color,
            chapters: task.chapters,
            hours: canTake,
            completed: false,
            isRevision: false,
            isExamDay: false,
            isReboundAdded: true
          });
          d.totalHours = roundToHalfHour(d.totalHours + canTake);
          hoursLeft = roundToHalfHour(hoursLeft - canTake);
          changedDaysMap[d.dayIndex] = {
            subject: task.subject,
            color: task.color
          };
        }
      }

      // Pass 2: If still remaining, distribute in 0.5h increments to active pre-exam days
      if (hoursLeft > 0) {
        for (let i = missedDayOffset + 1; i < newPlan.length; i++) {
          const d = newPlan[i];
          if (hoursLeft <= 0) break;
          const hasSubjectExam = d.tasks.some(function(t) { return t.examId === task.examId && t.isExamDay; });
          if (hasSubjectExam) continue;

          const canTake = roundToHalfHour(Math.min(0.5, hoursLeft));
          d.tasks.push({
            id: 'task_' + d.dayIndex + '_' + task.examId + '_rebound',
            examId: task.examId,
            subject: task.subject,
            color: task.color,
            chapters: task.chapters,
            hours: canTake,
            completed: false,
            isRevision: false,
            isExamDay: false,
            isReboundAdded: true
          });
          d.totalHours = roundToHalfHour(d.totalHours + canTake);
          hoursLeft = roundToHalfHour(hoursLeft - canTake);
          changedDaysMap[d.dayIndex] = {
            subject: task.subject,
            color: task.color
          };
        }
      }

      if (hoursLeft > 0) {
        unplacedHours += hoursLeft;
      }
    });

    // Build changed days diff list
    const changedDays = [];
    newPlan.forEach(function(d) {
      const oldD = currentPlan.find(function(od) { return od.dayIndex === d.dayIndex; });
      if (oldD && d.dayIndex !== missedDay.dayIndex && d.totalHours !== oldD.totalHours) {
        const added = roundToHalfHour(d.totalHours - oldD.totalHours);
        const meta = changedDaysMap[d.dayIndex] || { subject: unfinishedTasks[0].subject, color: unfinishedTasks[0].color };
        changedDays.push({
          dayIndex: d.dayIndex,
          dateString: d.dateString,
          beforeHours: oldD.totalHours,
          afterHours: d.totalHours,
          addedHours: added,
          subject: meta.subject,
          color: meta.color
        });
      }
    });

    let headline = `Moved ${unfinishedHours}h of unfinished work across remaining days`;
    if (unfinishedTasks.length === 1) {
      headline = `Moved ${unfinishedHours}h of unfinished ${unfinishedTasks[0].subject} work across remaining days`;
    }

    let warningMessage = null;
    if (unplacedHours > 0) {
      warningMessage = `Exam cutoff: ${unplacedHours}h of study could not be rescheduled because your exam date is tomorrow. Exam days are strictly protected for 0h study.`;
    }

    return {
      hasChanges: changedDays.length > 0 || newMissedDay.totalHours !== missedDay.totalHours,
      headline: headline,
      missedDayIndex: missedDay.dayIndex,
      unfinishedHours: unfinishedHours,
      unplacedHours: unplacedHours,
      warningMessage: warningMessage,
      changedDays: changedDays,
      newPlan: newPlan
    };
  }

  // Pure Forecast Simulator
  function simulateForecast(exams, currentPlan, simulatedDailyHours, currentDailyHours) {
    if (!exams || exams.length === 0) {
      return {
        simulatedDailyHours: parseFloat(simulatedDailyHours) || 4.0,
        currentDailyHours: parseFloat(currentDailyHours) || 4.0,
        subjects: [],
        totalNeeded: 0,
        totalScheduled: 0,
        totalShortfall: 0,
        everythingFits: true,
        coveredCount: 0,
        totalCount: 0,
        noExams: true
      };
    }

    simulatedDailyHours = parseFloat(simulatedDailyHours) || 4.0;
    currentDailyHours = parseFloat(currentDailyHours) || 4.0;

    const subjectsMap = {};
    let allExamsPassed = true;
    let allTasksDone = true;

    exams.forEach(function(e) {
      const daysLeft = getDaysFromToday(e.date);
      const isPassed = daysLeft < 0;
      if (!isPassed) allExamsPassed = false;
      const hpc = HOURS_PER_CHAPTER[e.difficulty] || 1.0;
      const totalRequired = roundToHalfHour(e.chapters * hpc);
      subjectsMap[e.id] = {
        id: e.id,
        name: e.name,
        color: e.color || 'indigo',
        difficulty: e.difficulty,
        daysLeft: daysLeft,
        totalRequired: totalRequired,
        completedHours: 0,
        neededHours: totalRequired,
        isExamPassed: isPassed
      };
    });

    // Deduct completed tasks from current plan
    if (currentPlan && Array.isArray(currentPlan)) {
      currentPlan.forEach(function(day) {
        if (!day.tasks) return;
        day.tasks.forEach(function(task) {
          if (task.completed && task.examId && subjectsMap[task.examId]) {
            subjectsMap[task.examId].completedHours = roundToHalfHour(
              subjectsMap[task.examId].completedHours + (task.hours || 0)
            );
          }
        });
      });
    }

    Object.keys(subjectsMap).forEach(function(id) {
      const s = subjectsMap[id];
      s.neededHours = Math.max(0, roundToHalfHour(s.totalRequired - s.completedHours));
      if (s.neededHours > 0 && !s.isExamPassed) {
        allTasksDone = false;
      }
    });

    // Active exams to simulate remaining workload
    const activeExams = [];
    exams.forEach(function(e) {
      const s = subjectsMap[e.id];
      if (s.isExamPassed || s.neededHours <= 0) return;
      const hpc = HOURS_PER_CHAPTER[e.difficulty] || 1.0;
      const effectiveChapters = Math.max(0.5, s.neededHours / hpc);
      activeExams.push({
        id: e.id,
        name: e.name,
        date: e.date,
        color: e.color,
        difficulty: e.difficulty,
        chapters: effectiveChapters
      });
    });

    // Run pure planner allocation with simulated hours
    let simPlan = [];
    if (activeExams.length > 0) {
      simPlan = generatePlan(activeExams, simulatedDailyHours);
    }

    const scheduledMap = {};
    simPlan.forEach(function(d) {
      if (!d.tasks) return;
      d.tasks.forEach(function(t) {
        if (!t.isExamDay && t.examId) {
          scheduledMap[t.examId] = roundToHalfHour((scheduledMap[t.examId] || 0) + t.hours);
        }
      });
    });

    let totalNeeded = 0;
    let totalScheduled = 0;
    const subjectForecasts = [];

    exams.forEach(function(e) {
      const s = subjectsMap[e.id];
      if (s.isExamPassed) return;

      const needed = s.neededHours;
      totalNeeded += needed;

      let scheduled = 0;
      if (needed === 0) {
        scheduled = 0;
      } else {
        scheduled = Math.min(needed, scheduledMap[e.id] || 0);
      }
      totalScheduled += scheduled;

      let coveragePct = 100;
      if (needed > 0) {
        coveragePct = Math.min(100, Math.round((scheduled / needed) * 100));
      }

      let status = 'on-track';
      let statusLabel = 'On track';
      if (coveragePct < 80) {
        status = 'behind';
        statusLabel = 'Behind';
      } else if (coveragePct < 100) {
        status = 'tight';
        statusLabel = 'Tight';
      }

      subjectForecasts.push({
        id: e.id,
        name: e.name,
        color: s.color,
        daysLeft: s.daysLeft,
        neededHours: needed,
        scheduledHours: scheduled,
        coveragePct: coveragePct,
        status: status,
        statusLabel: statusLabel
      });
    });

    const totalShortfall = Math.max(0, roundToHalfHour(totalNeeded - totalScheduled));
    const coveredSim = subjectForecasts.filter(function(s) { return s.coveragePct === 100; }).length;
    const totalSubs = subjectForecasts.length;

    return {
      simulatedDailyHours: simulatedDailyHours,
      currentDailyHours: currentDailyHours,
      subjects: subjectForecasts,
      totalNeeded: totalNeeded,
      totalScheduled: totalScheduled,
      totalShortfall: totalShortfall,
      everythingFits: totalShortfall === 0 && subjectForecasts.every(function(s) { return s.coveragePct === 100; }),
      coveredCount: coveredSim,
      totalCount: totalSubs,
      allExamsPassed: allExamsPassed,
      allTasksDone: allTasksDone
    };
  }

  // Fast minimum scanner
  function findMinimumDailyHours(exams, currentPlan) {
    if (!exams || exams.length === 0) return null;
    for (let h = 0.5; h <= 12.0; h += 0.5) {
      const res = simulateForecast(exams, currentPlan, h, 4.0);
      if (res.everythingFits) return h;
    }
    return null;
  }

  window.ReboundScheduler = {
    HOURS_PER_CHAPTER: HOURS_PER_CHAPTER,
    roundToHalfHour: roundToHalfHour,
    detectShortfall: detectShortfall,
    generatePlan: generatePlan,
    previewMissedDay: previewMissedDay,
    simulateForecast: simulateForecast,
    findMinimumDailyHours: findMinimumDailyHours
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

