import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { USERS, INITIAL_LEADS, PIPELINE_STAGES } from '../data/seedData';

const CRMContext = createContext(null);

export const CRMProvider = ({ children }) => {
  // Current logged in user / persona
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ca_current_user');
      return saved ? JSON.parse(saved) : USERS[0];
    } catch {
      return USERS[0];
    }
  });

  // Leads list
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('ca_leads');
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'leads', 'pipeline', 'followups', 'activities'

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected lead for 360 degree detail modal
  const [selectedLead, setSelectedLead] = useState(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);

  // Selected leads checkboxes for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Persist currentUser
  useEffect(() => {
    try {
      localStorage.setItem('ca_current_user', JSON.stringify(currentUser));
    } catch (e) {
      console.error('Error saving user to localStorage:', e);
    }
  }, [currentUser]);

  // Persist leads
  useEffect(() => {
    try {
      localStorage.setItem('ca_leads', JSON.stringify(leads));
    } catch (e) {
      console.error('Error saving leads to localStorage:', e);
    }
  }, [leads]);

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

  // Switch demo persona
  const switchPersona = (email) => {
    const user = USERS.find(u => u.email === email) || USERS[0];
    setCurrentUser(user);
    addToast(`Switched active persona to ${user.name} (${user.role.toUpperCase()})`, 'info');
  };

  // Reset all demo data
  const resetDemoData = () => {
    setLeads(INITIAL_LEADS);
    setSelectedLeadIds([]);
    localStorage.removeItem('ca_leads');
    addToast('Demo leads database restored to default state.', 'info');
  };

  // Add lead
  const addLead = (newLeadData) => {
    const counselor = USERS.find(u => u.id === newLeadData.assignedTo) || USERS[2];
    const newId = `CA-${1000 + leads.length + 1}`;
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newLead = {
      id: newId,
      name: newLeadData.name.trim(),
      email: newLeadData.email.trim(),
      mobile: newLeadData.mobile.trim(),
      college: newLeadData.college ? newLeadData.college.trim() : 'Not Specified',
      qualification: newLeadData.qualification ? newLeadData.qualification.trim() : 'Graduate',
      passoutYear: Number(newLeadData.passoutYear) || new Date().getFullYear(),
      targetRole: newLeadData.targetRole || 'Software Engineer',
      courseInterest: newLeadData.courseInterest || 'Career Transition Track',
      stage: newLeadData.stage || 'New Lead',
      priority: newLeadData.priority || 'Medium',
      assignedTo: counselor.id,
      counselorName: counselor.name,
      source: newLeadData.source || 'Website Inquiry',
      expectedFee: Number(newLeadData.expectedFee) || 50000,
      paidFee: Number(newLeadData.paidFee) || 0,
      createdDate: new Date().toISOString().slice(0, 10),
      nextFollowup: newLeadData.nextFollowup || '',
      notes: newLeadData.notes || '',
      history: [
        { date: timestamp, user: currentUser.name, note: `Lead created by ${currentUser.name}.` }
      ]
    };

    setLeads(prev => [newLead, ...prev]);
    addToast(`Lead ${newLead.name} (${newId}) added successfully!`, 'success');
    return newLead;
  };

  // Update lead
  const updateLead = (id, fields) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;

      const updatedHistory = [...(lead.history || [])];
      if (fields.stage && fields.stage !== lead.stage) {
        updatedHistory.unshift({
          date: timestamp,
          user: currentUser.name,
          note: `Status changed from "${lead.stage}" to "${fields.stage}".`
        });
      }
      if (fields.assignedTo && fields.assignedTo !== lead.assignedTo) {
        const newCounselor = USERS.find(u => u.id === fields.assignedTo);
        const counselorName = newCounselor ? newCounselor.name : 'Unknown';
        updatedHistory.unshift({
          date: timestamp,
          user: currentUser.name,
          note: `Assigned counselor changed to ${counselorName}.`
        });
        fields.counselorName = counselorName;
      }
      if (fields.newNote) {
        updatedHistory.unshift({
          date: timestamp,
          user: currentUser.name,
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

    addToast(`Lead updated successfully`, 'success');
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
    const counselor = USERS.find(u => u.id === counselorId);
    if (!counselor) return;

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    setLeads(prev => prev.map(lead => {
      if (!leadIds.includes(lead.id)) return lead;

      const updatedHistory = [...(lead.history || [])];
      updatedHistory.unshift({
        date: timestamp,
        user: currentUser.name,
        note: `Bulk assigned to ${counselor.name}.`
      });

      return {
        ...lead,
        assignedTo: counselor.id,
        counselorName: counselor.name,
        history: updatedHistory
      };
    }));

    addToast(`Successfully assigned ${leadIds.length} lead(s) to ${counselor.name}!`, 'success');
    setSelectedLeadIds([]);
    setIsBulkAssignOpen(false);
  };

  // Scoped leads based on user role (Counselors only see assigned leads if not admin/manager)
  const scopedLeads = useMemo(() => {
    if (!currentUser) return leads;
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      return leads;
    }
    // Sales Counselor only sees their own assigned leads
    return leads.filter(l => l.assignedTo === currentUser.id);
  }, [leads, currentUser]);

  // Overall KPIs calculation
  const metrics = useMemo(() => {
    const total = scopedLeads.length;
    const enrolled = scopedLeads.filter(l => l.stage === 'Enrolled').length;
    const interested = scopedLeads.filter(l => l.stage === 'Interested' || l.stage === 'Prospect').length;
    const followupsDue = scopedLeads.filter(l => l.stage === 'Follow-up' || l.nextFollowup).length;
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

  return (
    <CRMContext.Provider value={{
      users: USERS,
      currentUser,
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
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      selectedLead,
      setSelectedLead,
      isAddModalOpen,
      setIsAddModalOpen,
      isBulkAssignOpen,
      setIsBulkAssignOpen,
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
