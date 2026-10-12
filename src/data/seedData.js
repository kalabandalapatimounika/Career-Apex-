// Career Apex CRM - Seed Configuration (Clean Production Version - No Mock Data)

export const USERS = [
  {
    id: 'usr-1',
    name: 'Alexander Wright',
    email: 'admin@crm.local',
    role: 'admin',
    title: 'Director of Admissions & Placement',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
  },
  {
    id: 'usr-2',
    name: 'Rajesh Sharma',
    email: 'manager@crm.local',
    role: 'manager',
    title: 'Lead Counseling Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
  },
  {
    id: 'usr-3',
    name: 'Arun Kumar',
    email: 'sales@crm.local',
    role: 'sales',
    title: 'Senior Career Counselor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120'
  },
  {
    id: 'usr-4',
    name: 'Priya Patel',
    email: 'priya@crm.local',
    role: 'sales',
    title: 'Career Counselor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'
  },
  {
    id: 'usr-5',
    name: 'Vikram Singh',
    email: 'vikram@crm.local',
    role: 'sales',
    title: 'Placement Advisor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120'
  }
];

export const PIPELINE_STAGES = [
  { key: 'Cold Calling', label: 'Cold Calling', icon: 'fa-phone-slash', color: '#64748b' },
  { key: 'Not Connected', label: 'Not Connected', icon: 'fa-phone-flip', color: '#94a3b8' },
  { key: 'New Lead', label: 'New Lead', icon: 'fa-star', color: '#6366f1' },
  { key: 'Contacted', label: 'Contacted', icon: 'fa-phone', color: '#3b82f6' },
  { key: 'Interested', label: 'Interested', icon: 'fa-fire', color: '#f59e0b' },
  { key: 'Prospect', label: 'Prospect', icon: 'fa-bullseye', color: '#8b5cf6' },
  { key: 'Follow-up', label: 'Follow-up', icon: 'fa-clock', color: '#ec4899' },
  { key: 'Negotiation', label: 'Negotiation', icon: 'fa-handshake', color: '#06b6d4' },
  { key: 'Pending Closure', label: 'Pending Closure', icon: 'fa-file-invoice-dollar', color: '#14b8a6' },
  { key: 'Enrolled', label: 'Enrolled', icon: 'fa-trophy', color: '#10b981' },
  { key: 'Not Interested', label: 'Not Interested', icon: 'fa-ban', color: '#f43f5e' },
  { key: 'Lost', label: 'Lost', icon: 'fa-circle-xmark', color: '#ef4444' }
];

// Clean state - No mock candidate data
export const INITIAL_LEADS = [];
