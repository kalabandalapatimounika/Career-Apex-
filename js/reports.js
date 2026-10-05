/**
 * Career Apex CRM - Reports Module
 * Reports.getRevenueReport(), Reports.getCounselorReport(), Reports.getFunnelReport(), Reports.getSourceAttributionReport()
 */

const Reports = {
  getRevenueReport(filters = {}) {
    let students = Customers.getAll(filters);
    let payments = Payments.getAll();

    const booked = students.reduce((s, st) => s + (st.placementFee || 0), 0);
    const collected = students.reduce((s, st) => s + (st.paidAmount || 0), 0);
    const pending = Math.max(0, booked - collected);
    const rate = booked > 0 ? ((collected / booked) * 100).toFixed(1) : '0.0';

    return { booked, collected, pending, rate, paymentsCount: payments.length };
  },

  getCounselorReport() {
    const students = Customers.getAll();
    const counselors = StorageService.get(CRM_KEYS.USERS)?.filter(u => u.role === 'COUNSELOR') || [];

    return counselors.map(c => {
      const assigned = students.filter(s => s.counselor === c.name);
      const converted = assigned.filter(s => s.stage === 'Converted').length;
      const booked = assigned.reduce((sum, s) => sum + (s.placementFee || 0), 0);
      const paid = assigned.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      return {
        name: c.name,
        assignedCount: assigned.length,
        convertedCount: converted,
        rate: assigned.length > 0 ? ((converted / assigned.length) * 100).toFixed(1) : '0.0',
        booked,
        paid
      };
    });
  },

  getFunnelReport() {
    const students = Customers.getAll();
    const stages = Pipeline.getStages();
    return stages.map(st => ({
      stage: st,
      count: students.filter(s => s.stage === st).length
    }));
  },

  getSourceAttributionReport() {
    const students = Customers.getAll();
    const sourceMap = {};
    students.forEach(s => {
      const src = s.leadSource || 'Direct';
      if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0 };
      sourceMap[src].count++;
      sourceMap[src].revenue += (s.paidAmount || 0);
    });
    return sourceMap;
  }
};

window.Reports = Reports;
