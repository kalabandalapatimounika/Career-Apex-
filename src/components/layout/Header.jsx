import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Menu,
  Search,
  Plus,
  UserCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Phone,
  GraduationCap
} from 'lucide-react';

export const Header = () => {
  const {
    currentUser,
    users,
    switchPersona,
    resetDemoData,
    setIsAddModalOpen,
    setIsMobileMenuOpen,
    leads,
    setSelectedLead
  } = useCRM();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Live search filtered results
  const searchResults = searchQuery.trim() === '' ? [] : leads.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.college && l.college.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.qualification && l.qualification.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.mobile && l.mobile.includes(searchQuery))
  ).slice(0, 5);

  const handleSelectSearchResult = (lead) => {
    setSelectedLead(lead);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="crm-top-header" id="crm-header" style={{ position: 'relative' }}>
      {/* Mobile Drawer Hamburger Button */}
      <button
        type="button"
        className="btn btn-secondary crm-sidebar-toggle-btn show-mobile-only"
        onClick={() => setIsMobileMenuOpen(prev => !prev)}
        style={{ display: 'inline-flex', padding: '0.45rem', marginRight: '0.5rem', cursor: 'pointer' }}
        aria-label="Toggle navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Global Quick Search */}
      <div className="crm-header-search" style={{ position: 'relative', flex: '1', maxWidth: '380px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search student, roll ID, college, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            style={{ paddingLeft: '2.4rem', height: '38px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}
          />
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div
            className="card"
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              right: 0,
              zIndex: 1000,
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: '#fff',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
              Matched Student Leads
            </div>
            {searchResults.map(lead => (
              <div
                key={lead.id}
                onClick={() => handleSelectSearchResult(lead)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-50)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-900)' }}>{lead.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {lead.id} • {lead.college} • {lead.qualification}
                  </div>
                </div>
                <span className={`badge badge-stage-${lead.stage.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                  {lead.stage}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="crm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
        {/* Add Lead Primary CTA Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <Plus size={16} />
          <span className="hide-mobile">+ New Lead</span>
        </button>

        {/* Demo Persona Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsPersonaOpen(prev => !prev)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Switch Demo Role"
          >
            <UserCheck size={15} />
            <span className="hide-mobile">Role: {currentUser.role.toUpperCase()}</span>
            <ChevronDown size={14} />
          </button>

          {isPersonaOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                width: '280px',
                zIndex: 1100,
                boxShadow: 'var(--shadow-xl)',
                padding: '0.75rem',
                backgroundColor: '#fff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '0.5rem', padding: '0.2rem 0.4rem' }}>
                1-Click Demo Persona
              </div>
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    switchPersona(u.email);
                    setIsPersonaOpen(false);
                  }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    cursor: 'pointer',
                    backgroundColor: currentUser.email === u.email ? 'var(--primary-50)' : 'transparent',
                    marginBottom: '0.35rem'
                  }}
                  onMouseEnter={(e) => {
                    if (currentUser.email !== u.email) e.currentTarget.style.backgroundColor = 'var(--slate-100)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentUser.email !== u.email) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-900)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.title}</div>
                  </div>
                  <span className={`badge badge-role-${u.role}`} style={{ fontSize: '0.65rem' }}>{u.role}</span>
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '0.6rem', paddingTop: '0.6rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    resetDemoData();
                    setIsPersonaOpen(false);
                  }}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--danger-solid)' }}
                >
                  <RotateCcw size={14} style={{ marginRight: '0.35rem' }} /> Reset Demo Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current User Avatar Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-full)', background: 'var(--slate-100)', border: '1px solid var(--border-light)' }}>
          <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
          <div className="hide-mobile" style={{ lineHeight: 1.2, paddingRight: '0.3rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-900)' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{currentUser.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
