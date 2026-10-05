// Career Apex CRM - Seed Data for Student Placement & Career Counseling Sales CRM

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

export const INITIAL_LEADS = [
  {
    id: 'CA-1001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    mobile: '+91 98765 43210',
    college: 'IIT Madras',
    qualification: 'B.Tech - Computer Science',
    passoutYear: 2024,
    targetRole: 'Full Stack Engineer',
    courseInterest: 'Full Stack Web Development & System Design',
    stage: 'Interested',
    priority: 'High',
    assignedTo: 'usr-3', // Arun Kumar
    counselorName: 'Arun Kumar',
    source: 'Website Inquiry',
    expectedFee: 65000,
    paidFee: 0,
    createdDate: '2026-09-28',
    nextFollowup: '2026-10-06T11:00',
    notes: 'Very eager for product companies placement. Attended webinar on Full Stack development.',
    history: [
      { date: '2026-09-28 10:30', user: 'System', note: 'Lead captured from Website Inquiry form.' },
      { date: '2026-09-29 14:15', user: 'Arun Kumar', note: 'Introductory phone call completed. Interested in 6-month placement mentorship.' }
    ]
  },
  {
    id: 'CA-1002',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@outlook.com',
    mobile: '+91 98123 45678',
    college: 'BITS Pilani, Hyderabad',
    qualification: 'B.Tech - Electronics & Comm.',
    passoutYear: 2025,
    targetRole: 'Data Scientist',
    courseInterest: 'AI & Data Science Masterclass',
    stage: 'Contacted',
    priority: 'High',
    assignedTo: 'usr-4', // Priya Patel
    counselorName: 'Priya Patel',
    source: 'LinkedIn Ad',
    expectedFee: 75000,
    paidFee: 0,
    createdDate: '2026-10-01',
    nextFollowup: '2026-10-05T16:30',
    notes: 'Looking for campus placement prep and resume review. Requested curriculum syllabus.',
    history: [
      { date: '2026-10-01 11:20', user: 'System', note: 'Lead captured via LinkedIn Lead Gen Form.' },
      { date: '2026-10-02 12:45', user: 'Priya Patel', note: 'Sent curriculum brochure via WhatsApp.' }
    ]
  },
  {
    id: 'CA-1003',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@gmail.com',
    mobile: '+91 97654 32109',
    college: 'COEP Pune',
    qualification: 'MCA - Computer Applications',
    passoutYear: 2024,
    targetRole: 'Cloud & DevOps Engineer',
    courseInterest: 'AWS DevOps Placement Track',
    stage: 'Enrolled',
    priority: 'Medium',
    assignedTo: 'usr-3', // Arun Kumar
    counselorName: 'Arun Kumar',
    source: 'Campus Referral',
    expectedFee: 60000,
    paidFee: 60000,
    createdDate: '2026-09-15',
    nextFollowup: '2026-10-10T10:00',
    notes: 'Fee received in full via UPI. Batch starts next Monday.',
    history: [
      { date: '2026-09-15 09:00', user: 'Arun Kumar', note: 'Initial counseling session held.' },
      { date: '2026-09-22 17:00', user: 'Arun Kumar', note: 'Admission confirmed, payment ₹60,000 verified.' }
    ]
  },
  {
    id: 'CA-1004',
    name: 'Karthik Varma',
    email: 'karthik.v99@gmail.com',
    mobile: '+91 99887 66554',
    college: 'NIT Trichy',
    qualification: 'B.Tech - Mechanical',
    passoutYear: 2023,
    targetRole: 'Software Developer',
    courseInterest: 'Non-IT to IT Career Transition Program',
    stage: 'Follow-up',
    priority: 'High',
    assignedTo: 'usr-5', // Vikram Singh
    counselorName: 'Vikram Singh',
    source: 'Instagram Ad',
    expectedFee: 70000,
    paidFee: 15000,
    createdDate: '2026-09-20',
    nextFollowup: '2026-10-05T15:00',
    notes: 'Mechanical branch graduate transitioning into Software engineering. Token advance ₹15,000 paid.',
    history: [
      { date: '2026-09-20 16:30', user: 'Vikram Singh', note: '1-on-1 counseling consultation completed.' }
    ]
  },
  {
    id: 'CA-1005',
    name: 'Pooja Nair',
    email: 'pooja.nair@yahoo.com',
    mobile: '+91 94433 22110',
    college: 'Amrita Vishwa Vidyapeetham',
    qualification: 'BCA',
    passoutYear: 2025,
    targetRole: 'Product Designer / UI-UX',
    courseInterest: 'UI/UX Design & Career Launchpad',
    stage: 'New Lead',
    priority: 'Medium',
    assignedTo: 'usr-4', // Priya Patel
    counselorName: 'Priya Patel',
    source: 'College Seminar',
    expectedFee: 45000,
    paidFee: 0,
    createdDate: '2026-10-04',
    nextFollowup: '2026-10-06T14:00',
    notes: 'Interested in portfolio development and design case studies.',
    history: [
      { date: '2026-10-04 18:00', user: 'System', note: 'Lead imported from Seminar registration list.' }
    ]
  },
  {
    id: 'CA-1006',
    name: 'Deepak Patel',
    email: 'deepak.patel@gmail.com',
    mobile: '+91 98221 12345',
    college: 'Nirma University',
    qualification: 'B.E - Information Technology',
    passoutYear: 2024,
    targetRole: 'Cybersecurity Analyst',
    courseInterest: 'Ethical Hacking & Cyber Defense',
    stage: 'Prospect',
    priority: 'Low',
    assignedTo: 'usr-3', // Arun Kumar
    counselorName: 'Arun Kumar',
    source: 'Google Search',
    expectedFee: 55000,
    paidFee: 0,
    createdDate: '2026-09-25',
    nextFollowup: '2026-10-08T11:30',
    notes: 'Requested scholarship discount. Evaluating with parents.',
    history: [
      { date: '2026-09-25 11:00', user: 'Arun Kumar', note: 'Detailed phone consultation.' }
    ]
  },
  {
    id: 'CA-1007',
    name: 'Meera Iyer',
    email: 'meera.iyer@gmail.com',
    mobile: '+91 98334 56789',
    college: 'Anna University, Chennai',
    qualification: 'B.Tech - Artificial Intelligence',
    passoutYear: 2025,
    targetRole: 'ML Engineer',
    courseInterest: 'Generative AI & LLM Systems',
    stage: 'Enrolled',
    priority: 'High',
    assignedTo: 'usr-4', // Priya Patel
    counselorName: 'Priya Patel',
    source: 'Website Inquiry',
    expectedFee: 80000,
    paidFee: 80000,
    createdDate: '2026-09-10',
    nextFollowup: '2026-10-15T10:00',
    notes: 'Paid total fees. Enrolled in Cohort 12.',
    history: [
      { date: '2026-09-10 14:00', user: 'System', note: 'Lead captured.' },
      { date: '2026-09-18 16:00', user: 'Priya Patel', note: 'Enrollment confirmed.' }
    ]
  },
  {
    id: 'CA-1008',
    name: 'Suresh Menon',
    email: 'suresh.m@gmail.com',
    mobile: '+91 97441 23456',
    college: 'CUSAT Kochi',
    qualification: 'B.Tech - Mechanical',
    passoutYear: 2023,
    targetRole: 'QA / Automation Engineer',
    courseInterest: 'SDET & Automation Testing',
    stage: 'Lost',
    priority: 'Low',
    assignedTo: 'usr-5', // Vikram Singh
    counselorName: 'Vikram Singh',
    source: 'Cold Outreach',
    expectedFee: 40000,
    paidFee: 0,
    createdDate: '2026-09-05',
    nextFollowup: '',
    notes: 'Selected for a core engineering job elsewhere. Uninterested at this time.',
    history: [
      { date: '2026-09-05 10:00', user: 'Vikram Singh', note: 'First contact call.' },
      { date: '2026-09-26 15:00', user: 'Vikram Singh', note: 'Candidate reported joining local company.' }
    ]
  }
];

export const PIPELINE_STAGES = [
  { key: 'New Lead', label: 'New Inquiries', color: '#6366f1', icon: 'Sparkles' },
  { key: 'Contacted', label: 'Contacted', color: '#3b82f6', icon: 'Phone' },
  { key: 'Interested', label: 'Interested', color: '#f59e0b', icon: 'Flame' },
  { key: 'Prospect', label: 'Prospect', color: '#8b5cf6', icon: 'Target' },
  { key: 'Follow-up', label: 'Follow-up', color: '#ec4899', icon: 'Clock' },
  { key: 'Enrolled', label: 'Enrolled (Won)', color: '#10b981', icon: 'Trophy' },
  { key: 'Lost', label: 'Dropped / Lost', color: '#ef4444', icon: 'XCircle' }
];
