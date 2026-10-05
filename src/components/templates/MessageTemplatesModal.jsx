import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, MessageSquare, Copy, Check, Send } from 'lucide-react';

export const MessageTemplatesModal = () => {
  const { isTemplatesModalOpen, setIsTemplatesModalOpen, addToast } = useCRM();
  const [copiedId, setCopiedId] = useState(null);

  if (!isTemplatesModalOpen) return null;

  const templates = [
    {
      id: 'tpl-1',
      title: 'WhatsApp: Webinar Invitation & Syllabus Link',
      channel: 'WhatsApp',
      body: 'Hi [Candidate Name]! 👋 Thank you for your inquiry with Career Apex. We reviewed your profile in [Degree/College] and recommend our placement mentorship track for [Target Role]. Here is the detailed curriculum & placement record: https://career-apex.local/syllabus. When is a good time for a 10-minute counselor call?'
    },
    {
      id: 'tpl-2',
      title: 'WhatsApp: 1-on-1 Career Consultation Reminder',
      channel: 'WhatsApp',
      body: 'Dear [Candidate Name], your career roadmap consultation with senior placement advisor is scheduled today at [Time]. Please be ready with your academic details and resume. Call link: https://meet.career-apex.local/counseling'
    },
    {
      id: 'tpl-3',
      title: 'Email: Admissions Offer & Scholarship Confirmation',
      channel: 'Email',
      body: 'Dear [Candidate Name],\n\nCongratulations! Based on your evaluation, the admissions committee has confirmed your seat for the upcoming Career Transition Cohort with a scholarship deduction.\n\nCourse Track: [Target Role] Masterclass\nDuration: 6 Months (with 100% Placement Support)\nConfirmed Fee: ₹[Amount]\n\nPlease complete your registration token to lock your batch seat: https://career-apex.local/enroll\n\nWarm regards,\nAdmissions Team, Career Apex'
    },
    {
      id: 'tpl-4',
      title: 'WhatsApp: Post-Call Follow-up & Parent Q&A',
      channel: 'WhatsApp',
      body: 'Hi [Candidate Name], great speaking with you today regarding your goals in [Target Role]. We understand your family is evaluating options. Feel free to connect your parents with our Lead Counselor at +91 98200 11223 anytime.'
    }
  ];

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Template copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
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
        if (e.target === e.currentTarget) setIsTemplatesModalOpen(false);
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Counseling Message Templates
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', margin: 0 }}>
                Pre-approved WhatsApp & Email communication scripts for faster candidate follow-ups
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsTemplatesModalOpen(false)}
            style={{ padding: '0.35rem', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {templates.map(tpl => (
            <div
              key={tpl.id}
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                backgroundColor: 'var(--slate-50)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.68rem',
                      backgroundColor: tpl.channel === 'WhatsApp' ? '#dcfce7' : '#eff6ff',
                      color: tpl.channel === 'WhatsApp' ? '#15803d' : '#1d4ed8'
                    }}
                  >
                    {tpl.channel}
                  </span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--slate-900)' }}>{tpl.title}</strong>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(tpl.id, tpl.body)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check size={13} style={{ color: 'var(--success-solid)' }} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy Script
                    </>
                  )}
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--slate-700)', whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', lineHeight: 1.45 }}>
                {tpl.body}
              </div>
            </div>
          ))}
        </div>

        <div
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsTemplatesModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
