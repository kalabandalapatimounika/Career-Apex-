/**
 * SALES CRM - REVENUE TARGETS & 4-WEEK MILESTONE TRACKING MODULE
 * Allows Admin to configure monthly and 4-week revenue targets for every employee.
 * Calculates weekly and monthly realization progress from payment collections.
 */

const Targets = {
  /**
   * Retrieve all targets stored in the CRM
   */
  getAll() {
    return StorageService.getData(CRM_STORAGE_KEYS.TARGETS, []);
  },

  /**
   * Get current month in YYYY-MM format
   */
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  /**
   * Format currency for display (₹45,000)
   */
  formatCurrency(amount) {
    const num = Math.round(Number(amount) || 0);
    return '₹' + num.toLocaleString('en-IN');
  },

  /**
   * Calculate 4-week boundaries for a given month
   */
  getMonthWeeks(yearMonth = this.getCurrentMonth()) {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const today = new Date();
    const isThisMonth = today.getFullYear() === year && today.getMonth() === monthIndex;
    const currentDay = isThisMonth ? today.getDate() : 1;

    return [
      {
        weekNumber: 1,
        label: 'Week 1',
        dateRange: `Day 1 – 7`,
        startDay: 1,
        endDay: 7,
        isCurrentWeek: isThisMonth && currentDay >= 1 && currentDay <= 7
      },
      {
        weekNumber: 2,
        label: 'Week 2',
        dateRange: `Day 8 – 14`,
        startDay: 8,
        endDay: 14,
        isCurrentWeek: isThisMonth && currentDay >= 8 && currentDay <= 14
      },
      {
        weekNumber: 3,
        label: 'Week 3',
        dateRange: `Day 15 – 21`,
        startDay: 15,
        endDay: 21,
        isCurrentWeek: isThisMonth && currentDay >= 15 && currentDay <= 21
      },
      {
        weekNumber: 4,
        label: 'Week 4',
        dateRange: `Day 22 – ${daysInMonth}`,
        startDay: 22,
        endDay: daysInMonth,
        isCurrentWeek: isThisMonth && currentDay >= 22
      }
    ];
  },

  /**
   * Get target for a specific user and month (with smart fallback if not yet set)
   */
  getTargetForUser(userId, month = this.getCurrentMonth()) {
    if (!userId) return null;
    const cleanId = String(userId);
    const all = this.getAll();
    const existing = all.find(t => String(t.userId) === cleanId && t.month === month);

    if (existing) {
      return existing;
    }

    // Default target fallback if Admin hasn't set one yet
    const user = Users.getById(userId) || Users.getAll().find(u => String(u.id) === cleanId);
    const isManager = user && user.role === 'manager';
    const defaultMonthly = isManager ? 800000 : 200000;
    const weeklyEqual = Math.round(defaultMonthly / 4);

    return {
      id: `TGT-${cleanId}-${month}`,
      userId: user ? user.id : userId,
      userName: user ? user.name : 'Team Member',
      role: user ? user.role : 'sales',
      managerId: user ? user.managerId : null,
      month: month,
      monthlyRevenueTarget: defaultMonthly,
      week1Target: weeklyEqual,
      week2Target: weeklyEqual,
      week3Target: weeklyEqual,
      week4Target: defaultMonthly - (weeklyEqual * 3),
      isDefault: true,
      updatedAt: null
    };
  },

  /**
   * Save / Update target for an employee
   */
  saveTarget(data) {
    if (!data.userId) {
      return { success: false, message: 'Employee ID is required.' };
    }

    const month = data.month || this.getCurrentMonth();
    const cleanUserId = String(data.userId);
    const user = Users.getById(data.userId) || Users.getAll().find(u => String(u.id) === cleanUserId);

    if (!user) {
      return { success: false, message: 'Employee record not found.' };
    }

    const monthlyTarget = Math.max(0, Math.round(Number(data.monthlyRevenueTarget) || 0));

    // Weekly targets division
    let w1 = Number(data.week1Target);
    let w2 = Number(data.week2Target);
    let w3 = Number(data.week3Target);
    let w4 = Number(data.week4Target);

    if (isNaN(w1) || isNaN(w2) || isNaN(w3) || isNaN(w4) || data.autoDivide) {
      const q = Math.round(monthlyTarget / 4);
      w1 = q;
      w2 = q;
      w3 = q;
      w4 = monthlyTarget - (q * 3);
    } else {
      w1 = Math.max(0, Math.round(w1));
      w2 = Math.max(0, Math.round(w2));
      w3 = Math.max(0, Math.round(w3));
      w4 = Math.max(0, Math.round(w4));
    }

    const currentUser = (window.Auth && Auth.getCurrentUser()) || { name: 'Admin', role: 'admin' };
    const now = new Date().toISOString();

    const targetRecord = {
      id: `TGT-${user.id}-${month}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      managerId: user.managerId || null,
      managerName: user.managerName || null,
      month: month,
      monthlyRevenueTarget: monthlyTarget,
      week1Target: w1,
      week2Target: w2,
      week3Target: w3,
      week4Target: w4,
      isDefault: false,
      updatedBy: currentUser.name,
      updatedAt: now
    };

    const allTargets = this.getAll();
    const existingIndex = allTargets.findIndex(t => String(t.userId) === String(user.id) && t.month === month);

    if (existingIndex >= 0) {
      allTargets[existingIndex] = targetRecord;
    } else {
      allTargets.push(targetRecord);
    }

    StorageService.saveData(CRM_STORAGE_KEYS.TARGETS, allTargets);

    if (window.Activities) {
      Activities.log({
        action: 'Revenue Target Updated',
        description: `Admin updated revenue target for ${user.name} for ${month}: Monthly ${this.formatCurrency(monthlyTarget)} (W1: ${this.formatCurrency(w1)}, W2: ${this.formatCurrency(w2)}, W3: ${this.formatCurrency(w3)}, W4: ${this.formatCurrency(w4)}).`
      });
    }

    // Dispatch global event for listening dashboards
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crmTargetsUpdated', { detail: targetRecord }));
    }

    return { success: true, target: targetRecord };
  },

  /**
   * Compute comprehensive revenue progress against targets for an individual user
   */
  getUserRevenueProgress(userId, month = this.getCurrentMonth()) {
    const target = this.getTargetForUser(userId, month);
    const cleanUserId = String(userId);
    const isManager = target.role === 'manager';
    const weeksMeta = this.getMonthWeeks(month);

    // Retrieve all payment collections
    const allPayments = (window.Payments && Payments.getAll()) || [];
    const repPayments = allPayments.filter(p => {
      const isMatch = String(p.salespersonId) === cleanUserId || String(p.userId) === cleanUserId || (isManager && String(p.managerId) === cleanUserId);
      if (!isMatch) return false;
      const pDate = p.paymentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      return pDate && pDate.startsWith(month);
    });

    // Also get all assigned customers to check candidate contracted fees & stage
    const allCustomers = (window.Customers && Customers.getAll()) || [];
    const repCustomers = allCustomers.filter(c => String(c.salespersonId) === cleanUserId || (isManager && String(c.managerId) === cleanUserId));

    // Track weekly collections
    const weeklyData = [
      { weekNumber: 1, target: target.week1Target, achieved: 0, paymentCount: 0 },
      { weekNumber: 2, target: target.week2Target, achieved: 0, paymentCount: 0 },
      { weekNumber: 3, target: target.week3Target, achieved: 0, paymentCount: 0 },
      { weekNumber: 4, target: target.week4Target, achieved: 0, paymentCount: 0 }
    ];

    repPayments.forEach(p => {
      const pDate = p.paymentDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      const day = parseInt(pDate.split('-')[2], 10);
      const amt = Number(p.amount) || 0;

      if (day >= 1 && day <= 7) {
        weeklyData[0].achieved += amt;
        weeklyData[0].paymentCount++;
      } else if (day >= 8 && day <= 14) {
        weeklyData[1].achieved += amt;
        weeklyData[1].paymentCount++;
      } else if (day >= 15 && day <= 21) {
        weeklyData[2].achieved += amt;
        weeklyData[2].paymentCount++;
      } else {
        weeklyData[3].achieved += amt;
        weeklyData[3].paymentCount++;
      }
    });

    // If payments in demo/seed data were seeded under customer's installments instead of payments ledger,
    // also aggregate paid amounts from customer installments for complete coverage
    if (repPayments.length === 0) {
      repCustomers.forEach(c => {
        if (Array.isArray(c.installments)) {
          c.installments.forEach(inst => {
            if (inst.status === 'Paid' && inst.paidDate && inst.paidDate.startsWith(month)) {
              const day = parseInt(inst.paidDate.split('-')[2], 10);
              const amt = Number(inst.paidAmount || inst.amount) || 0;
              if (day >= 1 && day <= 7) {
                weeklyData[0].achieved += amt;
                weeklyData[0].paymentCount++;
              } else if (day >= 8 && day <= 14) {
                weeklyData[1].achieved += amt;
                weeklyData[1].paymentCount++;
              } else if (day >= 15 && day <= 21) {
                weeklyData[2].achieved += amt;
                weeklyData[2].paymentCount++;
              } else {
                weeklyData[3].achieved += amt;
                weeklyData[3].paymentCount++;
              }
            }
          });
        }
      });
    }

    // Format week cards with percentages and statuses
    const weeks = weeklyData.map((w, index) => {
      const meta = weeksMeta[index];
      const percent = w.target > 0 ? Number(((w.achieved / w.target) * 100).toFixed(1)) : 0;
      const remaining = Math.max(0, w.target - w.achieved);

      let status = 'Pending';
      let statusClass = 'badge-stage-follow-up';
      if (percent >= 100) {
        status = 'Achieved';
        statusClass = 'badge-stage-enrolled';
      } else if (percent >= 70) {
        status = 'On Track';
        statusClass = 'badge-stage-interested';
      } else if (percent >= 30) {
        status = 'In Progress';
        statusClass = 'badge-stage-prospect';
      } else if (meta.isCurrentWeek) {
        status = 'Active';
        statusClass = 'badge-stage-contacted';
      }

      return {
        ...w,
        ...meta,
        percent,
        remaining,
        status,
        statusClass
      };
    });

    const monthlyAchieved = weeks.reduce((sum, w) => sum + w.achieved, 0);
    const monthlyTarget = target.monthlyRevenueTarget;
    const monthlyPercent = monthlyTarget > 0 ? Number(((monthlyAchieved / monthlyTarget) * 100).toFixed(1)) : 0;
    const monthlyRemaining = Math.max(0, monthlyTarget - monthlyAchieved);

    let monthlyStatus = 'Pending';
    let monthlyStatusClass = 'badge-stage-follow-up';
    if (monthlyPercent >= 100) {
      monthlyStatus = 'Target Achieved';
      monthlyStatusClass = 'badge-stage-enrolled';
    } else if (monthlyPercent >= 75) {
      monthlyStatus = 'On Track';
      monthlyStatusClass = 'badge-stage-interested';
    } else if (monthlyPercent >= 40) {
      monthlyStatus = 'In Progress';
      monthlyStatusClass = 'badge-stage-prospect';
    } else {
      monthlyStatus = 'Needs Focus';
      monthlyStatusClass = 'badge-stage-not-interested';
    }

    return {
      userId,
      userName: target.userName,
      role: target.role,
      month,
      monthlyTarget,
      monthlyAchieved,
      monthlyPercent,
      monthlyRemaining,
      monthlyStatus,
      monthlyStatusClass,
      weeks,
      totalPaymentsRecorded: repPayments.length,
      assignedLeadCount: repCustomers.length
    };
  },

  /**
   * Aggregate revenue progress across a sales team or all salespeople
   */
  getTeamRevenueProgress(managerId = null, month = this.getCurrentMonth()) {
    const reps = Users.getSalespeople(managerId);
    const repProgressList = reps.map(rep => this.getUserRevenueProgress(rep.id, month));

    const totalMonthlyTarget = repProgressList.reduce((s, p) => s + p.monthlyTarget, 0);
    const totalMonthlyAchieved = repProgressList.reduce((s, p) => s + p.monthlyAchieved, 0);
    const teamPercent = totalMonthlyTarget > 0 ? Number(((totalMonthlyAchieved / totalMonthlyTarget) * 100).toFixed(1)) : 0;
    const teamRemaining = Math.max(0, totalMonthlyTarget - totalMonthlyAchieved);

    const weeksMeta = this.getMonthWeeks(month);
    const teamWeeks = [0, 1, 2, 3].map(wIndex => {
      const meta = weeksMeta[wIndex];
      const weekTarget = repProgressList.reduce((s, p) => s + p.weeks[wIndex].target, 0);
      const weekAchieved = repProgressList.reduce((s, p) => s + p.weeks[wIndex].achieved, 0);
      const percent = weekTarget > 0 ? Number(((weekAchieved / weekTarget) * 100).toFixed(1)) : 0;
      const remaining = Math.max(0, weekTarget - weekAchieved);

      let status = percent >= 100 ? 'Achieved' : (percent >= 70 ? 'On Track' : (percent >= 30 ? 'In Progress' : 'Pending'));
      let statusClass = percent >= 100 ? 'badge-stage-enrolled' : (percent >= 70 ? 'badge-stage-interested' : 'badge-stage-prospect');

      return {
        ...meta,
        target: weekTarget,
        achieved: weekAchieved,
        percent,
        remaining,
        status,
        statusClass
      };
    });

    return {
      managerId,
      month,
      repsCount: reps.length,
      totalMonthlyTarget,
      totalMonthlyAchieved,
      teamPercent,
      teamRemaining,
      weeks: teamWeeks,
      reps: repProgressList
    };
  },

  /**
   * Aggregate company-wide revenue progress
   */
  getCompanyRevenueProgress(month = this.getCurrentMonth()) {
    return this.getTeamRevenueProgress(null, month);
  },

  /**
   * Get progress for all active employees (sales reps and managers)
   */
  getAllEmployeesProgress(month = this.getCurrentMonth()) {
    const allUsers = (window.Users && Users.getAll()) || [];
    const employees = allUsers.filter(u => u.status === 'Active' && (u.role === 'sales' || u.role === 'manager'));
    return employees.map(emp => this.getUserRevenueProgress(emp.id, month));
  },

  /**
   * Modal dialog allowing Admin to update targets for any employee
   */
  openUpdateModal(preselectedUserId = null, onSaveCallback = null) {
    const existingModal = document.getElementById('target-update-modal');
    if (existingModal) existingModal.remove();

    const allUsers = Users.getAll().filter(u => u.status === 'Active' && (u.role === 'sales' || u.role === 'manager'));
    const defaultUserId = preselectedUserId || (allUsers[0] ? allUsers[0].id : null);
    const currentMonth = this.getCurrentMonth();

    const modalHtml = `
      <div class="modal show" id="target-update-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 9999; padding: 1rem; backdrop-filter: blur(4px);">
        <div class="modal-dialog" style="max-width: 580px; width: 100%; background: #ffffff; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); overflow: hidden; animation: modalSlideIn 0.2s ease-out;">
          <div class="modal-header" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.4); display: flex; align-items: center; justify-content: center; color: #60a5fa; font-size: 1.1rem;">
                <i class="fa-solid fa-bullseye"></i>
              </div>
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: #ffffff;">Set & Update Revenue Targets</h3>
                <span style="font-size: 0.75rem; color: #94a3b8;">Admin Configuration: Monthly Target divided into 4 Weekly Milestones</span>
              </div>
            </div>
            <button type="button" class="btn-close" id="btn-close-target-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body" style="padding: 1.5rem; max-height: calc(85vh - 120px); overflow-y: auto;">
            <!-- Select Employee & Month -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.8rem; color: var(--slate-700);">
                  Select Employee <span class="required">*</span>
                </label>
                <select class="form-select" id="tgt-modal-user" style="font-weight: 600;">
                  ${allUsers.map(u => `
                    <option value="${u.id}" ${String(u.id) === String(defaultUserId) ? 'selected' : ''}>
                      ${Utils.escapeHtml(u.name)} (${u.role.toUpperCase()})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.8rem; color: var(--slate-700);">
                  Target Month <span class="required">*</span>
                </label>
                <input type="month" class="form-control" id="tgt-modal-month" value="${currentMonth}" style="font-weight: 600;">
              </div>
            </div>

            <!-- Monthly Revenue Target -->
            <div style="background: var(--slate-50); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.25rem;">
              <label class="form-label" style="font-weight: 800; font-size: 0.9rem; color: var(--slate-900); display: flex; align-items: center; justify-content: space-between;">
                <span>Total Monthly Revenue Target (₹) <span class="required">*</span></span>
                <span id="tgt-modal-monthly-formatted" style="color: var(--primary-600); font-weight: 700; font-size: 0.85rem;">₹2,00,000</span>
              </label>
              <div style="position: relative;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--slate-400); font-size: 1.1rem;">₹</span>
                <input type="number" step="1000" min="0" class="form-control" id="tgt-modal-monthly-input" placeholder="200000" style="padding-left: 2.25rem; font-size: 1.15rem; font-weight: 700; color: var(--slate-900);">
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                <label style="font-size: 0.825rem; color: var(--slate-700); display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                  <input type="checkbox" id="tgt-modal-auto-divide" checked>
                  <span style="font-weight: 600;">Automatically divide equally across 4 weeks (25% each)</span>
                </label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-quick-100k" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">1L</button>
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-quick-200k" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">2L</button>
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-quick-300k" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">3L</button>
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-quick-500k" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">5L</button>
                </div>
              </div>
            </div>

            <!-- 4-Week Milestone Breakdown Grid -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--slate-600); text-transform: uppercase; letter-spacing: 0.04em;">
                  <i class="fa-solid fa-calendar-week" style="color: var(--primary-600);"></i> 4-Week Target Division
                </span>
                <span id="tgt-modal-sum-check" style="font-size: 0.78rem; font-weight: 600; color: var(--success-solid);">
                  Weekly Sum Matches Monthly Target ✓
                </span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <!-- Week 1 -->
                <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.75rem 1rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                    <span style="font-weight: 700; font-size: 0.825rem; color: var(--slate-900);">Week 1</span>
                    <span style="font-size: 0.72rem; color: var(--slate-500); background: var(--slate-100); padding: 0.1rem 0.4rem; border-radius: 4px;">Day 1 – 7</span>
                  </div>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--slate-400); font-size: 0.85rem;">₹</span>
                    <input type="number" min="0" step="1000" class="form-control tgt-week-input" id="tgt-modal-w1" style="padding-left: 1.75rem; font-weight: 700; font-size: 0.95rem;">
                  </div>
                </div>

                <!-- Week 2 -->
                <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.75rem 1rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                    <span style="font-weight: 700; font-size: 0.825rem; color: var(--slate-900);">Week 2</span>
                    <span style="font-size: 0.72rem; color: var(--slate-500); background: var(--slate-100); padding: 0.1rem 0.4rem; border-radius: 4px;">Day 8 – 14</span>
                  </div>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--slate-400); font-size: 0.85rem;">₹</span>
                    <input type="number" min="0" step="1000" class="form-control tgt-week-input" id="tgt-modal-w2" style="padding-left: 1.75rem; font-weight: 700; font-size: 0.95rem;">
                  </div>
                </div>

                <!-- Week 3 -->
                <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.75rem 1rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                    <span style="font-weight: 700; font-size: 0.825rem; color: var(--slate-900);">Week 3</span>
                    <span style="font-size: 0.72rem; color: var(--slate-500); background: var(--slate-100); padding: 0.1rem 0.4rem; border-radius: 4px;">Day 15 – 21</span>
                  </div>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--slate-400); font-size: 0.85rem;">₹</span>
                    <input type="number" min="0" step="1000" class="form-control tgt-week-input" id="tgt-modal-w3" style="padding-left: 1.75rem; font-weight: 700; font-size: 0.95rem;">
                  </div>
                </div>

                <!-- Week 4 -->
                <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.75rem 1rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
                    <span style="font-weight: 700; font-size: 0.825rem; color: var(--slate-900);">Week 4</span>
                    <span style="font-size: 0.72rem; color: var(--slate-500); background: var(--slate-100); padding: 0.1rem 0.4rem; border-radius: 4px;">Day 22 – End</span>
                  </div>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--slate-400); font-size: 0.85rem;">₹</span>
                    <input type="number" min="0" step="1000" class="form-control tgt-week-input" id="tgt-modal-w4" style="padding-left: 1.75rem; font-weight: 700; font-size: 0.95rem;">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding: 1rem 1.5rem; background: var(--slate-50); border-top: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-target-modal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" id="btn-save-target-modal">
              <i class="fa-solid fa-floppy-disk"></i> Save & Apply Targets
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const userSelect = document.getElementById('tgt-modal-user');
    const monthInput = document.getElementById('tgt-modal-month');
    const monthlyInput = document.getElementById('tgt-modal-monthly-input');
    const monthlyFormatted = document.getElementById('tgt-modal-monthly-formatted');
    const autoDivideChk = document.getElementById('tgt-modal-auto-divide');
    const sumCheck = document.getElementById('tgt-modal-sum-check');
    const w1Input = document.getElementById('tgt-modal-w1');
    const w2Input = document.getElementById('tgt-modal-w2');
    const w3Input = document.getElementById('tgt-modal-w3');
    const w4Input = document.getElementById('tgt-modal-w4');

    const loadTargetForSelectedUser = () => {
      const uid = userSelect.value;
      const m = monthInput.value || Targets.getCurrentMonth();
      const tgt = Targets.getTargetForUser(uid, m);

      monthlyInput.value = tgt.monthlyRevenueTarget;
      monthlyFormatted.textContent = Targets.formatCurrency(tgt.monthlyRevenueTarget);
      w1Input.value = tgt.week1Target;
      w2Input.value = tgt.week2Target;
      w3Input.value = tgt.week3Target;
      w4Input.value = tgt.week4Target;
      updateSumCheck();
    };

    const divideWeeksEqually = () => {
      const total = Number(monthlyInput.value) || 0;
      monthlyFormatted.textContent = Targets.formatCurrency(total);
      if (autoDivideChk.checked) {
        const q = Math.round(total / 4);
        w1Input.value = q;
        w2Input.value = q;
        w3Input.value = q;
        w4Input.value = total - (q * 3);
      }
      updateSumCheck();
    };

    const updateSumCheck = () => {
      const total = Number(monthlyInput.value) || 0;
      const sum = (Number(w1Input.value) || 0) + (Number(w2Input.value) || 0) + (Number(w3Input.value) || 0) + (Number(w4Input.value) || 0);

      if (sum === total) {
        sumCheck.textContent = `Weekly Sum: ${Targets.formatCurrency(sum)} (Matches 100% ✓)`;
        sumCheck.style.color = 'var(--success-solid)';
      } else {
        const diff = total - sum;
        const diffText = diff > 0 ? `+${Targets.formatCurrency(diff)} remaining` : `${Targets.formatCurrency(Math.abs(diff))} over`;
        sumCheck.textContent = `Weekly Sum: ${Targets.formatCurrency(sum)} / ${Targets.formatCurrency(total)} (${diffText})`;
        sumCheck.style.color = 'var(--warning-solid)';
      }
    };

    // Event listeners
    userSelect.addEventListener('change', loadTargetForSelectedUser);
    monthInput.addEventListener('change', loadTargetForSelectedUser);

    monthlyInput.addEventListener('input', divideWeeksEqually);
    autoDivideChk.addEventListener('change', () => {
      if (autoDivideChk.checked) divideWeeksEqually();
    });

    [w1Input, w2Input, w3Input, w4Input].forEach(inp => {
      inp.addEventListener('input', () => {
        autoDivideChk.checked = false;
        updateSumCheck();
      });
    });

    // Quick set buttons
    document.getElementById('btn-quick-100k').addEventListener('click', () => { monthlyInput.value = 100000; divideWeeksEqually(); });
    document.getElementById('btn-quick-200k').addEventListener('click', () => { monthlyInput.value = 200000; divideWeeksEqually(); });
    document.getElementById('btn-quick-300k').addEventListener('click', () => { monthlyInput.value = 300000; divideWeeksEqually(); });
    document.getElementById('btn-quick-500k').addEventListener('click', () => { monthlyInput.value = 500000; divideWeeksEqually(); });

    // Close logic
    const closeModal = () => {
      const modal = document.getElementById('target-update-modal');
      if (modal) modal.remove();
    };

    document.getElementById('btn-close-target-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-target-modal').addEventListener('click', closeModal);

    // Save logic
    document.getElementById('btn-save-target-modal').addEventListener('click', () => {
      const uid = userSelect.value;
      const m = monthInput.value || Targets.getCurrentMonth();
      const monthly = Number(monthlyInput.value) || 0;
      const w1 = Number(w1Input.value) || 0;
      const w2 = Number(w2Input.value) || 0;
      const w3 = Number(w3Input.value) || 0;
      const w4 = Number(w4Input.value) || 0;

      if (monthly <= 0) {
        if (window.Toast) Toast.error('Please enter a valid monthly revenue target.');
        return;
      }

      const res = Targets.saveTarget({
        userId: uid,
        month: m,
        monthlyRevenueTarget: monthly,
        week1Target: w1,
        week2Target: w2,
        week3Target: w3,
        week4Target: w4,
        autoDivide: autoDivideChk.checked
      });

      if (res.success) {
        if (window.Toast) {
          Toast.success(`Revenue target updated for ${res.target.userName}: ${Targets.formatCurrency(monthly)} / month`);
        }
        closeModal();
        if (typeof onSaveCallback === 'function') {
          onSaveCallback(res.target);
        }
      } else {
        if (window.Toast) Toast.error(res.message || 'Failed to save target.');
      }
    });

    // Initial load
    loadTargetForSelectedUser();
  }
};

window.Targets = Targets;
