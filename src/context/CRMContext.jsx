import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { USERS, INITIAL_LEADS, PIPELINE_STAGES } from '../data/seedData';
import {
  getCurrentSession,
  login as authLogin,
  register as authRegister,
  requestPasswordReset as authResetPassword,
  clearSession,
  getAllAccounts
} from '../services/authService';

const CRMContext = createContext(null);

export const CRMProvider = ({ children }) => {
  // Current authenticated user session (null when unauthenticated)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const session = getCurrentSession();
      return session ? session.user : null;
    } catch {
      return null;
    }
  });

  // Leads list - Clean production state, no mock dummy data
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('ca_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy mock data (IDs matching SM-LD-0001 to SM-LD-0036 or CA-1001)
          const nonMock = parsed.filter(l => l && !l.isMock && !l.id?.startsWith('SM-LD-00') && !l.id?.startsWith('CA-100'));
          return nonMock;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Active navigation tab ('dashboard', 'customers', 'leads', 'pipeline', 'followups', 'team', 'activities', 'reports', 'settings')
  const [activeTab, setActiveTab] = useState('dashboard');

  // Active stage filter within Pipeline (Excel)
  const [activePipelineStage, setActivePipelineStage] = useState('all');

  // Sidebar Pipeline submenu collapsed state
  const [isPipelineMenuCollapsed, setIsPipelineMenuCollapsed] = useState(() => {
    try {
      return localStorage.getItem('crm_pipeline_submenu_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected lead for 360 degree detail modal
  const [selectedLead, setSelectedLead] = useState(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Selected leads checkboxes for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Persist currentUser in localStorage when active
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ca_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ca_current_user');
      }
    } catch (e) {
      console.error('Error syncing user state:', e);
    }
  }, [currentUser]);

  // Persist leads (saves clean list)
  useEffect(() => {
    try {
      localStorage.setItem('ca_leads', JSON.stringify(leads));
    } catch (e) {
      console.error('Error saving leads to localStorage:', e);
    }
  }, [leads]);

  // Persist pipeline submenu collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('crm_pipeline_submenu_collapsed', String(isPipelineMenuCollapsed));
    } catch (e) {
      console.error('Error saving collapsed state:', e);
    }
  }, [isPipelineMenuCollapsed]);

  // Toast helper
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Authentication Handlers
  const handleLogin = async (credentials) => {
    const result = await authLogin(credentials);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setActiveTab('dashboard');
      addToast(`Welcome back, ${result.user.name}!`, 'success');
    }
    return result;
  };

  const handleRegister = async (userData) => {
    const result = await authRegister(userData);
    if (result.success) {
      addToast(`Staff account for ${result.user.name} created successfully!`, 'success');
    }
    return result;
  };

  const handleResetPassword = async (email) => {
    const result = await authResetPassword(email);
    if (result.success) {
      addToast(result.message, 'info');
    }
    return result;
  };

  const logout = () => {
    clearSession();
    setCurrentUser(null);
    addToast('You have been signed out.', 'info');
  };

  // Switch persona (for demo/preview when authenticated)
  const switchPersona = (email) => {
    const accounts = getAllAccounts();
    const user = accounts.find(u => u.email === email) || USERS.find(u => u.email === email);
    if (user) {
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatar
      };
      setCurrentUser(safeUser);
      localStorage.setItem('ca_current_user', JSON.stringify(safeUser));
      addToast(`Switched active profile to ${safeUser.name} (${safeUser.role.toUpperCase()})`, 'info');
    }
  };

  // Reset/Clear leads database
  const resetDemoData = () => {
    setLeads([]);
    setSelectedLeadIds([]);
    localStorage.removeItem('ca_leads');
    addToast('CRM candidate data cleared to clean state.', 'info');
  };

  // Add lead
  const addLead = (newLeadData) => {
    const accounts = getAllAccounts();
    const counselor = accounts.find(u => u.id === newLeadData.assignedTo) || USERS[2];
    const newId = `CA-${String(leads.length + 1).padStart(4, '0')}`;
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const authorName = currentUser ? currentUser.name : 'System';

    const newLead = {
      id: newId,
      name: newLeadData.name.trim(),
      email: newLeadData.email ? newLeadData.email.trim() : '',
      mobile: newLeadData.mobile.trim(),
      college: newLeadData.college ? newLeadData.college.trim() : 'Not Specified',
      qualification: newLeadData.qualification ? newLeadData.qualification.trim() : 'Graduate',
      passoutYear: Number(newLeadData.passoutYear) || new Date().getFullYear(),
      skills: newLeadData.skills || 'Software Development, System Design',
      targetRole: newLeadData.targetRole || 'Software Engineer',
      exp: newLeadData.exp || 'Fresher',
      stage: newLeadData.stage || 'New Lead',
      priority: newLeadData.priority || 'Medium',
      status: (newLeadData.stage === 'Enrolled') ? 'Enrolled' : (newLeadData.stage === 'Lost' || newLeadData.stage === 'Not Interested') ? 'Lost' : 'Active',
      assignedTo: counselor.id,
      counselorName: counselor.name,
      city: newLeadData.city || 'Bangalore',
      source: newLeadData.source || 'Website Inquiry',
      expectedFee: Number(newLeadData.expectedFee) || 60000,
      paidFee: Number(newLeadData.paidFee) || 0,
      feeStatus: Number(newLeadData.paidFee) >= Number(newLeadData.expectedFee) ? 'Fully Paid' : Number(newLeadData.paidFee) > 0 ? 'Partially Paid' : 'Pending',
      nextFollowup: newLeadData.nextFollowup || '',
      notes: newLeadData.notes || '',
      history: [
        { date: timestamp, user: authorName, note: `Candidate inquiry registered by ${authorName}.` }
      ]
    };

    setLeads(prev => [newLead, ...prev]);
    addToast(`Candidate ${newLead.name} (${newId}) registered successfully!`, 'success');
    return newLead;
  };

  // Update lead
  const updateLead = (id, fields) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const authorName = currentUser ? currentUser.name : 'System';

    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;

      const updatedHistory = [...(lead.history || [])];
      if (fields.stage && fields.stage !== lead.stage) {
        updatedHistory.unshift({
          date: timestamp,
          user: authorName,
          note: `Pipeline stage moved from "${lead.stage}" to "${fields.stage}".`
        });
        if (fields.stage === 'Enrolled') {
          fields.status = 'Enrolled';
        } else if (fields.stage === 'Lost' || fields.stage === 'Not Interested') {
          fields.status = 'Lost';
        } else {
          fields.status = 'Active';
        }
      }
      if (fields.assignedTo && fields.assignedTo !== lead.assignedTo) {
        const accounts = getAllAccounts();
        const newCounselor = accounts.find(u => u.id === fields.assignedTo) || USERS.find(u => u.id === fields.assignedTo);
        const counselorName = newCounselor ? newCounselor.name : 'Unknown';
        updatedHistory.unshift({
          date: timestamp,
          user: authorName,
          note: `Assigned counselor changed to ${counselorName}.`
        });
        fields.counselorName = counselorName;
      }
      if (fields.newNote) {
        updatedHistory.unshift({
          date: timestamp,
          user: authorName,
          note: fields.newNote
        });
        delete fields.newNote;
      }

      const updated = {
        ...lead,
        ...fields,
        history: updatedHistory
      };

      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(updated);
      }

      return updated;
    }));

    addToast(`Lead updated`, 'success');
  };

  // Quick update lead stage
  const updateLeadStage = (id, newStage) => {
    updateLead(id, { stage: newStage });
  };

  // Delete lead
  const deleteLead = (id) => {
    const target = leads.find(l => l.id === id);
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLeadIds(prev => prev.filter(item => item !== id));
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead(null);
    }
    addToast(`Lead ${target ? target.name : id} deleted`, 'info');
  };

  // Bulk assign leads
  const bulkAssignLeads = (leadIds, counselorId) => {
    const accounts = getAllAccounts();
    const counselor = accounts.find(u => u.id === counselorId) || USERS.find(u => u.id === counselorId);
    if (!counselor) return;

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const authorName = currentUser ? currentUser.name : 'System';

    setLeads(prev => prev.map(lead => {
      if (!leadIds.includes(lead.id)) return lead;

      const updatedHistory = [...(lead.history || [])];
      updatedHistory.unshift({
        date: timestamp,
        user: authorName,
        note: `Bulk assigned to ${counselor.name}.`
      });

      return {
        ...lead,
        assignedTo: counselor.id,
        counselorName: counselor.name,
        history: updatedHistory
      };
    }));

    addToast(`Assigned ${leadIds.length} candidate(s) to ${counselor.name}!`, 'success');
    setSelectedLeadIds([]);
    setIsBulkAssignOpen(false);
  };

  // Scoped leads based on user role
  const scopedLeads = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      return leads;
    }
    return leads.filter(l => l.assignedTo === currentUser.id);
  }, [leads, currentUser]);

  // Overall KPIs calculation
  const metrics = useMemo(() => {
    const total = scopedLeads.length;
    const enrolled = scopedLeads.filter(l => l.stage === 'Enrolled').length;
    const interested = scopedLeads.filter(l => l.stage === 'Interested' || l.stage === 'Prospect').length;
    const followupsDue = scopedLeads.filter(l => l.nextFollowup && l.stage !== 'Enrolled' && l.stage !== 'Lost').length;
    const totalValue = scopedLeads.reduce((acc, l) => acc + (l.expectedFee || 0), 0);
    const collectedValue = scopedLeads.reduce((acc, l) => acc + (l.paidFee || 0), 0);
    const conversionRate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : 0;

    return {
      total,
      enrolled,
      interested,
      followupsDue,
      totalValue,
      collectedValue,
      conversionRate
    };
  }, [scopedLeads]);

  // Stage counts for Pipeline submenu
  const pipelineStageCounts = useMemo(() => {
    const counts = { all: scopedLeads.length };
    PIPELINE_STAGES.forEach(st => {
      counts[st.key] = scopedLeads.filter(l => l.stage === st.key).length;
    });
    return counts;
  }, [scopedLeads]);

  return (
    <CRMContext.Provider value={{
      users: getAllAccounts(),
      currentUser,
      handleLogin,
      handleRegister,
      handleResetPassword,
      logout,
      switchPersona,
      resetDemoData,
      leads,
      scopedLeads,
      addLead,
      updateLead,
      updateLeadStage,
      deleteLead,
      bulkAssignLeads,
      metrics,
      activeTab,
      setActiveTab,
      activePipelineStage,
      setActivePipelineStage,
      isPipelineMenuCollapsed,
      setIsPipelineMenuCollapsed,
      pipelineStageCounts,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      selectedLead,
      setSelectedLead,
      isAddModalOpen,
      setIsAddModalOpen,
      isBulkAssignOpen,
      setIsBulkAssignOpen,
      isTemplatesModalOpen,
      setIsTemplatesModalOpen,
      isImportModalOpen,
      setIsImportModalOpen,
      selectedLeadIds,
      setSelectedLeadIds,
      toasts,
      addToast,
      removeToast,
      stages: PIPELINE_STAGES
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
