/**
 * SALES CRM - FOLLOWUPS MODULE
 * Scheduling, categorization (Today, Upcoming, Overdue, Completed), completion, rescheduling
 */

const Followups = {
  /**
   * Get all follow-up records
   */
  getAll(scoped = true) {
    let list = StorageService.getData(CRM_STORAGE_KEYS.FOLLOWUPS, []);
    if (!Array.isArray(list)) list = [];
    list = list.filter(f => f && typeof f === 'object' && f.id);
    const currentUser = window.Auth ? Auth.getCurrentUser() : null;

    if (scoped && currentUser) {
      if (currentUser.role === 'sales') {
        list = list.filter(f => f.salespersonId === currentUser.id);
      } else if (currentUser.role === 'manager') {
        const teamMemberIds = (window.Users && typeof Users.getTeamMembers === 'function') 
          ? Users.getTeamMembers(currentUser.id).map(u => u.id) 
          : [];
        teamMemberIds.push(currentUser.id);
        list = list.filter(f => teamMemberIds.includes(f.salespersonId));
      }
    }

    return list;
  },

  /**
   * Get follow-ups for a single customer
   */
  getByCustomer(customerId) {
    if (!customerId) return [];
    const list = this.getAll(false);
    return list.filter(f => f && f.customerId === customerId);
  },

  /**
   * Get categorized follow-ups: Today, Upcoming, Overdue, Completed
   */
  getCategorized(scoped = true) {
    const list = this.getAll(scoped);
    const todayStr = new Date().toISOString().split('T')[0];

    const today = [];
    const upcoming = [];
    const overdue = [];
    const completed = [];

    list.forEach(f => {
      if (!f) return;
      if (f.status === 'Completed') {
        completed.push(f);
      } else if (f.status === 'Cancelled') {
        // Can be omitted or kept
      } else {
        // Pending status
        const fDate = f.date || todayStr;
        if (fDate === todayStr) {
          today.push(f);
        } else if (fDate < todayStr) {
          overdue.push(f);
        } else {
          upcoming.push(f);
        }
      }
    });

    // Sort appropriately
    today.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    overdue.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    return { today, upcoming, overdue, completed };
  },

  /**
   * Create a new follow-up
   */
  create(data) {
    if (!data.customerId) {
      return { success: false, message: 'Customer is required for follow-up.' };
    }
    if (!data.date) {
      return { success: false, message: 'Follow-up date is required.' };
    }

    const customer = Customers.getById(data.customerId);
    if (!customer) {
      return { success: false, message: 'Customer not found.' };
    }

    const currentUser = Auth.getCurrentUser();
    let repName = data.salespersonName;
    if (!repName && data.salespersonId) {
      const u = Users.getById(data.salespersonId);
      if (u) repName = u.name;
    }
    if (!repName) {
      repName = customer.salespersonName || (currentUser ? currentUser.name : 'Unassigned');
    }

    const id = StorageService.generateId('CRM-FLW');
    const newFollowup = {
      id,
      customerId: customer.id,
      customerName: customer.name,
      salespersonId: data.salespersonId || customer.salespersonId || (currentUser ? currentUser.id : null),
      salespersonName: repName,
      date: data.date,
      time: data.time || '10:00',
      purpose: data.purpose ? data.purpose.trim() : 'General check-in and relationship follow-up',
      priority: data.priority || customer.priority || 'Medium',
      status: 'Pending',
      completedAt: null,
      completedBy: null,
      notes: ''
    };

    const list = StorageService.getData(CRM_STORAGE_KEYS.FOLLOWUPS, []);
    list.unshift(newFollowup);
    StorageService.saveData(CRM_STORAGE_KEYS.FOLLOWUPS, list);

    // Update customer's nextFollowUp field
    Customers.update(customer.id, {
      nextFollowUp: `${newFollowup.date}T${newFollowup.time}:00.000Z`
    });

    Activities.log({
      action: 'Follow-up Created',
      customerId: customer.id,
      description: `Follow-up scheduled with ${customer.name} on ${Utils.formatDate(newFollowup.date)} at ${newFollowup.time}.`
    });

    Toast.success(`Follow-up scheduled for ${customer.name}.`);
    return { success: true, followup: newFollowup };
  },

  /**
   * Mark a follow-up as Completed
   */
  complete(id, notes = '') {
    const list = StorageService.getData(CRM_STORAGE_KEYS.FOLLOWUPS, []);
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) {
      return { success: false, message: 'Follow-up not found.' };
    }

    const item = list[idx];
    const currentUser = Auth.getCurrentUser();
    const now = new Date().toISOString();

    list[idx] = {
      ...item,
      status: 'Completed',
      completedAt: now,
      completedBy: currentUser ? currentUser.name : 'System',
      notes: notes ? notes.trim() : item.notes
    };

    StorageService.saveData(CRM_STORAGE_KEYS.FOLLOWUPS, list);

    // Clear next follow-up on customer if it matched this one
    const customer = Customers.getById(item.customerId);
    if (customer) {
      // Find if another pending follow-up exists for this customer
      const remaining = list
        .filter(f => f.customerId === customer.id && f.status === 'Pending')
        .sort((a, b) => a.date.localeCompare(b.date));

      const nextDate = remaining.length ? `${remaining[0].date}T${remaining[0].time}:00.000Z` : null;
      Customers.update(customer.id, { nextFollowUp: nextDate });
    }

    Activities.log({
      action: 'Follow-up Completed',
      customerId: item.customerId,
      description: `Completed follow-up for ${item.customerName}. Notes: ${notes || 'No remarks.'}`
    });

    Toast.success('Follow-up marked as completed.');
    return { success: true, followup: list[idx] };
  },

  /**
   * Reschedule an existing follow-up
   */
  reschedule(id, newDate, newTime, reason = '') {
    if (!newDate) {
      return { success: false, message: 'New date is required.' };
    }

    const list = StorageService.getData(CRM_STORAGE_KEYS.FOLLOWUPS, []);
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) {
      return { success: false, message: 'Follow-up not found.' };
    }

    const item = list[idx];
    const oldDate = item.date;

    list[idx] = {
      ...item,
      date: newDate,
      time: newTime || item.time || '10:00',
      status: 'Pending',
      notes: reason ? `Rescheduled from ${oldDate}: ${reason}` : item.notes
    };

    StorageService.saveData(CRM_STORAGE_KEYS.FOLLOWUPS, list);

    // Update customer next follow-up
    Customers.update(item.customerId, {
      nextFollowUp: `${newDate}T${list[idx].time}:00.000Z`
    });

    Activities.log({
      action: 'Follow-up Rescheduled',
      customerId: item.customerId,
      description: `Rescheduled follow-up for ${item.customerName} from ${oldDate} to ${newDate}. Reason: ${reason || 'N/A'}`
    });

    Toast.success('Follow-up successfully rescheduled.');
    return { success: true, followup: list[idx] };
  }
};

window.Followups = Followups;
