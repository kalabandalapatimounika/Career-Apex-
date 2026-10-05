import React from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Kanban,
  ArrowRight,
  ArrowLeft,
  Phone,
  GraduationCap,
  Calendar,
  IndianRupee,
  Plus
} from 'lucide-react';

export const PipelineView = () => {
  const {
    scopedLeads,
    stages,
    updateLeadStage,
    setSelectedLead,
    setIsAddModalOpen
  } = useCRM();

  const handleMoveStage = (leadId, currentStageKey, direction) => {
    const currentIndex = stages.findIndex(s => s.key === currentStageKey);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < stages.length) {
      updateLeadStage(leadId, stages[targetIndex].key);
    }
  };

  return (
    <div className="pipeline-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header */}
      <div className="crm-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
            Counseling & Admissions Pipeline
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Visual stage progression of prospective students through counseling and enrollment.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> + New Candidate
        </button>
      </div>

      {/* Horizontally Scrollable Kanban Columns */}
      <div
        className="pipeline-board"
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '1.5rem',
          minHeight: 'calc(100vh - 220px)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {stages.map((st, idx) => {
          const columnLeads = scopedLeads.filter(l => l.stage === st.key);
          const totalFee = columnLeads.reduce((acc, l) => acc + (l.expectedFee || 0), 0);

          return (
            <div
              key={st.key}
              style={{
                width: '300px',
                minWidth: '300px',
                backgroundColor: 'var(--slate-100)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 240px)',
                overflow: 'hidden'
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '2px solid',
                  borderColor: st.color,
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: st.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'var(--slate-100)', padding: '0.15rem 0.45rem', borderRadius: '999px', color: 'var(--slate-600)' }}>
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Fee summary sub-strip */}
              <div style={{ padding: '0.35rem 1rem', fontSize: '0.7rem', color: 'var(--slate-500)', backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-light)' }}>
                Total: ₹{(totalFee / 1000).toFixed(0)}k
              </div>

              {/* Cards Viewport */}
              <div
                style={{
                  padding: '0.75rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  flex: 1,
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {columnLeads.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                    No candidates in this stage
                  </div>
                ) : (
                  columnLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="card"
                      style={{
                        padding: '0.85rem',
                        backgroundColor: '#fff',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-xs)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                      onClick={() => setSelectedLead(lead)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-400)' }}>
                          {lead.id}
                        </span>
                        <span
                          className={`badge ${lead.priority === 'High' ? 'badge-priority-high' : lead.priority === 'Medium' ? 'badge-priority-medium' : 'badge-priority-low'}`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {lead.priority}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                        {lead.name}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                        {lead.targetRole}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '0.1rem' }}>
                        {lead.college}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                          {lead.counselorName}
                        </span>

                        {/* Stage shift arrows */}
                        <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                          {idx > 0 && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'prev')}
                              style={{ padding: '0.2rem 0.35rem', fontSize: '0.7rem' }}
                              title="Move to previous stage"
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {idx < stages.length - 1 && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'next')}
                              style={{ padding: '0.2rem 0.35rem', fontSize: '0.7rem' }}
                              title="Move to next stage"
                            >
                              <ArrowRight size={12} />
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
    </div>
  );
};
