/**
 * LEAD CAREER & SALES CRM - LEADS / CANDIDATES MODULE
 * Lead CRUD, unique mobile validation, role-based queries, filters, search, and pagination
 * Domain: Candidate Job Seekers / Leads
 */

const Customers = {
  /**
   * Get all leads from localStorage
   */
  getAll() {
    try {
      const list = StorageService.getData(CRM_STORAGE_KEYS.CUSTOMERS, []);
      if (!Array.isArray(list)) return [];
      return list.filter(c => c && typeof c === 'object' && c.id);
    } catch (e) {
      console.error('Error in Customers.getAll:', e);
      return [];
    }
  },

  /**
   * Find single lead by CRM ID
   */
  getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const customers = this.getAll();
    let found = customers.find(c => c && c.id && String(c.id).trim().toLowerCase() === cleanId);
    if (found) return found;

    // Smart fallback: match numeric ID suffix if format changed (e.g. SM-LD-0001 vs CRM-LEAD-000001 or 0001)
    const matchNum = cleanId.match(/\d+/);
    if (matchNum) {
      const numVal = parseInt(matchNum[0], 10);
      found = customers.find(c => {
        if (!c || !c.id) return false;
        const cNum = String(c.id).match(/\d+/);
        return cNum && parseInt(cNum[0], 10) === numVal;
      });
      if (found) return found;
    }

    return null;
  },

  /**
   * Get leads accessible by current user based on RBAC rules
   * - Admin: all leads
   * - Manager: leads assigned to manager or team members
   * - Counselor/Sales: only assigned leads
   */
  getScopedCustomers(customUser = null) {
    const user = customUser || (window.Auth && typeof Auth.getCurrentUser === 'function' ? Auth.getCurrentUser() : null);
    const all = this.getAll();
    if (!user) return all;

    const role = (user.role || 'admin').toLowerCase();
    if (role === 'admin') {
      return all;
    }

    if (role === 'manager') {
      const team = (window.Users && typeof Users.getTeamMembers === 'function') 
        ? Users.getTeamMembers(user.id).map(m => m.id)
        : [];
      return all.filter(c => c && (c.managerId === user.id || team.includes(c.salespersonId)));
    }

    // Counselor / Salesperson
    return all.filter(c => c && c.salespersonId === user.id);
  },

  /**
   * Create a new Lead / Job Seeker
   */
  create(data) {
    // 1. Validation
    if (!data.name || !String(data.name).trim()) {
      return { success: false, message: 'Lead name is required.' };
    }
    if (!data.mobile || !Validation.isValidMobile(data.mobile)) {
      return { success: false, message: 'A valid 10-digit mobile number is required.' };
    }

    // 2. Check duplicate mobile
    const dupCheck = Validation.checkDuplicateMobile(data.mobile);
    if (dupCheck.exists) {
      return {
        success: false,
        isDuplicate: true,
        message: 'A lead with this mobile number is already registered.',
        existingCustomerId: dupCheck.customer.id,
        existingCustomer: dupCheck.customer
      };
    }

    // Check alternate mobile duplicate if provided
    if (data.altMobile) {
      const altDup = Validation.checkDuplicateMobile(data.altMobile);
      if (altDup.exists) {
        return {
          success: false,
          isDuplicate: true,
          message: 'Alternate mobile number belongs to another registered lead.',
          existingCustomerId: altDup.customer.id,
          existingCustomer: altDup.customer
        };
      }
    }

    // 3. Resolve manager & counselor/salesperson names
    let managerName = data.managerName || '';
    if (data.managerId && !managerName) {
      const m = Users.getById(data.managerId);
      if (m) managerName = m.name;
    }

    let salespersonName = data.salespersonName || '';
    if (data.salespersonId && !salespersonName) {
      const s = Users.getById(data.salespersonId);
      if (s) salespersonName = s.name;
    }

    const newId = data.id || StorageService.generateId('SM-LD');
    const now = new Date().toISOString();

    const newCustomer = {
      id: newId,
      name: data.name.trim(),
      mobile: String(data.mobile).trim(),
      altMobile: data.altMobile ? String(data.altMobile).trim() : '',
      email: data.email ? String(data.email).trim().toLowerCase() : '',
      // Academic background
      qualification: data.qualification ? data.qualification.trim() : 'B.Tech (Computer Science)',
      college: data.college ? data.college.trim() : 'College / University',
      passingYear: data.passingYear ? String(data.passingYear).trim() : '2025',
      cgpaOrPercentage: data.cgpaOrPercentage ? String(data.cgpaOrPercentage).trim() : '',
      // Career / Job preferences
      skills: data.skills ? data.skills.trim() : 'Java, Python, SQL',
      targetRole: data.targetRole ? data.targetRole.trim() : 'Software Engineer',
      experienceLevel: data.experienceLevel || 'Fresher',
      expectedCtc: data.expectedCtc ? data.expectedCtc.trim() : '',
      preferredLocation: data.preferredLocation ? data.preferredLocation.trim() : '',
      resumeLink: data.resumeLink ? data.resumeLink.trim() : '',
      certifications: data.certifications ? data.certifications.trim() : '',
      // Location
      address: data.address ? data.address.trim() : '',
      city: data.city ? data.city.trim() : '',
      state: data.state ? data.state.trim() : '',
      country: data.country ? data.country.trim() : 'India',
      // CRM Pipeline metadata
      source: data.source || 'Website Inquiry',
      stage: data.stage || 'New Lead',
      status: data.status || (data.stage === 'Pending Closure' ? 'Pending Closure' : (data.stage === 'Enrolled' || data.stage === 'Converted' ? 'Enrolled' : 'Active')),
      priority: data.priority || 'Medium',
      estimatedRevenue: data.estimatedRevenue !== undefined && data.estimatedRevenue !== null && data.estimatedRevenue !== '' ? Number(data.estimatedRevenue) : (data.stage === 'Pending Closure' ? (Number(data.totalFee) || 45000) : null),
      managerId: data.managerId || null,
      managerName: managerName || null,
      salespersonId: data.salespersonId || null,
      salespersonName: salespersonName || null,
      // Placement Fee & Payment Plan
      totalFee: Number(data.totalFee) >= 0 ? Number(data.totalFee) : 45000,
      paidAmount: Number(data.paidAmount) || 0,
      pendingAmount: Math.max(0, (Number(data.totalFee) >= 0 ? Number(data.totalFee) : 45000) - (Number(data.paidAmount) || 0)),
      paymentPlan: data.paymentPlan || '2 Installments',
      paymentStatus: data.paymentStatus || (Number(data.paidAmount) > 0 ? 'Partially Paid' : 'Pending'),
      installments: Array.isArray(data.installments) ? data.installments : (window.Payments && typeof Payments.generateDefaultInstallments === 'function' ? Payments.generateDefaultInstallments(Number(data.totalFee) || 45000, data.paymentPlan || '2 Installments', Number(data.paidAmount) || 0) : []),
      createdAt: now,
      updatedAt: now,
      lastContacted: null,
      nextFollowUp: data.nextFollowUp || null,
      notes: data.notes ? data.notes.trim() : ''
    };

    const customers = this.getAll();
    customers.unshift(newCustomer);
    StorageService.saveData(CRM_STORAGE_KEYS.CUSTOMERS, customers);

    // Initial note entry if notes provided
    if (newCustomer.notes) {
      const currentUser = Auth.getCurrentUser();
      const notesList = StorageService.getData(CRM_STORAGE_KEYS.NOTES, []);
      notesList.unshift({
        id: StorageService.generateId('CRM-NOTE'),
        customerId: newId,
        text: newCustomer.notes,
        createdBy: currentUser ? currentUser.name : 'System',
        createdAt: now
      });
      StorageService.saveData(CRM_STORAGE_KEYS.NOTES, notesList);
    }

    // Initial stage history entry
    const stageHistory = StorageService.getData(CRM_STORAGE_KEYS.STAGE_HISTORY, []);
    stageHistory.unshift({
      id: StorageService.generateId('CRM-STAGE'),
      customerId: newId,
      customerName: newCustomer.name,
      fromStage: 'None',
      toStage: newCustomer.stage,
      changedBy: (Auth.getCurrentUser() || {}).name || 'System',
      changedAt: now,
      reason: 'Lead profile registered'
    });
    StorageService.saveData(CRM_STORAGE_KEYS.STAGE_HISTORY, stageHistory);

    // Activity log
    Activities.log({
      action: 'Lead Registered',
      customerId: newId,
      description: `Registered lead: ${newCustomer.name} (${newId}) | ${newCustomer.qualification}, ${newCustomer.college} | Stage: "${newCustomer.stage}"`
    });

    return { success: true, customer: newCustomer };
  },

  /**
   * Update an existing Lead
   */
  update(id, updates) {
    const customers = this.getAll();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) {
      return { success: false, message: 'Lead record not found.' };
    }

    const existing = customers[idx];

    // Check duplicate mobile if mobile modified
    if (updates.mobile && updates.mobile !== existing.mobile) {
      const dupCheck = Validation.checkDuplicateMobile(updates.mobile, id);
      if (dupCheck.exists) {
        return {
          success: false,
          isDuplicate: true,
          message: 'Another lead with this mobile number already exists.',
          existingCustomerId: dupCheck.customer.id
        };
      }
    }

    // Resolve manager & counselor names if IDs changed
    if (updates.managerId && updates.managerId !== existing.managerId) {
      const m = Users.getById(updates.managerId);
      updates.managerName = m ? m.name : null;
    }
    if (updates.salespersonId && updates.salespersonId !== existing.salespersonId) {
      const s = Users.getById(updates.salespersonId);
      updates.salespersonName = s ? s.name : null;
    }

    const now = new Date().toISOString();
    customers[idx] = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID unconditionally
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: now
    };

    StorageService.saveData(CRM_STORAGE_KEYS.CUSTOMERS, customers);

    // Log stage transition history if stage changed
    if (updates.stage && updates.stage !== existing.stage) {
      const historyList = StorageService.getData(CRM_STORAGE_KEYS.STAGE_HISTORY, []);
      historyList.unshift({
        id: StorageService.generateId('CRM-STAGE'),
        customerId: id,
        customerName: updates.name || existing.name,
        fromStage: existing.stage,
        toStage: updates.stage,
        changedBy: (Auth.getCurrentUser() || {}).name || 'System',
        changedAt: now,
        reason: updates.stageChangeReason || 'Lead profile updated'
      });
      StorageService.saveData(CRM_STORAGE_KEYS.STAGE_HISTORY, historyList);
    }

    Activities.log({
      action: 'Lead Profile Updated',
      customerId: id,
      description: `Lead ${existing.name} (${id}) profile was updated.`
    });

    return { success: true, customer: customers[idx] };
  },

  /**
   * Delete lead (Admin only)
   */
  delete(id) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Unauthorized. Only administrators can delete lead records.' };
    }

    const customers = this.getAll();
    const customer = customers.find(c => c.id === id);
    if (!customer) return { success: false, message: 'Lead record not found.' };

    const remaining = customers.filter(c => c.id !== id);
    StorageService.saveData(CRM_STORAGE_KEYS.CUSTOMERS, remaining);

    Activities.log({
      action: 'Lead Deleted',
      customerId: id,
      description: `Lead ${customer.name} (${id}) was deleted by ${currentUser.name}.`
    });

    return { success: true };
  },

  /**
   * Filter and search leads
   * @param {object} params Filter options
   */
  filter(params = {}) {
    let list = this.getScopedCustomers();

    // Text search (Lead ID, Name, Mobile, Email, Qualification, College, Skills, Target Role, City)
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(c =>
        c.id.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.qualification && c.qualification.toLowerCase().includes(q)) ||
        (c.college && c.college.toLowerCase().includes(q)) ||
        (c.skills && c.skills.toLowerCase().includes(q)) ||
        (c.targetRole && c.targetRole.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }

    // Stage filter
    if (params.stage && params.stage !== 'all') {
      list = list.filter(c => c.stage === params.stage);
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      list = list.filter(c => c.status === params.status);
    }

    // Priority filter
    if (params.priority && params.priority !== 'all') {
      list = list.filter(c => c.priority.toLowerCase() === params.priority.toLowerCase());
    }

    // Counselor / Salesperson filter
    if (params.salespersonId && params.salespersonId !== 'all') {
      list = list.filter(c => c.salespersonId === params.salespersonId);
    }

    // Manager filter
    if (params.managerId && params.managerId !== 'all') {
      list = list.filter(c => c.managerId === params.managerId);
    }

    // Passing Year filter
    if (params.passingYear && params.passingYear !== 'all') {
      list = list.filter(c => String(c.passingYear) === String(params.passingYear));
    }

    // Qualification / Degree filter
    if (params.qualification && params.qualification !== 'all') {
      list = list.filter(c => c.qualification && c.qualification.toLowerCase().includes(params.qualification.toLowerCase()));
    }

    // Source filter
    if (params.source && params.source !== 'all') {
      list = list.filter(c => c.source === params.source);
    }

    // City filter
    if (params.city && params.city !== 'all') {
      list = list.filter(c => c.city && c.city.toLowerCase() === params.city.toLowerCase());
    }

    // Fee / Payment Status filter
    if (params.paymentStatus && params.paymentStatus !== 'all') {
      if (params.paymentStatus === 'Overdue') {
        const todayStr = new Date().toISOString().split('T')[0];
        list = list.filter(c => {
          if (c.paymentStatus === 'Fully Paid') return false;
          if (!Array.isArray(c.installments)) return false;
          return c.installments.some(inst => (inst.status === 'Pending' || inst.status === 'Overdue') && inst.dueDate && inst.dueDate < todayStr);
        });
      } else {
        list = list.filter(c => (c.paymentStatus || 'Pending') === params.paymentStatus);
      }
    }

    return list;
  },

  /**
   * Paginate list of items
   */
  paginate(items, page = 1, pageSize = 10) {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageItems = items.slice(startIdx, endIdx);

    return {
      items: pageItems,
      page: currentPage,
      pageSize,
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }
};

window.Customers = Customers;
