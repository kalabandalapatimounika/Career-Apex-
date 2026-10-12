import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { LeadsQueue } from './components/leads/LeadsQueue';
import { PipelineView } from './components/pipeline/PipelineView';
import { FollowupsView } from './components/followups/FollowupsView';
import { TeamView } from './components/team/TeamView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AddLeadModal } from './components/leads/AddLeadModal';
import { LeadDetailModal } from './components/leads/LeadDetailModal';
import { BulkAssignModal } from './components/leads/BulkAssignModal';
import { ImportLeadsModal } from './components/leads/ImportLeadsModal';
import { MessageTemplatesModal } from './components/templates/MessageTemplatesModal';
import { ToastContainer } from './components/common/Toast';

const AppContent = () => {
  const { currentUser, activeTab } = useCRM();

  // Route Protection: Unauthenticated visitors must log in
  if (!currentUser) {
    return (
      <div className="crm-auth-wrapper">
        <LoginPage />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="crm-app-container">
      {/* Role-Adaptive Responsive Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="crm-main-content">
        {/* Top Header with User Profile and Actions */}
        <Header />

        {/* Dynamic Page Body with Protected Views */}
        <main className="crm-page-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {(activeTab === 'customers' || activeTab === 'leads') && <LeadsQueue />}
          {activeTab === 'pipeline' && <PipelineView />}
          {activeTab === 'followups' && <FollowupsView />}
          {activeTab === 'team' && <TeamView />}
          {activeTab === 'activities' && <ActivitiesView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <AddLeadModal />
      <LeadDetailModal />
      <BulkAssignModal />
      <ImportLeadsModal />
      <MessageTemplatesModal />
      <ToastContainer />
    </div>
  );
};

export const App = () => {
  return (
    <CRMProvider>
      <AppContent />
    </CRMProvider>
  );
};

export default App;
