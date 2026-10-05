/**
 * Career Apex CRM - Pipeline Module
 * Pipeline.updateStage(), Pipeline.getStages(), Pipeline.getStageCounts()
 */

const Pipeline = {
  stages: [
    'Cold Calling', 'Not Connected', 'New Lead', 'Contacted',
    'Interested', 'Prospect', 'Follow-up', 'Negotiation',
    'Pending Closure', 'Enrolled', 'Not Interested', 'Lost'
  ],

  getStages() {
    return this.stages;
  },

  getStageCounts(customStudents = null) {
    const students = customStudents || Customers.getAll();
    const counts = { all: students.length, 'All Leads': students.length };
    this.stages.forEach(st => {
      counts[st] = students.filter(s => {
        if (s.stage === st) return true;
        if (st === 'Enrolled' && s.stage === 'Converted') return true;
        if (st === 'Converted' && s.stage === 'Enrolled') return true;
        return false;
      }).length;
    });
    counts['Converted'] = counts['Enrolled'];
    return counts;
  },

  updateStage(studentId, newStage, reason = '') {
    if (!reason || !reason.trim()) {
      Utils.showToast('Stage change reason is mandatory', 'warning');
      return false;
    }

    const student = Customers.getById(studentId);
    if (!student) return false;

    const oldStage = student.stage;
    const author = Auth.getSession()?.name || 'Staff';

    // Append to stage history
    const stageHistory = StorageService.get(CRM_KEYS.STAGE_HISTORY) || [];
    stageHistory.unshift({
      id: 'STG-' + Date.now(),
      studentId: student.id,
      fromStage: oldStage,
      toStage: newStage,
      reason: reason.trim(),
      counselor: author,
      timestamp: new Date().toISOString()
    });
    StorageService.set(CRM_KEYS.STAGE_HISTORY, stageHistory);

    // Update student
    Customers.update(studentId, {
      stage: newStage,
      lastContacted: new Date().toISOString().split('T')[0]
    });

    Activities.log('Stage Changed', `Moved from "${oldStage}" to "${newStage}". Reason: ${reason}`, student.id, student.name);
    Utils.showToast(`Candidate moved to "${newStage}"`, 'success');
    return true;
  },

  openStageChangeModal(studentId, onSuccess = null) {
    const student = Customers.getById(studentId);
    if (!student) return;

    let modal = document.getElementById('modal-stage-change-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-stage-change-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Move Pipeline Stage</h3>
            <span class="modal-subtitle">Document candidate qualification progression</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-stage-change-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-stage-change-dialog">
          <div class="modal-body">
            <div style="margin-bottom: 14px;">
              <span class="dossier-label">Candidate:</span>
              <h4 style="font-size: 16px; font-weight: 700;">${student.name} (${student.id})</h4>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">Current Stage: <span class="badge badge-purple">${student.stage}</span></p>
            </div>

            <div class="form-group">
              <label class="form-label">Select Target Stage <span class="required">*</span></label>
              <select id="stage-dialog-new" class="form-control" required>
                ${this.stages.map(st => `<option value="${st}" ${st === student.stage ? 'selected' : ''}>${st}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Mandatory Progression Reason <span class="required">*</span></label>
              <textarea id="stage-dialog-reason" class="form-control" rows="3" placeholder="Provide qualification notes, interview feedback, or closing justification..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-stage-change-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Confirm Stage Move</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-stage-change-dialog').onsubmit = (e) => {
      e.preventDefault();
      const newStage = document.getElementById('stage-dialog-new').value;
      const reason = document.getElementById('stage-dialog-reason').value;
      const ok = this.updateStage(studentId, newStage, reason);
      if (ok) {
        modal.classList.remove('open');
        if (typeof onSuccess === 'function') onSuccess();
        else if (typeof window.refreshPageData === 'function') window.refreshPageData();
      }
    };

    modal.classList.add('open');
  }
};

window.Pipeline = Pipeline;
