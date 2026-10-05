/**
 * Career Apex CRM - Router Helper
 * Manages URL query parameters, page redirection, and role access guards.
 */

const Router = {
  getParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  },

  getParam(key, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultValue;
  },

  navigate(page, params = {}) {
    const isPagesDir = window.location.pathname.includes('/pages/');
    const prefix = isPagesDir ? '' : 'pages/';
    const query = new URLSearchParams(params).toString();
    const url = `${prefix}${page}${query ? '?' + query : ''}`;
    window.location.href = url;
  },

  guardRole(allowedRoles = []) {
    const session = Auth.requireAuth();
    if (!session) return false;

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      Utils.showToast(`Access restricted: ${allowedRoles.join('/')} only`, 'error');
      setTimeout(() => {
        if (session.role === 'ADMIN') window.location.href = 'admin-dashboard.html';
        else if (session.role === 'MANAGER') window.location.href = 'manager-dashboard.html';
        else window.location.href = 'salesperson-dashboard.html';
      }, 1200);
      return false;
    }
    return true;
  }
};

window.Router = Router;
