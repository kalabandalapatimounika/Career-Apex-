import React from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  TrendingUp,
  LayoutDashboard,
  Users,
  Kanban,
  CalendarCheck,
  History,
  X,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    scopedLeads
  } = useCRM();

  const navItems = [
    {
      key: 'dashboard',
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'leads',
      label: 'Job Seekers Queue',
      icon: Users,
      badge: scopedLeads.length
    },
    {
      key: 'pipeline',
      label: 'Counseling Pipeline',
      icon: Kanban,
      badge: scopedLeads.filter(l => l.stage !== 'Enrolled' && l.stage !== 'Lost').length
    },
    {
      key: 'followups',
      label: 'Follow-ups & Tasks',
      icon: CalendarCheck,
      badge: scopedLeads.filter(l => l.stage === 'Follow-up' || l.nextFollowup).length,
      badgeColor: 'badge-priority-high'
    },
    {
      key: 'activities',
      label: 'Counseling Log',
      icon: History
    }
  ];

  const handleNavClick = (tabKey) => {
    setActiveTab(tabKey);
    setIsMobileMenuOpen(false); // Close mobile drawer when link clicked
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`crm-sidebar-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <aside className={`crm-sidebar ${isMobileMenuOpen ? 'open' : ''}`} id="crm-sidebar">
        {/* Brand Header */}
        <div className="crm-sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="crm-brand-logo" style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <TrendingUp size={22} />
            </div>
            <div className="crm-brand-info">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Career Apex</h2>
              <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', display: 'block', marginTop: '1px' }}>Placement & Counseling CRM</span>
            </div>
          </div>

          {/* Close button on mobile */}
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

        {/* Navigation items */}
        <div className="crm-nav-wrapper">
          <div className="crm-nav-section-title" style={{ padding: '0.75rem 1rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)', letterSpacing: '0.05em' }}>
            Operations Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <div
                key={item.key}
                className={`crm-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.key)}
                style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`badge ${item.badgeColor || ''}`}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      color: '#fff'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer with Active Persona info */}
        <div className="crm-sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-500)' }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                {currentUser.title}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
