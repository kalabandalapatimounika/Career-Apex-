import React from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  IndianRupee,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const AdminDashboard = () => {
  const {
    scopedLeads,
    metrics,
    stages,
    users,
    setActiveTab,
    setIsAddModalOpen,
    setSelectedLead,
    updateLeadStage
  } = useCRM();

  // Counselors summary for leaderboard
  const counselors = users.filter(u => u.role === 'sales' || u.role === 'manager');
  const counselorStats = counselors.map(c => {
    const assigned = scopedLeads.filter(l => l.assignedTo === c.id);
    const enrolled = assigned.filter(l => l.stage === 'Enrolled').length;
    const rate = assigned.length > 0 ? ((enrolled / assigned.length) * 100).toFixed(0) : 0;
    return {
      ...c,
      assignedCount: assigned.length,
      enrolledCount: enrolled,
      rate
    };
  });

  // Recent leads (up to 5)
  const recentLeads = [...scopedLeads].sort((a, b) => (b.id.localeCompare(a.id))).slice(0, 5);

  // Upcoming followups (up to 4)
  const upcomingFollowups = scopedLeads
    .filter(l => l.nextFollowup && l.stage !== 'Enrolled' && l.stage !== 'Lost')
    .slice(0, 4);

  return (
    <div className="dashboard-content" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header Strip */}
      <div className="crm-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="crm-page-title-group">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Admissions & Placement Dashboard
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Real-time candidate inquiry volume, counseling conversion, and placement analytics.
          </p>
        </div>

        <div className="crm-page-actions" style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('leads')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Users size={16} /> Job Seekers Queue
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> + New Candidate Inquiry
          </button>
        </div>
      </div>

      {/* 5-Card Responsive KPI Metrics Grid */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Inquiries */}
        <div className="kpi-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Candidates
            </div>
            <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
              {metrics.total}
            </div>
            <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={12} /> +14% vs last week
            </div>
          </div>
          <div className="kpi-icon-box" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Admissions Confirmed */}
        <div className="kpi-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Enrolled Candidates
            </div>
            <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-solid)', margin: '0.25rem 0' }}>
              {metrics.enrolled}
            </div>
            <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              {metrics.conversionRate}% conversion rate
            </div>
          </div>
          <div className="kpi-icon-box" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
        </div>

        {/* In Counseling */}
        <div className="kpi-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Counseling
            </div>
            <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning-solid)', margin: '0.25rem 0' }}>
              {metrics.interested}
            </div>
            <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              High-intent prospects
            </div>
          </div>
          <div className="kpi-icon-box" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', color: 'var(--warning-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Scheduled Follow-ups */}
        <div className="kpi-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Follow-ups
            </div>
            <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
              {metrics.followupsDue}
            </div>
            <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--danger-solid)' }}>
              Action required today
            </div>
          </div>
          <div className="kpi-icon-box" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--info-bg)', color: 'var(--info-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="kpi-card" style={{ background: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <div className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pipeline Value
            </div>
            <div className="kpi-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
              ₹{(metrics.totalValue / 100000).toFixed(1)}L
            </div>
            <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--success-solid)' }}>
              ₹{(metrics.collectedValue / 1000).toFixed(0)}k collected
            </div>
          </div>
          <div className="kpi-icon-box" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2fr (Stage breakdown & Recent Leads) + Right 1fr (Counselor targets & Followups) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stage Progress Bar Breakdown Card */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                  Candidate Pipeline Distribution
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Current status of active candidate pool</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('pipeline')}
                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Kanban View <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stages.map(st => {
                const count = scopedLeads.filter(l => l.stage === st.key).length;
                const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '130px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', flexShrink: 0 }}>
                      {st.label}
                    </div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: st.color,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                    <div style={{ width: '60px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                      {count} <span style={{ fontWeight: 400, color: 'var(--slate-400)', fontSize: '0.75rem' }}>({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Student Inquiries Table Card */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                  Recent Student Inquiries
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Latest candidate inquiries registered</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('leads')}
                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                View All ({scopedLeads.length}) <ChevronRight size={13} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--slate-500)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Candidate</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Target Role / College</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Counselor</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div
                          style={{ fontWeight: 600, color: 'var(--primary-600)', cursor: 'pointer' }}
                          onClick={() => setSelectedLead(lead)}
                        >
                          {lead.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{lead.id} • {lead.mobile}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.825rem', color: 'var(--slate-800)' }}>{lead.targetRole}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{lead.college}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <select
                          className="form-select form-select-sm"
                          value={lead.stage}
                          onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                        >
                          {stages.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                        {lead.counselorName}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedLead(lead)}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          View 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Counselor Leaderboard Card */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0, marginBottom: '0.25rem' }}>
              Counselor Performance & Targets
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block', marginBottom: '1rem' }}>
              Admissions targets & counseling conversion
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {counselorStats.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img src={c.avatar} alt={c.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-900)' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{c.assignedCount} Candidates Assigned</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--success-solid)' }}>
                      {c.enrolledCount} Enrolled
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                      {c.rate}% conv.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Follow-ups Reminder Card */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                  Upcoming Follow-ups
                </h3>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('followups')}
                style={{ fontSize: '0.72rem' }}
              >
                All Follow-ups
              </button>
            </div>

            {upcomingFollowups.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--success-solid)' }} />
                All scheduled follow-ups are up to date!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {upcomingFollowups.map(lead => (
                  <div
                    key={lead.id}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--slate-50)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div
                        style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--slate-900)', cursor: 'pointer' }}
                        onClick={() => setSelectedLead(lead)}
                      >
                        {lead.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {lead.nextFollowup ? lead.nextFollowup.replace('T', ' ') : 'Today'} • {lead.targetRole}
                      </div>
                    </div>

                    <a
                      href={`tel:${lead.mobile.replace(/\s+/g, '')}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.55rem', color: 'var(--primary-600)' }}
                      title="Call Candidate"
                    >
                      <Phone size={13} /> Call
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
