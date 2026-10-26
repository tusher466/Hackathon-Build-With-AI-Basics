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

        // 1. If no exams exist -> show Welcome view, hide other tabs
        if (exams.length === 0) {
          if (this.welcomeView) this.welcomeView.style.display = 'block';
          if (this.todayView) this.todayView.style.display = 'none';
          if (this.planView) this.planView.style.display = 'none';
          return;
        }

        // 2. If exams exist -> hide Welcome view
        if (this.welcomeView) this.welcomeView.style.display = 'none';

        // 3. Render active tab
        if (this.currentView === 'today') {
          if (this.todayView) {
            this.todayView.style.display = 'block';
            this.renderTodayPlaceholder(exams, settings);
          }
          if (this.planView) this.planView.style.display = 'none';
        } else {
          if (this.todayView) this.todayView.style.display = 'none';
          if (this.planView) {
            this.planView.style.display = 'block';
            this.renderPlanPlaceholder(exams, settings);
          }
        }
      } catch (err) {
        console.error('Render error caught gracefully:', err);
        this.renderErrorMessage('Something unexpected happened, but your data is safe in your browser.');
      }
    },

    renderTodayPlaceholder: function(exams, settings) {
      if (!this.todayView) return;
      const self = this;
      let examsSummaryHtml = '';
      exams.forEach(function(exam) {
        const days = getDaysFromToday(exam.date);
        const dayLabel = days === 0 ? 'Today' : (days === 1 ? 'Tomorrow' : 'In ' + days + ' days');
        const badgeClass = 'badge-' + getSubjectBadgeColor(exam);
        examsSummaryHtml += `
          <div class="exam-card-item">
            <div class="exam-info">
              <span class="subject-badge ${badgeClass}">${escapeHtml(exam.name)}</span>
              <div class="exam-details">
                <span class="exam-title">${escapeHtml(exam.name)} &bull; ${exam.chapters} chapters &bull; Difficulty ${exam.difficulty}/5</span>
                <span class="exam-subtext">${exam.date} (${dayLabel})</span>
              </div>
            </div>
          </div>
        `;
      });

      this.todayView.innerHTML = `
        <div class="welcome-card" style="margin: 1.5rem auto; text-align: left; max-width: 680px; padding: 2.5rem 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div class="welcome-badge" style="margin-bottom: 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Exams Saved (${exams.length})
            </div>
            <span style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); background: var(--color-primary-light); padding: 0.25rem 0.625rem; border-radius: var(--radius-full);">
              Target: ${settings.dailyHours || 4.0} hrs/day
            </span>
          </div>

          <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Your exams are saved!</h2>
          <p style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text-muted); margin-bottom: 1.25rem;">
            Your daily study tasks will appear here once the study plan is generated. Here are your saved subjects:
          </p>

          <div class="exams-list" style="margin-bottom: 1.75rem;">
            ${examsSummaryHtml}
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" id="btn-today-open-exams">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Manage Exams &amp; Hours
            </button>
          </div>
        </div>
      `;

      const btn = this.todayView.querySelector('#btn-today-open-exams');
      if (btn) {
        btn.addEventListener('click', function() {
          self.openExamsModal();
        });
      }
    },

    renderPlanPlaceholder: function(exams, settings) {
      if (!this.planView) return;
      const self = this;
      
      // Sort exams by date ascending
      const sortedExams = exams.slice().sort(function(a, b) {
        return getDaysFromToday(a.date) - getDaysFromToday(b.date);
      });

      let timelineHtml = '';
      sortedExams.forEach(function(exam) {
        const days = getDaysFromToday(exam.date);
        const dayLabel = days === 0 ? 'Today' : (days === 1 ? 'Tomorrow' : 'In ' + days + ' days');
        const badgeClass = 'badge-' + getSubjectBadgeColor(exam);
        timelineHtml += `
          <div class="exam-card-item">
            <div class="exam-info">
              <span class="subject-badge ${badgeClass}">${escapeHtml(exam.name)}</span>
              <div class="exam-details">
                <span class="exam-title">${escapeHtml(exam.name)} &bull; Exam Day: ${exam.date} (${dayLabel})</span>
                <span class="exam-subtext">${exam.chapters} chapters &bull; Difficulty ${exam.difficulty}/5</span>
              </div>
            </div>
          </div>
        `;
      });

      this.planView.innerHTML = `
        <div class="welcome-card" style="margin: 1.5rem auto; text-align: left; max-width: 680px; padding: 2.5rem 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div class="welcome-badge" style="margin-bottom: 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Full Plan Overview
            </div>
            <span style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); background: var(--color-primary-light); padding: 0.25rem 0.625rem; border-radius: var(--radius-full);">
              ${settings.dailyHours || 4.0} hrs/day
            </span>
          </div>

          <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Study Plan Timeline</h2>
          <p style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text-muted); margin-bottom: 1.25rem;">
            Your full day-by-day study schedule and light revision milestones will appear here. Upcoming exam deadlines:
          </p>

          <div class="exams-list" style="margin-bottom: 1.75rem;">
            ${timelineHtml}
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" id="btn-plan-open-exams">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Manage Exams &amp; Hours
            </button>
          </div>
        </div>
      `;

      const btn = this.planView.querySelector('#btn-plan-open-exams');
      if (btn) {
        btn.addEventListener('click', function() {
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
    addDaysToToday: addDaysToToday
  };

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    App.init();
  });

})(window, document);
