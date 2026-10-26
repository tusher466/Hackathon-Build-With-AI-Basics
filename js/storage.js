// ==========================================================================
// Rebound — Storage Module (localStorage wrapper)
// ==========================================================================

(function(window) {
  'use strict';

  const STORAGE_KEY = 'rebound_app_data_v1';

  const DEFAULT_DATA = {
    settings: {
      dailyHours: 4.0
    },
    exams: [],
    plan: null,
    undoSnapshot: null
  };

  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
      const parsed = JSON.parse(raw);
      return {
        settings: Object.assign({}, DEFAULT_DATA.settings, parsed.settings || {}),
        exams: Array.isArray(parsed.exams) ? parsed.exams : [],
        plan: parsed.plan || null,
        undoSnapshot: parsed.undoSnapshot || null
      };
    } catch (e) {
      console.error('Error reading localStorage, falling back to defaults:', e);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  }

  const Storage = {
    getData: getData,

    getSettings: function() {
      return getData().settings;
    },

    saveSettings: function(newSettings) {
      const data = getData();
      data.settings = Object.assign({}, data.settings, newSettings);
      saveData(data);
      return data.settings;
    },

    getExams: function() {
      return getData().exams;
    },

    getExamById: function(id) {
      const exams = getData().exams;
      return exams.find(function(e) { return e.id === id; }) || null;
    },

    saveExam: function(examData) {
      const data = getData();
      if (!data.exams) data.exams = [];

      if (examData.id) {
        // Edit existing
        const index = data.exams.findIndex(function(e) { return e.id === examData.id; });
        if (index !== -1) {
          data.exams[index] = Object.assign({}, data.exams[index], examData);
        } else {
          data.exams.push(examData);
        }
      } else {
        // Add new
        const newExam = Object.assign({}, examData, {
          id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        });
        data.exams.push(newExam);
      }

      saveData(data);
      return data.exams;
    },

    deleteExam: function(id) {
      const data = getData();
      data.exams = (data.exams || []).filter(function(e) { return e.id !== id; });
      // If no exams remain, also clear the plan
      if (data.exams.length === 0) {
        data.plan = null;
        data.undoSnapshot = null;
      }
      saveData(data);
      return data.exams;
    },

    getPlan: function() {
      return getData().plan;
    },

    savePlan: function(plan) {
      const data = getData();
      data.plan = plan;
      saveData(data);
      return data.plan;
    },

    getUndoSnapshot: function() {
      return getData().undoSnapshot;
    },

    saveUndoSnapshot: function(snapshot) {
      const data = getData();
      data.undoSnapshot = snapshot;
      saveData(data);
    },

    clearAll: function() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
        return false;
      }
    }
  };

  window.ReboundStorage = Storage;
})(window);
