import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { BarChart3, TrendingUp, PieChart, Users, Award, IndianRupee } from 'lucide-react';

export const ReportsView = () => {
  const { scopedLeads, metrics, stages } = useCRM();

  // Source breakdown
  const sources = [
    'Website Inquiry',
    'LinkedIn',
    'College Seminar',
    'Campus Placement Cell',
    'Job Portal / Naukri',
    'Instagram Ad',
    'Cold Calling / Raw Database'
  ];

  const sourceData = sources.map(src => {
    const total = scopedLeads.filter(l => l.source === src).length;
    const enrolled = scopedLeads.filter(l => l.source === src && l.stage === 'Enrolled').length;
    return { src, total, enrolled };
  });

  return (
    <div className="reports-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="crm-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
          Admissions & Revenue Analytics
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Conversion velocity, lead acquisition channels, and course fee collection performance.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Pipeline Volume
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
            {metrics.total} Inquiries
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Active pool in CRM</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Placement Track Conversion
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-solid)', margin: '0.25rem 0' }}>
            {metrics.conversionRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{metrics.enrolled} confirmed enrollments</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Course Fees Realized
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-600)', margin: '0.25rem 0' }}>
            ₹{(metrics.collectedValue / 1000).toFixed(0)}k
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Out of ₹{(metrics.totalValue / 100000).toFixed(1)}L projected</div>
        </div>
      </div>

      {/* Acquisition Channel Breakdown */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 1rem 0' }}>
          Lead Acquisition Channel Performance
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sourceData.map(item => {
            const pct = metrics.total > 0 ? Math.round((item.total / metrics.total) * 100) : 0;
            return (
              <div key={item.src}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{item.src}</span>
                  <span style={{ color: 'var(--slate-500)' }}>
                    <strong>{item.total}</strong> inquiries ({item.enrolled} enrolled • {pct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--slate-100)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary-600)', borderRadius: '999px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
