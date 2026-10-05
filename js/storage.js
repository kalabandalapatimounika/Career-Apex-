/**
 * Career Apex CRM - StorageService
 * Authoritative frontend persistence layer using localStorage.
 * Centralized key management and subscription events.
 */

const STORAGE_KEYS = {
  SESSION: 'crm_session',
  USERS: 'crm_users',
  STUDENTS: 'crm_students',
  PAYMENTS: 'crm_payments',
  INSTALLMENTS: 'crm_installments',
  FOLLOWUPS: 'crm_followups',
  CALLS: 'crm_calls',
  ACTIVITIES: 'crm_activities',
  STAGE_HISTORY: 'crm_stage_history',
  TARGETS: 'crm_targets',
  EMPLOYEE_TARGETS: 'crm_employee_targets',
  NOTES: 'crm_notes',
  SETTINGS: 'crm_settings'
};

class StorageServiceClass {
  constructor() {
    this.subscribers = {};
  }

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`StorageService.get error for ${key}:`, e);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.emit(key, value);
    } catch (e) {
      console.error(`StorageService.set error for ${key}:`, e);
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key);
      this.emit(key, null);
    } catch (e) {
      console.error(`StorageService.remove error for ${key}:`, e);
    }
  }

  clear() {
    try {
      localStorage.clear();
      this.emit('*', null);
    } catch (e) {
      console.error('StorageService.clear error:', e);
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => {
        try { cb(data); } catch (err) { console.error(`Error in subscriber for ${event}:`, err); }
      });
    }
    if (this.subscribers['*']) {
      this.subscribers['*'].forEach(cb => {
        try { cb({ event, data }); } catch (err) { console.error('Error in wildcard subscriber:', err); }
      });
    }
  }

  getStats() {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    return {
      kilobytes: (totalBytes / 1024).toFixed(2),
      studentsCount: (this.get(STORAGE_KEYS.STUDENTS) || []).length,
      paymentsCount: (this.get(STORAGE_KEYS.PAYMENTS) || []).length,
      followupsCount: (this.get(STORAGE_KEYS.FOLLOWUPS) || []).length,
      activitiesCount: (this.get(STORAGE_KEYS.ACTIVITIES) || []).length
    };
  }
}

window.StorageService = new StorageServiceClass();
window.CRM_KEYS = STORAGE_KEYS;
