import React from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  CalendarCheck,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap
} from 'lucide-react';

export const FollowupsView = () => {
  const {
    scopedLeads,
    updateLead,
    setSelectedLead,
    addToast
  } = useCRM();

  const nowStr = new Date().toISOString().slice(0, 10);

  // Group follow-ups
  const leadsWithFollowup = scopedLeads.filter(l => l.nextFollowup && l.stage !== 'Enrolled' && l.stage !== 'Lost');

  const overdue = leadsWithFollowup.filter(l => l.nextFollowup.slice(0, 10) < nowStr);
  const today = leadsWithFollowup.filter(l => l.nextFollowup.slice(0, 10) === nowStr);
  const upcoming = leadsWithFollowup.filter(l => l.nextFollowup.slice(0, 10) > nowStr);

  const handleMarkComplete = (lead) => {
    updateLead(lead.id, {
      nextFollowup: '',
      newNote: `Follow-up completed on ${new Date().toLocaleDateString()}.`
    });
    addToast(`Follow-up with ${lead.name} marked as completed!`, 'success');
  };

  return (
    <div className="followups-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="crm-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
          Follow-ups & Consultation Tasks
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Schedule of candidate phone calls, syllabus delivery, and scholarship decision dates.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Overdue Section */}
        {overdue.length > 0 && (
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--danger-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger-solid)' }}>
              <AlertCircle size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Overdue Follow-ups ({overdue.length})
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {overdue.map(lead => (
                <div
                  key={lead.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--danger-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--danger-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)', cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                        {lead.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--danger-solid)', fontWeight: 700 }}>
                        {lead.nextFollowup.replace('T', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                      {lead.college} • {lead.targetRole}
                    </div>
                    {lead.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        "{lead.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.5rem' }}>
                    <a href={`tel:${lead.mobile.replace(/\s+/g, '')}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      <Phone size={13} /> Call
                    </a>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleMarkComplete(lead)} style={{ flex: 1, justifyContent: 'center' }}>
                      <CheckCircle size={13} /> Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Follow-ups */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary-600)' }}>
            <CalendarCheck size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Scheduled for Today ({today.length})
            </h3>
          </div>

          {today.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
              No follow-ups due today.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {today.map(lead => (
                <div
                  key={lead.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--slate-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)', cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                        {lead.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-600)', fontWeight: 700 }}>
                        {lead.nextFollowup.replace('T', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                      {lead.college} • {lead.targetRole}
                    </div>
                    {lead.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        "{lead.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                    <a href={`tel:${lead.mobile.replace(/\s+/g, '')}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      <Phone size={13} /> Call
                    </a>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleMarkComplete(lead)} style={{ flex: 1, justifyContent: 'center' }}>
                      <CheckCircle size={13} /> Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={20} style={{ color: 'var(--slate-500)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
              Upcoming Future Consultations ({upcoming.length})
            </h3>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
              No upcoming future follow-ups scheduled.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {upcoming.map(lead => (
                <div
                  key={lead.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)', cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                        {lead.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                        {lead.nextFollowup.replace('T', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                      {lead.college} • {lead.targetRole}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedLead(lead)} style={{ flex: 1, justifyContent: 'center' }}>
                      View Details
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleMarkComplete(lead)} style={{ flex: 1, justifyContent: 'center' }}>
                      <CheckCircle size={13} /> Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
