import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, UserCheck } from 'lucide-react';

export const BulkAssignModal = () => {
  const {
    isBulkAssignOpen,
    setIsBulkAssignOpen,
    selectedLeadIds,
    bulkAssignLeads,
    users
  } = useCRM();

  const counselors = users.filter(u => u.role === 'sales' || u.role === 'manager');
  const [selectedCounselorId, setSelectedCounselorId] = useState(counselors[0]?.id || users[0].id);

  if (!isBulkAssignOpen) return null;

  const handleAssign = (e) => {
    e.preventDefault();
    bulkAssignLeads(selectedLeadIds, selectedCounselorId);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsBulkAssignOpen(false);
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Bulk Assign Candidates
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', margin: 0 }}>
                Assign {selectedLeadIds.length} candidate(s) to career counselor
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsBulkAssignOpen(false)}
            style={{ padding: '0.35rem', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleAssign}>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem', display: 'block' }}>
              Select Destination Counselor
            </label>
            <select
              className="form-select"
              value={selectedCounselorId}
              onChange={(e) => setSelectedCounselorId(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '0.6rem 0.75rem' }}
            >
              {counselors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.title}
                </option>
              ))}
            </select>

            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-100)', fontSize: '0.8rem', color: 'var(--primary-700)' }}>
              All {selectedLeadIds.length} selected candidate(s) will be transferred and their activity logs will record this assignment.
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              backgroundColor: 'var(--slate-50)'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsBulkAssignOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 600 }}
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
