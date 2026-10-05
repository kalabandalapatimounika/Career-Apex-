/**
 * SALES CRM - STORAGE MODULE
 * Centralized localStorage Management & ID Generator
 */

const CRM_STORAGE_KEYS = {
  USERS: 'crm_users',
  CUSTOMERS: 'crm_customers',
  LEADS: 'crm_leads',
  FOLLOWUPS: 'crm_followups',
  ACTIVITIES: 'crm_activities',
  CALLS: 'crm_calls',
  NOTES: 'crm_notes',
  STAGE_HISTORY: 'crm_stage_history',
  SETTINGS: 'crm_settings',
  CURRENT_USER: 'crm_current_user',
  COUNTERS: 'crm_counters',
  PAYMENTS: 'crm_payments',
  TARGETS: 'crm_targets',
  TEMPLATES: 'crm_templates'
};

const StorageService = {
  /**
   * Retrieve parsed data from localStorage with fallback
   */
  getData(key, defaultValue = []) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading key "${key}" from localStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Save data into localStorage as JSON string
   */
  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving key "${key}" to localStorage:`, error);
      return false;
    }
  },

  /**
   * Update data using an updater function
   */
  updateData(key, updateFn) {
    try {
      const current = this.getData(key, []);
      const updated = updateFn(current);
      this.saveData(key, updated);
      return updated;
    } catch (error) {
      console.error(`Error updating key "${key}" in localStorage:`, error);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   */
  deleteData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key "${key}" from localStorage:`, error);
      return false;
    }
  },

  /**
   * Clear all CRM data keys
   */
  clearData() {
    Object.values(CRM_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  /**
   * Generate sequential human-readable CRM IDs
   * Example: SM-LD-0001, CRM-ACT-000001, CRM-FLW-000001
   */
  generateId(prefix = 'SM-LD') {
    const counters = this.getData(CRM_STORAGE_KEYS.COUNTERS, {});
    const currentCount = (counters[prefix] || 0) + 1;
    counters[prefix] = currentCount;
    this.saveData(CRM_STORAGE_KEYS.COUNTERS, counters);

    const padLength = (prefix.toUpperCase() === 'SM-LD' || prefix.toLowerCase() === 'sm-ld') ? 4 : 6;
    const paddedNumber = String(currentCount).padStart(padLength, '0');
    return `${prefix}-${paddedNumber}`;
  }
};

// Global export for vanilla JS environment
window.CRM_STORAGE_KEYS = CRM_STORAGE_KEYS;
window.StorageService = StorageService;
