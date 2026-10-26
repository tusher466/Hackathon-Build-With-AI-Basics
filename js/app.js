// ==========================================================================
// Rebound — Main Application Controller (Slice 2: Exam Manager & Storage)
// ==========================================================================

(function(window, document) {
  'use strict';

  // Subject color palette cycle
  const COLOR_PALETTE = ['indigo', 'teal', 'emerald', 'amber'];

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

      // Assign subject color
      const existingExams = window.ReboundStorage.getExams();
      let color = 'indigo';
      if (id) {
        const current = existingExams.find(e => e.id === id);
        if (current && current.color) color = current.color;
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
      exams.forEach(function(exam) {
        const days = getDaysFromToday(exam.date);
        const dayLabel = days === 0 ? 'Today' : (days === 1 ? 'Tomorrow' : 'In ' + days + ' days');
        const badgeClass = 'badge-' + (exam.color || 'indigo');

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
      const exams = window.ReboundStorage.getExams();

      // View state routing:
      // If no exams exist -> always show Welcome view
      if (exams.length === 0) {
        if (this.welcomeView) this.welcomeView.style.display = 'block';
        if (this.todayView) this.todayView.style.display = 'none';
        if (this.planView) this.planView.style.display = 'none';
      } else {
        if (this.welcomeView) this.welcomeView.style.display = 'none';
        if (this.currentView === 'today') {
          if (this.todayView) this.todayView.style.display = 'block';
          if (this.planView) this.planView.style.display = 'none';
        } else {
          if (this.todayView) this.todayView.style.display = 'none';
          if (this.planView) this.planView.style.display = 'block';
        }
      }
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
