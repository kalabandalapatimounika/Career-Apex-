import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { History, Clock, User, Phone, CheckCircle2, MessageSquare } from 'lucide-react';

export const ActivitiesView = () => {
  const { scopedLeads, setSelectedLead } = useCRM();

  // Aggregate all history entries across scoped leads
  const allActivities = [];
  scopedLeads.forEach(lead => {
    (lead.history || []).forEach(h => {
      allActivities.push({
        ...h,
        leadId: lead.id,
        leadName: lead.name,
        targetRole: lead.targetRole,
        leadObj: lead
      });
    });
  });

  // Sort by date descending
  allActivities.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="activities-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="crm-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
          Admissions Counseling Activity Log
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Chronological audit trail of all candidate interactions, stage shifts, and counselor notes.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--border-light)' }}>
          {allActivities.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)' }}>
              No activities logged yet.
            </div>
          ) : (
            allActivities.map((act, index) => (
              <div key={index} style={{ position: 'relative', paddingLeft: '1.25rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.65rem',
                    top: '3px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-600)',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px var(--primary-200)'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)' }}>
                    {act.date}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>•</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                    Counselor: {act.user}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>•</span>
                  <span
                    style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-600)', cursor: 'pointer' }}
                    onClick={() => setSelectedLead(act.leadObj)}
                  >
                    Candidate: {act.leadName} ({act.leadId})
                  </span>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--slate-800)', marginTop: '0.35rem', backgroundColor: 'var(--slate-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  {act.note}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
