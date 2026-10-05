/**
 * Career Apex CRM - Followups Module
 * Followups.getAll(), Followups.create(), Followups.complete()
 */

const Followups = {
  getAll(category = 'all') {
    let followups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];
    const session = Auth.getSession();

    if (session && session.role === 'COUNSELOR') {
      followups = followups.filter(f => f.counselor === session.name);
    }

    const todayStr = '2026-10-05';
    const getDate = (f) => f.date || f.scheduledDate || '';

    if (category === 'overdue') {
      return followups.filter(f => f.status !== 'Completed' && getDate(f) < todayStr);
    } else if (category === 'today') {
      return followups.filter(f => f.status !== 'Completed' && getDate(f) === todayStr);
    } else if (category === 'upcoming') {
      return followups.filter(f => f.status !== 'Completed' && getDate(f) > todayStr);
    } else if (category === 'completed') {
      return followups.filter(f => f.status === 'Completed');
    }
    return followups;
  },

  create({ studentId, date, time = '11:30 AM', purpose, counselor, priority = 'Medium' }) {
    const student = Customers.getById(studentId);
    if (!student) {
      Utils.showToast('Student lead required for follow-up', 'error');
      return null;
    }

    const followups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];
    const newFollowup = {
      id: 'FLW-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      phone: student.phone,
      email: student.email,
      date,
      time,
      purpose: purpose.trim(),
      counselor: counselor || student.counselor,
      priority,
      status: date < '2026-10-05' ? 'Overdue' : 'Pending',
      outcomeNotes: '',
      createdAt: new Date().toISOString()
    };

    followups.unshift(newFollowup);
    StorageService.set(CRM_KEYS.FOLLOWUPS, followups);

    // Update student next follow-up
    Customers.update(student.id, { nextFollowUp: date });
    Activities.log('Follow-up Scheduled', `Follow-up set for ${date} (${purpose})`, student.id, student.name);
    Utils.showToast(`Follow-up scheduled for ${student.name}`, 'success');

    return newFollowup;
  },

  complete(id, outcomeNotes, nextAction = 'none') {
    if (!outcomeNotes || !outcomeNotes.trim()) {
      Utils.showToast('Outcome notes are mandatory to complete a task', 'warning');
      return false;
    }

    const followups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];
    const target = followups.find(f => f.id === id);
    if (!target) return false;

    target.status = 'Completed';
    target.outcomeNotes = outcomeNotes.trim();
    target.completedAt = new Date().toISOString();
    StorageService.set(CRM_KEYS.FOLLOWUPS, followups);

    // Schedule next action if needed
    if (nextAction === 'tomorrow') {
      this.create({
        studentId: target.studentId,
        date: '2026-10-06',
        time: '11:00 AM',
        purpose: `Follow-up after callback: ${outcomeNotes.slice(0, 40)}...`,
        counselor: target.counselor,
        priority: target.priority
      });
    }

    Activities.log('Follow-up Completed', `Completed: ${outcomeNotes.trim()}`, target.studentId, target.studentName);
    Utils.showToast('Task marked completed & outcome notes recorded', 'success');
    return true;
  },

  delete(id) {
    let followups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];
    const target = followups.find(f => f.id === id);
    if (!target) return false;

    followups = followups.filter(f => f.id !== id);
    StorageService.set(CRM_KEYS.FOLLOWUPS, followups);
    Utils.showToast('Follow-up task deleted', 'info');
    return true;
  },

  openCompleteModal(taskId, onSuccess = null) {
    const followups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];
    const task = followups.find(f => f.id === taskId);
    if (!task) return;

    let modal = document.getElementById('modal-complete-task-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-complete-task-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Complete Follow-up Task</h3>
            <span class="modal-subtitle">Document candidate outcome and next agenda milestone</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-complete-task-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-complete-task-dialog">
          <div class="modal-body">
            <div style="margin-bottom: 12px;">
              <span class="dossier-label">Task Candidate:</span>
              <h4 style="font-size: 15px; font-weight: 700;">${task.studentName}</h4>
              <p style="font-size: 12px; color: var(--text-muted);">Purpose: ${task.purpose}</p>
            </div>
            <div class="form-group">
              <label class="form-label">Mandatory Outcome Notes / Call Summary <span class="required">*</span></label>
              <textarea id="task-dialog-notes" class="form-control" rows="3" placeholder="Candidate reaction, commitments made, next steps..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Subsequent Action</label>
              <select id="task-dialog-action" class="form-control">
                <option value="none">Task finished - No immediate follow-up</option>
                <option value="tomorrow">Schedule follow-up tomorrow (11:00 AM)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-complete-task-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Confirm Completion</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-complete-task-dialog').onsubmit = (e) => {
      e.preventDefault();
      const notes = document.getElementById('task-dialog-notes').value;
      const nextAct = document.getElementById('task-dialog-action').value;
      const ok = this.complete(taskId, notes, nextAct);
      if (ok) {
        modal.classList.remove('open');
        if (typeof onSuccess === 'function') onSuccess();
        else if (typeof window.refreshPageData === 'function') window.refreshPageData();
      }
    };

    modal.classList.add('open');
  },

  update(id, updates) {
    const followups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];
    const idx = followups.findIndex(f => f.id === id);
    if (idx === -1) return false;
    followups[idx] = { ...followups[idx], ...updates, updatedAt: new Date().toISOString() };
    StorageService.set(CRM_KEYS.FOLLOWUPS, followups);
    Activities.log('Follow-up Updated', `Updated task for ${followups[idx].studentName}: ${followups[idx].purpose}`, followups[idx].studentId, followups[idx].studentName);
    Utils.showToast('Follow-up task updated', 'success');
    return followups[idx];
  },

  openScheduleModal(studentIdOrTaskId = null, onSuccess = null) {
    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    const counselors = StorageService.get(CRM_KEYS.USERS)?.filter(u => u.role === 'COUNSELOR') || [];
    const allFollowups = StorageService.get(CRM_KEYS.FOLLOWUPS) || [];

    const isEdit = studentIdOrTaskId && allFollowups.some(f => f.id === studentIdOrTaskId);
    const editTask = isEdit ? allFollowups.find(f => f.id === studentIdOrTaskId) : null;
    const selectedStudentId = editTask ? editTask.studentId : studentIdOrTaskId;

    let modal = document.getElementById('modal-schedule-task-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-schedule-task-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">${isEdit ? 'Edit Follow-up Task' : 'Schedule Follow-up Agenda'}</h3>
            <span class="modal-subtitle">${isEdit ? 'Modify scheduled callback or agenda details' : 'Add a targeted counseling callback or payment check'}</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-schedule-task-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-schedule-task-dialog">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Student Lead <span class="required">*</span></label>
              <select id="sch-dlg-student" class="form-control" required ${isEdit ? 'disabled' : ''}>
                <option value="">-- Choose Candidate --</option>
                ${students.map(s => `<option value="${s.id}" ${s.id === selectedStudentId ? 'selected' : ''}>${s.name} (${s.id}) - ${s.phone || s.mobile || ''}</option>`).join('')}
              </select>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Date <span class="required">*</span></label>
                <input type="date" id="sch-dlg-date" class="form-control" value="${editTask ? editTask.scheduledDate : '2026-10-06'}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Time <span class="required">*</span></label>
                <input type="text" id="sch-dlg-time" class="form-control" value="${editTask ? (editTask.scheduledTime || '11:30 AM') : '11:30 AM'}" required>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Counselor Assigned</label>
                <select id="sch-dlg-counselor" class="form-control">
                  ${counselors.map(c => `<option value="${c.name}" ${editTask && editTask.counselor === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select id="sch-dlg-priority" class="form-control">
                  <option value="High" ${editTask && editTask.priority === 'High' ? 'selected' : ''}>High</option>
                  <option value="Medium" ${!editTask || editTask.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="Low" ${editTask && editTask.priority === 'Low' ? 'selected' : ''}>Low</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Task Purpose <span class="required">*</span></label>
              <textarea id="sch-dlg-purpose" class="form-control" rows="2" placeholder="e.g. Follow up on fee installment, verify resume draft..." required>${editTask ? editTask.purpose : ''}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-schedule-task-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">${isEdit ? 'Update Task' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('form-schedule-task-dialog').onsubmit = (e) => {
      e.preventDefault();
      const sId = selectedStudentId || document.getElementById('sch-dlg-student').value;
      const date = document.getElementById('sch-dlg-date').value;
      const time = document.getElementById('sch-dlg-time').value;
      const counselor = document.getElementById('sch-dlg-counselor').value;
      const priority = document.getElementById('sch-dlg-priority').value;
      const purpose = document.getElementById('sch-dlg-purpose').value;

      let result;
      if (isEdit) {
        result = this.update(editTask.id, { scheduledDate: date, scheduledTime: time, purpose, counselor, priority });
      } else {
        result = this.create({ studentId: sId, date, time, purpose, counselor, priority });
      }

      if (result) {
        modal.classList.remove('open');
        if (typeof onSuccess === 'function') onSuccess();
        else if (typeof window.refreshPageData === 'function') window.refreshPageData();
      }
    };

    modal.classList.add('open');
  }
};

window.Followups = Followups;
