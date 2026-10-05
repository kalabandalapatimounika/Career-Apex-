/**
 * SALES CRM - APP MODULE
 * Global Layout Manager, Role-Aware Navigation, Header Components,
 * Global Live Search, Add Customer Modal, and Demo Persona Switcher
// Immediate theme initialization to prevent flash
try {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('crm_theme') || 'light');
} catch (e) {}

const App = {
  init(activePageKey = '') {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;

    this.initTheme();
    this.renderSidebar(activePageKey, currentUser);
    this.renderHeader(currentUser);
    this.initGlobalSearch();
    this.initAddCustomerModal();
    this.initMobileMenu();
  },

  /**
   * Common layout initialization helper for pages passing (user, activePageKey)
   */
  initCommon(user, activePageKey = '') {
    const currentUser = (user && typeof user === 'object' && user.id) ? user : Auth.getCurrentUser();
    if (!currentUser) return;

    this.initTheme();
    this.renderSidebar(activePageKey, currentUser);
    this.renderHeader(currentUser);
    this.initGlobalSearch();
    this.initAddCustomerModal();
    this.initMobileMenu();
  },

  /**
   * Render role-adaptive sidebar navigation
   */
  renderSidebar(activeKey, user) {
    const sidebarEl = document.getElementById('crm-sidebar');
    if (!sidebarEl) return;

    const currentUser = (user && typeof user === 'object' && user.role) ? user : Auth.getCurrentUser();
    if (!currentUser) return;

    const isPagesDir = window.location.pathname.includes('/pages/');
    const p = isPagesDir ? '' : 'pages/';

    const role = (currentUser.role || 'admin').toLowerCase();
    const dashboardHref = Auth.getDashboardUrl(role);

    // Navigation item definitions with role permissions
    const navItems = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'fa-gauge-high',
        href: dashboardHref,
        roles: ['admin', 'manager', 'sales']
      },
      {
        key: 'customers',
        label: 'Leads Directory',
        icon: 'fa-user-graduate',
        href: `${p}customers.html`,
        roles: ['admin', 'manager', 'sales']
      },
      {
        key: 'leads',
        label: 'Job Seekers Queue',
        icon: 'fa-user-tag',
        href: `${p}leads.html`,
        roles: ['admin', 'manager', 'sales']
      },
      {
        key: 'pipeline',
        label: 'Pipeline (Kanban)',
        icon: 'fa-chart-kanban',
        href: `${p}pipeline.html`,
        roles: ['admin', 'manager', 'sales']
      },
      {
        key: 'followups',
        label: 'Follow-ups',
        icon: 'fa-calendar-check',
        href: `${p}followups.html`,
        badge: this.getPendingFollowupsCount(user),
        roles: ['admin', 'manager', 'sales']
      },
      {
        key: 'team',
        label: 'Team Management',
        icon: 'fa-users-gear',
        href: `${p}team.html`,
        roles: ['admin', 'manager']
      },
      {
        key: 'activities',
        label: 'Activity Log',
        icon: 'fa-clock-rotate-left',
        href: `${p}activities.html`,
        roles: ['admin', 'manager', 'sales']
      },
      {
        key: 'reports',
        label: 'Reports & Analytics',
        icon: 'fa-chart-pie',
        href: `${p}reports.html`,
        roles: ['admin', 'manager']
      },
      {
        key: 'import',
        label: 'Import Leads',
        icon: 'fa-file-import',
        href: `${p}import-leads.html`,
        roles: ['admin', 'manager']
      },
      {
        key: 'templates',
        label: 'Message Templates',
        icon: 'fa-envelope-open-text',
        roles: ['admin', 'manager'],
        isAction: true
      },
      {
        key: 'settings',
        label: 'System Settings',
        icon: 'fa-sliders',
        href: `${p}settings.html`,
        roles: ['admin', 'manager']
      }
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(role));
    const pipelineSubmenu = this.getPipelineSubmenu(user, isPagesDir);

    sidebarEl.innerHTML = `
      <div class="crm-sidebar-brand">
        <div class="crm-brand-logo">
          <i class="fa-solid fa-arrow-trend-up"></i>
        </div>
        <div class="crm-brand-info">
          <h2>Career Apex</h2>
          <span>Student Placement & Career Counseling CRM</span>
        </div>
        <button class="crm-sidebar-close-btn" id="crm-sidebar-close-btn" aria-label="Close Sidebar" title="Close Sidebar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="crm-nav-wrapper">
        <div class="crm-nav-section-title">Navigation</div>
        ${filteredNav.map(item => {
          if (item.key === 'pipeline') {
            const isPipelineActive = activeKey === 'pipeline';
            const totalLeads = pipelineSubmenu[0] ? pipelineSubmenu[0].count : 0;
            const savedState = localStorage.getItem('crm_pipeline_submenu_collapsed');
            // If on pipeline page, keep expanded unless user explicitly toggles it
            const isCollapsed = savedState === 'true' && !isPipelineActive;

            return `
              <div class="crm-nav-item-wrapper ${isCollapsed ? 'collapsed' : ''}" id="pipeline-nav-wrapper">
                <div class="crm-nav-item ${isPipelineActive ? 'active' : ''}" id="pipeline-menu-toggle" style="cursor: pointer; justify-content: space-between; user-select: none;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fa-solid fa-table-cells"></i>
                    <span>Pipeline (Excel)</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span class="subitem-pill" style="font-size: 0.7rem; background-color: rgba(255,255,255,0.2); padding: 0.1rem 0.45rem; border-radius: 9999px;">${totalLeads}</span>
                    <i class="fa-solid fa-chevron-down crm-submenu-toggle-icon"></i>
                  </div>
                </div>
                <div class="crm-nav-submenu ${isCollapsed ? 'collapsed' : ''}" id="pipeline-nav-submenu">
                  ${pipelineSubmenu.map(sub => `
                    <a href="${sub.href}" class="crm-nav-subitem ${sub.isActive ? 'active' : ''}">
                      <span style="display: flex; align-items: center; gap: 0.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <i class="fa-solid ${sub.icon}" style="font-size: 0.7rem; width: 14px;"></i>
                        <span>${sub.name}</span>
                      </span>
                      <span class="subitem-pill">${sub.count}</span>
                    </a>
                  `).join('')}
                </div>
              </div>
            `;
          }

          if (item.isAction) {
            return `
              <div class="crm-nav-item" id="nav-item-${item.key}" style="cursor: pointer; user-select: none;">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
                <span class="badge" style="margin-left: auto; font-size: 0.65rem; background: rgba(59, 130, 246, 0.25); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4);">Admin/Mgr</span>
              </div>
            `;
          }

          return `
            <a href="${item.href}" class="crm-nav-item ${item.key === activeKey ? 'active' : ''}">
              <i class="fa-solid ${item.icon}"></i>
              <span>${item.label}</span>
              ${item.badge ? `<span class="badge badge-priority-high" style="margin-left: auto; font-size: 0.7rem; padding: 0.15rem 0.45rem;">${item.badge}</span>` : ''}
            </a>
          `;
        }).join('')}
      </div>

      <div class="crm-sidebar-footer" style="padding: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(0, 0, 0, 0.15);">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
          <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" alt="${currentUser.name || 'User'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-500);">
          <div style="overflow: hidden;">
            <div style="font-size: 0.825rem; font-weight: 600; color: #fff; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${Utils.escapeHtml(currentUser.name || 'User')}</div>
            <div style="font-size: 0.7rem; color: var(--slate-400);">${Utils.escapeHtml((currentUser.role || 'Admin').toUpperCase())}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="global-logout-btn" style="width: 100%; justify-content: center; background-color: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.12); color: #fff;">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>
    `;

    // Pipeline Submenu Expand / Collapse Handler
    const pipelineToggle = document.getElementById('pipeline-menu-toggle');
    const pipelineWrapper = document.getElementById('pipeline-nav-wrapper');
    const pipelineSubmenuEl = document.getElementById('pipeline-nav-submenu');

    pipelineToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      const willCollapse = !pipelineSubmenuEl.classList.contains('collapsed');
      if (willCollapse) {
        pipelineSubmenuEl.classList.add('collapsed');
        pipelineWrapper.classList.add('collapsed');
        localStorage.setItem('crm_pipeline_submenu_collapsed', 'true');
      } else {
        pipelineSubmenuEl.classList.remove('collapsed');
        pipelineWrapper.classList.remove('collapsed');
        localStorage.setItem('crm_pipeline_submenu_collapsed', 'false');
      }
    });

    document.getElementById('nav-item-templates')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.Templates && typeof Templates.openTemplateManagerModal === 'function') {
        Templates.openTemplateManagerModal();
      }
    });

    document.getElementById('global-logout-btn')?.addEventListener('click', () => {
      ConfirmModal.show({
        title: 'Sign Out',
        message: 'Are you sure you want to end your current CRM session?',
        confirmText: 'Sign Out',
        confirmVariant: 'danger',
        onConfirm: () => Auth.logout()
      });
    });
  },

  /**
   * Helper to count today's and overdue followups for badge
   */
  getPendingFollowupsCount(user) {
    const cats = Followups.getCategorized(true);
    const count = (cats.today.length || 0) + (cats.overdue.length || 0);
    return count > 0 ? count : null;
  },

  /**
   * Compute pipeline stages submenu items with live counts and active indicator
   */
  getPipelineSubmenu(user, isPagesDir) {
    const p = isPagesDir ? '' : 'pages/';
    const rawCustomers = (window.Customers && typeof Customers.getScopedCustomers === 'function')
      ? Customers.getScopedCustomers(user)
      : [];
    const customers = Array.isArray(rawCustomers) ? rawCustomers.filter(c => c && typeof c === 'object') : [];
    const stages = [
      { name: 'All Leads', param: 'all', icon: 'fa-layer-group' },
      { name: 'Cold Calling', param: 'Cold Calling', icon: 'fa-phone-slash' },
      { name: 'Not Connected', param: 'Not Connected', icon: 'fa-phone-flip' },
      { name: 'New Lead', param: 'New Lead', icon: 'fa-sparkles' },
      { name: 'Contacted', param: 'Contacted', icon: 'fa-phone' },
      { name: 'Interested', param: 'Interested', icon: 'fa-fire' },
      { name: 'Prospect', param: 'Prospect', icon: 'fa-bullseye' },
      { name: 'Follow-up', param: 'Follow-up', icon: 'fa-clock' },
      { name: 'Negotiation', param: 'Negotiation', icon: 'fa-handshake' },
      { name: 'Pending Closure', param: 'Pending Closure', icon: 'fa-file-invoice-dollar' },
      { name: 'Enrolled', param: 'Enrolled', icon: 'fa-trophy' },
      { name: 'Not Interested', param: 'Not Interested', icon: 'fa-ban' },
      { name: 'Lost', param: 'Lost', icon: 'fa-circle-xmark' }
    ];

    let currentUrl;
    try {
      currentUrl = new URL(window.location.href);
    } catch (e) {
      currentUrl = { pathname: '', searchParams: { get: () => '' } };
    }
    const isPipelinePage = currentUrl.pathname.includes('pipeline.html');
    const activeStageParam = currentUrl.searchParams.get('stage') || (isPipelinePage ? 'all' : '');

    return stages.map(st => {
      const count = st.param === 'all'
        ? customers.length
        : customers.filter(c => c && (c.stage === st.param || (st.param === 'Enrolled' && c.stage === 'Converted'))).length;
      const isActive = isPipelinePage && activeStageParam.toLowerCase() === st.param.toLowerCase();

      return {
        name: st.name,
        href: `${p}pipeline.html?stage=${encodeURIComponent(st.param)}`,
        count,
        icon: st.icon,
        isActive
      };
    });
  },

  /**
   * Render Top Header bar with quick search, add customer button, persona switcher
   */
  renderHeader(user) {
    const headerEl = document.getElementById('crm-header');
    if (!headerEl) return;

    const currentUser = (user && typeof user === 'object' && user.id) ? user : Auth.getCurrentUser();
    const role = ((currentUser && currentUser.role) || 'admin').toLowerCase();

    headerEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; width: 100%; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; max-width: 550px;">
          <button class="btn btn-icon btn-secondary crm-sidebar-toggle-btn" id="mobile-menu-toggle" aria-label="Toggle Sidebar Navigation" title="Toggle Navigation Menu">
            <i class="fa-solid fa-bars"></i>
          </button>
          
          <div style="position: relative; width: 100%;">
            <div class="search-box-container" style="position: relative; width: 100%;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--slate-400);"></i>
              <input type="text" id="global-search-input" class="form-control" placeholder="Quick search leads by ID, name, college, degree, skills, phone..." style="padding-left: 2.5rem; padding-right: 4.5rem; border-radius: var(--radius-full); background-color: var(--slate-100); border-color: transparent;">
              <div class="hide-mobile" style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; gap: 0.2rem;">
                <kbd style="font-family: inherit; font-size: 0.65rem; font-weight: 700; color: var(--slate-400); background: var(--slate-200); padding: 0.12rem 0.35rem; border-radius: 4px; border: 1px solid var(--border-light);">Ctrl K</kbd>
              </div>
            </div>
            <div id="global-search-results" class="quick-search-results"></div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <!-- Dark / Light Theme Toggle -->
          <button class="btn btn-icon btn-secondary" id="theme-toggle-btn" title="Toggle Dark / Light Mode" style="border-radius: var(--radius-full); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
            <i class="fa-solid fa-moon" id="theme-toggle-icon"></i>
          </button>

          ${(role === 'admin' || role === 'manager') ? `
            <button class="btn btn-secondary btn-sm" id="global-templates-btn" title="Create & Manage Communication Templates">
              <i class="fa-solid fa-envelope-open-text" style="color: var(--primary-600);"></i>
              <span class="hide-mobile">Templates</span>
            </button>
          ` : ''}

          <button class="btn btn-primary btn-sm" id="global-add-customer-btn">
            <i class="fa-solid fa-user-plus"></i> <span class="hide-mobile">Add Lead</span>
          </button>

          <!-- Quick Persona Switcher for effortless demo testing -->
          <div style="position: relative;">
            <button class="btn btn-secondary btn-sm" id="persona-switcher-btn" title="Quick Role Switcher">
              <i class="fa-solid fa-user-gear"></i>
              <span class="hide-mobile">Switch Role</span>
              <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem;"></i>
            </button>
            <div id="persona-dropdown" class="card" style="display: none; position: absolute; right: 0; top: 120%; width: 280px; z-index: 100; box-shadow: var(--shadow-xl); padding: 0.75rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 0.5rem; padding: 0.25rem 0.5rem;">
                Switch Demo Persona
              </div>
              <div class="persona-option" data-email="admin@crm.local" style="padding: 0.5rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.65rem; cursor: pointer; transition: background 0.15s;">
                <span class="badge badge-role-admin" style="font-size: 0.65rem;">Admin</span>
                <div>
                  <div style="font-weight: 600; font-size: 0.8rem;">Alexander Wright</div>
                  <div style="font-size: 0.7rem; color: var(--slate-500);">Full Access & Governance</div>
                </div>
              </div>
              <div class="persona-option" data-email="manager@crm.local" style="padding: 0.5rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.65rem; cursor: pointer; transition: background 0.15s;">
                <span class="badge badge-role-manager" style="font-size: 0.65rem;">Manager</span>
                <div>
                  <div style="font-weight: 600; font-size: 0.8rem;">Rajesh Sharma</div>
                  <div style="font-size: 0.7rem; color: var(--slate-500);">Team Pipeline & Assignments</div>
                </div>
              </div>
              <div class="persona-option" data-email="sales@crm.local" style="padding: 0.5rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.65rem; cursor: pointer; transition: background 0.15s;">
                <span class="badge badge-role-sales" style="font-size: 0.65rem;">Sales</span>
                <div>
                  <div style="font-weight: 600; font-size: 0.8rem;">Arun Kumar</div>
                  <div style="font-size: 0.7rem; color: var(--slate-500);">Assigned Leads & Follow-ups</div>
                </div>
              </div>
              <div style="border-top: 1px solid var(--border-light); margin-top: 0.5rem; padding-top: 0.5rem;">
                <button class="btn btn-secondary btn-sm" id="header-reset-demo-btn" style="width: 100%; justify-content: center; font-size: 0.75rem; color: var(--danger-solid);">
                  <i class="fa-solid fa-arrows-rotate"></i> Reset All Demo Data
                </button>
              </div>
            </div>
          </div>

          <!-- Active User Profile Pill in Header -->
          <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.6rem 0.25rem 0.25rem; border-radius: var(--radius-full); background: var(--slate-100); border: 1px solid var(--border-light);">
            <div style="position: relative; display: flex; align-items: center;">
              <img src="${(currentUser && currentUser.avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" alt="${(currentUser && currentUser.name) || 'User'}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
              <span style="position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; border-radius: 50%; background: #10b981; border: 1.5px solid var(--bg-card);"></span>
            </div>
            <div class="hide-mobile" style="line-height: 1.2; padding-right: 0.25rem;">
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--slate-900);">${Utils.escapeHtml((currentUser && currentUser.name) || 'User')}</div>
              <div style="font-size: 0.65rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">${Utils.escapeHtml(role)}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('global-templates-btn')?.addEventListener('click', () => {
      if (window.Templates && typeof Templates.openTemplateManagerModal === 'function') {
        Templates.openTemplateManagerModal();
      }
    });

    // Persona dropdown toggling
    const personaBtn = document.getElementById('persona-switcher-btn');
    const personaDropdown = document.getElementById('persona-dropdown');

    personaBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = personaDropdown.style.display === 'block';
      personaDropdown.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      if (personaDropdown) personaDropdown.style.display = 'none';
    });

    personaDropdown?.querySelectorAll('.persona-option').forEach(opt => {
      opt.addEventListener('mouseenter', () => opt.style.backgroundColor = 'var(--slate-100)');
      opt.addEventListener('mouseleave', () => opt.style.backgroundColor = 'transparent)');
      opt.addEventListener('click', () => {
        const targetEmail = opt.getAttribute('data-email');
        const res = Auth.login(targetEmail, targetEmail.startsWith('admin') ? 'admin123' : targetEmail.startsWith('manager') ? 'manager123' : 'sales123');
        if (res.success) {
          Toast.success(`Switched role to ${res.user.role.toUpperCase()}: ${res.user.name}`);
          setTimeout(() => {
            window.location.href = Auth.getDashboardUrl(res.user.role);
          }, 400);
        }
      });
    });

    // Reset Demo Data
    document.getElementById('header-reset-demo-btn')?.addEventListener('click', () => {
      ConfirmModal.show({
        title: 'Reset Demo Data',
        message: 'This will restore all customers, leads, follow-ups, calls, and activities back to the initial demo state. Continue?',
        confirmText: 'Reset Everything',
        confirmVariant: 'danger',
        onConfirm: () => {
          SeedData.resetDemoData();
          Toast.success('Demo data restored successfully.');
          setTimeout(() => window.location.reload(), 600);
        }
      });
    });
  },

  /**
   * Global live search dropdown functionality
   */
  initGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('global-search-results');
    if (!input || !resultsContainer) return;

    const isPagesDir = window.location.pathname.includes('/pages/');
    const custDetailUrl = isPagesDir ? 'customer-details.html?id=' : 'pages/customer-details.html?id=';

    // Global Ctrl+K / Cmd+K listener
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    input.addEventListener('input', Utils.debounce((e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('show');
        return;
      }

      const customers = Customers.getScopedCustomers();
      const matches = customers.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.qualification && c.qualification.toLowerCase().includes(q)) ||
        (c.college && c.college.toLowerCase().includes(q)) ||
        (c.skills && c.skills.toLowerCase().includes(q)) ||
        (c.targetRole && c.targetRole.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      ).slice(0, 6);

      if (!matches.length) {
        resultsContainer.innerHTML = `
          <div style="padding: 1rem; text-align: center; color: var(--slate-500); font-size: 0.85rem;">
            No leads found matching "<strong>${Utils.escapeHtml(q)}</strong>"
          </div>
        `;
        resultsContainer.classList.add('show');
        return;
      }

      resultsContainer.innerHTML = matches.map(c => `
        <div class="quick-search-item" onclick="window.location.href='${custDetailUrl}${c.id}'">
          <div>
            <div style="font-weight: 600; font-size: 0.85rem; color: var(--slate-800);">${Utils.escapeHtml(c.name)}</div>
            <div style="font-size: 0.75rem; color: var(--slate-500);">${c.id} • ${Utils.escapeHtml(c.qualification || 'Lead')} (${Utils.escapeHtml(c.college || '—')}) • ${c.mobile}</div>
          </div>
          <div>
            ${Utils.getStageBadge(c.stage)}
          </div>
        </div>
      `).join('');

      resultsContainer.classList.add('show');
    }, 250));

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.remove('show');
      }
    });
  },

  /**
   * Add Customer global modal
   */
  initAddCustomerModal() {
    const addBtn = document.getElementById('global-add-customer-btn');
    if (!addBtn) return;

    let modal = document.getElementById('global-add-customer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'global-add-customer-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fa-solid fa-user-plus" style="color: var(--primary-600); margin-right: 0.5rem;"></i>Add Lead</h3>
            <button class="modal-close-btn" id="add-cust-modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <form id="global-add-customer-form">
              <!-- Basic Information -->
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-700); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.65rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.25rem;">
                <i class="fa-solid fa-id-card"></i> Candidate Details
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Lead Full Name <span class="required">*</span></label>
                  <input type="text" class="form-control" id="add-cust-name" placeholder="e.g. Aditya Deshmukh" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-control" id="add-cust-email" placeholder="lead@example.com">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Primary Mobile Number <span class="required">*</span></label>
                  <input type="tel" class="form-control" id="add-cust-mobile" placeholder="10-digit mobile number" maxlength="15" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Alternate Mobile / WhatsApp</label>
                  <input type="tel" class="form-control" id="add-cust-alt-mobile" placeholder="Optional WhatsApp number" maxlength="15">
                </div>
              </div>

              <!-- Academic Profile -->
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-700); text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.65rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.25rem;">
                <i class="fa-solid fa-graduation-cap"></i> Academic Background
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Degree / Qualification <span class="required">*</span></label>
                  <input type="text" class="form-control" id="add-cust-qualification" placeholder="e.g. B.Tech Computer Science, BCA, MCA" required>
                </div>
                <div class="form-group">
                  <label class="form-label">College / University Name <span class="required">*</span></label>
                  <input type="text" class="form-control" id="add-cust-college" placeholder="e.g. VJTI Mumbai, Delhi University" required>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Passing Year (YOP)</label>
                  <select class="form-select" id="add-cust-yop">
                    <option value="2026">2026 (Final Year)</option>
                    <option value="2025" selected>2025 (Fresh Grad)</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Experience Level</label>
                  <select class="form-select" id="add-cust-exp">
                    <option value="Fresher" selected>Fresher (0 yrs)</option>
                    <option value="0-1 yr">0 - 1 yr</option>
                    <option value="1-2 yrs">1 - 2 yrs</option>
                    <option value="2+ yrs">2+ yrs</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">CGPA / Percentage</label>
                  <input type="text" class="form-control" id="add-cust-cgpa" placeholder="e.g. 8.4 CGPA or 78%">
                </div>
              </div>

              <!-- Career & Job Preferences -->
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-700); text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.65rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.25rem;">
                <i class="fa-solid fa-briefcase"></i> Job Preferences & Skills
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Target Job Role <span class="required">*</span></label>
                  <input type="text" class="form-control" id="add-cust-role" placeholder="e.g. Software Engineer, Data Analyst, QA" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Key Technical Skills <span class="required">*</span></label>
                  <input type="text" class="form-control" id="add-cust-skills" placeholder="e.g. Java, Spring Boot, React, SQL" required>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Current City</label>
                  <input type="text" class="form-control" id="add-cust-city" placeholder="e.g. Mumbai">
                </div>
                <div class="form-group">
                  <label class="form-label">Current State</label>
                  <input type="text" class="form-control" id="add-cust-state" placeholder="e.g. Maharashtra">
                </div>
                <div class="form-group">
                  <label class="form-label">Preferred Job Location</label>
                  <input type="text" class="form-control" id="add-cust-prefloc" placeholder="e.g. Bengaluru / Pune">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Expected CTC</label>
                  <input type="text" class="form-control" id="add-cust-ctc" placeholder="e.g. 4.5 - 6.0 LPA">
                </div>
                <div class="form-group">
                  <label class="form-label">Lead / Inquiry Source</label>
                  <select class="form-select" id="add-cust-source">
                    <option value="Cold Calling / Raw Database">Cold Calling / Raw Database</option>
                    <option value="Excel / CSV Upload">Excel / CSV Upload</option>
                    <option value="Job Portal / Naukri">Job Portal / Naukri</option>
                    <option value="College Placement Cell">College Placement Cell</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Walk-in / Campus Drive">Walk-in / Campus Drive</option>
                    <option value="Website Inquiry" selected>Website Inquiry</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media / Instagram">Social Media / Instagram</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select class="form-select" id="add-cust-priority">
                    <option value="High">High</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <!-- Placement Counseling Assignment -->
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-700); text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.65rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.25rem;">
                <i class="fa-solid fa-users"></i> Placement Assignment & Stage
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                <div class="form-group">
                  <label class="form-label">Initial Stage</label>
                  <select class="form-select" id="add-cust-stage">
                    <option value="Cold Calling">Cold Calling (Raw Data - Uncontacted)</option>
                    <option value="Not Connected">Not Connected</option>
                    <option value="New Lead" selected>New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Pending Closure">Pending Closure</option>
                    <option value="Enrolled">Enrolled</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Assigned Counseling Manager</label>
                  <select class="form-select" id="add-cust-manager"></select>
                </div>
                <div class="form-group">
                  <label class="form-label">Assigned Career Counselor</label>
                  <select class="form-select" id="add-cust-salesperson"></select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Counseling Notes & Career Aspirations</label>
                <textarea class="form-control" id="add-cust-notes" rows="2" placeholder="Lead background, immediate availability, preferred interview timings..."></textarea>
              </div>

              <div id="add-cust-error-alert" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); background-color: var(--danger-bg); border: 1px solid var(--danger-border); color: var(--danger-text); font-size: 0.85rem; margin-top: 0.5rem;"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="add-cust-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="add-cust-modal-submit">
              <i class="fa-solid fa-floppy-disk"></i> Add Lead
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const form = document.getElementById('global-add-customer-form');
    const mgrSelect = document.getElementById('add-cust-manager');
    const salesSelect = document.getElementById('add-cust-salesperson');
    const errorAlert = document.getElementById('add-cust-error-alert');
    const submitBtn = document.getElementById('add-cust-modal-submit');
    const cancelBtn = document.getElementById('add-cust-modal-cancel');
    const closeBtn = document.getElementById('add-cust-modal-close');

    const openModal = () => {
      form.reset();
      errorAlert.style.display = 'none';
      Validation.clearAllErrors(form);

      const currentUser = Auth.getCurrentUser();

      // Populate managers based on role
      const managers = Users.getManagers();
      if (currentUser && currentUser.role === 'manager') {
        mgrSelect.innerHTML = `<option value="${currentUser.id}" selected>${Utils.escapeHtml(currentUser.name)} (My Team)</option>`;
        mgrSelect.disabled = true;
      } else {
        mgrSelect.disabled = false;
        mgrSelect.innerHTML = '<option value="">-- Unassigned Manager --</option>' +
          managers.map(m => `<option value="${m.id}">${Utils.escapeHtml(m.name)}</option>`).join('');
      }

      // Populate counselors / sales reps
      const populateReps = (mgrId = null) => {
        const effectiveMgrId = (currentUser && currentUser.role === 'manager') ? currentUser.id : mgrId;
        const reps = Users.getSalespeople(effectiveMgrId);
        salesSelect.innerHTML = '<option value="">-- Unassigned Counselor --</option>' +
          reps.map(r => `<option value="${r.id}">${Utils.escapeHtml(r.name)} (${Utils.escapeHtml(r.managerName || 'Counselor')})</option>`).join('');
      };

      if (currentUser && currentUser.role === 'manager') {
        populateReps(currentUser.id);
      } else {
        populateReps();
        mgrSelect.onchange = () => populateReps(mgrSelect.value);
      }

      modal.classList.add('show');
    };

    const closeModal = () => modal.classList.remove('show');

    addBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    submitBtn.addEventListener('click', () => {
      const name = document.getElementById('add-cust-name').value.trim();
      const mobile = document.getElementById('add-cust-mobile').value.trim();
      const altMobile = document.getElementById('add-cust-alt-mobile').value.trim();
      const email = document.getElementById('add-cust-email').value.trim();
      const qualification = document.getElementById('add-cust-qualification').value.trim();
      const college = document.getElementById('add-cust-college').value.trim();
      const passingYear = document.getElementById('add-cust-yop').value;
      const experienceLevel = document.getElementById('add-cust-exp').value;
      const cgpaOrPercentage = document.getElementById('add-cust-cgpa').value.trim();
      const targetRole = document.getElementById('add-cust-role').value.trim();
      const skills = document.getElementById('add-cust-skills').value.trim();
      const city = document.getElementById('add-cust-city').value.trim();
      const state = document.getElementById('add-cust-state').value.trim();
      const preferredLocation = document.getElementById('add-cust-prefloc').value.trim();
      const expectedCtc = document.getElementById('add-cust-ctc').value.trim();
      const source = document.getElementById('add-cust-source').value;
      const priority = document.getElementById('add-cust-priority').value;
      const stage = document.getElementById('add-cust-stage').value;
      const managerId = mgrSelect.value;
      const salespersonId = salesSelect.value;
      const notes = document.getElementById('add-cust-notes').value.trim();

      errorAlert.style.display = 'none';

      // Validation
      if (!name) {
        Validation.setError(document.getElementById('add-cust-name'), 'Lead name is required.');
        return;
      }
      if (!mobile || !Validation.isValidMobile(mobile)) {
        Validation.setError(document.getElementById('add-cust-mobile'), 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (email && !Validation.isValidEmail(email)) {
        Validation.setError(document.getElementById('add-cust-email'), 'Please enter a valid email address.');
        return;
      }

      const result = Customers.create({
        name,
        mobile,
        altMobile,
        email,
        qualification,
        college,
        passingYear,
        experienceLevel,
        cgpaOrPercentage,
        targetRole,
        skills,
        city,
        state,
        preferredLocation,
        expectedCtc,
        source,
        priority,
        stage,
        managerId,
        salespersonId,
        notes
      });

      if (!result.success) {
        if (result.isDuplicate) {
          const isPagesDir = window.location.pathname.includes('/pages/');
          const detailUrl = `${isPagesDir ? '' : 'pages/'}customer-details.html?id=${result.existingCustomerId}`;
          errorAlert.innerHTML = `
            <strong>Duplicate Detected:</strong> A lead with mobile <strong>${mobile}</strong> is already registered:
            <br>
            <strong>${Utils.escapeHtml(result.existingCustomer.name)}</strong> (${result.existingCustomerId})
            <br>
            <a href="${detailUrl}" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem; display: inline-flex;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Existing Lead Profile
            </a>
          `;
          errorAlert.style.display = 'block';
        } else {
          errorAlert.textContent = result.message;
          errorAlert.style.display = 'block';
        }
        return;
      }

      Toast.success(`Lead registered: ${result.customer.name} (${result.customer.id})`);
      closeModal();

      // Redirect to customer/lead details page
      const isPagesDir = window.location.pathname.includes('/pages/');
      const detailUrl = `${isPagesDir ? '' : 'pages/'}customer-details.html?id=${result.customer.id}`;
      setTimeout(() => {
        window.location.href = detailUrl;
      }, 500);
    });
  },

  /**
   * Mobile sidebar toggle and responsive backdrop manager
   */
  initMobileMenu() {
    let backdrop = document.getElementById('crm-sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'crm-sidebar-backdrop';
      backdrop.className = 'crm-sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('crm-sidebar');
    const closeBtn = document.getElementById('crm-sidebar-close-btn');
    if (!sidebar) return;

    const openSidebar = () => {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
      document.body.classList.add('sidebar-open');
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    };

    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });

    backdrop.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });

    // Close when a nav link is clicked on mobile / tablet
    sidebar.querySelectorAll('a.crm-nav-item, a.crm-nav-subitem').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
          closeSidebar();
        }
      });
    });
  },

  /**
   * Theme Manager (Dark / Light Mode)
   */
  initTheme() {
    const savedTheme = localStorage.getItem('crm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    toggleBtn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('crm_theme', next);
      this.updateThemeIcon(next);
      window.dispatchEvent(new CustomEvent('crmThemeChanged', { detail: { theme: next } }));
    });
  },

  updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
      icon.style.color = '#fbbf24';
    } else {
      icon.className = 'fa-solid fa-moon';
      icon.style.color = 'var(--slate-600)';
    }
  }
};

window.App = App;
