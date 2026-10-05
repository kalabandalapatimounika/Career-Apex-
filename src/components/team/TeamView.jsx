import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Users, Mail, Phone, ShieldCheck, Target, Award } from 'lucide-react';

export const TeamView = () => {
  const { users, scopedLeads, setSelectedLead, setActiveTab } = useCRM();

  return (
    <div className="team-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="crm-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
          Counseling Team Management
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Overview of admissions counselors, sales advisors, lead allocation, and target achievement.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {users.map(u => {
          const assigned = scopedLeads.filter(l => l.assignedTo === u.id);
          const enrolled = assigned.filter(l => l.stage === 'Enrolled').length;
          const convRate = assigned.length > 0 ? Math.round((enrolled / assigned.length) * 100) : 0;
          const revenue = enrolled * 65000;

          return (
            <div
              key={u.id}
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: '#fff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <img
                  src={u.avatar}
                  alt={u.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-100)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>{u.name}</h3>
                    <span className={`badge badge-role-${u.role}`} style={{ fontSize: '0.65rem' }}>{u.role}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>{u.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.1rem' }}>{u.email}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-lg)', textAlign: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>Leads</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>{assigned.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>Enrolled</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success-solid)' }}>{enrolled}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>Conv. Rate</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-600)' }}>{convRate}%</div>
                </div>
              </div>

              {/* Target Achievement Bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--slate-600)', fontWeight: 600 }}>Monthly Admission Target (10)</span>
                  <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{enrolled * 10}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, enrolled * 10)}%`, height: '100%', backgroundColor: 'var(--primary-600)', borderRadius: '999px' }} />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('pipeline')}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
              >
                View Assigned Pipeline ({assigned.length})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
