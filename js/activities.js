/**
 * SALES CRM - ACTIVITIES MODULE
 * Centralized audit trail, event logging, timeline retrieval, and reporting metrics
 */

const Activities = {
  /**
   * Log an activity event
   * @param {object} params
   * @param {string} params.action Action name (e.g. 'Customer Created', 'Call Recorded')
   * @param {string} [params.customerId] Related customer CRM ID
   * @param {string} params.description Human-readable event description
   * @param {string} [params.user] User name (defaults to current user)
   * @param {string} [params.role] User role (defaults to current user role)
   */
  log({ action, customerId = null, description, user = null, role = null }) {
    try {
      const currentUser = Auth.getCurrentUser();
      const userName = user || (currentUser ? currentUser.name : 'System');
      const userRole = role || (currentUser ? currentUser.role : 'admin');

      const activityId = StorageService.generateId('CRM-ACT');
      const newActivity = {
        id: activityId,
        user: userName,
        role: userRole,
        action,
        customerId: customerId || null,
        description: description || '',
        timestamp: new Date().toISOString()
      };

      const activities = StorageService.getData(CRM_STORAGE_KEYS.ACTIVITIES, []);
      activities.unshift(newActivity); // Newest first

      // Keep recent 1000 activities to prevent uncontrolled growth
      if (activities.length > 1000) {
        activities.length = 1000;
      }

      StorageService.saveData(CRM_STORAGE_KEYS.ACTIVITIES, activities);
      return newActivity;
    } catch (e) {
      console.error('Failed to log activity:', e);
      return null;
    }
  },

  /**
   * Get all activities with optional filtering and role scoping
   */
  getAll(filters = {}) {
    let activities = StorageService.getData(CRM_STORAGE_KEYS.ACTIVITIES, []);
    const currentUser = Auth.getCurrentUser();

    // Role-based visibility check if specified
    if (filters.scoped && currentUser) {
      if (currentUser.role === 'sales') {
        // Salesperson sees their own activities or activities on their assigned leads
        const myCustomers = StorageService.getData(CRM_STORAGE_KEYS.CUSTOMERS, [])
          .filter(c => c.salespersonId === currentUser.id)
          .map(c => c.id);
        
        activities = activities.filter(a => 
          a.user === currentUser.name || (a.customerId && myCustomers.includes(a.customerId))
        );
      } else if (currentUser.role === 'manager') {
        // Manager sees team activities
        const teamUsers = Users.getTeamMembers(currentUser.id).map(u => u.name);
        teamUsers.push(currentUser.name);
        activities = activities.filter(a => teamUsers.includes(a.user));
      }
    }

    if (filters.customerId) {
      activities = activities.filter(a => a.customerId === filters.customerId);
    }

    if (filters.user) {
      activities = activities.filter(a => a.user.toLowerCase() === filters.user.toLowerCase());
    }

    if (filters.action) {
      activities = activities.filter(a => a.action.toLowerCase() === filters.action.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      activities = activities.filter(a =>
        a.description.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.user.toLowerCase().includes(q) ||
        (a.customerId && a.customerId.toLowerCase().includes(q))
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      activities = activities.filter(a => new Date(a.timestamp).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000);
      activities = activities.filter(a => new Date(a.timestamp).getTime() <= end);
    }

    return activities;
  },

  /**
   * Get activity timeline for a single customer
   */
  getByCustomer(customerId) {
    if (!customerId) return [];
    return this.getAll({ customerId });
  },

  /**
   * Calculate aggregated activity statistics for reports and dashboards
   */
  getStats() {
    const activities = StorageService.getData(CRM_STORAGE_KEYS.ACTIVITIES, []);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let countToday = 0;
    let countWeek = 0;
    let countMonth = 0;

    const byUser = {};
    const byType = {};

    activities.forEach(a => {
      const t = new Date(a.timestamp).getTime();
      if (t >= todayStart) countToday++;
      if (t >= weekStart) countWeek++;
      if (t >= monthStart) countMonth++;

      // User aggregation
      const u = a.user || 'Unknown';
      if (!byUser[u]) {
        byUser[u] = {
          name: u,
          role: a.role,
          total: 0,
          customerCreated: 0,
          customerEdited: 0,
          callsRecorded: 0,
          stageChanges: 0,
          followupsCompleted: 0
        };
      }
      byUser[u].total++;
      if (a.action === 'Customer Created') byUser[u].customerCreated++;
      else if (a.action === 'Customer Edited') byUser[u].customerEdited++;
      else if (a.action === 'Call Recorded') byUser[u].callsRecorded++;
      else if (a.action === 'Stage Changed') byUser[u].stageChanges++;
      else if (a.action === 'Follow-up Completed') byUser[u].followupsCompleted++;

      // Type aggregation
      byType[a.action] = (byType[a.action] || 0) + 1;
    });

    return {
      total: activities.length,
      today: countToday,
      thisWeek: countWeek,
      thisMonth: countMonth,
      byUser,
      byType
    };
  }
};

window.Activities = Activities;
