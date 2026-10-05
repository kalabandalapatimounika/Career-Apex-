/**
 * SALES CRM - COMMUNICATION TEMPLATES MODULE
 * Admin & Sales Manager Template Governance (Email & WhatsApp)
 * One-Click Sending with/without Attachment Options for Sales Team
 */

const Templates = {
  // Standard downloadable brochures and agreements for candidate sharing
  STANDARD_ATTACHMENTS: [
    {
      id: 'ATT-001',
      name: 'Skill_Move_Placement_Track_Brochure_2026.pdf',
      size: '1.4 MB',
      category: 'Curriculum & Placement',
      desc: 'Complete placement guaranteed track syllabus and hiring partners list.'
    },
    {
      id: 'ATT-002',
      name: 'Skill_Move_Fee_Structure_and_Agreement.pdf',
      size: '820 KB',
      category: 'Fee & Terms',
      desc: 'Official installment milestones breakdown and refund policy terms.'
    },
    {
      id: 'ATT-003',
      name: 'Technical_Assessment_and_Interview_Prep.pdf',
      size: '2.1 MB',
      category: 'Interview Preparation',
      desc: 'Coding round evaluation rubrics, resume guide, and interview playbook.'
    },
    {
      id: 'ATT-004',
      name: 'Skill_Move_Corporate_Hiring_Partners.pdf',
      size: '1.8 MB',
      category: 'Hiring Partners',
      desc: 'Verified list of 150+ tech partner startups and MNC recruitment clients.'
    },
    {
      id: 'ATT-005',
      name: 'Job_Description_FullStack_Backend.pdf',
      size: '640 KB',
      category: 'Job Descriptions',
      desc: 'Verified JD with CTC ₹4.5 - 7.5 LPA for shortlisted candidate review.'
    }
  ],

  /**
   * Get all communication templates from storage
   * @param {string|null} type 'email' | 'whatsapp' | null
   */
  getAll(type = null) {
    let list = StorageService.getData(CRM_STORAGE_KEYS.TEMPLATES, []);
    if (!Array.isArray(list)) list = [];
    list = list.filter(t => t && typeof t === 'object' && t.id);

    if (type) {
      const cleanType = String(type).trim().toLowerCase();
      list = list.filter(t => (t.type || '').toLowerCase() === cleanType);
    }
    return list;
  },

  /**
   * Get template by ID
   */
  getById(id) {
    if (!id) return null;
    const all = this.getAll();
    return all.find(t => t.id === id) || null;
  },

  /**
   * Check if current user has permission to create or edit templates (Admin and Sales Manager)
   */
  canManageTemplates(customUser = null) {
    const user = customUser || (window.Auth ? Auth.getCurrentUser() : null);
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role === 'admin' || role === 'manager';
  },

  /**
   * Create a new template (Admin and Manager only)
   */
  create(data) {
    const currentUser = window.Auth ? Auth.getCurrentUser() : null;
    if (!this.canManageTemplates(currentUser)) {
      return { success: false, message: 'Only Administrators and Sales Managers can create templates.' };
    }

    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Template name is required.' };
    }
    const type = (data.type || 'email').toLowerCase();
    if (type !== 'email' && type !== 'whatsapp') {
      return { success: false, message: 'Template type must be either Email or WhatsApp.' };
    }
    if (type === 'email' && (!data.subject || !data.subject.trim())) {
      return { success: false, message: 'Email subject line is required.' };
    }
    if (!data.body || !data.body.trim()) {
      return { success: false, message: 'Template message body is required.' };
    }

    const prefix = type === 'email' ? 'TMPL-EM' : 'TMPL-WA';
    const id = StorageService.generateId(prefix);

    const template = {
      id,
      name: data.name.trim(),
      type,
      category: data.category || 'General Communication',
      subject: type === 'email' ? data.subject.trim() : (data.subject ? data.subject.trim() : ''),
      body: data.body.trim(),
      hasAttachment: !!data.hasAttachment,
      attachmentName: data.hasAttachment ? (data.attachmentName || this.STANDARD_ATTACHMENTS[0].name) : '',
      attachmentSize: data.hasAttachment ? (data.attachmentSize || '1.4 MB') : '',
      createdBy: currentUser ? currentUser.name : 'Administrator',
      createdByRole: currentUser ? currentUser.role : 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const all = this.getAll();
    all.push(template);
    StorageService.saveData(CRM_STORAGE_KEYS.TEMPLATES, all);

    if (window.Activities) {
      Activities.log({
        action: 'Template Created',
        description: `${currentUser ? currentUser.name : 'Admin'} created ${type.toUpperCase()} template "${template.name}"`
      });
    }

    return { success: true, template };
  },

  /**
   * Update an existing template
   */
  update(id, updates) {
    const currentUser = window.Auth ? Auth.getCurrentUser() : null;
    if (!this.canManageTemplates(currentUser)) {
      return { success: false, message: 'Only Administrators and Sales Managers can modify templates.' };
    }

    const all = this.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, message: 'Template not found.' };

    const existing = all[idx];
    all[idx] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    StorageService.saveData(CRM_STORAGE_KEYS.TEMPLATES, all);

    if (window.Activities) {
      Activities.log({
        action: 'Template Updated',
        description: `${currentUser ? currentUser.name : 'Admin'} updated template "${all[idx].name}"`
      });
    }

    return { success: true, template: all[idx] };
  },

  /**
   * Delete a template
   */
  delete(id) {
    const currentUser = window.Auth ? Auth.getCurrentUser() : null;
    if (!this.canManageTemplates(currentUser)) {
      return { success: false, message: 'Only Administrators and Sales Managers can delete templates.' };
    }

    let all = this.getAll();
    const target = all.find(t => t.id === id);
    if (!target) return { success: false, message: 'Template not found.' };

    all = all.filter(t => t.id !== id);
    StorageService.saveData(CRM_STORAGE_KEYS.TEMPLATES, all);

    if (window.Activities) {
      Activities.log({
        action: 'Template Deleted',
        description: `${currentUser ? currentUser.name : 'Admin'} deleted template "${target.name}"`
      });
    }

    return { success: true };
  },

  /**
   * Replace all dynamic placeholders inside template text
   */
  interpolate(text, customer, currentUser = null) {
    if (!text) return '';
    const c = customer || {};
    const u = currentUser || (window.Auth ? Auth.getCurrentUser() : {}) || {};

    const fee = Number(c.totalFee) || 45000;
    const paid = Number(c.paidAmount) || 0;
    const pending = Math.max(0, fee - paid);
    const fmt = num => '₹' + num.toLocaleString('en-IN');

    const replacements = {
      '{{lead_name}}': c.name || 'Candidate',
      '{{lead_id}}': c.id || 'SM-LD-0001',
      '{{target_role}}': c.targetRole || 'Software Professional',
      '{{qualification}}': c.qualification || 'Degree',
      '{{college}}': c.college || 'College/University',
      '{{city}}': c.city || 'your city',
      '{{state}}': c.state || 'India',
      '{{experience}}': c.experienceLevel || 'Fresher',
      '{{counselor_name}}': c.salespersonName || u.name || 'Career Counselor',
      '{{counselor_phone}}': u.mobile || '9820011223',
      '{{counselor_email}}': u.email || 'counselor@skillmove.org',
      '{{manager_name}}': c.managerName || 'Rajesh Sharma',
      '{{total_fee}}': fmt(fee),
      '{{paid_amount}}': fmt(paid),
      '{{pending_fee}}': fmt(pending),
      '{{payment_plan}}': c.paymentPlan || '2 Installments',
      '{{company_name}}': 'Career Apex'
    };

    let result = text;
    Object.keys(replacements).forEach(key => {
      const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(re, replacements[key]);
    });

    return result;
  },

  /**
   * Open the Send Communication Modal (Email or WhatsApp) with Template selector and Attachment options
   */
  openSendModal({ customerId, type = 'email', templateId = null, onSent = null }) {
    const customer = (window.Customers && typeof Customers.getById === 'function')
      ? Customers.getById(customerId)
      : null;

    if (!customer) {
      if (window.Toast) Toast.error('Lead record not found.');
      return;
    }

    const currentUser = window.Auth ? Auth.getCurrentUser() : null;
    const isEmail = type.toLowerCase() === 'email';
    const modalId = 'modal-send-template-comm';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const availableTemplates = this.getAll(isEmail ? 'email' : 'whatsapp');
    const canManage = this.canManageTemplates(currentUser);

    // Initial selected template
    let activeTemplate = templateId
      ? availableTemplates.find(t => t.id === templateId)
      : (availableTemplates[0] || null);

    let withAttachment = activeTemplate ? !!activeTemplate.hasAttachment : true;
    let selectedAttachmentName = (activeTemplate && activeTemplate.attachmentName)
      ? activeTemplate.attachmentName
      : this.STANDARD_ATTACHMENTS[0].name;

    const renderModalContent = () => {
      const subject = isEmail
        ? (activeTemplate ? this.interpolate(activeTemplate.subject, customer, currentUser) : `Career Placement Track Update - Career Apex`)
        : '';
      const body = activeTemplate
        ? this.interpolate(activeTemplate.body, customer, currentUser)
        : `Hi ${customer.name},\n\nThis is ${currentUser ? currentUser.name : 'Career Apex counselor'}. I wanted to share our latest placement updates with you.\n\nBest regards,\n${currentUser ? currentUser.name : 'Career Apex'}`;

      modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="max-width: 780px;">
          <div class="modal-header" style="background: ${isEmail ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'}; border-bottom: 1px solid var(--border-light);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: ${isEmail ? 'var(--primary-gradient)' : '#10b981'}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem;">
                <i class="fa-solid ${isEmail ? 'fa-envelope-open-text' : 'fa-brands fa-whatsapp'}"></i>
              </div>
              <div>
                <h3 class="modal-title" style="font-size: 1.15rem; font-weight: 800; color: var(--slate-900);">
                  ${isEmail ? 'Send Template Email' : 'Send WhatsApp Message'}
                </h3>
                <div style="font-size: 0.78rem; color: var(--slate-500);">
                  Recipient: <strong style="color: var(--slate-800);">${Utils.escapeHtml(customer.name)}</strong> (${customer.id}) • ${isEmail ? (customer.email || 'No email') : (customer.mobile || 'No mobile')}
                </div>
              </div>
            </div>
            <button class="modal-close-btn" id="comm-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="modal-body" style="padding: 1.25rem; max-height: 75vh; overflow-y: auto;">
            <!-- Template Selection & Management Header -->
            <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <label style="font-weight: 700; font-size: 0.825rem; color: var(--slate-800); text-transform: uppercase; letter-spacing: 0.04em;">
                  <i class="fa-solid fa-wand-magic-sparkles" style="color: var(--primary-600); margin-right: 0.35rem;"></i> Select ${isEmail ? 'Email' : 'WhatsApp'} Template
                </label>
                ${canManage ? `
                  <button class="btn btn-secondary btn-sm" id="btn-manage-templates-shortcut" style="font-size: 0.75rem; padding: 0.2rem 0.55rem; color: var(--primary-700);">
                    <i class="fa-solid fa-gear"></i> Manage Templates
                  </button>
                ` : ''}
              </div>

              <select class="form-select" id="comm-template-select" style="font-weight: 600; font-size: 0.9rem; background-color: #fff;">
                ${availableTemplates.length === 0 ? '<option value="">No templates defined yet</option>' : ''}
                ${availableTemplates.map(t => `
                  <option value="${t.id}" ${activeTemplate && activeTemplate.id === t.id ? 'selected' : ''}>
                    [${t.category || 'General'}] ${Utils.escapeHtml(t.name)} ${t.hasAttachment ? '📎 (With attachment)' : ''}
                  </option>
                `).join('')}
                <option value="custom">-- Custom Blank Message --</option>
              </select>
            </div>

            <!-- Subject Line (Email Only) -->
            ${isEmail ? `
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700;">Subject Line <span class="required">*</span></label>
                <input type="text" class="form-control" id="comm-subject-input" value="${Utils.escapeHtml(subject)}" placeholder="Enter email subject" style="font-weight: 600;">
              </div>
            ` : ''}

            <!-- Attachment Option: With Attachment or Without Attachment -->
            <div style="margin-bottom: 1.25rem; background: #ffffff; border: 1px solid ${withAttachment ? '#a7f3d0' : 'var(--border-light)'}; border-radius: var(--radius-lg); padding: 0.9rem; transition: all 0.2s;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <span style="font-weight: 700; font-size: 0.825rem; color: var(--slate-800); text-transform: uppercase;">
                  <i class="fa-solid fa-paperclip" style="color: ${withAttachment ? '#059669' : 'var(--slate-400)'}; margin-right: 0.4rem;"></i> Attachment Mode
                </span>
                <span class="badge" style="font-size: 0.72rem; ${withAttachment ? 'background:#ecfdf5; color:#047857;' : 'background:#f1f5f9; color:#64748b;'}">
                  ${withAttachment ? '✓ Sending With Attachment' : 'Sending Without Attachment'}
                </span>
              </div>

              <!-- Radio Switcher for With/Without Attachment -->
              <div style="display: flex; gap: 1.5rem; margin-bottom: 0.75rem;">
                <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: ${withAttachment ? 'var(--primary-700)' : 'var(--slate-600)'};">
                  <input type="radio" name="comm-attachment-toggle" value="with" ${withAttachment ? 'checked' : ''} style="cursor: pointer;">
                  <i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> Send With Attachment
                </label>
                <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: ${!withAttachment ? 'var(--primary-700)' : 'var(--slate-600)'};">
                  <input type="radio" name="comm-attachment-toggle" value="without" ${!withAttachment ? 'checked' : ''} style="cursor: pointer;">
                  <i class="fa-solid fa-ban" style="color: var(--slate-400);"></i> Send Without Attachment
                </label>
              </div>

              <!-- Attachment Selector when enabled -->
              <div id="comm-attachment-selector-box" style="${withAttachment ? 'display: block;' : 'display: none;'} background: #f8fafc; border-radius: var(--radius-md); padding: 0.75rem; border: 1px dashed #cbd5e1;">
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--slate-600); margin-bottom: 0.35rem; display: block;">
                  Select Document to Attach:
                </label>
                <select class="form-select" id="comm-attachment-file-select" style="font-size: 0.85rem; font-weight: 600;">
                  ${this.STANDARD_ATTACHMENTS.map(att => `
                    <option value="${att.name}" ${att.name === selectedAttachmentName ? 'selected' : ''}>
                      📄 ${att.name} (${att.size}) — ${att.category}
                    </option>
                  `).join('')}
                </select>
                <div style="font-size: 0.72rem; color: #047857; margin-top: 0.4rem; display: flex; align-items: center; gap: 0.35rem;">
                  <i class="fa-solid fa-circle-check"></i> Document ready to dispatch via ${isEmail ? 'official email attachment' : 'verified WhatsApp media card'}.
                </div>
              </div>
            </div>

            <!-- Message Body Textarea -->
            <div class="form-group" style="margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label class="form-label" style="font-weight: 700; margin-bottom: 0;">Message Content <span class="required">*</span></label>
                <span style="font-size: 0.72rem; color: var(--slate-400);">Placeholders auto-filled with candidate profile data</span>
              </div>
              <textarea class="form-control" id="comm-body-textarea" rows="9" style="font-size: 0.875rem; font-family: inherit; line-height: 1.5; white-space: pre-wrap;">${body}</textarea>
            </div>

            <!-- Quick Placeholder Variable Tags -->
            <div style="background: #f1f5f9; padding: 0.6rem 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.5rem;">
              <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); margin-bottom: 0.35rem;">
                Click to Insert Variable Tag:
              </div>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                ${[
                  '{{lead_name}}',
                  '{{target_role}}',
                  '{{qualification}}',
                  '{{college}}',
                  '{{counselor_name}}',
                  '{{counselor_phone}}',
                  '{{total_fee}}',
                  '{{pending_fee}}',
                  '{{lead_id}}'
                ].map(tag => `
                  <button type="button" class="btn btn-secondary btn-sm comm-tag-btn" data-tag="${tag}" style="font-size: 0.7rem; padding: 0.15rem 0.45rem; background: #fff;">
                    ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <button class="btn btn-secondary" id="comm-modal-cancel">Cancel</button>

            <div style="display: flex; gap: 0.6rem;">
              <button class="btn btn-primary" id="comm-modal-send" style="background: ${isEmail ? 'var(--primary-600)' : '#10b981'}; border-color: ${isEmail ? 'var(--primary-700)' : '#059669'}; font-weight: 700; padding: 0.5rem 1.25rem;">
                <i class="fa-solid ${isEmail ? 'fa-paper-plane' : 'fa-brands fa-whatsapp'}"></i>
                ${isEmail ? 'Send Email with 1-Click' : 'Send WhatsApp Message'}
              </button>
            </div>
          </div>
        </div>
      `;

      // Event handlers
      modal.querySelector('#comm-modal-close').onclick = () => modal.classList.remove('show');
      modal.querySelector('#comm-modal-cancel').onclick = () => modal.classList.remove('show');

      // Template dropdown change
      const templateSelect = modal.querySelector('#comm-template-select');
      templateSelect.onchange = () => {
        const val = templateSelect.value;
        if (val === 'custom') {
          activeTemplate = null;
          withAttachment = false;
        } else {
          activeTemplate = availableTemplates.find(t => t.id === val);
          if (activeTemplate) {
            withAttachment = !!activeTemplate.hasAttachment;
            if (activeTemplate.attachmentName) selectedAttachmentName = activeTemplate.attachmentName;
          }
        }
        renderModalContent();
      };

      // Attachment Radio Toggle
      const radioInputs = modal.querySelectorAll('input[name="comm-attachment-toggle"]');
      radioInputs.forEach(r => {
        r.onchange = () => {
          withAttachment = (r.value === 'with');
          const box = modal.querySelector('#comm-attachment-selector-box');
          if (box) box.style.display = withAttachment ? 'block' : 'none';
        };
      });

      // Attachment file selector
      const attSelect = modal.querySelector('#comm-attachment-file-select');
      if (attSelect) {
        attSelect.onchange = () => {
          selectedAttachmentName = attSelect.value;
        };
      }

      // Quick Tag Insertion
      modal.querySelectorAll('.comm-tag-btn').forEach(btn => {
        btn.onclick = () => {
          const tag = btn.getAttribute('data-tag');
          const textarea = modal.querySelector('#comm-body-textarea');
          if (!textarea) return;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.substring(0, start) + tag + text.substring(end);
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        };
      });

      // Shortcut to template manager
      const manageShortcut = modal.querySelector('#btn-manage-templates-shortcut');
      if (manageShortcut) {
        manageShortcut.onclick = () => {
          modal.classList.remove('show');
          Templates.openTemplateManagerModal(isEmail ? 'email' : 'whatsapp');
        };
      }

      // Send Button Action
      modal.querySelector('#comm-modal-send').onclick = () => {
        const bodyText = modal.querySelector('#comm-body-textarea').value.trim();
        const subjectText = isEmail ? modal.querySelector('#comm-subject-input').value.trim() : '';

        if (!bodyText) {
          if (window.Toast) Toast.error('Message content cannot be empty.');
          return;
        }

        const templateName = activeTemplate ? activeTemplate.name : 'Custom Message';
        const attInfo = withAttachment ? selectedAttachmentName : null;

        if (isEmail) {
          if (!customer.email || !customer.email.trim()) {
            if (window.Toast) Toast.error('This candidate does not have a registered email address.');
            return;
          }

          // Dispatch Email
          const mailToUrl = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText + (attInfo ? `\n\n[Attachment Attached: ${attInfo}]` : ''))}`;

          // Log Activity
          if (window.Activities) {
            Activities.log({
              action: 'Email Sent',
              customerId: customer.id,
              description: `Email sent to ${customer.name} (${customer.email}): "${subjectText}" ${attInfo ? `[Attached: ${attInfo}]` : '[Without attachment]'}`
            });
          }

          // Trigger email client safely
          try {
            const a = document.createElement('a');
            a.href = mailToUrl;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 50);
          } catch (e) {
            window.location.href = mailToUrl;
          }

          if (window.Toast) {
            Toast.success(`Email dispatched to ${customer.name}! ${attInfo ? `(With ${attInfo})` : ''}`);
          }
        } else {
          if (!customer.mobile || !customer.mobile.trim()) {
            if (window.Toast) Toast.error('This candidate does not have a registered phone number.');
            return;
          }

          // Dispatch WhatsApp
          const cleanMobile = Utils.cleanPhoneNumber(customer.mobile);
          let waMessage = bodyText;
          if (attInfo) {
            waMessage += `\n\n📎 *Attached Document:* ${attInfo}\n(Download from Career Apex portal or request direct PDF transfer)`;
          }

          const waUrl = `https://wa.me/91${cleanMobile.slice(-10)}?text=${encodeURIComponent(waMessage)}`;

          // Log Activity
          if (window.Activities) {
            Activities.log({
              action: 'WhatsApp Sent',
              customerId: customer.id,
              description: `WhatsApp message sent to ${customer.name} (+91${cleanMobile.slice(-10)}): "${templateName}" ${attInfo ? `[With ${attInfo}]` : '[Without attachment]'}`
            });
          }

          window.open(waUrl, '_blank', 'noopener,noreferrer');

          if (window.Toast) {
            Toast.success(`WhatsApp message launched for ${customer.name}! ${attInfo ? `(With ${attInfo})` : ''}`);
          }
        }

        modal.classList.remove('show');
        if (typeof onSent === 'function') onSent();
      };
    };

    renderModalContent();
    modal.classList.add('show');
  },

  /**
   * Open the Template Manager Modal (Create, Edit, Delete Email & WhatsApp Templates)
   * Protected for Admin & Sales Manager
   */
  openTemplateManagerModal(initialType = 'all') {
    const currentUser = window.Auth ? Auth.getCurrentUser() : null;
    if (!this.canManageTemplates(currentUser)) {
      if (window.Toast) Toast.error('Access Restricted: Only Administrators and Sales Managers can manage templates.');
      return;
    }

    const modalId = 'modal-template-manager';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    let activeFilter = initialType; // 'all' | 'email' | 'whatsapp'
    let editingTemplateId = null;

    const renderManager = () => {
      const templates = this.getAll(activeFilter === 'all' ? null : activeFilter);

      modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="max-width: 900px;">
          <div class="modal-header" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
            <div>
              <h3 class="modal-title" style="font-weight: 800; font-size: 1.25rem; color: var(--slate-900);">
                <i class="fa-solid fa-folder-open" style="color: var(--primary-600); margin-right: 0.5rem;"></i>
                Email & WhatsApp Communication Templates
              </h3>
              <div style="font-size: 0.78rem; color: var(--slate-500);">
                Configured by Admin & Sales Managers • Usable by whole counseling team with 1-click
              </div>
            </div>
            <button class="modal-close-btn" id="mgr-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="modal-body" style="padding: 1.25rem; max-height: 75vh; overflow-y: auto;">
            <!-- Top Controls: Filter & Create Button -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" id="btn-flt-all">All Templates (${this.getAll().length})</button>
                <button class="btn btn-sm ${activeFilter === 'email' ? 'btn-primary' : 'btn-secondary'}" id="btn-flt-email">
                  <i class="fa-solid fa-envelope"></i> Email (${this.getAll('email').length})
                </button>
                <button class="btn btn-sm ${activeFilter === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}" id="btn-flt-whatsapp">
                  <i class="fa-brands fa-whatsapp"></i> WhatsApp (${this.getAll('whatsapp').length})
                </button>
              </div>

              <button class="btn btn-primary btn-sm" id="btn-create-new-template" style="background: var(--primary-600); font-weight: 700;">
                <i class="fa-solid fa-plus"></i> Create New Template
              </button>
            </div>

            <!-- Templates List Table -->
            <div class="table-responsive" style="border: 1px solid var(--border-light); border-radius: var(--radius-md); background: #fff;">
              <table class="table" style="font-size: 0.85rem; margin-bottom: 0;">
                <thead>
                  <tr style="background: var(--slate-100);">
                    <th>Channel</th>
                    <th>Template Name</th>
                    <th>Subject / Category</th>
                    <th>Attachment Setting</th>
                    <th>Created By</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${templates.length === 0 ? `
                    <tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 2.5rem;">No templates found. Click "Create New Template" to add one.</td></tr>
                  ` : templates.map(t => {
                    const isEm = t.type === 'email';
                    return `
                      <tr>
                        <td>
                          <span class="badge" style="${isEm ? 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;' : 'background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;'} font-size: 0.72rem;">
                            <i class="fa-solid ${isEm ? 'fa-envelope' : 'fa-brands fa-whatsapp'}"></i> ${isEm ? 'Email' : 'WhatsApp'}
                          </span>
                        </td>
                        <td>
                          <strong style="color: var(--slate-900);">${Utils.escapeHtml(t.name)}</strong>
                          <div style="font-size: 0.72rem; color: var(--slate-400);">${t.id}</div>
                        </td>
                        <td>
                          <div style="font-weight: 600; color: var(--slate-700);">${Utils.escapeHtml(t.subject || '—')}</div>
                          <div style="font-size: 0.72rem; color: var(--slate-500);">${Utils.escapeHtml(t.category || 'General')}</div>
                        </td>
                        <td>
                          ${t.hasAttachment ? `
                            <span class="badge" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 0.72rem;">
                              <i class="fa-solid fa-paperclip"></i> ${Utils.escapeHtml(t.attachmentName || 'Standard PDF')}
                            </span>
                          ` : `
                            <span style="color: var(--slate-400); font-size: 0.75rem;">Without Attachment</span>
                          `}
                        </td>
                        <td>
                          <span style="font-size: 0.8rem; color: var(--slate-600);">${Utils.escapeHtml(t.createdBy || 'Admin')}</span>
                        </td>
                        <td style="text-align: right;">
                          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-edit-tmpl" data-id="${t.id}" title="Edit Template" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
                              <i class="fa-solid fa-pen"></i> Edit
                            </button>
                            <button class="btn btn-secondary btn-sm btn-delete-tmpl" data-id="${t.id}" title="Delete Template" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--danger-solid);">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="mgr-modal-done">Done</button>
          </div>
        </div>
      `;

      modal.querySelector('#mgr-modal-close').onclick = () => modal.classList.remove('show');
      modal.querySelector('#mgr-modal-done').onclick = () => modal.classList.remove('show');

      modal.querySelector('#btn-flt-all').onclick = () => { activeFilter = 'all'; renderManager(); };
      modal.querySelector('#btn-flt-email').onclick = () => { activeFilter = 'email'; renderManager(); };
      modal.querySelector('#btn-flt-whatsapp').onclick = () => { activeFilter = 'whatsapp'; renderManager(); };

      modal.querySelector('#btn-create-new-template').onclick = () => {
        openEditForm(null);
      };

      modal.querySelectorAll('.btn-edit-tmpl').forEach(btn => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-id');
          openEditForm(tid);
        };
      });

      modal.querySelectorAll('.btn-delete-tmpl').forEach(btn => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-id');
          const t = this.getById(tid);
          if (!t) return;
          if (confirm(`Are you sure you want to delete template "${t.name}"?`)) {
            this.delete(tid);
            if (window.Toast) Toast.success('Template deleted successfully.');
            renderManager();
          }
        };
      });
    };

    const openEditForm = (targetId = null) => {
      const isEdit = !!targetId;
      const t = isEdit ? this.getById(targetId) : {
        name: '',
        type: activeFilter === 'whatsapp' ? 'whatsapp' : 'email',
        category: 'Outreach & Counseling',
        subject: '',
        body: '',
        hasAttachment: true,
        attachmentName: this.STANDARD_ATTACHMENTS[0].name
      };

      const editModalId = 'modal-template-editor';
      let editModal = document.getElementById(editModalId);
      if (!editModal) {
        editModal = document.createElement('div');
        editModal.id = editModalId;
        editModal.className = 'modal-backdrop';
        editModal.style.zIndex = '1100';
        document.body.appendChild(editModal);
      } else {
        editModal.style.zIndex = '1100';
      }

      editModal.innerHTML = `
        <div class="modal-dialog modal-lg" style="max-width: 720px; z-index: 1050;">
          <div class="modal-header">
            <h3 class="modal-title" style="font-weight: 800;">
              ${isEdit ? '<i class="fa-solid fa-pen-to-square"></i> Edit Communication Template' : '<i class="fa-solid fa-plus-circle"></i> Create Communication Template'}
            </h3>
            <button class="modal-close-btn" id="edit-tmpl-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <form id="template-edit-form">
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                <div class="form-group">
                  <label class="form-label">Template Name <span class="required">*</span></label>
                  <input type="text" class="form-control" id="tmpl-form-name" value="${Utils.escapeHtml(t.name || '')}" placeholder="e.g. Placement Track Syllabus & Enrollment" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Channel Type <span class="required">*</span></label>
                  <select class="form-select" id="tmpl-form-type" ${isEdit ? 'disabled' : ''}>
                    <option value="email" ${t.type === 'email' ? 'selected' : ''}>Email</option>
                    <option value="whatsapp" ${t.type === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                <div class="form-group">
                  <label class="form-label">Category / Stage</label>
                  <input type="text" class="form-control" id="tmpl-form-category" value="${Utils.escapeHtml(t.category || 'General')}" placeholder="e.g. Brochure, Fee Structure, Follow-up">
                </div>
                <div class="form-group">
                  <label class="form-label">Attachment Requirement</label>
                  <select class="form-select" id="tmpl-form-has-att">
                    <option value="true" ${t.hasAttachment ? 'selected' : ''}>Send With Attachment (Default)</option>
                    <option value="false" ${!t.hasAttachment ? 'selected' : ''}>Send Without Attachment</option>
                  </select>
                </div>
              </div>

              <div class="form-group" id="tmpl-form-att-group" style="${t.hasAttachment ? '' : 'display:none;'} margin-bottom: 0.85rem;">
                <label class="form-label">Default Document Attachment</label>
                <select class="form-select" id="tmpl-form-att-name">
                  ${this.STANDARD_ATTACHMENTS.map(a => `
                    <option value="${a.name}" ${t.attachmentName === a.name ? 'selected' : ''}>
                      ${a.name} (${a.size}) — ${a.category}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group" id="tmpl-form-subj-group" style="${t.type === 'email' ? '' : 'display:none;'} margin-bottom: 0.85rem;">
                <label class="form-label">Email Subject Line <span class="required">*</span></label>
                <input type="text" class="form-control" id="tmpl-form-subject" value="${Utils.escapeHtml(t.subject || '')}" placeholder="e.g. Career Apex Career Assistance for {{lead_name}}">
              </div>

              <div class="form-group" style="margin-bottom: 0.75rem;">
                <label class="form-label">Message Content / Template Body <span class="required">*</span></label>
                <textarea class="form-control" id="tmpl-form-body" rows="8" placeholder="Type template body with dynamic tags like {{lead_name}}, {{target_role}}, {{counselor_name}}..." required>${Utils.escapeHtml(t.body || '')}</textarea>
              </div>

              <div style="font-size: 0.72rem; color: var(--slate-500); background: #f1f5f9; padding: 0.5rem; border-radius: var(--radius-sm);">
                Supported placeholders: <code>{{lead_name}}</code>, <code>{{target_role}}</code>, <code>{{qualification}}</code>, <code>{{college}}</code>, <code>{{city}}</code>, <code>{{counselor_name}}</code>, <code>{{counselor_phone}}</code>, <code>{{total_fee}}</code>, <code>{{pending_fee}}</code>, <code>{{lead_id}}</code>.
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="edit-tmpl-cancel">Cancel</button>
            <button class="btn btn-primary" id="edit-tmpl-save" style="font-weight: 700;">
              ${isEdit ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </div>
      `;

      editModal.querySelector('#edit-tmpl-close').onclick = () => editModal.classList.remove('show');
      editModal.querySelector('#edit-tmpl-cancel').onclick = () => editModal.classList.remove('show');

      const typeSelect = editModal.querySelector('#tmpl-form-type');
      typeSelect.onchange = () => {
        const isEm = typeSelect.value === 'email';
        editModal.querySelector('#tmpl-form-subj-group').style.display = isEm ? '' : 'none';
      };

      const hasAttSelect = editModal.querySelector('#tmpl-form-has-att');
      hasAttSelect.onchange = () => {
        editModal.querySelector('#tmpl-form-att-group').style.display = hasAttSelect.value === 'true' ? '' : 'none';
      };

      editModal.querySelector('#edit-tmpl-save').onclick = () => {
        const name = editModal.querySelector('#tmpl-form-name').value.trim();
        const type = typeSelect.value;
        const category = editModal.querySelector('#tmpl-form-category').value.trim();
        const hasAttachment = editModal.querySelector('#tmpl-form-has-att').value === 'true';
        const attachmentName = editModal.querySelector('#tmpl-form-att-name').value;
        const subject = editModal.querySelector('#tmpl-form-subject').value.trim();
        const body = editModal.querySelector('#tmpl-form-body').value.trim();

        if (!name) {
          if (window.Toast) Toast.error('Template name is required.');
          return;
        }
        if (type === 'email' && !subject) {
          if (window.Toast) Toast.error('Subject line is required for Email templates.');
          return;
        }
        if (!body) {
          if (window.Toast) Toast.error('Template message body is required.');
          return;
        }

        const data = {
          name,
          type,
          category,
          hasAttachment,
          attachmentName: hasAttachment ? attachmentName : '',
          subject,
          body
        };

        if (isEdit) {
          const res = this.update(targetId, data);
          if (!res.success) {
            if (window.Toast) Toast.error(res.message);
            return;
          }
          if (window.Toast) Toast.success('Template updated successfully!');
        } else {
          const res = this.create(data);
          if (!res.success) {
            if (window.Toast) Toast.error(res.message);
            return;
          }
          if (window.Toast) Toast.success('New template created successfully!');
        }

        editModal.classList.remove('show');
        renderManager();
      };

      editModal.classList.add('show');
    };

    renderManager();
    modal.classList.add('show');
  }
};

window.Templates = Templates;
