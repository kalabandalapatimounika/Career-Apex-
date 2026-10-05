/**
 * Career Apex CRM - Auth Service
 * Authentication, Session Persistence, Role Switching, and RBAC Permissions.
 */

const Auth = {
  login(email, password) {
    const users = StorageService.get(CRM_KEYS.USERS) || [];
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matched) {
      return { success: false, message: 'Invalid credentials. User email not found.' };
    }

    StorageService.set(CRM_KEYS.SESSION, matched);
    this.logActivity('Sign In', `User ${matched.name} (${matched.role}) logged in`);
    return { success: true, user: matched };
  },

  logout() {
    const user = this.getSession();
    if (user) {
      this.logActivity('Sign Out', `User ${user.name} logged out`);
    }
    StorageService.remove(CRM_KEYS.SESSION);

    // Determine correct relative path to login page
    const isPagesDir = window.location.pathname.includes('/pages/');
    window.location.href = isPagesDir ? '../index.html' : 'index.html';
  },

  getSession() {
    return StorageService.get(CRM_KEYS.SESSION);
  },

  getCurrentUser() {
    return this.getSession();
  },

  requireAuth() {
    const session = this.getSession();
    if (!session) {
      const isPagesDir = window.location.pathname.includes('/pages/');
      window.location.href = isPagesDir ? '../index.html' : 'index.html';
      return null;
    }
    return session;
  },

  switchRole(role) {
    const users = StorageService.get(CRM_KEYS.USERS) || [];
    const target = users.find(u => u.role === role) || users[0];
    StorageService.set(CRM_KEYS.SESSION, target);
    this.logActivity('Role Switched', `Active session switched to ${target.role} (${target.name})`);

    // Redirect to appropriate dashboard for the role
    const isPagesDir = window.location.pathname.includes('/pages/');
    const prefix = isPagesDir ? '' : 'pages/';

    if (role === 'ADMIN') {
      window.location.href = `${prefix}admin-dashboard.html`;
    } else if (role === 'MANAGER') {
      window.location.href = `${prefix}manager-dashboard.html`;
    } else {
      window.location.href = `${prefix}salesperson-dashboard.html`;
    }
  },

  isAdmin() {
    const session = this.getSession();
    return session && session.role === 'ADMIN';
  },

  isManager() {
    const session = this.getSession();
    return session && (session.role === 'MANAGER' || session.role === 'ADMIN');
  },

  isCounselor() {
    const session = this.getSession();
    return session && session.role === 'COUNSELOR';
  },

  canAccess(feature) {
    const role = this.getSession()?.role;
    switch (feature) {
      case 'settings':
        return role === 'ADMIN';
      case 'team_management':
        return role === 'ADMIN' || role === 'MANAGER';
      case 'edit_targets':
        return role === 'ADMIN' || role === 'MANAGER';
      case 'bulk_reassign':
        return role === 'ADMIN' || role === 'MANAGER';
      case 'delete_lead':
        return role === 'ADMIN';
      default:
        return true;
    }
  },

  logActivity(action, description) {
    const user = this.getSession()?.name || 'System';
    const activities = StorageService.get(CRM_KEYS.ACTIVITIES) || [];
    activities.unshift({
      id: 'ACT-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: user,
      action: action,
      entity: 'Session',
      description: description
    });
    StorageService.set(CRM_KEYS.ACTIVITIES, activities);
  }
};

window.Auth = Auth;
