import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Sliders, Save, RotateCcw, Bell, Shield, Database } from 'lucide-react';

export const SettingsView = () => {
  const { resetDemoData, addToast } = useCRM();

  const [settings, setSettings] = useState({
    crmName: 'Career Apex CRM',
    targetCompany: 'Product Companies & MNCs',
    defaultCurrency: 'INR (₹)',
    enableEmailAlerts: true,
    enableWhatsAppAlerts: true,
    autoFollowupHours: '24'
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast('System settings saved successfully!', 'success');
  };

  return (
    <div className="settings-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="crm-page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
          System Settings & Governance
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Configure admissions workflows, notifications, placement cohorts, and data retention.
        </p>
      </div>

      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <form onSubmit={handleSave} className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 1.25rem 0' }}>
            General Operations Configuration
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                CRM Instance Brand Name
              </label>
              <input
                type="text"
                className="form-control"
                value={settings.crmName}
                onChange={(e) => setSettings({ ...settings, crmName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                Primary Placement Focus
              </label>
              <input
                type="text"
                className="form-control"
                value={settings.targetCompany}
                onChange={(e) => setSettings({ ...settings, targetCompany: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem', display: 'block' }}>
                Default Follow-up Reminder Window
              </label>
              <select
                className="form-select"
                value={settings.autoFollowupHours}
                onChange={(e) => setSettings({ ...settings, autoFollowupHours: e.target.value })}
              >
                <option value="12">Within 12 Hours</option>
                <option value="24">Within 24 Hours (Recommended)</option>
                <option value="48">Within 48 Hours</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => setSettings({ ...settings, enableEmailAlerts: e.target.checked })}
                />
                Email Notifications for High-Priority Leads
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.enableWhatsAppAlerts}
                  onChange={(e) => setSettings({ ...settings, enableWhatsAppAlerts: e.target.checked })}
                />
                WhatsApp Follow-up Alerts
              </label>
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Save size={15} /> Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Database Reset Card */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--danger-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger-solid)', margin: '0 0 0.5rem 0' }}>
            Restore Factory Demo Data
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', margin: '0 0 1rem 0' }}>
            Reset all 36 candidates, counseling stages, follow-up logs, and assignments back to default demo state.
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetDemoData}
            style={{ color: 'var(--danger-solid)', borderColor: 'var(--danger-border)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={15} /> Reset All Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
