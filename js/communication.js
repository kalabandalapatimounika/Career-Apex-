/**
 * Career Apex CRM - Communication Module
 * Unified Call Logger with Modal & tel: trigger, WhatsApp templates (wa.me), and Email Dispatcher.
 */

const Communication = {
  logCall(studentIdOrPayload, onSuccess = null) {
    let studentId = typeof studentIdOrPayload === 'string' ? studentIdOrPayload : studentIdOrPayload.studentId;
    const student = Customers.getById(studentId);
    if (!student) {
      Utils.showToast('Student lead required to log call', 'error');
      return null;
    }

    // If direct payload provided
    if (typeof studentIdOrPayload === 'object' && studentIdOrPayload.outcome) {
      return this.saveCallRecord(student, studentIdOrPayload, onSuccess);
    }

    // Trigger phone link
    const phoneNum = student.mobile || student.phone || '';
    const cleanNum = Utils.cleanPhone(phoneNum);
    if (cleanNum) {
      const telUrl = `tel:+91${cleanNum}`;
      // Trigger tel in hidden iframe or gentle link
      const tempLink = document.createElement('a');
      tempLink.href = telUrl;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    }

    // Open Call Logging Dialog
    this.openCallModal(student, onSuccess);
  },

  openCallModal(student, onSuccess = null) {
    let modal = document.getElementById('modal-call-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-call-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Log Call: ${student.name}</h3>
            <span class="modal-subtitle">Tel: ${student.mobile || student.phone} • ${student.stage}</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-call-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-call-dialog">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Call Outcome <span class="required">*</span></label>
              <select id="call-dlg-outcome" class="form-control" required>
                <option value="Connected - Interested">Connected - Interested</option>
                <option value="Connected - Not Interested">Connected - Not Interested</option>
                <option value="Call Back Requested">Call Back Requested</option>
                <option value="No Answer">No Answer</option>
                <option value="Busy">Busy</option>
                <option value="Invalid Number">Invalid Number</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Call Duration</label>
              <select id="call-dlg-duration" class="form-control">
                <option value="1-2 mins">1–2 mins (Brief update)</option>
                <option value="5-10 mins" selected>5–10 mins (Initial qualification)</option>
                <option value="15-20 mins">15–20 mins (Detailed counseling)</option>
                <option value="30+ mins">30+ mins (Fee & enrollment discussion)</option>
                <option value="0 mins">0 mins (Unconnected / No answer)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Counselor Discussion Notes <span class="required">*</span></label>
              <textarea id="call-dlg-notes" class="form-control" rows="3" placeholder="Key points discussed, candidate interest level, next action agreed upon..." required></textarea>
            </div>

            <div class="form-group" style="margin-top: 10px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                <input type="checkbox" id="call-dlg-schedule-followup" checked>
                <span>Schedule immediate follow-up task after saving call</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-call-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Save Call Record</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-call-dialog').onsubmit = (e) => {
      e.preventDefault();
      const outcome = document.getElementById('call-dlg-outcome').value;
      const duration = document.getElementById('call-dlg-duration').value;
      const notes = document.getElementById('call-dlg-notes').value;
      const createFollowup = document.getElementById('call-dlg-schedule-followup').checked;

      this.saveCallRecord(student, { outcome, duration, notes }, () => {
        modal.classList.remove('open');
        if (typeof onSuccess === 'function') onSuccess();
        else if (typeof window.refreshPageData === 'function') window.refreshPageData();

        if (createFollowup) {
          Followups.openScheduleModal(student.id, onSuccess);
        }
      });
    };

    modal.classList.add('open');
  },

  saveCallRecord(student, { outcome, duration = '5-10 mins', notes = '' }, callback = null) {
    const calls = StorageService.get(CRM_KEYS.CALLS) || [];
    const author = Auth.getSession()?.name || 'Counselor';
    const today = new Date().toISOString().split('T')[0];

    const newCall = {
      id: 'CALL-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      counselor: author,
      duration,
      outcome,
      notes: notes.trim(),
      date: today,
      createdAt: new Date().toISOString()
    };

    calls.unshift(newCall);
    StorageService.set(CRM_KEYS.CALLS, calls);

    // Update student's lastContacted date
    Customers.update(student.id, { lastContacted: today });
    Customers.addNote(student.id, `[Call Logged: ${outcome} (${duration})] ${notes}`);

    // Log Activity
    Activities.log('Call Logged', `Call (${duration}) with outcome "${outcome}". Notes: ${notes.slice(0, 60)}...`, student.id, student.name);
    Utils.showToast(`Call record logged for ${student.name}!`, 'success');

    if (callback) callback(newCall);
    return newCall;
  },

  sendWhatsApp(studentId, templateKey = 'welcome', customText = null) {
    const student = Customers.getById(studentId);
    if (!student) {
      Utils.showToast('Student lead not found', 'error');
      return;
    }

    const defaultTexts = {
      welcome: `Hi ${student.name}, Greetings from Career Apex! We have reviewed your profile for our premium software placement program. When is a convenient time today for your 1-on-1 counseling call?`,
      followup: `Hi ${student.name}, this is following up on our recent counseling discussion regarding your placement roadmap at Career Apex. Are you available for a quick sync?`,
      fee: `Hi ${student.name}, please find attached the details for your placement fee payment installment schedule at Career Apex. Feel free to reach out if you have any questions.`
    };

    const messageText = customText || defaultTexts[templateKey] || defaultTexts.welcome;
    const cleanPhone = Utils.cleanPhone(student.mobile || student.phone);
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    Activities.log('WhatsApp Initiated', `WhatsApp outreach dispatched: "${messageText.slice(0, 60)}..."`, student.id, student.name);
    window.open(waUrl, '_blank');
    Utils.showToast('WhatsApp conversation initiated and logged', 'success');
  },

  sendEmail(studentId, subject = null, body = null) {
    const student = Customers.getById(studentId);
    if (!student) {
      Utils.showToast('Student lead not found', 'error');
      return;
    }

    const sub = subject || `Career Apex — Candidate Counseling & Placement Program (${student.name})`;
    const b = body || `Dear ${student.name},\n\nThank you for connecting with Career Apex regarding our Student Placement & Career Counseling program.\n\nPlease let us know your preferred time slot for your next counseling session.\n\nBest regards,\nCareer Apex Admissions Team\nsupport@careerapex.com`;

    const mailto = `mailto:${student.email || ''}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(b)}`;
    Activities.log('Email Initiated', `Email sent to ${student.email || student.name}: "${sub}"`, student.id, student.name);
    window.open(mailto, '_blank');
    Utils.showToast('Email client opened & activity logged', 'success');
  }
};

window.Communication = Communication;
