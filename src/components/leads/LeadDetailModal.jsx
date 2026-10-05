import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  X,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  IndianRupee,
  Clock,
  User,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const LeadDetailModal = () => {
  const {
    selectedLead,
    setSelectedLead,
    updateLead,
    updateLeadStage,
    stages,
    users
  } = useCRM();

  const [newNote, setNewNote] = useState('');
  const [newFollowup, setNewFollowup] = useState(selectedLead?.nextFollowup || '');

  if (!selectedLead) return null;

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    updateLead(selectedLead.id, { newNote: newNote.trim() });
    setNewNote('');
  };

  const handleUpdateFollowup = () => {
    updateLead(selectedLead.id, { nextFollowup: newFollowup });
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CA';
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
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedLead(null);
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        {/* Modal Top Profile Bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#fff',
                boxShadow: '0 4px 12px var(--primary-glow)'
              }}
            >
              {getInitials(selectedLead.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  {selectedLead.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: '#e2e8f0',
                    fontWeight: 600
                  }}
                >
                  {selectedLead.id}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', margin: '0.2rem 0 0 0' }}>
                {selectedLead.qualification} • {selectedLead.college} (Passout {selectedLead.passoutYear})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href={`tel:${selectedLead.mobile.replace(/\s+/g, '')}`}
              className="btn btn-secondary btn-sm"
              style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <Phone size={14} /> Call
            </a>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedLead(null)}
              style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          className="modal-body"
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Quick Stage and Counselor Control Bar */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'center'
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Current Counseling Stage
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedLead.stage}
                onChange={(e) => updateLeadStage(selectedLead.id, e.target.value)}
                style={{ fontWeight: 700, fontSize: '0.85rem' }}
              >
                {stages.map(st => (
                  <option key={st.key} value={st.key}>{st.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Assigned Career Counselor
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedLead.assignedTo}
                onChange={(e) => updateLead(selectedLead.id, { assignedTo: e.target.value })}
                style={{ fontWeight: 600, fontSize: '0.85rem' }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                Next Follow-up Due
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="datetime-local"
                  className="form-control form-control-sm"
                  value={newFollowup}
                  onChange={(e) => setNewFollowup(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleUpdateFollowup}
                  style={{ padding: '0.25rem 0.6rem' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Details Overview Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Target Role</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>
                {selectedLead.targetRole}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                {selectedLead.courseInterest}
              </div>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Contact Info</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-900)', marginTop: '0.2rem' }}>
                {selectedLead.mobile}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                {selectedLead.email}
              </div>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Admissions Fee</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success-solid)', marginTop: '0.2rem' }}>
                ₹{selectedLead.expectedFee ? selectedLead.expectedFee.toLocaleString() : '50,000'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                Paid: ₹{selectedLead.paidFee ? selectedLead.paidFee.toLocaleString() : '0'}
              </div>
            </div>
          </div>

          {/* Consultation Log / Call Notes Input */}
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
              Log Counseling Session / Call Notes
            </h4>
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Log discussion notes, student concerns, agreed next steps..."
                className="form-control"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
              >
                <Send size={14} /> Add Note
              </button>
            </form>
          </div>

          {/* Activity & Counseling History Timeline */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.85rem' }}>
              Counseling Activity History
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-light)' }}>
              {(selectedLead.history || []).map((item, idx) => (
                <div key={idx} style={{ position: 'relative', paddingLeft: '1rem' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '-1.35rem',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-600)'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                    {item.date} • {item.user}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-700)', marginTop: '0.15rem' }}>
                    {item.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedLead(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
