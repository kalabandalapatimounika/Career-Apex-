import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { X } from 'lucide-react';

export const Sidebar = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    activePipelineStage,
    setActivePipelineStage,
    isPipelineMenuCollapsed,
    setIsPipelineMenuCollapsed,
    pipelineStageCounts,
    metrics,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsTemplatesModalOpen,
    setIsImportModalOpen,
    stages,
    addToast
  } = useCRM();

  const handleNavClick = (tabKey) => {
    setActiveTab(tabKey);
    setIsMobileMenuOpen(false);
  };

  const handlePipelineSubClick = (e, stageKey) => {
    e.stopPropagation();
    setActivePipelineStage(stageKey);
    setActiveTab('pipeline');
    setIsMobileMenuOpen(false);
  };

  const togglePipelineSubmenu = (e) => {
    e.stopPropagation();
    setIsPipelineMenuCollapsed(prev => !prev);
  };

  const pipelineSubmenuItems = [
    { key: 'all', name: 'All Leads', icon: 'fa-layer-group', count: pipelineStageCounts.all || 0 },
    ...stages.map(st => ({
      key: st.key,
      name: st.label,
      icon: st.icon,
      count: pipelineStageCounts[st.key] || 0
    }))
  ];

  const role = (currentUser?.role || 'admin').toLowerCase();
  const isAdminOrMgr = role === 'admin' || role === 'manager';

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`crm-sidebar-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar Shell */}
      <aside className={`crm-sidebar ${isMobileMenuOpen ? 'open' : ''}`} id="crm-sidebar">
        {/* Brand Header */}
        <div className="crm-sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="crm-brand-logo" style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', boxShadow: '0 4px 12px var(--primary-glow)' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
            </div>
            <div className="crm-brand-info">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Career Apex</h2>
              <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', display: 'block', marginTop: '1px' }}>Student Placement & Sales CRM</span>
            </div>
          </div>

          <button
            type="button"
            className="crm-sidebar-close-btn"
            id="crm-sidebar-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Nav Item List */}
        <div className="crm-nav-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="crm-nav-section-title">Navigation</div>

          {/* 1. Dashboard */}
          <div
            className={`crm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <i className="fa-solid fa-gauge-high"></i>
            <span>Dashboard</span>
          </div>

          {/* 2. Leads Directory */}
          <div
            className={`crm-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => handleNavClick('customers')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span>Leads Directory</span>
          </div>

          {/* 3. Job Seekers Queue */}
          <div
            className={`crm-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => handleNavClick('leads')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <i className="fa-solid fa-user-tag"></i>
            <span>Job Seekers Queue</span>
          </div>

          {/* 4. Collapsible Pipeline (Excel) Nav Item */}
          <div className={`crm-nav-item-wrapper ${isPipelineMenuCollapsed ? 'collapsed' : ''}`} id="pipeline-nav-wrapper">
            <div
              className={`crm-nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
              id="pipeline-menu-toggle"
              onClick={(e) => {
                handleNavClick('pipeline');
                togglePipelineSubmenu(e);
              }}
              style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fa-solid fa-table-cells"></i>
                <span>Pipeline (Excel)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="subitem-pill" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.45rem', borderRadius: '9999px', color: '#fff', fontWeight: 600 }}>
                  {pipelineStageCounts.all || 0}
                </span>
                <i
                  className="fa-solid fa-chevron-down crm-submenu-toggle-icon"
                  style={{
                    transform: isPipelineMenuCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease'
                  }}
                ></i>
              </div>
            </div>

            {/* Pipeline Stage Submenu */}
            <div className={`crm-nav-submenu ${isPipelineMenuCollapsed ? 'collapsed' : ''}`} id="pipeline-nav-submenu">
              {pipelineSubmenuItems.map(sub => {
                const isSubActive = activeTab === 'pipeline' && activePipelineStage === sub.key;
                return (
                  <div
                    key={sub.key}
                    className={`crm-nav-subitem ${isSubActive ? 'active' : ''}`}
                    onClick={(e) => handlePipelineSubClick(e, sub.key)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <i className={`fa-solid ${sub.icon}`} style={{ fontSize: '0.75rem', width: '16px', textAlign: 'center' }}></i>
                      <span>{sub.name}</span>
                    </span>
                    <span className="subitem-pill">{sub.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Follow-ups (with pink/red circular badge) */}
          <div
            className={`crm-nav-item ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => handleNavClick('followups')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <i className="fa-solid fa-calendar-check"></i>
            <span>Follow-ups</span>
            {metrics.followupsDue > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#f43f5e',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(244, 63, 94, 0.4)'
                }}
              >
                {metrics.followupsDue}
              </span>
            )}
          </div>

          {/* 6. Team Management (Admin/Manager) */}
          {isAdminOrMgr && (
            <div
              className={`crm-nav-item ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => handleNavClick('team')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <i className="fa-solid fa-users-gear"></i>
              <span>Team Management</span>
            </div>
          )}

          {/* 7. Activity Log */}
          <div
            className={`crm-nav-item ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => handleNavClick('activities')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Activity Log</span>
          </div>

          {/* 8. Reports & Analytics (Admin/Manager) */}
          {isAdminOrMgr && (
            <div
              className={`crm-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => handleNavClick('reports')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <i className="fa-solid fa-chart-pie"></i>
              <span>Reports & Analytics</span>
            </div>
          )}

          {/* 9. Import Leads (Admin/Manager) */}
          {isAdminOrMgr && (
            <div
              className="crm-nav-item"
              onClick={() => {
                setIsImportModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <i className="fa-solid fa-file-import"></i>
              <span>Import Leads</span>
            </div>
          )}

          {/* 10. Message Templates (Admin/Manager) */}
          {isAdminOrMgr && (
            <div
              className="crm-nav-item"
              onClick={() => {
                setIsTemplatesModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <i className="fa-solid fa-envelope-open-text"></i>
              <span>Message Templates</span>
              <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                Admin/Mgr
              </span>
            </div>
          )}

          {/* 11. System Settings (Admin/Manager) */}
          {isAdminOrMgr && (
            <div
              className={`crm-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <i className="fa-solid fa-sliders"></i>
              <span>System Settings</span>
            </div>
          )}
        </div>

        {/* Sidebar Footer with User Profile and Sign Out Button */}
        <div className="crm-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-500)' }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
                {currentUser.role}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => addToast('Session locked. Click persona switcher in header to change user.', 'info')}
            style={{ width: '100%', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem' }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
