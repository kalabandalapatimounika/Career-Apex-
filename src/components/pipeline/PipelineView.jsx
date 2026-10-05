import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Table,
  Kanban,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  RotateCcw,
  Search,
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Filter
} from 'lucide-react';

export const PipelineView = () => {
  const {
    scopedLeads,
    stages,
    users,
    activePipelineStage,
    setActivePipelineStage,
    updateLeadStage,
    deleteLead,
    setSelectedLead,
    setIsAddModalOpen,
    setIsImportModalOpen,
    pipelineStageCounts,
    addToast
  } = useCRM();

  // View Mode: 'excel' (Spreadsheet) or 'kanban' (Cards)
  const [viewMode, setViewMode] = useState('excel');

  // Excel Toolbar Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYop, setFilterYop] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCounselor, setFilterCounselor] = useState('all');
  const [filterFeeStatus, setFilterFeeStatus] = useState('all');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return scopedLeads.filter(lead => {
      // Stage Filter
      if (activePipelineStage !== 'all' && lead.stage !== activePipelineStage) {
        return false;
      }
      // Year of Passing Filter
      if (filterYop !== 'all' && String(lead.passoutYear) !== filterYop) {
        return false;
      }
      // Priority Filter
      if (filterPriority !== 'all' && lead.priority !== filterPriority) {
        return false;
      }
      // Counselor Filter
      if (filterCounselor !== 'all' && lead.assignedTo !== filterCounselor) {
        return false;
      }
      // Fee Status Filter
      if (filterFeeStatus !== 'all' && lead.feeStatus !== filterFeeStatus) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          lead.name.toLowerCase().includes(q) ||
          lead.id.toLowerCase().includes(q) ||
          (lead.qualification && lead.qualification.toLowerCase().includes(q)) ||
          (lead.college && lead.college.toLowerCase().includes(q)) ||
          (lead.skills && lead.skills.toLowerCase().includes(q)) ||
          (lead.targetRole && lead.targetRole.toLowerCase().includes(q)) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.mobile && lead.mobile.includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [scopedLeads, activePipelineStage, filterYop, filterPriority, filterCounselor, filterFeeStatus, searchQuery]);

  // Financial aggregates for the status bar
  const totalEstimatedRevenue = useMemo(() => {
    return filteredLeads.reduce((acc, l) => acc + (l.expectedFee || 0), 0);
  }, [filteredLeads]);

  const totalCollectedFee = useMemo(() => {
    return filteredLeads.reduce((acc, l) => acc + (l.paidFee || 0), 0);
  }, [filteredLeads]);

  // Stage Buttons Array
  const stagePills = [
    { key: 'all', label: 'All Leads', count: pipelineStageCounts.all || 0, icon: 'fa-layer-group' },
    ...stages.map(st => ({
      key: st.key,
      label: st.label,
      count: pipelineStageCounts[st.key] || 0,
      icon: st.icon
    }))
  ];

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      addToast('No leads in current pipeline view to export', 'error');
      return;
    }
    const headers = [
      'Lead ID,Lead Name,Qualification,College,YOP,Key Skills,Target Role,Exp,Mobile,Stage,Priority,Status,Expected Fee,Paid Fee,Fee Status,Counselor,City,Next Follow-up'
    ];
    const rows = filteredLeads.map(l => [
      `"${l.id}"`,
      `"${l.name}"`,
      `"${l.qualification || ''}"`,
      `"${l.college || ''}"`,
      l.passoutYear,
      `"${l.skills || ''}"`,
      `"${l.targetRole || ''}"`,
      `"${l.exp || 'Fresher'}"`,
      `"${l.mobile}"`,
      `"${l.stage}"`,
      `"${l.priority}"`,
      `"${l.status || 'Active'}"`,
      l.expectedFee || 0,
      l.paidFee || 0,
      `"${l.feeStatus || 'Pending'}"`,
      `"${l.counselorName || ''}"`,
      `"${l.city || ''}"`,
      `"${l.nextFollowup || ''}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pipeline_excel_${activePipelineStage}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filteredLeads.length} leads to Excel/CSV`, 'success');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterYop('all');
    setFilterPriority('all');
    setFilterCounselor('all');
    setFilterFeeStatus('all');
    addToast('Filters reset', 'info');
  };

  const activeStageLabel = activePipelineStage === 'all'
    ? 'All Candidates'
    : (stages.find(s => s.key === activePipelineStage)?.label || activePipelineStage);

  return (
    <div className="pipeline-excel-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Top Header Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em', margin: 0 }}>
              Lead Pipeline
            </h1>
            <span className="badge badge-priority-medium" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
              {activeStageLabel} ({filteredLeads.length})
            </span>
          </div>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', margin: '0.15rem 0 0 0' }}>
            Excel-style spreadsheet view tracking leads, qualifications, career stages, counselor assignments, and placement follow-ups.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Toggle (Excel vs Kanban) */}
          <div style={{ display: 'flex', background: 'var(--slate-200)', padding: '0.2rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => setViewMode('excel')}
              style={{
                border: 'none',
                background: viewMode === 'excel' ? '#fff' : 'transparent',
                color: viewMode === 'excel' ? 'var(--primary-600)' : 'var(--slate-600)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: viewMode === 'excel' ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <FileSpreadsheet size={14} /> Excel View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                border: 'none',
                background: viewMode === 'kanban' ? '#fff' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--primary-600)' : 'var(--slate-600)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: viewMode === 'kanban' ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Kanban size={14} /> Kanban
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsImportModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Upload size={14} style={{ color: 'var(--primary-600)' }} /> Import Excel
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} style={{ color: '#107c41' }} /> Export Excel / CSV
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Stage Pill Tabs (Excel Sheet Switcher Buttons) */}
      <div
        className="stage-pill-bar"
        style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.65rem',
          marginBottom: '1rem',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {stagePills.map(st => {
          const isActive = activePipelineStage === st.key;
          return (
            <button
              key={st.key}
              type="button"
              className={`stage-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActivePipelineStage(st.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                background: isActive ? 'var(--primary-gradient)' : '#fff',
                border: isActive ? '1px solid transparent' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--slate-700)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-xs)'
              }}
            >
              <i className={`fa-solid ${st.icon}`} style={{ fontSize: '0.75rem', opacity: isActive ? 1 : 0.8 }}></i>
              <span>{st.label}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                  color: isActive ? '#fff' : 'var(--slate-600)'
                }}
              >
                {st.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Excel Spreadsheet Container */}
      <div className="excel-spreadsheet-container" style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Excel Toolbar & Filter Ribbon */}
        <div className="excel-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', fontSize: '0.8rem' }}></i>
              <input
                type="text"
                id="excel-search"
                className="form-control"
                placeholder="Filter by name, degree, college, skills, role, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem 0.45rem 2.25rem', height: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* YOP Filter */}
            <select
              className="form-select form-select-sm"
              value={filterYop}
              onChange={(e) => setFilterYop(e.target.value)}
              style={{ fontSize: '0.8rem', width: '130px', height: '36px' }}
            >
              <option value="all">All Passing Years</option>
              <option value="2026">2026 (Final Yr)</option>
              <option value="2025">2025 (Grad)</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>

            {/* Priority Filter */}
            <select
              className="form-select form-select-sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ fontSize: '0.8rem', width: '120px', height: '36px' }}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Counselor Filter */}
            <select
              className="form-select form-select-sm"
              value={filterCounselor}
              onChange={(e) => setFilterCounselor(e.target.value)}
              style={{ fontSize: '0.8rem', width: '150px', height: '36px' }}
            >
              <option value="all">All Counselors</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            {/* Fee Status Filter */}
            <select
              className="form-select form-select-sm"
              value={filterFeeStatus}
              onChange={(e) => setFilterFeeStatus(e.target.value)}
              style={{ fontSize: '0.8rem', width: '135px', height: '36px' }}
            >
              <option value="all">All Fee Statuses</option>
              <option value="Fully Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Reset Filter Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ height: '36px', padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
              title="Reset Filters"
            >
              <RotateCcw size={13} style={{ marginRight: '0.25rem' }} /> Reset
            </button>
          </div>
        </div>

        {/* View Mode: Excel Spreadsheet View */}
        {viewMode === 'excel' && (
          <div className="excel-sheet-viewport">
            <table className="table-excel" id="excel-pipeline-table">
              <thead>
                <tr>
                  <th className="row-index-header">#</th>
                  <th>Lead ID</th>
                  <th>Lead Name</th>
                  <th>Degree / Qualification</th>
                  <th>College / University</th>
                  <th>YOP</th>
                  <th>Key Skills</th>
                  <th>Target Role</th>
                  <th>Exp</th>
                  <th>Mobile Phone</th>
                  <th>Quick Connect</th>
                  <th>Pipeline Stage</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Estimated Revenue</th>
                  <th>Placement Fee</th>
                  <th>Career Counselor</th>
                  <th>City / Location</th>
                  <th>Next Follow-up</th>
                  <th style={{ position: 'sticky', right: 0, backgroundColor: '#f1f5f9', zIndex: 15, textAlign: 'center' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={20} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                      <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: 'var(--slate-300)' }}></i>
                      <div style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.95rem' }}>
                        No candidate leads found matching active criteria
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                        Try changing the stage filter tab or clearing search keywords.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => {
                    const priorityClass =
                      lead.priority === 'High' ? 'badge-priority-high' :
                      lead.priority === 'Medium' ? 'badge-priority-medium' :
                      'badge-priority-low';

                    const feeStatusClass =
                      lead.feeStatus === 'Fully Paid' ? 'badge-stage-won' :
                      lead.feeStatus === 'Partially Paid' ? 'badge-stage-negotiation' :
                      'badge-stage-new';

                    return (
                      <tr key={lead.id}>
                        {/* Row Index */}
                        <td className="row-index-cell">{index + 1}</td>

                        {/* Lead ID */}
                        <td>
                          <span
                            onClick={() => setSelectedLead(lead)}
                            style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)', cursor: 'pointer' }}
                          >
                            {lead.id}
                          </span>
                        </td>

                        {/* Lead Name */}
                        <td>
                          <strong
                            onClick={() => setSelectedLead(lead)}
                            style={{ color: 'var(--slate-900)', cursor: 'pointer', transition: 'color 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-600)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--slate-900)'}
                          >
                            {lead.name}
                          </strong>
                        </td>

                        {/* Degree */}
                        <td style={{ color: 'var(--slate-700)' }}>{lead.qualification || '—'}</td>

                        {/* College */}
                        <td style={{ color: 'var(--slate-700)' }}>{lead.college || '—'}</td>

                        {/* YOP */}
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{lead.passoutYear || '—'}</td>

                        {/* Key Skills */}
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.skills}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>{lead.skills || '—'}</span>
                        </td>

                        {/* Target Role */}
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{lead.targetRole || '—'}</span>
                        </td>

                        {/* Exp */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)', fontSize: '0.7rem' }}>
                            {lead.exp || 'Fresher'}
                          </span>
                        </td>

                        {/* Mobile Phone */}
                        <td>
                          <a href={`tel:${lead.mobile.replace(/\s+/g, '')}`} style={{ color: 'var(--slate-700)', textDecoration: 'none', fontWeight: 500 }}>
                            {lead.mobile}
                          </a>
                        </td>

                        {/* Quick Connect */}
                        <td>
                          <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                            <a
                              href={`tel:${lead.mobile.replace(/\s+/g, '')}`}
                              className="cell-action-btn"
                              title="Phone Call"
                              style={{ color: 'var(--primary-600)' }}
                            >
                              <Phone size={12} />
                            </a>
                            <a
                              href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="cell-action-btn"
                              title="WhatsApp Chat"
                              style={{ color: '#25D366' }}
                            >
                              <MessageCircle size={12} />
                            </a>
                          </div>
                        </td>

                        {/* Pipeline Stage (1-click inline dropdown) */}
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={lead.stage}
                            onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.45rem',
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
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${priorityClass}`} style={{ fontSize: '0.68rem' }}>
                            {lead.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: lead.stage === 'Enrolled' ? 'var(--success-bg)' : lead.stage === 'Lost' || lead.stage === 'Not Interested' ? 'var(--danger-bg)' : 'var(--info-bg)',
                              color: lead.stage === 'Enrolled' ? 'var(--success-text)' : lead.stage === 'Lost' || lead.stage === 'Not Interested' ? 'var(--danger-text)' : 'var(--info-text)'
                            }}
                          >
                            {lead.stage === 'Enrolled' ? 'Enrolled' : lead.stage === 'Lost' || lead.stage === 'Not Interested' ? 'Dropped' : 'Active'}
                          </span>
                        </td>

                        {/* Estimated Revenue */}
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{lead.expectedFee ? lead.expectedFee.toLocaleString() : '50,000'}
                        </td>

                        {/* Placement Fee Status */}
                        <td>
                          <span className={`badge ${feeStatusClass}`} style={{ fontSize: '0.68rem' }}>
                            {lead.feeStatus || 'Pending'}
                          </span>
                        </td>

                        {/* Counselor */}
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '0.78rem' }}>
                            {lead.counselorName}
                          </span>
                        </td>

                        {/* City */}
                        <td style={{ color: 'var(--slate-600)' }}>{lead.city || '—'}</td>

                        {/* Next Follow-up */}
                        <td>
                          <span style={{ fontSize: '0.75rem', color: lead.nextFollowup ? 'var(--primary-600)' : 'var(--slate-400)', fontWeight: lead.nextFollowup ? 600 : 400 }}>
                            {lead.nextFollowup ? lead.nextFollowup.replace('T', ' ') : '—'}
                          </span>
                        </td>

                        {/* Sticky Action Column */}
                        <td style={{ position: 'sticky', right: 0, backgroundColor: '#fff', textAlign: 'center', zIndex: 12 }}>
                          <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                            <button
                              type="button"
                              className="cell-action-btn"
                              onClick={() => setSelectedLead(lead)}
                              title="View 360° Candidate Profile"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              className="cell-action-btn"
                              onClick={() => {
                                if (window.confirm(`Delete lead ${lead.name}?`)) {
                                  deleteLead(lead.id);
                                }
                              }}
                              title="Delete Lead"
                              style={{ color: 'var(--danger-solid)' }}
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
        )}

        {/* View Mode: Kanban Cards View */}
        {viewMode === 'kanban' && (
          <div
            style={{
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              overflowX: 'auto',
              minHeight: 'calc(100vh - 350px)',
              WebkitOverflowScrolling: 'touch',
              backgroundColor: 'var(--slate-50)'
            }}
          >
            {stages.map((st, idx) => {
              const colLeads = filteredLeads.filter(l => l.stage === st.key);
              return (
                <div
                  key={st.key}
                  style={{
                    width: '290px',
                    minWidth: '290px',
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'calc(100vh - 360px)',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '2px solid',
                      borderColor: st.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className={`fa-solid ${st.icon}`} style={{ color: st.color, fontSize: '0.8rem' }}></i>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--slate-900)' }}>{st.label}</strong>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--slate-100)', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                      {colLeads.length}
                    </span>
                  </div>

                  <div style={{ padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                    {colLeads.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.78rem' }}>
                        No leads
                      </div>
                    ) : (
                      colLeads.map(lead => (
                        <div
                          key={lead.id}
                          className="card"
                          style={{
                            padding: '0.75rem',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-xs)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-600)' }}>{lead.id}</span>
                            <span className={`badge ${lead.priority === 'High' ? 'badge-priority-high' : 'badge-priority-medium'}`} style={{ fontSize: '0.62rem' }}>
                              {lead.priority}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>{lead.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                            {lead.qualification} • {lead.college}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-700)', fontWeight: 600, marginTop: '0.25rem' }}>
                            {lead.targetRole}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{lead.counselorName}</span>
                            <div style={{ display: 'flex', gap: '0.2rem' }} onClick={(e) => e.stopPropagation()}>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => updateLeadStage(lead.id, stages[idx - 1].key)}
                                  style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }}
                                  title="Previous Stage"
                                >
                                  <ArrowLeft size={11} />
                                </button>
                              )}
                              {idx < stages.length - 1 && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => updateLeadStage(lead.id, stages[idx + 1].key)}
                                  style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }}
                                  title="Next Stage"
                                >
                                  <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Excel Sheet Status Bar */}
        <div className="excel-status-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span><i className="fa-solid fa-check" style={{ color: 'var(--success-solid)', marginRight: '0.35rem' }}></i> READY</span>
            <span>Showing: <strong id="status-row-count">{filteredLeads.length}</strong> leads</span>
            <span id="status-stage-label" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
              Stage: {activeStageLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span>Est. Pipeline: <strong style={{ color: 'var(--slate-900)' }}>₹{(totalEstimatedRevenue / 100000).toFixed(2)}L</strong></span>
            <span>Fee Collected: <strong style={{ color: 'var(--success-solid)' }}>₹{(totalCollectedFee / 1000).toFixed(0)}k</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
