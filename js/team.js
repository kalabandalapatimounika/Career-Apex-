/**
 * Career Apex CRM - Team Module
 * Team.getRoster(), Team.reassignLeads(), Team.updateTargets()
 */

const Team = {
  getRoster() {
    const users = StorageService.get(CRM_KEYS.USERS) || [];
    const counselors = users.filter(u => u.role === 'COUNSELOR');
    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    const targets = StorageService.get(CRM_KEYS.TARGETS) || {};

    return counselors.map(c => {
      const assigned = students.filter(s => s.counselor === c.name);
      const converted = assigned.filter(s => s.stage === 'Converted' || s.stage === 'Enrolled').length;
      const rate = assigned.length > 0 ? ((converted / assigned.length) * 100).toFixed(1) : '0.0';
      const revenue = assigned.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      const callsCount = (StorageService.get(CRM_KEYS.CALLS) || []).filter(cl => cl.counselor === c.name).length;
      const followupsCount = assigned.filter(s => s.nextFollowUp || s.nextFollowup).length;

      const targetObj = (targets.counselors || []).find(t => t.name === c.name) || { target: 300000 };
      const quotaPct = targetObj.target > 0 ? ((revenue / targetObj.target) * 100).toFixed(1) : '0.0';

      return {
        ...c,
        manager: c.manager || 'Rajesh Sharma',
        assignedCount: assigned.length,
        convertedCount: converted,
        conversionRate: rate,
        revenue,
        callsCount: callsCount || 1,
        followupsCount,
        monthlyTarget: targetObj.target,
        quotaPct
      };
    });
  },

  reassignLeads({ sourceCounselor, targetCounselor, count = 5, stageFilter = 'all' }) {
    if (!Auth.canAccess('bulk_reassign')) {
      Utils.showToast('Permission denied: Admin or Manager only', 'error');
      return false;
    }

    if (sourceCounselor === targetCounselor) {
      Utils.showToast('Source and destination counselors must be different', 'warning');
      return false;
    }

    let students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    let eligible = students.filter(s => s.counselor === sourceCounselor && (stageFilter === 'all' ? s.stage !== 'Converted' : s.stage === stageFilter));

    if (eligible.length === 0) {
      Utils.showToast(`No eligible leads found for ${sourceCounselor}`, 'warning');
      return false;
    }

    const reassignBatch = eligible.slice(0, count);
    const author = Auth.getSession()?.name || 'Manager';

    reassignBatch.forEach(s => {
      s.counselor = targetCounselor;
      if (!s.notes) s.notes = [];
      s.notes.unshift({
        id: 'NOTE-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        author,
        text: `Lead reassigned from ${sourceCounselor} to ${targetCounselor}`
      });
    });

    StorageService.set(CRM_KEYS.STUDENTS, students);
    Activities.log('Leads Reassigned', `Reassigned ${reassignBatch.length} leads from ${sourceCounselor} to ${targetCounselor}`);
    Utils.showToast(`Reassigned ${reassignBatch.length} leads to ${targetCounselor}`, 'success');

    return true;
  },

  updateTargets(targetsData) {
    if (!Auth.canAccess('edit_targets')) {
      Utils.showToast('Permission denied: Admin or Manager only', 'error');
      return false;
    }
    StorageService.set(CRM_KEYS.TARGETS, targetsData);
    Activities.log('Targets Updated', `Monthly revenue targets updated for ${targetsData.month || 'Current Month'}`);
    Utils.showToast('Revenue targets & milestones updated', 'success');
    return true;
  },

  openTargetModal(onSuccess = null) {
    const targets = StorageService.get(CRM_KEYS.TARGETS) || {};
    const counselors = (StorageService.get(CRM_KEYS.USERS) || []).filter(u => u.role === 'COUNSELOR');

    let modal = document.getElementById('modal-targets-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-targets-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Set / Update Employee Revenue Targets</h3>
            <span class="modal-subtitle">Company revenue targets &amp; 4-week milestones breakdown</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-targets-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-update-targets-dialog">
          <div class="modal-body">
            <div class="form-grid-2" style="margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label">Quota Month</label>
                <input type="text" id="target-dlg-month" class="form-control" value="${targets.month || 'October 2026'}">
              </div>
              <div class="form-group">
                <label class="form-label">Company Monthly Target (₹)</label>
                <input type="number" id="target-dlg-total" class="form-control" value="${targets.companyTarget || 1240000}" readonly style="background: #f1f5f9;">
              </div>
            </div>

            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 12px;">Counselor Individual Targets</h4>
            <div>
              ${counselors.map(c => {
                const cur = (targets.counselors || []).find(t => t.name === c.name) || { target: 300000 };
                return `
                  <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong>${c.name}</strong>
                      <div style="font-size: 11px; color: var(--text-muted);">${c.title || 'Counselor'}</div>
                    </div>
                    <div style="width: 180px;">
                      <input type="number" class="form-control counselor-target-item" data-counselor="${c.name}" value="${cur.target}" step="10000" min="50000">
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-targets-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Save Quotas</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-update-targets-dialog').onsubmit = (e) => {
      e.preventDefault();
      const month = document.getElementById('target-dlg-month').value;
      const items = [];
      document.querySelectorAll('.counselor-target-item').forEach(inp => {
        const name = inp.getAttribute('data-counselor');
        const val = Number(inp.value) || 300000;
        items.push({
          id: 'CNS-' + name.slice(0, 3).toUpperCase(),
          name,
          target: val,
          achieved: 15000,
          weeklyMilestones: [Math.round(val / 4), Math.round(val / 4), Math.round(val / 4), Math.round(val / 4)]
        });
      });

      const companySum = items.reduce((s, it) => s + it.target, 0);
      Team.updateTargets({
        month,
        companyTarget: companySum,
        achievedRevenue: 42000,
        remainingTarget: Math.max(0, companySum - 42000),
        realizationRate: ((42000 / companySum) * 100).toFixed(1),
        counselors: items
      });

      modal.classList.remove('open');
      if (typeof onSuccess === 'function') onSuccess();
      else if (typeof window.refreshPageData === 'function') window.refreshPageData();
    };

    modal.classList.add('open');
  },

  openReassignModal(onSuccess = null) {
    const counselors = (StorageService.get(CRM_KEYS.USERS) || []).filter(u => u.role === 'COUNSELOR');

    let modal = document.getElementById('modal-reassign-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-reassign-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Reassign Sales Leads</h3>
            <span class="modal-subtitle">Balance lead distribution among sales counselors</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-reassign-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-reassign-dialog">
          <div class="modal-body">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Source Counselor <span class="required">*</span></label>
                <select id="reassign-dlg-source" class="form-control" required>
                  <option value="">-- Choose Source --</option>
                  ${counselors.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Destination Counselor <span class="required">*</span></label>
                <select id="reassign-dlg-dest" class="form-control" required>
                  <option value="">-- Choose Destination --</option>
                  ${counselors.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Stage Filter</label>
                <select id="reassign-dlg-stage" class="form-control">
                  <option value="all">All Non-Converted Leads</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Cold Calling">Cold Calling</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Lead Quantity</label>
                <input type="number" id="reassign-dlg-count" class="form-control" value="5" min="1" max="50">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-reassign-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Transfer Leads</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-reassign-dialog').onsubmit = (e) => {
      e.preventDefault();
      const source = document.getElementById('reassign-dlg-source').value;
      const dest = document.getElementById('reassign-dlg-dest').value;
      const stage = document.getElementById('reassign-dlg-stage').value;
      const count = Number(document.getElementById('reassign-dlg-count').value);

      const ok = this.reassignLeads({ sourceCounselor: source, targetCounselor: dest, count, stageFilter: stage });
      if (ok) {
        modal.classList.remove('open');
        if (typeof onSuccess === 'function') onSuccess();
        else if (typeof window.refreshPageData === 'function') window.refreshPageData();
      }
    };

    modal.classList.add('open');
  },

  getEmployeeTargets() {
    return StorageService.get(CRM_KEYS.EMPLOYEE_TARGETS) || [];
  },

  updateEmployeeTarget(id, updates) {
    let targets = this.getEmployeeTargets();
    const idx = targets.findIndex(t => t.id === id || t.name === id);
    if (idx === -1) return false;

    targets[idx] = { ...targets[idx], ...updates };
    if (targets[idx].monthlyTarget > 0) {
      targets[idx].realizationPct = Number(((targets[idx].achieved / targets[idx].monthlyTarget) * 100).toFixed(1));
    }
    StorageService.set(CRM_KEYS.EMPLOYEE_TARGETS, targets);
    Activities.log('Target Updated', null, null, `Updated 4-week quotas for ${targets[idx].name}`);
    Utils.showToast(`Updated targets for ${targets[idx].name}`, 'success');
    return targets[idx];
  },

  openEmployeeTargetModal(employeeId, onSuccess = null) {
    const targets = this.getEmployeeTargets();
    const emp = targets.find(t => t.id === employeeId || t.name === employeeId);
    if (!emp) {
      Utils.showToast('Employee record not found', 'error');
      return;
    }

    let modal = document.getElementById('modal-employee-target-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-employee-target-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Update Target: ${emp.name}</h3>
            <span class="modal-subtitle">${emp.role} • ${emp.team}</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-employee-target-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-emp-target-dlg">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Monthly Target (₹) <span class="required">*</span></label>
              <input type="number" id="emp-monthly-target" class="form-control" value="${emp.monthlyTarget}" step="10000" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Week 1 Target (₹)</label>
                <input type="number" id="emp-w1-target" class="form-control" value="${emp.week1Quota}" step="5000">
              </div>
              <div class="form-group">
                <label class="form-label">Week 1 Achieved (₹)</label>
                <input type="number" id="emp-w1-achieved" class="form-control" value="${emp.week1Achieved || 0}" step="1000">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Week 2 Target (₹)</label>
                <input type="number" id="emp-w2-target" class="form-control" value="${emp.week2Quota}" step="5000">
              </div>
              <div class="form-group">
                <label class="form-label">Week 2 Achieved (₹)</label>
                <input type="number" id="emp-w2-achieved" class="form-control" value="${emp.week2Achieved || 0}" step="1000">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Week 3 Target (₹)</label>
                <input type="number" id="emp-w3-target" class="form-control" value="${emp.week3Quota}" step="5000">
              </div>
              <div class="form-group">
                <label class="form-label">Week 3 Achieved (₹)</label>
                <input type="number" id="emp-w3-achieved" class="form-control" value="${emp.week3Achieved || 0}" step="1000">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Week 4 Target (₹)</label>
                <input type="number" id="emp-w4-target" class="form-control" value="${emp.week4Quota}" step="5000">
              </div>
              <div class="form-group">
                <label class="form-label">Week 4 Achieved (₹)</label>
                <input type="number" id="emp-w4-achieved" class="form-control" value="${emp.week4Achieved || 0}" step="1000">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-employee-target-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Update Target Matrix</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-emp-target-dlg').onsubmit = (e) => {
      e.preventDefault();
      const monthly = Number(document.getElementById('emp-monthly-target').value) || 0;
      const w1q = Number(document.getElementById('emp-w1-target').value) || 0;
      const w1a = Number(document.getElementById('emp-w1-achieved').value) || 0;
      const w2q = Number(document.getElementById('emp-w2-target').value) || 0;
      const w2a = Number(document.getElementById('emp-w2-achieved').value) || 0;
      const w3q = Number(document.getElementById('emp-w3-target').value) || 0;
      const w3a = Number(document.getElementById('emp-w3-achieved').value) || 0;
      const w4q = Number(document.getElementById('emp-w4-target').value) || 0;
      const w4a = Number(document.getElementById('emp-w4-achieved').value) || 0;

      const totalAchieved = w1a + w2a + w3a + w4a;

      Team.updateEmployeeTarget(emp.id, {
        monthlyTarget: monthly,
        achieved: totalAchieved,
        week1Quota: w1q,
        week1Achieved: w1a,
        week2Quota: w2q,
        week2Achieved: w2a,
        week3Quota: w3q,
        week3Achieved: w3a,
        week4Quota: w4q,
        week4Achieved: w4a
      });

      modal.classList.remove('open');
      if (typeof onSuccess === 'function') onSuccess();
      else if (typeof window.refreshPageData === 'function') window.refreshPageData();
    };

    modal.classList.add('open');
  }
};

window.Team = Team;

