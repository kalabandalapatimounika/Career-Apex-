import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, UserPlus } from 'lucide-react';

export const AddLeadModal = () => {
  const { isAddModalOpen, setIsAddModalOpen, addLead, users, stages } = useCRM();

  const counselors = users.filter(u => u.role === 'sales' || u.role === 'manager');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    college: '',
    qualification: '',
    passoutYear: new Date().getFullYear(),
    targetRole: 'Full Stack Engineer',
    courseInterest: 'Full Stack Web Development & System Design',
    assignedTo: counselors[0]?.id || users[0].id,
    stage: 'New Lead',
    priority: 'High',
    expectedFee: 60000,
    source: 'Website Inquiry',
    notes: '',
    nextFollowup: ''
  });

  if (!isAddModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      alert('Please provide candidate name and mobile number.');
      return;
    }
    addLead(formData);
    setIsAddModalOpen(false);
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
        if (e.target === e.currentTarget) setIsAddModalOpen(false);
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
          maxHeight: '92vh',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        {/* Modal Header */}
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
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Register New Candidate Inquiry
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', margin: 0 }}>
                Capture student details, career aspirations, and assign counseling advisor
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddModalOpen(false)}
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            className="modal-body"
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Row 1: Name & Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  placeholder="+91 98765 43210"
                  className="form-control"
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 2: Email & College */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="candidate@gmail.com"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  College / University
                </label>
                <input
                  type="text"
                  name="college"
                  placeholder="e.g. IIT Madras, BITS Pilani"
                  className="form-control"
                  value={formData.college}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 3: Qualification & Passout Year */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Degree / Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  placeholder="e.g. B.Tech Computer Science, MCA, BCA"
                  className="form-control"
                  value={formData.qualification}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Year of Passing
                </label>
                <input
                  type="number"
                  name="passoutYear"
                  min="2018"
                  max="2030"
                  className="form-control"
                  value={formData.passoutYear}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Row 4: Target Role & Course Track */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Target Career Role
                </label>
                <select
                  name="targetRole"
                  className="form-select"
                  value={formData.targetRole}
                  onChange={handleChange}
                >
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
                  <option value="AI / ML Engineer">AI / ML Engineer</option>
                  <option value="QA Automation Engineer">QA Automation Engineer</option>
                  <option value="Product Designer / UI-UX">Product Designer / UI-UX</option>
                  <option value="Cybersecurity Specialist">Cybersecurity Specialist</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Assigned Career Counselor
                </label>
                <select
                  name="assignedTo"
                  className="form-select"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Initial Stage & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Initial Pipeline Stage
                </label>
                <select
                  name="stage"
                  className="form-select"
                  value={formData.stage}
                  onChange={handleChange}
                >
                  {stages.map(st => (
                    <option key={st.key} value={st.key}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Lead Priority
                </label>
                <select
                  name="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Row 6: Expected Course Fee & Lead Source */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Expected Fee (₹ INR)
                </label>
                <input
                  type="number"
                  name="expectedFee"
                  className="form-control"
                  value={formData.expectedFee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                  Lead Acquisition Source
                </label>
                <select
                  name="source"
                  className="form-select"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="Website Inquiry">Website Inquiry</option>
                  <option value="LinkedIn Ad">LinkedIn Ad</option>
                  <option value="Campus Referral">Campus Referral</option>
                  <option value="College Seminar">College Seminar</option>
                  <option value="Instagram Ad">Instagram Ad</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Direct Call">Direct Call</option>
                </select>
              </div>
            </div>

            {/* Counselor Consultation Notes */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                Initial Counseling Notes & Background
              </label>
              <textarea
                name="notes"
                rows={2}
                className="form-control"
                placeholder="Candidate background, current preparation level, timeline..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div
            className="modal-footer"
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              backgroundColor: 'var(--slate-50)'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 600 }}
            >
              Register Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
