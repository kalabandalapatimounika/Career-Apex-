/**
 * SALES CRM - UTILS MODULE
 * Date formatters, badges, string sanitizers, CSV export
 */

const Utils = {
  /**
   * Format ISO date string to DD-MMM-YYYY (e.g. 15-Oct-2026)
   */
  formatDate(dateInput) {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Format ISO date string to DD-MMM-YYYY, hh:mm A
   */
  formatDateTime(dateInput) {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Human-friendly relative time (e.g., "5 mins ago", "Yesterday", "2 days ago")
   */
  formatRelativeTime(dateInput) {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return this.formatDate(dateInput);
  },

  /**
   * Clean mobile phone numbers into 10-digit standard or international
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '');
  },

  /**
   * Generate HTML badge element for Lead Stage
   */
  getStageBadge(stage) {
    if (!stage) return '<span class="badge badge-stage-new">New Lead</span>';
    const lower = stage.toLowerCase().replace(/\s+/g, '');
    let badgeClass = 'badge-stage-new';

    if (lower.includes('cold')) badgeClass = 'badge-stage-cold';
    else if (lower.includes('notconnect')) badgeClass = 'badge-stage-not-connected';
    else if (lower.includes('contact')) badgeClass = 'badge-stage-contacted';
    else if (lower.includes('interest') && !lower.includes('not')) badgeClass = 'badge-stage-interested';
    else if (lower.includes('prospect')) badgeClass = 'badge-stage-prospect';
    else if (lower.includes('follow')) badgeClass = 'badge-stage-followup';
    else if (lower.includes('negotiat')) badgeClass = 'badge-stage-negotiation';
    else if (lower.includes('pendingclosure') || lower.includes('closure')) badgeClass = 'badge-stage-pending-closure';
    else if (lower.includes('enroll') || lower.includes('convert')) badgeClass = 'badge-stage-enrolled';
    else if (lower.includes('notinterest')) badgeClass = 'badge-stage-not-interested';
    else if (lower.includes('lost')) badgeClass = 'badge-stage-lost';

    return `<span class="badge ${badgeClass}"><span class="badge-dot"></span>${this.escapeHtml(stage)}</span>`;
  },

  /**
   * Generate HTML badge element for Priority
   */
  getPriorityBadge(priority) {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') {
      return '<span class="badge badge-priority-high"><i class="fa-solid fa-arrow-up-right-dots"></i> High</span>';
    } else if (p === 'low') {
      return '<span class="badge badge-priority-low"><i class="fa-solid fa-arrow-down"></i> Low</span>';
    }
    return '<span class="badge badge-priority-medium"><i class="fa-solid fa-minus"></i> Medium</span>';
  },

  /**
   * Generate HTML badge element for Status
   */
  getStatusBadge(status) {
    const s = (status || 'active').toLowerCase().replace(/\s+/g, '');
    let badgeClass = 'badge-status-active';
    let icon = 'fa-circle-check';

    if (s.includes('enroll') || s.includes('convert')) {
      badgeClass = 'badge-status-enrolled';
      icon = 'fa-trophy';
    } else if (s.includes('closure') || s.includes('pendingclosure')) {
      badgeClass = 'badge-status-pending-closure';
      icon = 'fa-file-invoice-dollar';
    } else if (s.includes('notconnect')) {
      badgeClass = 'badge-status-not-connected';
      icon = 'fa-phone-slash';
    } else if (s.includes('lost')) {
      badgeClass = 'badge-status-lost';
      icon = 'fa-circle-xmark';
    } else if (s.includes('notinterest')) {
      badgeClass = 'badge-status-notinterested';
      icon = 'fa-ban';
    } else if (s.includes('closed')) {
      badgeClass = 'badge-status-closed';
      icon = 'fa-lock';
    }

    return `<span class="badge ${badgeClass}"><i class="fa-solid ${icon}"></i> ${this.escapeHtml(status || 'Active')}</span>`;
  },

  /**
   * Get user role badge
   */
  getRoleBadge(role) {
    const r = (role || 'sales').toLowerCase();
    if (r === 'admin') {
      return '<span class="badge badge-role-admin"><i class="fa-solid fa-shield-halved"></i> Admin</span>';
    } else if (r === 'manager') {
      return '<span class="badge badge-role-manager"><i class="fa-solid fa-user-tie"></i> Sales Manager</span>';
    }
    return '<span class="badge badge-role-sales"><i class="fa-solid fa-user-tag"></i> Sales Rep</span>';
  },

  /**
   * Get payment status badge
   */
  getPaymentStatusBadge(status, customer) {
    const s = (status || 'Pending').trim();
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = customer && Array.isArray(customer.installments) && customer.paymentStatus !== 'Fully Paid' &&
      customer.installments.some(inst => (inst.status === 'Pending' || inst.status === 'Overdue') && inst.dueDate && inst.dueDate < todayStr);

    if (s === 'Fully Paid') {
      return '<span class="badge badge-status-converted" style="background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;"><i class="fa-solid fa-circle-check"></i> Fully Paid</span>';
    }
    if (isOverdue) {
      return '<span class="badge badge-danger" style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;"><i class="fa-solid fa-triangle-exclamation"></i> Overdue Due</span>';
    }
    if (s === 'Partially Paid') {
      return '<span class="badge badge-warning" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;"><i class="fa-solid fa-hourglass-half"></i> Partially Paid</span>';
    }
    return '<span class="badge badge-secondary" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;"><i class="fa-regular fa-clock"></i> Fee Pending</span>';
  },

  /**
   * Safe HTML string escape to avoid XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(str).replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Export JSON array to downloaded CSV file
   */
  exportToCsv(filename, rows) {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
              cell = cell.replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  /**
   * Simple debounce helper for search inputs
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

window.Utils = Utils;
