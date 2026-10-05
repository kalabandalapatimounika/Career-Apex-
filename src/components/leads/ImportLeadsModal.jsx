import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle } from 'lucide-react';

export const ImportLeadsModal = () => {
  const { isImportModalOpen, setIsImportModalOpen, addLead, addToast, currentUser } = useCRM();
  const [dragOver, setDragOver] = useState(false);
  const [importPreview, setImportPreview] = useState(null);

  if (!isImportModalOpen) return null;

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Mobile,Degree,College,YOP,Target Role,Expected Fee\n" +
      "Vikrant Bose,vikrant@gmail.com,9823456789,B.Tech CSE,IIT Bombay,2025,Full Stack Developer,70000\n" +
      "Sunita Rao,sunita.rao@outlook.com,9823456780,MCA,COEP Pune,2024,Data Analyst,55000\n" +
      "Naveen Chandra,naveen.c@gmail.com,9823456781,BCA,Bangalore University,2025,Frontend Specialist,45000";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_career_apex_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulateSampleUpload = () => {
    const sampleBatch = [
      { name: 'Vikrant Bose', email: 'vikrant@gmail.com', mobile: '+91 98234 56789', qualification: 'B.Tech CSE', college: 'IIT Bombay', passoutYear: 2025, targetRole: 'Full Stack Developer', expectedFee: 70000, stage: 'Cold Calling', priority: 'High', source: 'Excel / CSV Upload' },
      { name: 'Sunita Rao', email: 'sunita.rao@outlook.com', mobile: '+91 98234 56780', qualification: 'MCA', college: 'COEP Pune', passoutYear: 2024, targetRole: 'Data Analyst', expectedFee: 55000, stage: 'New Lead', priority: 'Medium', source: 'Excel / CSV Upload' },
      { name: 'Naveen Chandra', email: 'naveen.c@gmail.com', mobile: '+91 98234 56781', qualification: 'BCA', college: 'Bangalore University', passoutYear: 2025, targetRole: 'Frontend Specialist', expectedFee: 45000, stage: 'Cold Calling', priority: 'Low', source: 'Excel / CSV Upload' }
    ];
    setImportPreview(sampleBatch);
  };

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.length === 0) return;
    importPreview.forEach(item => {
      addLead(item);
    });
    addToast(`Successfully imported ${importPreview.length} candidates from Excel!`, 'success');
    setImportPreview(null);
    setIsImportModalOpen(false);
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
        if (e.target === e.currentTarget) setIsImportModalOpen(false);
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '620px',
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
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Bulk Import Candidates from Excel / CSV
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', margin: 0 }}>
                Upload batch student lists, job portal exports, or campus drive spreadsheets
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsImportModalOpen(false)}
            style={{ padding: '0.35rem', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {/* Dropzone Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); simulateSampleUpload(); }}
            onClick={simulateSampleUpload}
            style={{
              border: `2px dashed ${dragOver ? 'var(--primary-600)' : 'var(--slate-300)'}`,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: dragOver ? 'var(--primary-50)' : 'var(--slate-50)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
          >
            <Upload size={36} style={{ color: 'var(--primary-600)', margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-800)' }}>
              Click or drag Excel / CSV file here to upload
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Supports .csv, .xlsx, .xls (Up to 500 candidate rows per file)
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>Need standard format?</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadSample}
              style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Download size={13} /> Download Sample Template (.CSV)
            </button>
          </div>

          {/* Preview Table if uploaded */}
          {importPreview && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.75rem', backgroundColor: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={15} style={{ color: 'var(--success-solid)' }} />
                Ready to Import: {importPreview.length} Candidates Detected
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--slate-500)' }}>
                      <th style={{ padding: '0.4rem' }}>Name</th>
                      <th style={{ padding: '0.4rem' }}>Mobile</th>
                      <th style={{ padding: '0.4rem' }}>Degree & College</th>
                      <th style={{ padding: '0.4rem' }}>Target Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                        <td style={{ padding: '0.4rem', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '0.4rem' }}>{c.mobile}</td>
                        <td style={{ padding: '0.4rem' }}>{c.qualification} ({c.college})</td>
                        <td style={{ padding: '0.4rem', color: 'var(--primary-600)' }}>{c.targetRole}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            onClick={() => setIsImportModalOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!importPreview}
            onClick={handleConfirmImport}
            style={{ fontWeight: 600 }}
          >
            Import Into Pipeline ({importPreview ? importPreview.length : 0})
          </button>
        </div>
      </div>
    </div>
  );
};
