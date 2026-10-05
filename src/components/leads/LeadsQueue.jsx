import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  Trash2,
  UserCheck,
  Phone,
  Mail,
  GraduationCap,
  Building,
  CheckCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const LeadsQueue = () => {
  const {
    scopedLeads,
    stages,
    users,
    updateLeadStage,
    deleteLead,
    setSelectedLead,
    setIsAddModalOpen,
    setIsBulkAssignOpen,
    selectedLeadIds,
    setSelectedLeadIds,
    addToast
  } = useCRM();

  // Filters state
  const [activeStageFilter, setActiveStageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [counselorFilter, setCounselorFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter logic
  const filteredLeads = useMemo(() => {
    return scopedLeads.filter(lead => {
      // Stage tab filter
      if (activeStageFilter !== 'all' && lead.stage !== activeStageFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) {
        return false;
      }
      // Counselor filter
      if (counselorFilter !== 'all' && lead.assignedTo !== counselorFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          lead.name.toLowerCase().includes(q) ||
          lead.id.toLowerCase().includes(q) ||
          (lead.college && lead.college.toLowerCase().includes(q)) ||
          (lead.qualification && lead.qualification.toLowerCase().includes(q)) ||
          (lead.targetRole && lead.targetRole.toLowerCase().includes(q)) ||
          (lead.mobile && lead.mobile.includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [scopedLeads, activeStageFilter, priorityFilter, counselorFilter, searchQuery]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;

  // Handle Select All
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(paginatedLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  // Handle Individual Checkbox
  const handleSelectOne = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      addToast('No leads to export', 'error');
      return;
    }
    const headers = ['ID,Name,Email,Mobile,College,Degree,PassoutYear,TargetRole,Stage,Priority,Counselor,ExpectedFee'];
    const rows = filteredLeads.map(l => [
      `"${l.id}"`,
      `"${l.name}"`,
      `"${l.email}"`,
      `"${l.mobile}"`,
      `"${l.college || ''}"`,
      `"${l.qualification || ''}"`,
      l.passoutYear,
      `"${l.targetRole || ''}"`,
      `"${l.stage}"`,
      `"${l.priority}"`,
      `"${l.counselorName}"`,
      l.expectedFee
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `career_apex_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filteredLeads.length} leads to CSV`, 'success');
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to remove ${selectedLeadIds.length} candidate(s)?`)) {
      selectedLeadIds.forEach(id => deleteLead(id));
      setSelectedLeadIds([]);
    }
  };

  return (
    <div className="leads-page-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Top Header Group */}
      <div className="crm-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Job Seekers & Candidate Queue
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Central repository of student inquiries, counseling stages, and placement track assignments.
          </p>
        </div>

        <div className="crm-page-actions" style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <UserPlus size={16} /> + New Candidate
          </button>
        </div>
      </div>

      {/* Stage Tab Filter Pills (Matching kumartharun199216-hue.github.io/SalesCRM) */}
      <div
        className="nav-tabs"
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-light)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button
          type="button"
          className={`tab-btn ${activeStageFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveStageFilter('all'); setCurrentPage(1); }}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            border: activeStageFilter === 'all' ? '1px solid var(--primary-600)' : '1px solid var(--border-light)',
            backgroundColor: activeStageFilter === 'all' ? 'var(--primary-600)' : '#fff',
            color: activeStageFilter === 'all' ? '#fff' : 'var(--slate-700)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          All Candidates
          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: activeStageFilter === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--slate-100)', color: activeStageFilter === 'all' ? '#fff' : 'var(--slate-600)' }}>
            {scopedLeads.length}
          </span>
        </button>

        {stages.map(st => {
          const count = scopedLeads.filter(l => l.stage === st.key).length;
          const isActive = activeStageFilter === st.key;
          return (
            <button
              key={st.key}
              type="button"
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => { setActiveStageFilter(st.key); setCurrentPage(1); }}
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                border: isActive ? '1px solid var(--primary-600)' : '1px solid var(--border-light)',
                backgroundColor: isActive ? 'var(--primary-600)' : '#fff',
                color: isActive ? '#fff' : 'var(--slate-700)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              {st.label}
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--slate-100)', color: isActive ? '#fff' : 'var(--slate-600)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search candidate name, phone, college..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              style={{ height: '36px', fontSize: '0.85rem' }}
            >
              <option value="all">Priority: All</option>
              <option value="High">Priority: High</option>
              <option value="Medium">Priority: Medium</option>
              <option value="Low">Priority: Low</option>
            </select>
          </div>

          {/* Counselor Filter */}
          <div>
            <select
              className="form-select"
              value={counselorFilter}
              onChange={(e) => { setCounselorFilter(e.target.value); setCurrentPage(1); }}
              style={{ height: '36px', fontSize: '0.85rem' }}
            >
              <option value="all">Counselor: All Team</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Reset */}
          {(searchQuery || priorityFilter !== 'all' || counselorFilter !== 'all' || activeStageFilter !== 'all') && (
            <div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                  setCounselorFilter('all');
                  setActiveStageFilter('all');
                  setCurrentPage(1);
                }}
                style={{ height: '36px', width: '100%', justifyContent: 'center' }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {selectedLeadIds.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--slate-900)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {selectedLeadIds.length} candidate(s) selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsBulkAssignOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <UserCheck size={14} /> Assign Counselor
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                selectedLeadIds.forEach(id => updateLeadStage(id, 'Enrolled'));
                setSelectedLeadIds([]);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}
            >
              <CheckCircle size={14} /> Mark Enrolled
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleBulkDelete}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger-solid)' }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Responsive Leads Table Container */}
      <div
        className="card"
        style={{
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}
      >
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-light)', color: 'var(--slate-500)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.75rem 1rem', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.75rem 1rem' }}>Candidate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Academic Background</th>
                <th style={{ padding: '0.75rem 1rem' }}>Target Career Track</th>
                <th style={{ padding: '0.75rem 1rem' }}>Counselor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Stage / Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '0.35rem' }}>
                      No candidates match your current filter
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>Try clearing search keywords or switching stage tabs.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  const priorityClass =
                    lead.priority === 'High' ? 'badge-priority-high' :
                    lead.priority === 'Medium' ? 'badge-priority-medium' :
                    'badge-priority-low';

                  return (
                    <tr
                      key={lead.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        backgroundColor: isChecked ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(lead.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Candidate Name & Contact */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div
                          style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-600)', cursor: 'pointer' }}
                          onClick={() => setSelectedLead(lead)}
                        >
                          {lead.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <span>{lead.id}</span>
                          <span>•</span>
                          <a href={`tel:${lead.mobile.replace(/\s+/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {lead.mobile}
                          </a>
                        </div>
                      </td>

                      {/* Academic Background */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--slate-800)' }}>
                          {lead.college}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {lead.qualification} ({lead.passoutYear})
                        </div>
                      </td>

                      {/* Target Role & Course */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--slate-800)' }}>
                          {lead.targetRole}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {lead.courseInterest}
                        </div>
                      </td>

                      {/* Assigned Counselor */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                          {lead.counselorName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          {lead.source}
                        </div>
                      </td>

                      {/* Stage Dropdown (1-click inline change) */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select
                          className="form-select form-select-sm"
                          value={lead.stage}
                          onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            color: lead.stage === 'Enrolled' ? 'var(--success-solid)' : lead.stage === 'Lost' ? 'var(--danger-solid)' : 'var(--slate-800)'
                          }}
                        >
                          {stages.map(st => (
                            <option key={st.key} value={st.key}>{st.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${priorityClass}`}>
                          {lead.priority}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedLead(lead)}
                            title="360° Candidate Profile"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (window.confirm(`Delete candidate ${lead.name}?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            title="Delete Lead"
                            style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-solid)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          className="pagination-wrapper"
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Showing {filteredLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} candidates
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', padding: '0 0.5rem' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
