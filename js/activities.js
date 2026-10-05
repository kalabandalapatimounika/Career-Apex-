/**
 * Career Apex CRM - Activities Module
 * Activities.log(), Activities.getAll()
 */

const Activities = {
  log(action, description, studentId = null, studentName = null) {
    const activities = StorageService.get(CRM_KEYS.ACTIVITIES) || [];
    const user = Auth.getSession()?.name || 'System';

    const newActivity = {
      id: 'ACT-' + Date.now(),
      timestamp: new Date().toISOString(),
      user,
      action,
      entity: action.includes('Payment') ? 'Payment' : (action.includes('Call') ? 'Communication' : 'Lead'),
      studentId,
      studentName,
      description
    };

    activities.unshift(newActivity);
    if (activities.length > 500) activities.length = 500;
    StorageService.set(CRM_KEYS.ACTIVITIES, activities);
    return newActivity;
  },

  getAll(filters = {}) {
    let activities = StorageService.get(CRM_KEYS.ACTIVITIES) || [];
    if (filters.action && filters.action !== 'all') {
      activities = activities.filter(a => a.action === filters.action);
    }
    if (filters.studentId) {
      activities = activities.filter(a => a.studentId === filters.studentId);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      activities = activities.filter(a =>
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.user && a.user.toLowerCase().includes(q)) ||
        (a.studentName && a.studentName.toLowerCase().includes(q)) ||
        (a.studentId && a.studentId.toLowerCase().includes(q))
      );
    }
    return activities;
  }
};

window.Activities = Activities;
