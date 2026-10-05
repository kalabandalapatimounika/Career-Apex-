/**
 * SALES CRM - LEADS MODULE
 * Lead assignment, reassignment, bulk actions, and status updates
 */

const Leads = {
  /**
   * Assign or reassign lead to a manager and salesperson
   */
  assign(customerId, { managerId, salespersonId }) {
    const customer = Customers.getById(customerId);
    if (!customer) {
      return { success: false, message: 'Lead not found.' };
    }

    const currentUser = Auth.getCurrentUser();
    let managerName = null;
    let salespersonName = null;

    if (managerId) {
      const m = Users.getById(managerId);
      if (m) managerName = m.name;
    }

    if (salespersonId) {
      const s = Users.getById(salespersonId);
      if (s) {
        salespersonName = s.name;
        // Auto set manager if sales rep has assigned manager
        if (!managerId && s.managerId) {
          managerId = s.managerId;
          managerName = s.managerName;
        }
      }
    }

    const updates = {
      managerId,
      managerName,
      salespersonId,
      salespersonName
    };

    const res = Customers.update(customerId, updates);
    if (!res.success) return res;

    // Log activity
    const assigner = currentUser ? currentUser.name : 'System';
    const repText = salespersonName ? `to ${salespersonName}` : '';
    const mgrText = managerName ? `under Manager ${managerName}` : '';

    Activities.log({
      action: 'Lead Assigned',
      customerId: customerId,
      description: `Lead "${customer.name}" (${customerId}) assigned ${repText} ${mgrText} by ${assigner}.`
    });

    return {
      success: true,
      customer: res.customer,
      message: `Lead successfully assigned to ${salespersonName || managerName || 'unassigned'}.`
    };
  },

  /**
   * Bulk assign leads to a salesperson
   */
  bulkAssign(customerIds = [], { managerId, salespersonId }) {
    if (!customerIds.length) {
      return { success: false, message: 'No leads selected for assignment.' };
    }

    let successCount = 0;
    customerIds.forEach(id => {
      const res = this.assign(id, { managerId, salespersonId });
      if (res.success) successCount++;
    });

    return {
      success: true,
      count: successCount,
      message: `Successfully assigned ${successCount} leads.`
    };
  }
};

window.Leads = Leads;
