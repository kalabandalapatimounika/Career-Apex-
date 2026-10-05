/**
 * SALES CRM - REPORTS MODULE
 * Dynamic analytics engine: Placement Revenue, Stage Velocity, Team Benchmarks, and Multi-filter Intelligence
 */

const Reports = {
  /**
   * Filter customer dataset using universal multi-dimensional filter criteria
   * @param {object} filters Universal filter options
   */
  filterCustomers(filters = {}) {
    let list = Customers.getScopedCustomers();

    // 1. Counselor filter
    if (filters.salespersonId && filters.salespersonId !== 'all') {
      list = list.filter(c => c.salespersonId === filters.salespersonId);
    }

    // 2. Manager filter
    if (filters.managerId && filters.managerId !== 'all') {
      list = list.filter(c => c.managerId === filters.managerId);
    }

    // 3. Stage filter
    if (filters.stage && filters.stage !== 'all') {
      list = list.filter(c => c.stage === filters.stage);
    }

    // 4. Source filter
    if (filters.source && filters.source !== 'all') {
      list = list.filter(c => c.source === filters.source);
    }

    // 5. Payment / Fee Status filter
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      if (filters.paymentStatus === 'Overdue') {
        const todayStr = new Date().toISOString().split('T')[0];
        list = list.filter(c => {
          if (c.paymentStatus === 'Fully Paid') return false;
          if (!Array.isArray(c.installments)) return false;
          return c.installments.some(inst => (inst.status === 'Pending' || inst.status === 'Overdue') && inst.dueDate && inst.dueDate < todayStr);
        });
      } else {
        list = list.filter(c => (c.paymentStatus || 'Pending') === filters.paymentStatus);
      }
    }

    // 6. Date Range filter (createdAt)
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      list = list.filter(c => new Date(c.createdAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000);
      list = list.filter(c => new Date(c.createdAt).getTime() <= end);
    }

    return list;
  },

  /**
   * Placement Fee & Revenue Analytics Report
   * @param {object} filters Universal filters
   */
  getRevenueReport(filters = {}) {
    const filteredCustomers = this.filterCustomers(filters);
    const summary = Payments.getSummary(filteredCustomers);

    // Counselor revenue performance breakdown
    const counselors = Users.getSalespeople();
    const counselorStats = counselors.map(c => {
      const custs = filteredCustomers.filter(cust => cust.salespersonId === c.id);
      const booked = custs.reduce((sum, cust) => sum + (Number(cust.totalFee) || 0), 0);
      const collected = custs.reduce((sum, cust) => sum + (Number(cust.paidAmount) || 0), 0);
      const pending = custs.reduce((sum, cust) => sum + (Number(cust.pendingAmount) || 0), 0);
      const rate = booked > 0 ? ((collected / booked) * 100).toFixed(1) : '0.0';
      const fullyPaidCount = custs.filter(cust => cust.paymentStatus === 'Fully Paid').length;

      return {
        id: c.id,
        name: c.name,
        managerName: c.managerName || '—',
        avatar: c.avatar,
        leadCount: custs.length,
        studentCount: custs.length,
        bookedFee: booked,
        collectedFee: collected,
        pendingFee: pending,
        realizationRate: `${rate}%`,
        rateNumber: Number(rate),
        fullyPaidCount
      };
    }).sort((a, b) => b.collectedFee - a.collectedFee);

    // Revenue by Pipeline Stage
    const stageRevenue = {};
    SeedData.STAGES.forEach(st => {
      stageRevenue[st] = { stage: st, booked: 0, collected: 0, pending: 0, count: 0 };
    });

    filteredCustomers.forEach(cust => {
      const st = cust.stage || 'Cold Calling';
      if (!stageRevenue[st]) {
        stageRevenue[st] = { stage: st, booked: 0, collected: 0, pending: 0, count: 0 };
      }
      stageRevenue[st].booked += Number(cust.totalFee) || 0;
      stageRevenue[st].collected += Number(cust.paidAmount) || 0;
      stageRevenue[st].pending += Number(cust.pendingAmount) || 0;
      stageRevenue[st].count++;
    });

    // Payment Mode Stats from all logged transactions matching filtered customers
    const custIds = new Set(filteredCustomers.map(c => c.id));
    const allPayments = Payments.getAll().filter(p => custIds.has(p.customerId));
    const modeStats = { 'UPI': 0, 'Net Banking': 0, 'Credit/Debit Card': 0, 'Cash': 0, 'Cheque': 0 };
    allPayments.forEach(p => {
      const mode = p.paymentMode || 'UPI';
      modeStats[mode] = (modeStats[mode] || 0) + (Number(p.amount) || 0);
    });

    // Overdue & Upcoming Installments
    const dues = Payments.getInstallmentDues(filteredCustomers, 'all').slice(0, 15);

    return {
      summary,
      counselorStats,
      stageRevenue: Object.values(stageRevenue),
      modeStats,
      dues,
      filteredCount: filteredCustomers.length
    };
  },

  /**
   * Calculate Stage Movement analytics from actual stage history records
   * @param {object} [filters] Date filters { startDate, endDate, salespersonId, etc. }
   */
  getStageMovementReport(filters = {}) {
    let history = StorageService.getData(CRM_STORAGE_KEYS.STAGE_HISTORY, []);

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      history = history.filter(h => new Date(h.changedAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000);
      history = history.filter(h => new Date(h.changedAt).getTime() <= end);
    }

    if (filters.salespersonId && filters.salespersonId !== 'all') {
      const repCustIds = new Set(Customers.getAll().filter(c => c.salespersonId === filters.salespersonId).map(c => c.id));
      history = history.filter(h => repCustIds.has(h.customerId));
    }

    const transitions = {};

    history.forEach(h => {
      if (!h.fromStage || h.fromStage === 'None') return;
      const key = `${h.fromStage} → ${h.toStage}`;
      if (!transitions[key]) {
        transitions[key] = {
          fromStage: h.fromStage,
          toStage: h.toStage,
          count: 0,
          records: []
        };
      }
      transitions[key].count++;
      transitions[key].records.push(h);
    });

    const resultList = Object.values(transitions);
    resultList.sort((a, b) => b.count - a.count);

    return {
      totalMovements: history.length,
      transitions: resultList
    };
  },

  /**
   * Calculate Sales Team Performance Report across all sales reps
   * @param {object} filters Universal filters
   */
  getTeamPerformanceReport(filters = {}) {
    let salespeople = Users.getSalespeople();

    if (filters.managerId && filters.managerId !== 'all') {
      salespeople = salespeople.filter(s => s.managerId === filters.managerId);
    }
    if (filters.salespersonId && filters.salespersonId !== 'all') {
      salespeople = salespeople.filter(s => s.id === filters.salespersonId);
    }

    const customers = this.filterCustomers(filters);
    const calls = StorageService.getData(CRM_STORAGE_KEYS.CALLS, []);
    const followups = StorageService.getData(CRM_STORAGE_KEYS.FOLLOWUPS, []);
    const activities = StorageService.getData(CRM_STORAGE_KEYS.ACTIVITIES, []);

    return salespeople.map(rep => {
      const repCustomers = customers.filter(c => c.salespersonId === rep.id);
      const repCalls = calls.filter(c => c.salespersonId === rep.id);
      const repFollowups = followups.filter(f => f.salespersonId === rep.id);
      const repActivities = activities.filter(a => a.user === rep.name);

      const assigned = repCustomers.length;
      const contacted = repCustomers.filter(c => c.stage === 'Contacted' || c.lastContacted).length;
      const interested = repCustomers.filter(c => c.stage === 'Interested').length;
      const prospects = repCustomers.filter(c => c.stage === 'Prospect').length;
      const pendingClosure = repCustomers.filter(c => c.stage === 'Pending Closure' || c.status === 'Pending Closure').length;
      const converted = repCustomers.filter(c => c.stage === 'Enrolled' || c.stage === 'Converted' || c.status === 'Enrolled' || c.status === 'Converted').length;
      const notInterested = repCustomers.filter(c => c.stage === 'Not Interested' || c.status === 'Not Interested').length;
      const lost = repCustomers.filter(c => c.stage === 'Lost' || c.status === 'Lost').length;
      const notConnected = repCustomers.filter(c => c.stage === 'Not Connected' || c.status === 'Not Connected').length;
      const completedFollowups = repFollowups.filter(f => f.status === 'Completed').length;

      const bookedFee = repCustomers.reduce((sum, c) => sum + (Number(c.totalFee) || 0), 0);
      const collectedFee = repCustomers.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);
      const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(1) : '0.0';

      return {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        managerName: rep.managerName || '—',
        avatar: rep.avatar,
        leadsAssigned: assigned,
        leadsContacted: contacted,
        callsMade: repCalls.length,
        interestedCount: interested,
        prospectsCount: prospects,
        pendingClosureCount: pendingClosure,
        enrolledCount: converted,
        convertedCount: converted,
        notConnectedCount: notConnected,
        followupsScheduled: repFollowups.length,
        followupsCompleted: completedFollowups,
        notInterestedCount: notInterested,
        lostCount: lost,
        bookedFee,
        collectedFee,
        totalActivities: repActivities.length,
        conversionRate: `${conversionRate}%`
      };
    });
  },

  /**
   * Get KPI summary numbers calculated dynamically from localStorage
   */
  getDashboardKPIs(user = null) {
    const currentUser = user || Auth.getCurrentUser();
    const customers = Customers.getScopedCustomers(currentUser);
    const followups = Followups.getAll(true);

    const todayStr = new Date().toISOString().split('T')[0];

    let totalLeads = customers.length;
    let newLeads = 0;
    let notConnected = 0;
    let contacted = 0;
    let interested = 0;
    let prospects = 0;
    let followupsInStage = 0;
    let negotiation = 0;
    let pendingClosure = 0;
    let converted = 0;
    let notInterested = 0;
    let lost = 0;

    let totalPlacementFees = 0;
    let totalCashCollected = 0;
    let totalPendingDues = 0;

    customers.forEach(c => {
      const stage = (c.stage || '').toLowerCase();
      if (stage === 'new lead' || stage === 'cold calling') newLeads++;
      else if (stage === 'not connected') notConnected++;
      else if (stage === 'contacted') contacted++;
      else if (stage === 'interested') interested++;
      else if (stage === 'prospect') prospects++;
      else if (stage === 'follow-up') followupsInStage++;
      else if (stage === 'negotiation') negotiation++;
      else if (stage === 'pending closure') pendingClosure++;
      else if (stage === 'enrolled' || stage === 'converted') converted++;
      else if (stage === 'not interested') notInterested++;
      else if (stage === 'lost') lost++;

      totalPlacementFees += Number(c.totalFee) || 0;
      totalCashCollected += Number(c.paidAmount) || 0;
      totalPendingDues += Number(c.pendingAmount) || 0;
    });

    const todayFollowups = followups.filter(f => f.date === todayStr && f.status === 'Pending').length;
    const overdueFollowups = followups.filter(f => f.date < todayStr && f.status === 'Pending').length;
    const completedFollowups = followups.filter(f => f.status === 'Completed').length;

    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;
    const collectionRate = totalPlacementFees > 0 ? ((totalCashCollected / totalPlacementFees) * 100).toFixed(1) : 0;

    // Overdue installments count
    let overdueInstallmentsCount = 0;
    customers.forEach(c => {
      if (c.paymentStatus !== 'Fully Paid' && Array.isArray(c.installments)) {
        c.installments.forEach(inst => {
          if ((inst.status === 'Pending' || inst.status === 'Overdue') && inst.dueDate && inst.dueDate < todayStr) {
            overdueInstallmentsCount++;
          }
        });
      }
    });

    return {
      totalCustomers: totalLeads,
      totalLeads,
      newLeads,
      contacted,
      interested,
      prospects,
      followupsInStage,
      negotiation,
      pendingClosure,
      enrolled: converted,
      converted,
      notConnected,
      notInterested,
      lost,
      todayFollowups,
      overdueFollowups,
      completedFollowups,
      conversionRate,
      totalPlacementFees,
      totalCashCollected,
      totalPendingDues,
      collectionRate,
      overdueInstallmentsCount
    };
  },

  /**
   * Get lead source distribution with universal filters
   * @param {object} filters Universal filters
   */
  getLeadSourceStats(filters = {}) {
    const customers = this.filterCustomers(filters);
    const sources = {};

    customers.forEach(c => {
      const src = c.source || 'Other';
      sources[src] = (sources[src] || 0) + 1;
    });

    return sources;
  }
};

window.Reports = Reports;
