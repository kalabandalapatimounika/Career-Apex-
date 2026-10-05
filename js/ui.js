/**
 * Career Apex CRM - UI Component & Common Layout Manager
 * Injects consistent Sidebar, Header, Global Search, Role Switcher, and Add Lead Modal.
 */

const UI = {
  init(activeNav = 'dashboard') {
    const user = Auth.requireAuth();
    if (!user) return;

    this.isPagesDir = window.location.pathname.includes('/pages/');
    this.prefix = this.isPagesDir ? '' : 'pages/';
    this.rootPrefix = this.isPagesDir ? '../' : '';

    this.renderSidebar(activeNav, user);
    this.renderHeader(user);
    this.injectCommonModals();
    this.setupGlobalEvents();
    this.updateRBACVisibility(user);
  },

  renderSidebar(activeNav, user) {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    const totalCount = students.length;

    // Counts per stage using Pipeline module
    const stageCounts = (typeof Pipeline !== 'undefined' && Pipeline.getStageCounts) ? Pipeline.getStageCounts(students) : {};
    const getCount = (st) => stageCounts[st] !== undefined ? stageCounts[st] : students.filter(s => s.stage === st).length;

    // Determine dashboard link based on role
    let dashboardLink = `${this.prefix}admin-dashboard.html`;
    if (user.role === 'MANAGER') dashboardLink = `${this.prefix}manager-dashboard.html`;
    else if (user.role === 'COUNSELOR') dashboardLink = `${this.prefix}salesperson-dashboard.html`;

    sidebarContainer.innerHTML = `
      <aside class="sidebar" id="app-sidebar">
        <!-- Sidebar Header & Logo -->
        <div class="sidebar-header">
          <div class="brand-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <div class="brand-info">
            <span class="brand-title">Career Apex</span>
            <span class="brand-subtitle">STUDENT PLACEMENT &amp; COUNSELING CRM</span>
          </div>
        </div>

        <div class="nav-section-label">NAVIGATION</div>

        <nav class="sidebar-nav">
          <!-- Dashboard Link -->
          <a href="${dashboardLink}" class="nav-item ${activeNav === 'dashboard' ? 'active' : ''}" id="nav-dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span class="nav-title">Dashboard</span>
          </a>

          <!-- Leads Directory -->
          <a href="${this.prefix}customers.html" class="nav-item ${activeNav === 'customers' ? 'active' : ''}" id="nav-leads">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="nav-title">Leads Directory</span>
          </a>

          <!-- Job Seekers Queue -->
          <a href="${this.prefix}customers.html?view=queue" class="nav-item ${activeNav === 'queue' ? 'active' : ''}" id="nav-queue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
            <span class="nav-title">Job Seekers Queue</span>
          </a>

          <!-- Pipeline (Excel) Expandable -->
          <div class="nav-item nav-expandable open ${activeNav === 'pipeline' ? 'active' : ''}" id="nav-pipeline-root">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            <span class="nav-title" onclick="window.location.href='${this.prefix}pipeline.html'">Pipeline (Excel)</span>
            <span class="nav-badge">${totalCount}</span>
            <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <!-- Submenu Stages List (Matching 12 stages exactly) -->
          <div class="nav-submenu">
            <a href="${this.prefix}pipeline.html" class="subnav-item"><span class="nav-title">All Leads</span><span class="nav-badge">${totalCount}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Cold%20Calling" class="subnav-item"><span class="nav-title">Cold Calling</span><span class="nav-badge">${getCount('Cold Calling')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Not%20Connected" class="subnav-item"><span class="nav-title">Not Connected</span><span class="nav-badge">${getCount('Not Connected')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=New%20Lead" class="subnav-item"><span class="nav-title">New Lead</span><span class="nav-badge">${getCount('New Lead')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Contacted" class="subnav-item"><span class="nav-title">Contacted</span><span class="nav-badge">${getCount('Contacted')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Interested" class="subnav-item"><span class="nav-title">Interested</span><span class="nav-badge">${getCount('Interested')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Prospect" class="subnav-item"><span class="nav-title">Prospect</span><span class="nav-badge">${getCount('Prospect')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Follow-up" class="subnav-item"><span class="nav-title">Follow-up</span><span class="nav-badge">${getCount('Follow-up')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Negotiation" class="subnav-item"><span class="nav-title">Negotiation</span><span class="nav-badge">${getCount('Negotiation')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Pending%20Closure" class="subnav-item"><span class="nav-title">Pending Closure</span><span class="nav-badge">${getCount('Pending Closure')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Enrolled" class="subnav-item"><span class="nav-title">Enrolled</span><span class="nav-badge">${getCount('Enrolled')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Not%20Interested" class="subnav-item"><span class="nav-title">Not Interested</span><span class="nav-badge">${getCount('Not Interested')}</span></a>
            <a href="${this.prefix}pipeline.html?stage=Lost" class="subnav-item"><span class="nav-title">Lost</span><span class="nav-badge">${getCount('Lost')}</span></a>
          </div>

          <!-- Follow-ups -->
          <a href="${this.prefix}followups.html" class="nav-item ${activeNav === 'followups' ? 'active' : ''}" id="nav-followups">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span class="nav-title">Follow-ups</span>
          </a>

          <!-- Communication -->
          <a href="${this.prefix}communication.html" class="nav-item ${activeNav === 'communication' ? 'active' : ''}" id="nav-communication">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="nav-title">Communication</span>
          </a>

          <!-- Activities -->
          <a href="${this.prefix}activities.html" class="nav-item ${activeNav === 'activities' ? 'active' : ''}" id="nav-activities">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span class="nav-title">Activities</span>
          </a>

          <!-- Team -->
          <a href="${this.prefix}team.html" class="nav-item ${activeNav === 'team' ? 'active' : ''}" id="nav-team">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="nav-title">Team</span>
          </a>

          <!-- Reports -->
          <a href="${this.prefix}reports.html" class="nav-item ${activeNav === 'reports' ? 'active' : ''}" id="nav-reports">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span class="nav-title">Reports</span>
          </a>

          <!-- Settings (Admin Only) -->
          <a href="${this.prefix}settings.html" class="nav-item ${activeNav === 'settings' ? 'active' : ''}" id="nav-settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span class="nav-title">Settings</span>
          </a>
        </nav>

        <!-- Sidebar Footer & Profile -->
        <div class="sidebar-footer">
          <div class="user-profile-badge">
            <img class="user-avatar" src="${user.avatar}" alt="${user.name}">
            <div class="user-details">
              <span class="user-name">${user.name}</span>
              <span class="user-role-label">${user.role}</span>
            </div>
          </div>
          <button class="btn-signout" id="btn-sidebar-signout" onclick="Auth.logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>
    `;
  },

  renderHeader(user) {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    headerContainer.innerHTML = `
      <header class="top-header">
        <div class="header-left">
          <button class="mobile-menu-btn" id="btn-mobile-menu" aria-label="Toggle Navigation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <div class="header-search-wrapper">
            <div class="search-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input 
              type="text" 
              id="global-search-input" 
              class="header-search-input" 
              placeholder="Quick search leads by ID, name, college, degree, skills, phone..."
              autocomplete="off"
            >
            <div class="global-search-dropdown" id="global-search-dropdown"></div>
          </div>
        </div>

        <div class="header-right">
          <!-- Templates Button -->
          <button class="btn-header-action" id="btn-header-templates" title="Outreach Templates">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Templates
          </button>

          <!-- + Add Lead Button -->
          <button class="btn-primary-purple" id="btn-header-add-lead" title="Add New Lead">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Add Lead
          </button>

          <!-- Switch Role Dropdown -->
          <div class="role-switch-container">
            <button class="btn-header-action" id="btn-switch-role">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
              Switch Role ▼
            </button>
            <div class="role-dropdown-menu" id="role-dropdown-menu">
              <div class="role-menu-header">Switch Simulated Role</div>
              <div class="role-option ${user.role === 'ADMIN' ? 'active' : ''}" onclick="Auth.switchRole('ADMIN')">
                <div class="role-option-info"><span class="role-option-name">Alexander Wright</span><span class="role-option-title">ADMIN (Executive Director)</span></div>
                <svg class="role-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="role-option ${user.role === 'MANAGER' ? 'active' : ''}" onclick="Auth.switchRole('MANAGER')">
                <div class="role-option-info"><span class="role-option-name">Rajesh Sharma</span><span class="role-option-title">MANAGER (Branch Head &amp; Manager)</span></div>
                <svg class="role-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="role-option ${user.role === 'COUNSELOR' ? 'active' : ''}" onclick="Auth.switchRole('COUNSELOR')">
                <div class="role-option-info"><span class="role-option-name">Arun Kumar</span><span class="role-option-title">COUNSELOR (Career Counselor)</span></div>
                <svg class="role-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          <!-- Header User Avatar -->
          <div class="header-user-badge">
            <img class="header-user-avatar" src="${user.avatar}" alt="${user.name}">
            <div class="header-user-details">
              <span class="header-user-name">${user.name}</span>
              <span class="header-user-role">${user.role}</span>
            </div>
          </div>
        </div>
      </header>
    `;
  },

  injectCommonModals() {
    let modalWrapper = document.getElementById('common-modals-wrapper');
    if (!modalWrapper) {
      modalWrapper = document.createElement('div');
      modalWrapper.id = 'common-modals-wrapper';
      document.body.appendChild(modalWrapper);
    }

    modalWrapper.innerHTML = `
      <!-- Add / Edit Lead Modal -->
      <div class="modal-backdrop" id="modal-add-lead">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title" id="modal-lead-title">Add New Student Lead</h3>
              <span class="modal-subtitle">Enroll student lead into placement CRM with automated duplicate check</span>
            </div>
            <button class="modal-close-btn" onclick="document.getElementById('modal-add-lead').classList.remove('open')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="form-add-lead" onsubmit="UI.handleSaveLead(event)">
            <div class="modal-body">
              <input type="hidden" id="lead-edit-id">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Student Full Name <span class="required">*</span></label>
                  <input type="text" id="lead-input-name" class="form-control" placeholder="e.g. Siddharth Verma" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Primary Mobile (10-digits) <span class="required">*</span></label>
                  <input type="tel" id="lead-input-phone" class="form-control" placeholder="e.g. 9876543210" required>
                  <span class="form-hint">Checked against primary & alternate mobile</span>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Alternate Mobile</label>
                  <input type="tel" id="lead-input-alt-phone" class="form-control" placeholder="e.g. 9876543211">
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" id="lead-input-email" class="form-control" placeholder="siddharth.v@gmail.com">
                </div>
              </div>
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">College / Institute</label>
                  <input type="text" id="lead-input-college" class="form-control" placeholder="e.g. RV College of Engg">
                </div>
                <div class="form-group">
                  <label class="form-label">Degree / Stream</label>
                  <input type="text" id="lead-input-degree" class="form-control" placeholder="e.g. B.Tech Computer Science">
                </div>
                <div class="form-group">
                  <label class="form-label">Graduation Year</label>
                  <select id="lead-input-year" class="form-control">
                    <option value="2026">2026</option>
                    <option value="2025" selected>2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Technical Skills</label>
                  <input type="text" id="lead-input-skills" class="form-control" placeholder="Java, Spring Boot, React">
                </div>
                <div class="form-group">
                  <label class="form-label">Target Role</label>
                  <input type="text" id="lead-input-role" class="form-control" placeholder="Full Stack Developer">
                </div>
                <div class="form-group">
                  <label class="form-label">Preferred Location</label>
                  <input type="text" id="lead-input-location" class="form-control" placeholder="Bangalore / Pune">
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Lead Source</label>
                  <select id="lead-input-source" class="form-control">
                    <option value="Campus Drive">Campus Drive</option>
                    <option value="LinkedIn Campaign">LinkedIn Campaign</option>
                    <option value="Website Lead" selected>Website Lead</option>
                    <option value="Referral">Referral</option>
                    <option value="Meta Ads">Meta Ads</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Supervising Manager <span class="required">*</span></label>
                  <select id="lead-input-manager" class="form-control" required>
                    <option value="Rajesh Sharma" selected>Rajesh Sharma (Branch Head)</option>
                    <option value="Priya Patel">Priya Patel (Branch Head)</option>
                    <option value="Amit Verma">Amit Verma (Branch Head)</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Assigned Counselor <span class="required">*</span></label>
                  <select id="lead-input-counselor" class="form-control" required>
                    <option value="Arun Kumar" selected>Arun Kumar</option>
                    <option value="Sneha Rao">Sneha Rao</option>
                    <option value="Vikram Singh">Vikram Singh</option>
                    <option value="Neha Gupta">Neha Gupta</option>
                    <option value="Rahul Mehta">Rahul Mehta</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select id="lead-input-priority" class="form-control">
                    <option value="High">High</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-1">
                <div class="form-group">
                  <label class="form-label">Placement Fee (₹) <span class="required">*</span></label>
                  <input type="number" id="lead-input-fee" class="form-control" value="50000" min="10000" step="1000" required>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" onclick="document.getElementById('modal-add-lead').classList.remove('open')">Cancel</button>
              <button type="submit" class="btn-primary-purple">Save Lead</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Templates Modal -->
      <div class="modal-backdrop" id="modal-templates">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title">Outreach Communication Templates</h3>
              <span class="modal-subtitle">Pre-approved counseling scripts and candidate engagement templates</span>
            </div>
            <button class="modal-close-btn" onclick="document.getElementById('modal-templates').classList.remove('open')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="dossier-grid">
              <div class="dossier-box">
                <h4 class="dossier-box-title" style="color: #22c55e;">WhatsApp: Profile Introduction</h4>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                  "Hi {Student_Name}, Greetings from Career Apex! We have reviewed your profile for our premium software placement program. When is a convenient time today for your 1-on-1 counseling call?"
                </p>
                <button class="btn-secondary" style="margin-top: 10px; font-size: 12px;" onclick="window.location.href='${this.prefix}communication.html'">Open in Communication Center</button>
              </div>
              <div class="dossier-box">
                <h4 class="dossier-box-title" style="color: #3b82f6;">Email: Placement Agreement Milestone</h4>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
                  "Dear {Student_Name}, Attached is your official Placement Assistance Agreement with Career Apex CRM. Please review the 3-installment fee breakdown and sign the agreement to initiate employer interview submissions."
                </p>
                <button class="btn-secondary" style="margin-top: 10px; font-size: 12px;" onclick="window.location.href='${this.prefix}communication.html'">Open in Communication Center</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  setupGlobalEvents() {
    // Mobile sidebar toggle
    document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
      document.getElementById('app-sidebar')?.classList.toggle('mobile-open');
    });

    // Expandable pipeline submenu toggle
    const expandable = document.querySelector('.nav-expandable');
    expandable?.addEventListener('click', (e) => {
      if (e.target.closest('.nav-title')) return;
      expandable.classList.toggle('open');
    });

    // Switch Role Menu
    const switchBtn = document.getElementById('btn-switch-role');
    const roleMenu = document.getElementById('role-dropdown-menu');
    switchBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      roleMenu?.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!switchBtn?.contains(e.target)) roleMenu?.classList.remove('open');
    });

    // Global Search Autocomplete
    const searchInput = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-dropdown');
    if (searchInput && dropdown) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) {
          dropdown.classList.remove('open');
          dropdown.innerHTML = '';
          return;
        }

        const students = StorageService.get(CRM_KEYS.STUDENTS) || [];
        const matches = students.filter(s => {
          const skills = Array.isArray(s.skills) ? s.skills.join(' ').toLowerCase() : '';
          return (
            (s.id && s.id.toLowerCase().includes(q)) ||
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.college && s.college.toLowerCase().includes(q)) ||
            (s.degree && s.degree.toLowerCase().includes(q)) ||
            (s.phone && s.phone.includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            skills.includes(q)
          );
        });

        if (matches.length === 0) {
          dropdown.innerHTML = `<div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 13px;">No candidate matching "${q}"</div>`;
        } else {
          dropdown.innerHTML = `
            <div class="search-dropdown-header">Found ${matches.length} Candidates</div>
            ${matches.slice(0, 8).map(s => `
              <div class="search-result-item" onclick="window.location.href='${this.prefix}customer-details.html?id=${s.id}'">
                <div class="search-result-info">
                  <div class="search-result-name">${s.name} <span class="badge badge-purple" style="font-size: 10px;">${s.id}</span></div>
                  <div class="search-result-meta">${s.college || 'College'} • ${s.degree || ''} • ${s.phone}</div>
                </div>
                <div><span class="badge ${s.stage === 'Converted' ? 'badge-green' : 'badge-amber'}">${s.stage}</span></div>
              </div>
            `).join('')}
          `;
        }
        dropdown.classList.add('open');
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target)) dropdown.classList.remove('open');
      });
    }

    // Add Lead Button
    document.getElementById('btn-header-add-lead')?.addEventListener('click', () => {
      this.openAddLeadModal();
    });

    // Templates Button
    document.getElementById('btn-header-templates')?.addEventListener('click', () => {
      document.getElementById('modal-templates')?.classList.add('open');
    });

    // Backdrop click close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });
  },

  openAddLeadModal(editId = null) {
    const modal = document.getElementById('modal-add-lead');
    const form = document.getElementById('form-add-lead');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('lead-edit-id').value = '';
    document.getElementById('modal-lead-title').textContent = 'Add New Student Lead';

    if (editId) {
      const student = (StorageService.get(CRM_KEYS.STUDENTS) || []).find(s => s.id === editId);
      if (student) {
        document.getElementById('lead-edit-id').value = student.id;
        document.getElementById('modal-lead-title').textContent = `Edit Student: ${student.name} (${student.id})`;
        document.getElementById('lead-input-name').value = student.name;
        document.getElementById('lead-input-phone').value = student.phone;
        document.getElementById('lead-input-alt-phone').value = student.alternatePhone || '';
        document.getElementById('lead-input-email').value = student.email || '';
        document.getElementById('lead-input-college').value = student.college || '';
        document.getElementById('lead-input-degree').value = student.degree || '';
        document.getElementById('lead-input-year').value = student.passingYear || 2025;
        document.getElementById('lead-input-skills').value = Array.isArray(student.skills) ? student.skills.join(', ') : '';
        document.getElementById('lead-input-role').value = student.targetRole || '';
        document.getElementById('lead-input-location').value = student.preferredLocation || '';
        document.getElementById('lead-input-source').value = student.leadSource || 'Direct';
        if (document.getElementById('lead-input-manager')) document.getElementById('lead-input-manager').value = student.manager || 'Rajesh Sharma';
        document.getElementById('lead-input-counselor').value = student.counselor || 'Arun Kumar';
        document.getElementById('lead-input-priority').value = student.priority || 'Medium';
        document.getElementById('lead-input-fee').value = student.placementFee || 50000;
      }
    }
    modal.classList.add('open');
  },

  handleSaveLead(e) {
    e.preventDefault();
    const editId = document.getElementById('lead-edit-id').value;
    const name = document.getElementById('lead-input-name').value.trim();
    const phone = document.getElementById('lead-input-phone').value.trim();
    const altPhone = document.getElementById('lead-input-alt-phone').value.trim();
    const email = document.getElementById('lead-input-email').value.trim();
    const college = document.getElementById('lead-input-college').value.trim();
    const degree = document.getElementById('lead-input-degree').value.trim();
    const passingYear = Number(document.getElementById('lead-input-year').value) || 2025;
    const skillsRaw = document.getElementById('lead-input-skills').value.trim();
    const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : ['Java', 'SQL'];
    const targetRole = document.getElementById('lead-input-role').value.trim() || 'Software Engineer';
    const preferredLocation = document.getElementById('lead-input-location').value.trim() || 'Bangalore';
    const leadSource = document.getElementById('lead-input-source').value;
    const manager = document.getElementById('lead-input-manager')?.value || 'Rajesh Sharma';
    const counselor = document.getElementById('lead-input-counselor').value;
    const priority = document.getElementById('lead-input-priority').value;
    const placementFee = Number(document.getElementById('lead-input-fee').value) || 50000;

    const cleanPhone = Utils.cleanPhone(phone);
    if (cleanPhone.length < 10) {
      Utils.showToast('Please enter a valid 10-digit primary mobile number', 'error');
      return;
    }

    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];

    // Duplicate check
    const duplicate = students.find(s => {
      if (editId && s.id === editId) return false;
      const sPhone = Utils.cleanPhone(s.phone || s.mobile);
      const sAlt = Utils.cleanPhone(s.alternatePhone || s.alternateMobile);
      return sPhone === cleanPhone || sAlt === cleanPhone || (email && s.email && s.email.toLowerCase() === email.toLowerCase());
    });

    if (duplicate) {
      Utils.showToast(`Duplicate Student: Mobile/Email already registered under ${duplicate.name} (${duplicate.id}). Please check candidate dossier.`, 'error');
      return;
    }

    const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${cleanPhone}`;

    if (editId) {
      const idx = students.findIndex(s => s.id === editId);
      if (idx >= 0) {
        students[idx] = {
          ...students[idx],
          name,
          phone: formattedPhone,
          mobile: formattedPhone,
          alternatePhone: altPhone,
          alternateMobile: altPhone,
          email, college, degree, passingYear,
          skills, targetRole, preferredLocation, leadSource,
          manager, counselor, priority,
          placementFee,
          pendingAmount: Math.max(0, placementFee - (students[idx].paidAmount || 0)),
          updatedAt: new Date().toISOString()
        };
        StorageService.set(CRM_KEYS.STUDENTS, students);
        Utils.showToast(`Student ${name} updated successfully`, 'success');
      }
    } else {
      const maxId = students.reduce((max, s) => {
        const m = (s.id || '').match(/CAPX-(\d+)/);
        return m ? Math.max(max, parseInt(m[1])) : max;
      }, 1000);
      const newId = `CAPX-${maxId + 1}`;

      const newStudent = {
        id: newId,
        leadId: newId,
        name,
        phone: formattedPhone,
        mobile: formattedPhone,
        alternatePhone: altPhone,
        alternateMobile: altPhone,
        email,
        college,
        degree,
        passingYear,
        skills,
        targetRole,
        preferredLocation,
        leadSource,
        stage: 'New Lead',
        counselor: counselor || 'Arun Kumar',
        manager: manager || 'Rajesh Sharma',
        placementFee,
        paidAmount: 0,
        pendingAmount: placementFee,
        paymentStatus: 'Pending',
        priority,
        lastContacted: '',
        nextFollowUp: '2026-10-06',
        nextFollowup: '2026-10-06',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installments: [
          { num: 1, amount: Math.round(placementFee * 0.5), dueDate: '2026-10-25', paidDate: null, status: 'Pending' },
          { num: 2, amount: placementFee - Math.round(placementFee * 0.5), dueDate: '2026-11-15', paidDate: null, status: 'Pending' }
        ]
      };

      students.unshift(newStudent);
      StorageService.set(CRM_KEYS.STUDENTS, students);

      // Log activity
      const activities = StorageService.get(CRM_KEYS.ACTIVITIES) || [];
      activities.unshift({
        id: 'ACT-' + Date.now(),
        timestamp: new Date().toISOString(),
        user: Auth.getSession()?.name || 'Staff',
        action: 'Lead Created',
        entity: 'Lead',
        studentId: newId,
        studentName: name,
        description: `New lead created for ${name} (${formattedPhone}) assigned to ${counselor}`
      });
      StorageService.set(CRM_KEYS.ACTIVITIES, activities);

      Utils.showToast(`Lead ${newId} created for ${name}!`, 'success');
    }

    document.getElementById('modal-add-lead')?.classList.remove('open');
    if (typeof window.refreshPageData === 'function') window.refreshPageData();
    if (typeof window.applyFilters === 'function') window.applyFilters();
    if (typeof window.applyPipelineFilters === 'function') window.applyPipelineFilters();
  },

  updateRBACVisibility(user) {
    if (user.role === 'COUNSELOR') {
      const teamNav = document.getElementById('nav-team');
      const settingsNav = document.getElementById('nav-settings');
      if (teamNav) teamNav.style.display = 'none';
      if (settingsNav) settingsNav.style.display = 'none';
    } else if (user.role === 'MANAGER') {
      const settingsNav = document.getElementById('nav-settings');
      if (settingsNav) settingsNav.style.display = 'none';
    }
  }
};

window.UI = UI;
