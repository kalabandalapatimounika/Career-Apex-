/**
 * SALES CRM - PIPELINE MODULE
 * Kanban board stage transitions, stage change history, drag-and-drop, and stage modal
 */

const Pipeline = {
  STAGES: [
    'Cold Calling',
    'Not Connected',
    'New Lead',
    'Contacted',
    'Interested',
    'Prospect',
    'Follow-up',
    'Negotiation',
    'Pending Closure',
    'Enrolled',
    'Not Interested',
    'Lost'
  ],

  getStages() {
    const settings = StorageService.getData(CRM_STORAGE_KEYS.SETTINGS, {});
    let stages = settings.leadStages || this.STAGES;
    // Map legacy 'Converted' to 'Enrolled'
    stages = stages.map(s => s === 'Converted' ? 'Enrolled' : s);

    if (!stages.includes('Cold Calling')) {
      stages = ['Cold Calling', ...stages];
    }
    if (!stages.includes('Not Connected')) {
      const coldIdx = stages.indexOf('Cold Calling');
      if (coldIdx !== -1) {
        stages.splice(coldIdx + 1, 0, 'Not Connected');
      } else {
        stages.unshift('Not Connected');
      }
    }
    if (!stages.includes('Pending Closure')) {
      const enrollIdx = stages.indexOf('Enrolled');
      if (enrollIdx !== -1) {
        stages.splice(enrollIdx, 0, 'Pending Closure');
      } else {
        stages.push('Pending Closure');
      }
    }

    if (settings.leadStages) {
      settings.leadStages = stages;
      StorageService.saveData(CRM_STORAGE_KEYS.SETTINGS, settings);
    }
    return stages;
  },

  /**
   * Execute stage change with history recording and activity logging
   */
  changeStage(customerId, toStage, reason = '', estimatedRevenue = null) {
    const customer = Customers.getById(customerId);
    if (!customer) {
      return { success: false, message: 'Customer not found.' };
    }

    const fromStage = customer.stage;
    const isStageSame = fromStage === toStage;
    const isEstRevUpdating = toStage === 'Pending Closure' && estimatedRevenue !== null;

    if (isStageSame && !isEstRevUpdating) {
      return { success: true, customer }; // No change
    }

    const currentUser = Auth.getCurrentUser();
    const changedByName = currentUser ? currentUser.name : 'System';
    const now = new Date().toISOString();

    // Map stage to appropriate status
    let newStatus = 'Active';
    if (toStage === 'Enrolled' || toStage === 'Converted') newStatus = 'Enrolled';
    else if (toStage === 'Pending Closure') newStatus = 'Pending Closure';
    else if (toStage === 'Not Connected') newStatus = 'Not Connected';
    else if (toStage === 'Lost') newStatus = 'Lost';
    else if (toStage === 'Not Interested') newStatus = 'Not Interested';

    const updates = {
      stage: toStage,
      status: newStatus
    };

    if (toStage === 'Pending Closure') {
      const revNum = estimatedRevenue !== null && estimatedRevenue !== undefined && estimatedRevenue !== ''
        ? Number(estimatedRevenue)
        : (customer.estimatedRevenue || customer.totalFee || 45000);
      updates.estimatedRevenue = revNum;
    }

    // 1. Create stage history record
    const historyId = StorageService.generateId('CRM-STAGE');
    const historyRecord = {
      id: historyId,
      customerId: customer.id,
      customerName: customer.name,
      fromStage: fromStage,
      toStage: toStage,
      changedBy: changedByName,
      changedAt: now,
      reason: reason ? reason.trim() : 'Manual stage transition',
      estimatedRevenue: updates.estimatedRevenue || customer.estimatedRevenue || null
    };

    const historyList = StorageService.getData(CRM_STORAGE_KEYS.STAGE_HISTORY, []);
    historyList.unshift(historyRecord);
    StorageService.saveData(CRM_STORAGE_KEYS.STAGE_HISTORY, historyList);

    // 2. Update customer record
    const updateRes = Customers.update(customerId, updates);
    if (!updateRes.success) return updateRes;

    // 3. Log activity
    const estRevText = updates.estimatedRevenue
      ? ` [Estimated Revenue: ₹${Number(updates.estimatedRevenue).toLocaleString('en-IN')}]`
      : '';
    Activities.log({
      action: 'Stage Changed',
      customerId: customer.id,
      description: `Stage changed for ${customer.name} from "${fromStage}" to "${toStage}"${estRevText}. Reason: ${historyRecord.reason}`
    });

    Toast.success(`Stage updated to ${toStage} for ${customer.name}.`);
    return { success: true, customer: updateRes.customer };
  },

  /**
   * Get stage transition history for a specific customer
   */
  getStageHistory(customerId) {
    if (!customerId) return [];
    const list = StorageService.getData(CRM_STORAGE_KEYS.STAGE_HISTORY, []);
    return list.filter(h => h.customerId === customerId);
  },

  /**
   * Open Stage Change Modal with dynamic Estimated Revenue input for Pending Closure
   */
  openStageModal(customerId, preselectedNewStage = null, onSaved = () => {}) {
    const customer = Customers.getById(customerId);
    if (!customer) {
      Toast.error('Lead record not found');
      return;
    }

    let modal = document.getElementById('stage-change-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'stage-change-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fa-solid fa-arrows-split-up-and-left" style="color: var(--primary-600); margin-right: 0.5rem;"></i>Change Lead Stage</h3>
            <button class="modal-close-btn" id="stage-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label" style="font-weight: 600;">Lead</label>
              <input type="text" class="form-control" id="stage-modal-cust-name" disabled style="background: var(--slate-100); font-weight: 700;">
            </div>
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label" style="font-weight: 600;">Current Stage</label>
              <input type="text" class="form-control" id="stage-modal-current-stage" disabled style="background: var(--slate-100);">
            </div>
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label" style="font-weight: 600;">New Stage <span class="required">*</span></label>
              <select class="form-select" id="stage-modal-new-stage"></select>
            </div>

            <!-- Dynamic Estimated Revenue Field for Pending Closure -->
            <div class="form-group" id="stage-modal-est-rev-group" style="display: none; margin-bottom: 0.85rem; background: #fefce8; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid #fef08a;">
              <label class="form-label" style="font-weight: 700; color: #854d0e; display: flex; align-items: center; justify-content: space-between;">
                <span><i class="fa-solid fa-indian-rupee-sign" style="margin-right: 0.25rem;"></i> Estimated Revenue</span>
                <span class="required" style="font-size: 0.75rem;">Required for Pending Closure</span>
              </label>
              <div style="position: relative;">
                <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); font-weight: 700; color: #b45309;">₹</span>
                <input type="number" min="0" step="500" class="form-control" id="stage-modal-est-revenue" placeholder="e.g. 45000" style="padding-left: 2rem; font-weight: 700; background: #fff;">
              </div>
              <small style="font-size: 0.72rem; color: #92400e; margin-top: 0.35rem; display: block;">
                Enter projected enrollment revenue expected upon final closure.
              </small>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Reason / Transition Notes <span class="required">*</span></label>
              <textarea class="form-control" id="stage-modal-reason" rows="2" placeholder="Explain why the lead stage is being updated..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="stage-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="stage-modal-save">Update Stage</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const nameInput = document.getElementById('stage-modal-cust-name');
    const currentInput = document.getElementById('stage-modal-current-stage');
    const newSelect = document.getElementById('stage-modal-new-stage');
    const estRevGroup = document.getElementById('stage-modal-est-rev-group');
    const estRevInput = document.getElementById('stage-modal-est-revenue');
    const reasonInput = document.getElementById('stage-modal-reason');
    const saveBtn = document.getElementById('stage-modal-save');
    const cancelBtn = document.getElementById('stage-modal-cancel');
    const closeBtn = document.getElementById('stage-modal-close');

    nameInput.value = `${customer.name} (${customer.id})`;
    currentInput.value = customer.stage;
    reasonInput.value = '';

    // Populate stage options
    const targetStage = preselectedNewStage || customer.stage;
    newSelect.innerHTML = this.getStages()
      .map(stage => `<option value="${stage}" ${stage === targetStage ? 'selected' : ''}>${stage}</option>`)
      .join('');

    const toggleEstRevenue = () => {
      if (newSelect.value === 'Pending Closure') {
        estRevGroup.style.display = 'block';
        if (!estRevInput.value) {
          estRevInput.value = customer.estimatedRevenue || customer.totalFee || 45000;
        }
      } else {
        estRevGroup.style.display = 'none';
      }
    };

    newSelect.onchange = toggleEstRevenue;
    toggleEstRevenue();

    const hide = () => modal.classList.remove('show');

    const handleSave = () => {
      const selectedStage = newSelect.value;
      const reason = reasonInput.value.trim();

      if (!reason) {
        Validation.setError(reasonInput, 'Please provide a reason for the stage transition.');
        return;
      }
      Validation.clearError(reasonInput);

      let estRev = null;
      if (selectedStage === 'Pending Closure') {
        estRev = Number(estRevInput.value);
        if (isNaN(estRev) || estRev <= 0) {
          Validation.setError(estRevInput, 'Please enter a valid estimated revenue amount.');
          return;
        }
        Validation.clearError(estRevInput);
      }

      hide();
      const res = this.changeStage(customerId, selectedStage, reason, estRev);
      if (res.success && typeof onSaved === 'function') {
        onSaved(res.customer);
      }
      cleanup();
    };

    const handleCancel = () => {
      hide();
      cleanup();
    };

    const cleanup = () => {
      saveBtn.removeEventListener('click', handleSave);
      cancelBtn.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
      newSelect.onchange = null;
    };

    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);

    modal.classList.add('show');
  }
};

window.Pipeline = Pipeline;
