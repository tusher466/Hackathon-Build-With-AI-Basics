// ==========================================================================
// Rebound — Main Application Controller (Slice 2: Exam Manager & Storage)
// ==========================================================================

(function(window, document) {
  'use strict';

  // Subject color palette cycle (distinct: green reserved for done, amber for diffs, teal for app)
  const COLOR_PALETTE = ['indigo', 'violet', 'sky', 'rose'];

  // Utility: Date parsing with NO timezone shift
  function parseDateString(str) {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatDateToISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getTodayString() {
    return formatDateToISO(new Date());
  }

  function getDaysFromToday(targetDateStr) {
    const today = parseDateString(getTodayString());
    const target = parseDateString(targetDateStr);
    if (!today || !target) return 0;
    const diff = target.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  function addDaysToToday(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatDateToISO(d);
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return `${dayName}, ${d.getDate()} ${monthName}`;
  }

  // App State & DOM Elements
  const App = {
    currentView: 'today',

    init: function() {
      this.cacheElements();
      this.bindEvents();
      this.render();
    },

    cacheElements: function() {
      // Containers & Views
      this.welcomeView = document.getElementById('welcome-view');
      this.todayView = document.getElementById('today-view');
      this.planView = document.getElementById('plan-view');

      // Navigation
      this.navToday = document.getElementById('nav-today');
      this.navPlan = document.getElementById('nav-plan');
      this.btnOpenExams = document.getElementById('btn-open-exams');
      this.btnWelcomeAdd = document.getElementById('btn-welcome-add');

      // Modal Elements
      this.modalExams = document.getElementById('modal-exams');
      this.btnModalClose = document.getElementById('btn-modal-close');
      this.btnCloseModal = document.getElementById('btn-close-modal');
      
      // Form Elements
      this.examForm = document.getElementById('exam-form');
      this.examIdInput = document.getElementById('exam-id');
      this.examNameInput = document.getElementById('exam-name');
      this.examDateInput = document.getElementById('exam-date');
      this.examDateHint = document.getElementById('exam-date-relative-hint');
      this.examChaptersInput = document.getElementById('exam-chapters');
      this.examDiffInput = document.getElementById('exam-difficulty');
      this.diffButtons = document.querySelectorAll('#difficulty-buttons .diff-btn');
      this.btnSubmitExam = document.getElementById('btn-submit-exam');
      this.btnCancelEdit = document.getElementById('btn-cancel-edit');
      this.alertBanner = document.getElementById('exam-validation-alert');
      this.alertMessage = document.getElementById('exam-validation-message');

      // List & Settings Elements
      this.examsListItems = document.getElementById('exams-list-items');
      this.examsCountHeader = document.getElementById('exams-count-header');
      this.dailyHoursInput = document.getElementById('setting-daily-hours');
      this.btnClearData = document.getElementById('btn-clear-data');
      this.modalStatusText = document.getElementById('modal-status-text');
    },

    bindEvents: function() {
      const self = this;

      // Welcome CTA
      if (this.btnWelcomeAdd) {
        this.btnWelcomeAdd.addEventListener('click', function() {
          self.openExamsModal();
        });
      }

      // Header button
      if (this.btnOpenExams) {
        this.btnOpenExams.addEventListener('click', function() {
          self.openExamsModal();
        });
      }

      // Close modal
      if (this.btnModalClose) {
        this.btnModalClose.addEventListener('click', function() {
          self.closeExamsModal();
        });
      }
      if (this.btnCloseModal) {
        this.btnCloseModal.addEventListener('click', function() {
          self.closeExamsModal();
        });
      }

      // Backdrop click to close
      if (this.modalExams) {
        this.modalExams.addEventListener('click', function(e) {
          if (e.target === self.modalExams) {
            self.closeExamsModal();
          }
        });
      }

      // Navigation tab switching
      if (this.navToday) {
        this.navToday.addEventListener('click', function() {
          self.switchView('today');
        });
      }
      if (this.navPlan) {
        this.navPlan.addEventListener('click', function() {
          self.switchView('plan');
        });
      }

      // Difficulty buttons selector
      this.diffButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          self.diffButtons.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          self.examDiffInput.value = btn.getAttribute('data-diff');
        });
      });

      // Exam Date Input change -> update relative hint
      if (this.examDateInput) {
        this.examDateInput.addEventListener('input', function() {
          self.updateDateHint(this.value);
        });
      }

      // Form Submit
      if (this.examForm) {
        this.examForm.addEventListener('submit', function(e) {
          e.preventDefault();
          self.handleExamSubmit();
        });
      }

      // Cancel Edit
      if (this.btnCancelEdit) {
        this.btnCancelEdit.addEventListener('click', function() {
          self.resetExamForm();
        });
      }

      // Daily Study Hours change
      if (this.dailyHoursInput) {
        this.dailyHoursInput.addEventListener('change', function() {
          let hours = parseFloat(this.value);
          if (isNaN(hours) || hours < 0.5) {
            hours = 0.5;
            this.value = '0.5';
          } else if (hours > 16) {
            hours = 16;
            this.value = '16';
          }
          window.ReboundStorage.saveSettings({ dailyHours: hours });
          const allExams = window.ReboundStorage.getExams();
          if (allExams.length > 0) {
            const updatedPlan = window.ReboundScheduler.generatePlan(allExams, hours);
            window.ReboundStorage.savePlan(updatedPlan);
          }
          self.render();
          self.showStatus('Saved daily hours: ' + hours + ' hrs/day');
        });
      }

      // Reset / Clear All Data
      if (this.btnClearData) {
        this.btnClearData.addEventListener('click', function() {
          const ok = window.confirm('Are you sure you want to clear all saved exams and data? This will return to the welcome screen.');
          if (ok) {
            window.ReboundStorage.clearAll();
            self.resetExamForm();
            self.closeExamsModal();
            self.render();
          }
        });
      }
    },

    openExamsModal: function(prefillDays) {
      this.hideError();
      const settings = window.ReboundStorage.getSettings();
      if (this.dailyHoursInput) {
        this.dailyHoursInput.value = settings.dailyHours || 4.0;
      }
      
      // Default date to today + 6 days if empty
      if (!this.examDateInput.value) {
        this.examDateInput.value = addDaysToToday(prefillDays || 6);
        this.updateDateHint(this.examDateInput.value);
      }

      this.renderExamsList();
      this.modalExams.classList.add('open');
      this.examNameInput.focus();
    },

    closeExamsModal: function() {
      this.modalExams.classList.remove('open');
      this.resetExamForm();
      this.render();
    },

    updateDateHint: function(dateStr) {
      if (!dateStr) {
        this.examDateHint.textContent = 'Choose date';
        return;
      }
      const days = getDaysFromToday(dateStr);
      if (days < 0) {
        this.examDateHint.textContent = 'Date is in the past!';
        this.examDateHint.style.color = '#DC2626';
      } else if (days === 0) {
        this.examDateHint.textContent = 'Today!';
        this.examDateHint.style.color = 'var(--color-primary)';
      } else if (days === 1) {
        this.examDateHint.textContent = 'Tomorrow (in 1 day)';
        this.examDateHint.style.color = 'var(--color-primary)';
      } else {
        this.examDateHint.textContent = 'In ' + days + ' days';
        this.examDateHint.style.color = 'var(--color-primary)';
      }
    },

    showError: function(msg) {
      if (this.alertBanner && this.alertMessage) {
        this.alertMessage.textContent = msg;
        this.alertBanner.classList.add('show');
        this.alertBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },

    hideError: function() {
      if (this.alertBanner) {
        this.alertBanner.classList.remove('show');
      }
    },

    showStatus: function(msg) {
      if (this.modalStatusText) {
        this.modalStatusText.textContent = msg;
        setTimeout(() => {
          if (this.modalStatusText.textContent === msg) {
            this.modalStatusText.textContent = 'All changes saved';
          }
        }, 3000);
      }
    },

    handleExamSubmit: function() {
      this.hideError();

      const id = this.examIdInput.value.trim();
      const name = this.examNameInput.value.trim();
      const dateStr = this.examDateInput.value;
      const chapters = parseInt(this.examChaptersInput.value, 10);
      const difficulty = parseInt(this.examDiffInput.value, 10);

      // Validation 1: Subject name required
      if (!name) {
        this.showError('Please enter a subject name (e.g. Calculus).');
        this.examNameInput.focus();
        return;
      }

      // Validation 2: Exam date required
      if (!dateStr) {
        this.showError('Please select a valid exam date.');
        this.examDateInput.focus();
        return;
      }

      // Validation 3: Exam date not in the past
      const daysUntilExam = getDaysFromToday(dateStr);
      if (daysUntilExam < 0) {
        this.showError('Exam date cannot be in the past. Please choose today or a future date.');
        this.examDateInput.focus();
        return;
      }

      // Validation 4: Chapters positive integer
      if (isNaN(chapters) || chapters < 1) {
        this.showError('Please enter at least 1 chapter or module to study.');
        this.examChaptersInput.focus();
        return;
      }

      // Validation 5: Difficulty between 1 and 5
      if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
        this.showError('Difficulty must be between 1 (Very Easy) and 5 (Very Hard).');
        return;
      }

      // Assign subject color: Calculus -> indigo, Physics -> violet, Economics -> sky, or cycle
      const lowerName = name.toLowerCase();
      let color = 'indigo';
      if (lowerName.includes('calc')) {
        color = 'indigo';
      } else if (lowerName.includes('phys')) {
        color = 'violet';
      } else if (lowerName.includes('econ')) {
        color = 'sky';
      } else if (id) {
        const current = existingExams.find(e => e.id === id);
        if (current && current.color && current.color !== 'teal' && current.color !== 'emerald' && current.color !== 'amber') {
          color = current.color;
        } else {
          color = COLOR_PALETTE[existingExams.length % COLOR_PALETTE.length];
        }
      } else {
        color = COLOR_PALETTE[existingExams.length % COLOR_PALETTE.length];
      }

      const examData = {
        name: name,
        date: dateStr,
        examDay: daysUntilExam, // relative day index
        chapters: chapters,
        difficulty: difficulty,
        color: color
      };

      if (id) {
        examData.id = id;
      }

      window.ReboundStorage.saveExam(examData);
      
      // Automatically re-generate plan on exam change
      const allExams = window.ReboundStorage.getExams();
      const currentSettings = window.ReboundStorage.getSettings();
      const newPlan = window.ReboundScheduler.generatePlan(allExams, currentSettings.dailyHours);
      window.ReboundStorage.savePlan(newPlan);

      this.showStatus('Saved ' + name + ' successfully!');
      this.resetExamForm();
      this.renderExamsList();
      this.render();
    },

    resetExamForm: function() {
      this.hideError();
      this.examIdInput.value = '';
      this.examNameInput.value = '';
      this.examChaptersInput.value = '';
      this.examDiffInput.value = '3';
      this.diffButtons.forEach(b => {
        if (b.getAttribute('data-diff') === '3') b.classList.add('active');
        else b.classList.remove('active');
      });
      this.btnSubmitExam.textContent = 'Add Exam';
      this.btnCancelEdit.style.display = 'none';
      this.examDateInput.value = addDaysToToday(6);
      this.updateDateHint(this.examDateInput.value);
    },

    editExam: function(id) {
      const exam = window.ReboundStorage.getExamById(id);
      if (!exam) return;

      this.hideError();
      this.examIdInput.value = exam.id;
      this.examNameInput.value = exam.name;
      this.examDateInput.value = exam.date;
      this.updateDateHint(exam.date);
      this.examChaptersInput.value = exam.chapters;
      this.examDiffInput.value = exam.difficulty;

      this.diffButtons.forEach(b => {
        if (b.getAttribute('data-diff') === String(exam.difficulty)) b.classList.add('active');
        else b.classList.remove('active');
      });

      this.btnSubmitExam.textContent = 'Update Exam';
      this.btnCancelEdit.style.display = 'inline-flex';
      this.examNameInput.focus();
    },

    deleteExam: function(id) {
      const exam = window.ReboundStorage.getExamById(id);
      const name = exam ? exam.name : 'this exam';
      if (window.confirm('Delete ' + name + '?')) {
        window.ReboundStorage.deleteExam(id);
        const allExams = window.ReboundStorage.getExams();
        const currentSettings = window.ReboundStorage.getSettings();
        if (allExams.length > 0) {
          const newPlan = window.ReboundScheduler.generatePlan(allExams, currentSettings.dailyHours);
          window.ReboundStorage.savePlan(newPlan);
        } else {
          window.ReboundStorage.savePlan(null);
        }
        this.renderExamsList();
        this.render();
        this.showStatus('Deleted ' + name);
      }
    },

    renderExamsList: function() {
      const exams = window.ReboundStorage.getExams();
      this.examsCountHeader.textContent = 'Your Exams (' + exams.length + ')';

      if (!this.examsListItems) return;

      if (exams.length === 0) {
        this.examsListItems.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.875rem; text-align: center; padding: 1.5rem 0;">No exams added yet. Add your first exam above!</p>';
        return;
      }

      let html = '';
      const self = this;
  function getSubjectBadgeColor(exam) {
    if (!exam) return 'indigo';
    const lower = (exam.name || '').toLowerCase();
    if (lower.includes('calc')) return 'indigo';
    if (lower.includes('phys')) return 'violet';
    if (lower.includes('econ')) return 'sky';
    if (exam.color === 'violet' || exam.color === 'rose' || exam.color === 'sky' || exam.color === 'indigo') {
      return exam.color;
    }
    if (exam.color === 'teal') return 'violet';
    if (exam.color === 'emerald') return 'sky';
    return 'indigo';
  }

      exams.forEach(function(exam) {
        const days = getDaysFromToday(exam.date);
        const dayLabel = days === 0 ? 'Today' : (days === 1 ? 'Tomorrow' : 'In ' + days + ' days');
        const badgeClass = 'badge-' + getSubjectBadgeColor(exam);

        html += `
          <div class="exam-card-item" data-id="${exam.id}">
            <div class="exam-info">
              <span class="subject-badge ${badgeClass}">${escapeHtml(exam.name)}</span>
              <div class="exam-details">
                <span class="exam-title">${escapeHtml(exam.name)} &bull; ${exam.chapters} ch &bull; Diff ${exam.difficulty}/5</span>
                <span class="exam-subtext">${exam.date} (${dayLabel})</span>
              </div>
            </div>
            <div class="exam-actions">
              <button type="button" class="btn-icon btn-edit" data-id="${exam.id}" title="Edit Exam" aria-label="Edit ${escapeHtml(exam.name)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="btn-icon btn-delete" data-id="${exam.id}" title="Delete Exam" aria-label="Delete ${escapeHtml(exam.name)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        `;
      });

      this.examsListItems.innerHTML = html;

      // Attach event listeners to dynamically created edit/delete buttons
      this.examsListItems.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
          self.editExam(this.getAttribute('data-id'));
        });
      });

      this.examsListItems.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
          self.deleteExam(this.getAttribute('data-id'));
        });
      });
    },

    switchView: function(viewName) {
      this.currentView = viewName;
      if (viewName === 'today') {
        this.navToday.classList.add('active');
        this.navPlan.classList.remove('active');
      } else {
        this.navPlan.classList.add('active');
        this.navToday.classList.remove('active');
      }
      this.render();
    },

    render: function() {
      try {
        const exams = window.ReboundStorage.getExams();
        const settings = window.ReboundStorage.getSettings();
        let plan = window.ReboundStorage.getPlan();

        // 1. If no exams exist -> show Welcome view, hide other tabs
        if (exams.length === 0) {
          if (this.welcomeView) this.welcomeView.style.display = 'block';
          if (this.todayView) this.todayView.style.display = 'none';
          if (this.planView) this.planView.style.display = 'none';
          return;
        }

        // 2. Ensure plan exists
        if (!plan || plan.length === 0) {
          plan = window.ReboundScheduler.generatePlan(exams, settings.dailyHours);
          window.ReboundStorage.savePlan(plan);
        }

        // 3. Hide Welcome view
        if (this.welcomeView) this.welcomeView.style.display = 'none';

        // 4. Render active tab
        if (this.currentView === 'today') {
          if (this.todayView) {
            this.todayView.style.display = 'block';
            this.renderTodayView(plan, exams, settings);
          }
          if (this.planView) this.planView.style.display = 'none';
        } else {
          if (this.todayView) this.todayView.style.display = 'none';
          if (this.planView) {
            this.planView.style.display = 'block';
            this.renderFullPlan(plan, exams, settings);
          }
        }
      } catch (err) {
        console.error('Render error caught gracefully:', err);
        this.renderErrorMessage('Something unexpected happened, but your data is safe in your browser.');
      }
    },

    renderTodayView: function(plan, exams, settings) {
      if (!this.todayView) return;
      const self = this;

      const todayStr = formatShortDate(getTodayString());
      
      // Calculate nearest upcoming exam
      let nearestExam = null;
      let minDays = Infinity;
      exams.forEach(function(e) {
        const d = getDaysFromToday(e.date);
        if (d >= 0 && d < minDays) {
          minDays = d;
          nearestExam = e;
        }
      });

      let nearestBadgeText = 'No upcoming exams';
      if (nearestExam) {
        if (minDays === 0) nearestBadgeText = `Today: ${nearestExam.name} Exam!`;
        else if (minDays === 1) nearestBadgeText = `Tomorrow: ${nearestExam.name} Exam`;
        else nearestBadgeText = `In ${minDays} days: ${nearestExam.name} Exam`;
      }

      // Check shortfall
      const shortfallInfo = window.ReboundScheduler.detectShortfall(exams, settings.dailyHours);
      let shortfallBannerHtml = '';
      if (shortfallInfo && shortfallInfo.isShortfall) {
        shortfallBannerHtml = `
          <div class="validation-banner show" style="background: #FFFBEB; border-color: #FCD34D; color: #92400E; margin-bottom: 1.25rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <strong>Study Hours Shortfall (${shortfallInfo.hoursShort}h short)</strong>
              <div style="font-size: 0.8125rem; margin-top: 0.25rem;">${escapeHtml(shortfallInfo.message)}</div>
            </div>
          </div>
        `;
      }

      // Today's day plan is Day 0 (dayOffset === 0)
      const todayPlan = plan && plan.length > 0 ? plan[0] : null;
      const tasks = todayPlan ? todayPlan.tasks.filter(t => !t.isExamDay && t.hours > 0) : [];
      const completedCount = tasks.filter(t => t.completed).length;
      const totalCount = tasks.length;
      const allDone = totalCount > 0 && completedCount === totalCount;
      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

      let progressLabel = `${completedCount} of ${totalCount} tasks done`;
      if (totalCount === 0) {
        progressLabel = todayPlan && todayPlan.isExamDay ? 'Exam day • 0h study scheduled' : 'Rest day • 0 tasks';
      }

      let tasksHtml = '';
      if (tasks.length === 0) {
        if (todayPlan && todayPlan.isExamDay) {
          tasksHtml = `
            <div class="welcome-card" style="margin: 1.5rem 0; padding: 2rem; text-align: center;">
              <div class="welcome-badge" style="background: #FEE2E2; color: #991B1B;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Exam Day
              </div>
              <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Good luck on your ${escapeHtml(todayPlan.examName)} Exam today!</h3>
              <p style="font-size: 0.875rem; color: var(--color-text-muted);">
                No study tasks scheduled for today. Focus on your exam and do your best!
              </p>
            </div>
          `;
        } else {
          tasksHtml = `
            <div class="welcome-card" style="margin: 1.5rem 0; padding: 2rem; text-align: center;">
              <div class="welcome-badge" style="background: var(--color-success-light); color: var(--color-success);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Rest Day
              </div>
              <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No study tasks scheduled for today</h3>
              <p style="font-size: 0.875rem; color: var(--color-text-muted);">
                You are completely on schedule! Take this time to rest and recharge before your next study session.
              </p>
            </div>
          `;
        }
      } else {
        tasks.forEach(function(task) {
          const isDone = task.completed ? 'is-done' : '';
          const checked = task.completed ? 'checked' : '';
          const badgeClass = 'badge-' + getSubjectBadgeColor(task);

          tasksHtml += `
            <div class="today-task-card ${isDone}" data-task-id="${task.id}" id="card-${task.id}">
              <div class="task-left-content">
                <div class="task-checkbox-wrapper">
                  <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" id="chk-${task.id}" ${checked} aria-label="Mark ${escapeHtml(task.subject)} ${escapeHtml(task.chapters)} complete">
                </div>
                <div class="task-desc">
                  <span class="subject-badge ${badgeClass} task-subject-tag">${escapeHtml(task.subject)}</span>
                  <span class="task-chapter-text">${escapeHtml(task.chapters)}</span>
                </div>
              </div>
              <div class="task-right-meta">
                <span>${task.hours} hrs</span>
              </div>
            </div>
          `;
        });
      }

      this.todayView.innerHTML = `
        <div class="today-container">
          ${shortfallBannerHtml}

          <!-- Header Card -->
          <div class="today-header-card">
            <div class="today-meta-row">
              <span class="today-date-text">Today &bull; ${todayStr}</span>
              <span class="nearest-exam-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${nearestBadgeText}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="progress-container">
              <div class="progress-header">
                <span>Daily Progress</span>
                <span id="today-progress-text">${progressLabel}</span>
              </div>
              <div class="progress-track" id="today-progress-track" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-fill" id="today-progress-fill" style="width: ${percent}%;"></div>
              </div>
            </div>
          </div>

          <!-- All Done Celebration Banner (when all tasks completed) -->
          <div class="all-done-banner" id="all-done-banner" style="display: ${allDone ? 'flex' : 'none'};">
            <div class="all-done-icon" aria-hidden="true">🎉</div>
            <div class="all-done-content">
              <h4>All done for today!</h4>
              <p>You've completed all scheduled study tasks. Great work! Take a well-earned break.</p>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="today-tasks-container">
            ${tasksHtml}
          </div>

          <!-- Missed Today Box -->
          <div class="missed-today-box">
            <div class="missed-today-text">
              <h4>Fell behind or missed today?</h4>
              <p>Rebound automatically redistributes unfinished hours across future study days.</p>
            </div>
            <button type="button" class="btn btn-amber" id="btn-missed-today">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              I missed today
            </button>
          </div>
        </div>
      `;

      // Attach task checkbox click and change listeners
      this.todayView.querySelectorAll('.today-task-card').forEach(function(card) {
        const checkbox = card.querySelector('.task-checkbox');
        const taskId = card.getAttribute('data-task-id');

        // Checkbox change event
        if (checkbox) {
          checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            self.handleTaskToggle(taskId, this.checked);
          });
        }

        // Card body click event (outside the checkbox itself)
        card.addEventListener('click', function(e) {
          if (e.target === checkbox) return;
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            self.handleTaskToggle(taskId, checkbox.checked);
          }
        });
      });

      // Hook up Missed Today button placeholder
      const btnMissed = this.todayView.querySelector('#btn-missed-today');
      if (btnMissed) {
        btnMissed.addEventListener('click', function() {
          alert("Missed Today preview is coming up next in Slice 5!");
        });
      }
    },

    handleTaskToggle: function(taskId, isChecked) {
      const plan = window.ReboundStorage.getPlan();
      if (!plan || plan.length === 0) return;

      // Update in plan Day 0
      let updated = false;
      plan.forEach(function(day) {
        day.tasks.forEach(function(task) {
          if (task.id === taskId) {
            task.completed = isChecked;
            updated = true;
          }
        });
      });

      if (updated) {
        window.ReboundStorage.savePlan(plan);

        // Instant visual update for card
        const card = this.todayView.querySelector(`.today-task-card[data-task-id="${taskId}"]`);
        if (card) {
          if (isChecked) card.classList.add('is-done');
          else card.classList.remove('is-done');
          const chk = card.querySelector('.task-checkbox');
          if (chk) chk.checked = isChecked;
        }

        // Instant progress bar and all-done banner update
        const todayPlan = plan[0];
        const tasks = todayPlan ? todayPlan.tasks.filter(t => !t.isExamDay && t.hours > 0) : [];
        const completedCount = tasks.filter(t => t.completed).length;
        const totalCount = tasks.length;
        const allDone = totalCount > 0 && completedCount === totalCount;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

        const progressText = document.getElementById('today-progress-text');
        const progressFill = document.getElementById('today-progress-fill');
        const progressTrack = document.getElementById('today-progress-track');
        const allDoneBanner = document.getElementById('all-done-banner');

        if (progressText) {
          progressText.textContent = `${completedCount} of ${totalCount} tasks done`;
        }
        if (progressFill) {
          progressFill.style.width = `${percent}%`;
        }
        if (progressTrack) {
          progressTrack.setAttribute('aria-valuenow', percent);
        }
        if (allDoneBanner) {
          allDoneBanner.style.display = allDone ? 'flex' : 'none';
        }
      }
    },

    renderFullPlan: function(plan, exams, settings) {
      if (!this.planView) return;
      const self = this;

      // Check shortfall
      const shortfallInfo = window.ReboundScheduler.detectShortfall(exams, settings.dailyHours);
      let shortfallBannerHtml = '';
      if (shortfallInfo && shortfallInfo.isShortfall) {
        shortfallBannerHtml = `
          <div class="validation-banner show" style="background: #FFFBEB; border-color: #FCD34D; color: #92400E; margin-bottom: 1.25rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <strong>Study Hours Shortfall (${shortfallInfo.hoursShort}h short)</strong>
              <div style="font-size: 0.8125rem; margin-top: 0.25rem;">${escapeHtml(shortfallInfo.message)}</div>
            </div>
          </div>
        `;
      }

      let daysHtml = '';
      let totalPlannedHours = 0;

      plan.forEach(function(day) {
        totalPlannedHours += day.totalHours;
        const isExamDay = day.isExamDay ? 'is-exam-day' : '';
        const hasRevision = day.tasks.some(t => t.isRevision) ? 'has-revision' : '';

        let badgesHtml = '';
        if (day.isExamDay) {
          badgesHtml += `<span class="badge-exam-pill">EXAM DAY: ${escapeHtml(day.examName)}</span>`;
        }
        if (day.tasks.some(t => t.isRevision)) {
          badgesHtml += `<span class="badge-revision-pill">Light Revision</span>`;
        }

        let tasksRowsHtml = '';
        if (day.tasks.length === 0 || (day.isExamDay && day.tasks.every(t => t.hours === 0))) {
          if (day.isExamDay) {
            tasksRowsHtml = `
              <div style="font-size: 0.875rem; color: var(--color-primary); font-weight: 600; padding: 0.5rem 0;">
                Best of luck on your ${escapeHtml(day.examName)} Exam today! (0h study scheduled)
              </div>
            `;
          } else {
            tasksRowsHtml = `<div style="font-size: 0.875rem; color: var(--color-text-muted); padding: 0.5rem 0;">Rest Day — No study scheduled</div>`;
          }
        } else {
          day.tasks.forEach(function(t) {
            if (t.isExamDay) return;
            const badgeClass = 'badge-' + getSubjectBadgeColor(t);
            const revisionBadge = t.isRevision ? '<span class="badge-revision-pill" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; margin-left: 0.5rem;">Revision</span>' : '';
            tasksRowsHtml += `
              <div class="timeline-task-row">
                <div class="timeline-task-info">
                  <span class="subject-badge ${badgeClass}">${escapeHtml(t.subject)}</span>
                  <span class="timeline-task-chapters">${escapeHtml(t.chapters)}${revisionBadge}</span>
                </div>
                <span class="timeline-task-hours">${t.hours} hrs</span>
              </div>
            `;
          });
        }

        daysHtml += `
          <div class="timeline-day-card ${isExamDay} ${hasRevision}">
            <div class="timeline-day-header">
              <span class="timeline-day-title">
                Day ${day.dayIndex} &bull; ${day.dateString}
              </span>
              <div class="timeline-day-badges">
                ${badgesHtml}
                <span class="timeline-task-hours">${day.totalHours} hrs planned</span>
              </div>
            </div>
            <div class="timeline-tasks-list">
              ${tasksRowsHtml}
            </div>
          </div>
        `;
      });

      this.planView.innerHTML = `
        <div class="plan-container">
          ${shortfallBannerHtml}

          <!-- Overview Header -->
          <div class="plan-header-box">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;">Full Study Plan Timeline</h2>
              <p style="font-size: 0.875rem; color: var(--color-text-muted);">
                ${plan.length} total days &bull; ${totalPlannedHours.toFixed(1)} planned study hours &bull; Target ${settings.dailyHours}h/day
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button type="button" class="btn btn-secondary" id="btn-replan-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit Exams &amp; Hours
              </button>
            </div>
          </div>

          <!-- Timeline Days -->
          <div class="plan-timeline">
            ${daysHtml}
          </div>
        </div>
      `;

      const btnEdit = this.planView.querySelector('#btn-replan-all');
      if (btnEdit) {
        btnEdit.addEventListener('click', function() {
          self.openExamsModal();
        });
      }
    },

    renderErrorMessage: function(msg) {
      const root = document.getElementById('app-root');
      if (!root) return;
      root.innerHTML = `
        <div class="welcome-card" style="max-width: 540px; margin: 3rem auto; text-align: center;">
          <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #DC2626;">We encountered a small hiccup</h2>
          <p style="font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 1.5rem;">${escapeHtml(msg)}</p>
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <button type="button" class="btn btn-secondary" onclick="window.location.reload()">Reload Page</button>
            <button type="button" class="btn btn-primary" onclick="window.ReboundApp.openExamsModal()">Manage Exams</button>
          </div>
        </div>
      `;
    }
  };

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose App and Date utilities
  window.ReboundApp = App;
  window.ReboundDate = {
    parseDateString: parseDateString,
    formatDateToISO: formatDateToISO,
    getTodayString: getTodayString,
    getDaysFromToday: getDaysFromToday,
    addDaysToToday: addDaysToToday,
    formatShortDate: formatShortDate
  };

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });

})(window, document);
