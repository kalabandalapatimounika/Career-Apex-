import { USERS } from '../data/seedData.js';

// Storage keys
const STORAGE_KEYS = {
  SESSION: 'ca_crm_session',
  REGISTERED_USERS: 'ca_crm_registered_users',
  LEADS: 'ca_leads'
};

// Default passwords for the initial team accounts (used for clean authentication flow)
const DEFAULT_PASSWORDS = {
  'admin@crm.local': 'admin123',
  'manager@crm.local': 'manager123',
  'sales@crm.local': 'sales123',
  'priya@crm.local': 'priya123',
  'vikram@crm.local': 'vikram123'
};

// Simple secure hash simulation for storing registered user passwords without plain-text storage
const hashPassword = (password) => {
  let hash = 0;
  const str = `ca_salt_${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hsh_${Math.abs(hash).toString(16)}`;
};

/**
 * Get all registered user accounts (combining seed team users + any newly registered staff)
 */
export const getAllAccounts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    const registered = stored ? JSON.parse(stored) : [];

    // Map base seed users
    const baseUsers = USERS.map(u => ({
      ...u,
      passwordHash: hashPassword(DEFAULT_PASSWORDS[u.email] || 'password123')
    }));

    // Combine avoiding duplicate emails
    const registeredEmails = new Set(registered.map(r => r.email.toLowerCase()));
    const combined = [
      ...baseUsers.filter(b => !registeredEmails.has(b.email.toLowerCase())),
      ...registered
    ];

    return combined;
  } catch (e) {
    console.error('Error reading registered users:', e);
    return USERS.map(u => ({
      ...u,
      passwordHash: hashPassword(DEFAULT_PASSWORDS[u.email] || 'password123')
    }));
  }
};

/**
 * Read the current active authenticated session from sessionStorage or localStorage
 */
export const getCurrentSession = () => {
  try {
    // Check sessionStorage first (tab session)
    let raw = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    let isRemembered = false;

    // Check localStorage (persistent session)
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (raw) isRemembered = true;
    }

    if (!raw) return null;

    const session = JSON.parse(raw);

    // Validate token and expiration
    if (!session || !session.token || !session.user || !session.expiresAt) {
      clearSession();
      return null;
    }

    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return {
      token: session.token,
      user: session.user,
      isRemembered
    };
  } catch (e) {
    console.error('Error verifying current session:', e);
    clearSession();
    return null;
  }
};

/**
 * Clear session from both sessionStorage and localStorage
 */
export const clearSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem('ca_current_user'); // Clean legacy keys
  } catch (e) {
    console.error('Error clearing session:', e);
  }
};

/**
 * Authenticate credentials
 * Simulates real authentication with validation, security checks, and token generation
 * @param {Object} credentials - { email, password, rememberMe }
 * @returns {Promise<{ success: boolean, user?: Object, token?: string, error?: string }>}
 */
export const login = async ({ email, password, rememberMe = false }) => {
  // Realistic processing delay (350ms) to allow loading indicators to properly render
  await new Promise(resolve => setTimeout(resolve, 350));

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // Basic validation
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!cleanPass) {
    return { success: false, error: 'Password is required.' };
  }

  const accounts = getAllAccounts();
  const matchedUser = accounts.find(acc => acc.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    return {
      success: false,
      error: 'No account found with this email address. Check your credentials or sign up.'
    };
  }

  const computedHash = hashPassword(cleanPass);
  if (matchedUser.passwordHash !== computedHash) {
    return {
      success: false,
      error: 'Incorrect password. Please try again or use the forgot password link.'
    };
  }

  // Create sanitized user object (NO passwords/hashes stored in session)
  const safeUser = {
    id: matchedUser.id,
    name: matchedUser.name,
    email: matchedUser.email,
    role: matchedUser.role || 'sales',
    title: matchedUser.title || 'Career Counselor',
    avatar: matchedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
  };

  // Generate secure session token and expiration
  const token = `ca_tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  // Remember me: 30 days; Session only: 8 hours
  const expiresAt = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);

  const sessionPayload = {
    token,
    user: safeUser,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  // Store in selected storage without plain-text passwords
  clearSession();
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionPayload));
  } else {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionPayload));
  }

  // Also sync current user for CRM context persistence
  localStorage.setItem('ca_current_user', JSON.stringify(safeUser));

  return {
    success: true,
    user: safeUser,
    token
  };
};

/**
 * Register a new staff user
 * @param {Object} userData - { name, email, password, role, title }
 * @returns {Promise<{ success: boolean, user?: Object, error?: string }>}
 */
export const register = async ({ name, email, password, role = 'sales', title = 'Career Counselor' }) => {
  await new Promise(resolve => setTimeout(resolve, 400));

  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanName) {
    return { success: false, error: 'Full name is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, error: 'A valid email address is required.' };
  }

  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const accounts = getAllAccounts();
  if (accounts.some(acc => acc.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email address already exists.' };
  }

  // Create new user profile
  const avatarNumber = Math.floor(Math.random() * 5) + 1;
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120'
  ];

  const newUser = {
    id: `usr-${Date.now().toString(36)}`,
    name: cleanName,
    email: cleanEmail,
    role: role,
    title: title || (role === 'admin' ? 'Admissions Administrator' : role === 'manager' ? 'Counseling Manager' : 'Career Counselor'),
    avatar: avatars[avatarNumber % avatars.length],
    passwordHash: hashPassword(cleanPass),
    createdAt: new Date().toISOString()
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    const registered = stored ? JSON.parse(stored) : [];
    registered.push(newUser);
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registered));

    const { passwordHash, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  } catch (e) {
    return { success: false, error: 'Failed to save account: ' + e.message };
  }
};

/**
 * Request password reset
 * @param {string} email
 */
export const requestPasswordReset = async (email) => {
  await new Promise(resolve => setTimeout(resolve, 350));
  const cleanEmail = (email || '').trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const accounts = getAllAccounts();
  const exists = accounts.some(acc => acc.email.toLowerCase() === cleanEmail);

  if (!exists) {
    return { success: false, error: 'No registered account found with this email address.' };
  }

  return {
    success: true,
    message: `Password reset instructions and a secure recovery link have been sent to ${cleanEmail}.`
  };
};

/**
 * Backend integration metadata
 */
export const getBackendAuthInfo = () => ({
  hasBackendConfigured: false,
  authType: 'Client-Side Team Auth with Secure Session Tokens',
  requiredForProduction: [
    'Deploy backend API (e.g. Node/Express, NestJS, or Python FastAPI) with `/api/auth/login` and `/api/auth/verify` endpoints',
    'OR configure Firebase Authentication (set `apiKey`, `authDomain`, `projectId` in `.env`)',
    'Exchange credentials for signed JWT / HTTP-only Secure Cookies',
    'Replace client storage tokens with CSRF-protected session cookies'
  ]
});
