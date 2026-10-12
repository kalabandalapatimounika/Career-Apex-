import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  User,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

export const LoginPage = () => {
  const { handleLogin, handleRegister, handleResetPassword } = useCRM();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('sales');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validate Email Regex
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Clear errors when typing
  const handleEmailChange = (val) => {
    setLoginEmail(val);
    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
    if (serverError) setServerError('');
  };

  const handlePasswordChange = (val) => {
    setLoginPassword(val);
    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
    if (serverError) setServerError('');
  };

  // Quick-fill credentials helper for seamless testing
  const fillCredentials = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setFormErrors({});
    setServerError('');
  };

  // Submit Login
  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Validation
    const errors = {};
    if (!loginEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(loginEmail)) {
      errors.email = 'Please enter a valid email format (e.g. name@company.com).';
    }

    if (!loginPassword) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    try {
      const res = await handleLogin({
        email: loginEmail,
        password: loginPassword,
        rememberMe
      });

      if (!res.success) {
        setServerError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setServerError('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Registration
  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const errors = {};
    if (!regName.trim()) errors.name = 'Full name is required.';
    if (!regEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(regEmail)) {
      errors.email = 'Please enter a valid email format.';
    }
    if (!regPassword) {
      errors.password = 'Password is required.';
    } else if (regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    try {
      const roleTitles = {
        sales: 'Career Counselor',
        manager: 'Lead Counseling Manager',
        admin: 'Director of Admissions'
      };
      const res = await handleRegister({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        title: roleTitles[regRole] || 'Career Counselor'
      });

      if (res.success) {
        setSuccessMessage('Account created successfully! You can now sign in.');
        setLoginEmail(regEmail);
        setLoginPassword('');
        setMode('login');
      } else {
        setServerError(res.error || 'Registration failed.');
      }
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Forgot Password
  const onForgotSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!forgotEmail.trim()) {
      setFormErrors({ forgotEmail: 'Email address is required.' });
      return;
    }
    if (!isValidEmail(forgotEmail)) {
      setFormErrors({ forgotEmail: 'Please enter a valid email address.' });
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    try {
      const res = await handleResetPassword(forgotEmail);
      if (res.success) {
        setForgotSubmitted(true);
      } else {
        setServerError(res.error || 'Failed to process request.');
      }
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-page-wrapper"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.08) 0%, rgba(248, 250, 252, 1) 90%)',
        padding: '1.5rem',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.25rem',
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 0.9rem',
              background: 'var(--primary-gradient)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              boxShadow: '0 6px 18px var(--primary-glow)'
            }}
          >
            <i className="fa-solid fa-arrow-trend-up"></i>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0, letterSpacing: '-0.02em' }}>
            Career Apex CRM
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Student Placement & Career Counseling Operations
          </p>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div
            id="login-error-alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              color: 'var(--success-text)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}
          >
            <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* =========================================================================
            MODE 1: SIGN IN FORM
           ========================================================================= */}
        {mode === 'login' && (
          <div>
            <form onSubmit={onLoginSubmit} id="login-form" noValidate>
              {/* Email Field */}
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" htmlFor="login-email" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                  Email Address <span style={{ color: 'var(--danger-solid)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail
                    size={17}
                    style={{ position: 'absolute', left: '12px', color: formErrors.email ? 'var(--danger-solid)' : 'var(--slate-400)', pointerEvents: 'none' }}
                  />
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    autoComplete="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    placeholder="name@crm.local"
                    value={loginEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    style={{
                      paddingLeft: '2.4rem',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {formErrors.email && (
                  <div className="invalid-feedback" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--danger-solid)', marginTop: '0.3rem' }}>
                    {formErrors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" htmlFor="login-password" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', margin: 0 }}>
                    Password <span style={{ color: 'var(--danger-solid)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setMode('forgot');
                      setServerError('');
                      setFormErrors({});
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-600)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock
                    size={17}
                    style={{ position: 'absolute', left: '12px', color: formErrors.password ? 'var(--danger-solid)' : 'var(--slate-400)', pointerEvents: 'none' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    style={{
                      paddingLeft: '2.4rem',
                      paddingRight: '2.5rem',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    type="button"
                    id="toggle-password-btn"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--slate-400)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {formErrors.password && (
                  <div className="invalid-feedback" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--danger-solid)', marginTop: '0.3rem' }}>
                    {formErrors.password}
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--slate-600)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    id="login-remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
                  />
                  Remember me on this device
                </label>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                id="login-submit-btn"
                className="btn btn-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.7rem 1.25rem',
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px var(--primary-glow)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.85 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In to CRM</span>
                  </>
                )}
              </button>
            </form>

            {/* Registration toggle */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.825rem', color: 'var(--slate-500)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                id="toggle-signup-link"
                onClick={() => {
                  setMode('register');
                  setServerError('');
                  setFormErrors({});
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Register staff member
              </button>
            </div>

            {/* 1-Click Credentials Tester */}
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick-Fill Test Accounts
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Click to fill</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div
                  id="test-account-admin"
                  onClick={() => fillCredentials('admin@crm.local', 'admin123')}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                    e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-900)' }}>Alexander Wright</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>admin@crm.local • admin123</div>
                  </div>
                  <span className="badge badge-role-admin" style={{ fontSize: '0.65rem' }}>Admin</span>
                </div>

                <div
                  id="test-account-manager"
                  onClick={() => fillCredentials('manager@crm.local', 'manager123')}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                    e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-900)' }}>Rajesh Sharma</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>manager@crm.local • manager123</div>
                  </div>
                  <span className="badge badge-role-manager" style={{ fontSize: '0.65rem' }}>Manager</span>
                </div>

                <div
                  id="test-account-sales"
                  onClick={() => fillCredentials('sales@crm.local', 'sales123')}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                    e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-900)' }}>Arun Kumar</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>sales@crm.local • sales123</div>
                  </div>
                  <span className="badge badge-role-sales" style={{ fontSize: '0.65rem' }}>Counselor</span>
                </div>
              </div>
            </div>

            {/* Backend Requirement Transparency Notice */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--slate-100)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                fontSize: '0.72rem',
                color: 'var(--slate-600)'
              }}
            >
              <Info size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <div>
                <strong>Client Authentication Active</strong>: Validated via secure token session. To connect an external backend, add your REST/Firebase API endpoints in the configuration.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: REGISTRATION FORM
           ========================================================================= */}
        {mode === 'register' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.2rem 0' }}>
                Register Staff Account
              </h2>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem', margin: 0 }}>
                Create access for admissions counselors and placement coordinators.
              </p>
            </div>

            <form onSubmit={onRegisterSubmit} noValidate>
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.3rem' }}>
                  Full Name <span style={{ color: 'var(--danger-solid)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Ananya Sen"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.85rem' }}
                  />
                </div>
                {formErrors.name && <div className="invalid-feedback" style={{ display: 'block' }}>{formErrors.name}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.3rem' }}>
                  Work Email <span style={{ color: 'var(--danger-solid)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)' }} />
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    placeholder="ananya@careerapex.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.85rem' }}
                  />
                </div>
                {formErrors.email && <div className="invalid-feedback" style={{ display: 'block' }}>{formErrors.email}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.3rem' }}>
                  Role & Department
                </label>
                <select
                  className="form-select"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{ height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="sales">Career Counselor (Sales & Inquiries)</option>
                  <option value="manager">Lead Counseling Manager</option>
                  <option value="admin">Director of Admissions (Admin)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.3rem' }}>
                  Password (min 6 characters) <span style={{ color: 'var(--danger-solid)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)' }} />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                    }}
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem', height: '40px', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(prev => !prev)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && <div className="invalid-feedback" style={{ display: 'block' }}>{formErrors.password}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.3rem' }}>
                  Confirm Password <span style={{ color: 'var(--danger-solid)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)' }} />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Repeat your password"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.85rem' }}
                  />
                </div>
                {formErrors.confirmPassword && <div className="invalid-feedback" style={{ display: 'block' }}>{formErrors.confirmPassword}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ width: '100%', justifyContent: 'center', height: '42px', fontWeight: 700, fontSize: '0.9rem' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '0.4rem' }} />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setServerError('');
                  setFormErrors({});
                }}
                style={{ background: 'none', border: 'none', color: 'var(--slate-600)', fontSize: '0.825rem', cursor: 'pointer', fontWeight: 600 }}
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 3: FORGOT PASSWORD
           ========================================================================= */}
        {mode === 'forgot' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.2rem 0' }}>
                Reset Your Password
              </h2>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.8rem', margin: 0 }}>
                Enter the email address registered with your Career Apex account.
              </p>
            </div>

            {forgotSubmitted ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--success-bg)', color: 'var(--success-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                  Recovery Link Dispatched
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Password reset instructions and a verification token have been sent to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setMode('login');
                    setForgotSubmitted(false);
                    setForgotEmail('');
                  }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={onForgotSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                    Registered Email Address <span style={{ color: 'var(--danger-solid)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)' }} />
                    <input
                      type="email"
                      className={`form-control ${formErrors.forgotEmail ? 'is-invalid' : ''}`}
                      placeholder="name@crm.local"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (formErrors.forgotEmail) setFormErrors({});
                      }}
                      style={{ paddingLeft: '2.4rem', height: '42px', fontSize: '0.875rem' }}
                    />
                  </div>
                  {formErrors.forgotEmail && <div className="invalid-feedback" style={{ display: 'block' }}>{formErrors.forgotEmail}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{ width: '100%', justifyContent: 'center', height: '42px', fontWeight: 700 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '0.4rem' }} />
                      Sending Recovery Link...
                    </>
                  ) : (
                    'Send Password Reset Link'
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setServerError('');
                      setFormErrors({});
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--slate-600)', fontSize: '0.825rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
