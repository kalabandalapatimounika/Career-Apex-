/**
 * SALES CRM - COMMUNICATION MODULE
 * Initiates Call (tel:), WhatsApp (wa.me), Email (mailto:), and Call Outcome Recording Form
 */

const Communication = {
  CALL_OUTCOMES: [
    'Connected',
    'No Answer',
    'Busy',
    'Switched Off',
    'Wrong Number',
    'Call Back Requested',
    'Interested',
    'Not Interested'
  ],

  /**
   * Initiate phone call using tel: protocol
   */
  initiateCall(customerId, promptRecordModal = true) {
    const customer = Customers.getById(customerId);
    if (!customer || !customer.mobile) {
      Toast.error('Customer phone number not available.');
      return;
    }

    const cleanNumber = Utils.cleanPhoneNumber(customer.mobile);
    const telUrl = `tel:+91${cleanNumber.slice(-10)}`;

    Activities.log({
      action: 'Call Initiated',
      customerId: customer.id,
      description: `Outbound call initiated to ${customer.name} (${customer.mobile})`
    });

    // Trigger device dialer safely without navigating away
    try {
      const a = document.createElement('a');
      a.href = telUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 50);
    } catch (e) {
      window.location.href = telUrl;
    }

    // Prompt call outcome recording modal
    if (promptRecordModal) {
      setTimeout(() => {
        this.openCallRecordModal(customerId);
      }, 800);
    }
  },

  /**
   * Open WhatsApp conversation with Template selection and attachment options
   */
  openWhatsApp(customerId, promptTemplate = true, onSent = null) {
    const customer = Customers.getById(customerId);
    if (!customer || !customer.mobile) {
      if (window.Toast) Toast.error('Customer phone number not available.');
      return;
    }

    if (promptTemplate && window.Templates && typeof Templates.openSendModal === 'function') {
      Templates.openSendModal({ customerId, type: 'whatsapp', onSent });
      return;
    }

    const cleanNumber = Utils.cleanPhoneNumber(customer.mobile);
    const waUrl = `https://wa.me/91${cleanNumber.slice(-10)}`;

    Activities.log({
      action: 'WhatsApp Opened',
      customerId: customer.id,
      description: `WhatsApp conversation opened for ${customer.name} (+91${cleanNumber.slice(-10)})`
    });

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (window.Toast) Toast.info(`Opened WhatsApp chat for ${customer.name}`);
    if (typeof onSent === 'function') onSent();
  },

  /**
   * Open Email composer with Template selection and attachment options
   */
  initiateEmail(customerId, promptTemplate = true, onSent = null) {
    const customer = Customers.getById(customerId);
    if (!customer || !customer.email) {
      if (window.Toast) Toast.error('Customer email address not available.');
      return;
    }

    if (promptTemplate && window.Templates && typeof Templates.openSendModal === 'function') {
      Templates.openSendModal({ customerId, type: 'email', onSent });
      return;
    }

    const mailUrl = `mailto:${customer.email}?subject=${encodeURIComponent(`Career Placement follow-up for ${customer.name}`)}`;

    Activities.log({
      action: 'Email Initiated',
      customerId: customer.id,
      description: `Email composer opened for ${customer.name} (${customer.email})`
    });

    try {
      const a = document.createElement('a');
      a.href = mailUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 50);
    } catch (e) {
      window.location.href = mailUrl;
    }
    if (window.Toast) Toast.info(`Drafting email to ${customer.email}`);
    if (typeof onSent === 'function') onSent();
  },

  /**
   * Open modal to record call outcome
   */
  openCallRecordModal(customerId, onSaved = () => {}) {
    const customer = Customers.getById(customerId);
    if (!customer) {
      Toast.error('Customer not found.');
      return;
    }

    let modal = document.getElementById('call-record-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'call-record-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fa-solid fa-phone-volume" style="color: var(--primary-600); margin-right: 0.5rem;"></i>Record Call Outcome</h3>
            <button class="modal-close-btn" id="call-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Customer</label>
                <input type="text" class="form-control" id="call-modal-cust" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Call Outcome <span class="required">*</span></label>
                <select class="form-select" id="call-modal-outcome"></select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Call Notes / Discussion Summary <span class="required">*</span></label>
              <textarea class="form-control" id="call-modal-notes" rows="3" placeholder="Key points discussed during the call..."></textarea>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Next Action</label>
                <select class="form-select" id="call-modal-next-action">
                  <option value="None">None</option>
                  <option value="Schedule Follow-up" selected>Schedule Follow-up</option>
                  <option value="Send Email Proposal">Send Email Proposal</option>
                  <option value="Share Product Demo">Share Product Demo</option>
                  <option value="Escalate to Manager">Escalate to Manager</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Next Follow-up Date/Time</label>
                <input type="datetime-local" class="form-control" id="call-modal-followup-date">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Optionally Update Lead Stage</label>
              <select class="form-select" id="call-modal-stage">
                <option value="">Keep current stage</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="call-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="call-modal-save">Save Call Outcome</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const custInput = document.getElementById('call-modal-cust');
    const outcomeSelect = document.getElementById('call-modal-outcome');
    const notesInput = document.getElementById('call-modal-notes');
    const actionSelect = document.getElementById('call-modal-next-action');
    const followDateInput = document.getElementById('call-modal-followup-date');
    const stageSelect = document.getElementById('call-modal-stage');
    const saveBtn = document.getElementById('call-modal-save');
    const cancelBtn = document.getElementById('call-modal-cancel');
    const closeBtn = document.getElementById('call-modal-close');

    custInput.value = `${customer.name} (${customer.mobile})`;
    notesInput.value = '';

    // Populate outcomes
    outcomeSelect.innerHTML = this.CALL_OUTCOMES
      .map(o => `<option value="${o}">${o}</option>`)
      .join('');

    // Pre-populate follow-up date to tomorrow 10am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    followDateInput.value = tomorrow.toISOString().slice(0, 16);

    // Populate stages
    stageSelect.innerHTML = '<option value="">-- Keep Current Stage (' + customer.stage + ') --</option>' +
      Pipeline.getStages().map(st => `<option value="${st}">${st}</option>`).join('');

    const hide = () => modal.classList.remove('show');

    const handleSave = () => {
      const outcome = outcomeSelect.value;
      const notes = notesInput.value.trim();
      const nextAction = actionSelect.value;
      const followupDate = followDateInput.value;
      const newStage = stageSelect.value;

      if (!notes) {
        Validation.setError(notesInput, 'Please record notes or remarks about this call.');
        return;
      }
      Validation.clearError(notesInput);

      hide();

      // 1. Record call
      const currentUser = Auth.getCurrentUser();
      const now = new Date().toISOString();
      const callRecord = {
        id: StorageService.generateId('CRM-CALL'),
        customerId: customer.id,
        customerName: customer.name,
        salespersonId: currentUser ? currentUser.id : customer.salespersonId,
        salespersonName: currentUser ? currentUser.name : customer.salespersonName,
        outcome,
        notes,
        nextAction,
        nextFollowUpDate: followupDate || '',
        timestamp: now
      };

      const callsList = StorageService.getData(CRM_STORAGE_KEYS.CALLS, []);
      callsList.unshift(callRecord);
      StorageService.saveData(CRM_STORAGE_KEYS.CALLS, callsList);

      // 2. Update Customer's lastContacted
      const custUpdates = {
        lastContacted: now
      };

      // 3. Create follow-up if selected & date provided
      if (nextAction === 'Schedule Follow-up' && followupDate) {
        const parts = followupDate.split('T');
        Followups.create({
          customerId: customer.id,
          date: parts[0],
          time: parts[1] || '10:00',
          purpose: `Follow-up after call: ${notes.slice(0, 80)}...`,
          priority: customer.priority || 'Medium'
        });
      }

      Customers.update(customer.id, custUpdates);

      // 4. Optionally update stage
      if (newStage && newStage !== customer.stage) {
        Pipeline.changeStage(customer.id, newStage, `Call outcome: ${outcome} - ${notes.slice(0, 50)}`);
      }

      // 5. Activity log
      Activities.log({
        action: 'Call Recorded',
        customerId: customer.id,
        description: `Recorded call with ${customer.name}. Outcome: ${outcome}. Remarks: ${notes}`
      });

      Toast.success(`Call record saved for ${customer.name}`);
      if (typeof onSaved === 'function') onSaved();
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
    };

    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);

    modal.classList.add('show');
  },

  /**
   * Get calls list for a customer
   */
  getByCustomer(customerId) {
    if (!customerId) return [];
    const calls = StorageService.getData(CRM_STORAGE_KEYS.CALLS, []);
    return calls.filter(c => c.customerId === customerId);
  }
};

window.Communication = Communication;
