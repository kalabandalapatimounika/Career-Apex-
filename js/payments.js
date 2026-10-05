/**
 * SALES CRM - PAYMENTS & PLACEMENT FEE MODULE
 * Handles lead placement fee contracts, installment schedules,
 * transaction ledgers, cash collection tracking, and revenue analytics.
 */

const Payments = {
  /**
   * Format number into Indian Rupee format: ₹45,000
   */
  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN');
  },

  /**
   * Get all recorded payment transactions
   */
  getAll() {
    try {
      const list = StorageService.getData(CRM_STORAGE_KEYS.PAYMENTS, []);
      if (!Array.isArray(list)) return [];
      return list.filter(p => p && typeof p === 'object' && p.id);
    } catch (e) {
      console.error('Error in Payments.getAll:', e);
      return [];
    }
  },

  /**
   * Get all payment transactions for a specific lead
   */
  getByCustomerId(customerId) {
    if (!customerId) return [];
    const all = this.getAll();
    const cleanId = String(customerId).trim().toUpperCase();
    return all.filter(p => p && p.customerId && String(p.customerId).trim().toUpperCase() === cleanId);
  },

  /**
   * Record a new installment / fee payment for a lead
   * @param {object} data
   * @returns {{ success: boolean, message?: string, payment?: object, customer?: object }}
   */
  recordPayment(data) {
    if (!data.customerId) {
      return { success: false, message: 'Lead ID is required.' };
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Please enter a valid positive payment amount.' };
    }

    const customer = Customers.getById(data.customerId);
    if (!customer) {
      return { success: false, message: 'Lead record not found.' };
    }

    const currentUser = Auth.getCurrentUser();
    const now = new Date().toISOString();
    const paymentDate = data.paymentDate || now.split('T')[0];
    const newPaymentId = StorageService.generateId('CRM-PAY');

    const paymentRecord = {
      id: newPaymentId,
      customerId: customer.id,
      customerName: customer.name,
      studentDegree: customer.qualification || '',
      college: customer.college || '',
      amount: amount,
      paymentDate: paymentDate,
      paymentMode: data.paymentMode || 'UPI / Online',
      transactionRef: data.transactionRef ? String(data.transactionRef).trim() : `TXN-${Date.now().toString().slice(-6)}`,
      installmentTitle: data.installmentTitle || 'Fee Installment',
      installmentNumber: data.installmentNumber || null,
      notes: data.notes ? String(data.notes).trim() : '',
      receivedBy: data.receivedBy || (currentUser ? currentUser.name : 'System'),
      salespersonId: customer.salespersonId || null,
      salespersonName: customer.salespersonName || null,
      managerId: customer.managerId || null,
      managerName: customer.managerName || null,
      createdAt: now
    };

    // Save transaction to ledger
    const allPayments = this.getAll();
    allPayments.unshift(paymentRecord);
    StorageService.saveData(CRM_STORAGE_KEYS.PAYMENTS, allPayments);

    // Update customer fee totals
    const currentPaid = Number(customer.paidAmount) || 0;
    const totalFee = Number(customer.totalFee) || amount;
    const newPaidTotal = currentPaid + amount;
    const pendingDue = Math.max(0, totalFee - newPaidTotal);

    let newStatus = 'Pending';
    if (pendingDue <= 0) {
      newStatus = 'Fully Paid';
    } else if (newPaidTotal > 0) {
      newStatus = 'Partially Paid';
    }

    // Update customer's installment schedule if present
    let installments = Array.isArray(customer.installments) ? [...customer.installments] : [];
    
    // Check if an existing pending installment matches this payment or update by title
    let matchedInstallment = false;
    if (data.installmentId) {
      installments = installments.map(inst => {
        if (inst.id === data.installmentId) {
          matchedInstallment = true;
          return {
            ...inst,
            paidAmount: (Number(inst.paidAmount) || 0) + amount,
            paidDate: paymentDate,
            paymentMode: paymentRecord.paymentMode,
            transactionRef: paymentRecord.transactionRef,
            status: ((Number(inst.paidAmount) || 0) + amount >= inst.amount) ? 'Paid' : 'Partially Paid'
          };
        }
        return inst;
      });
    }

    // If no specific installment ID was targeted, mark the earliest pending installment as paid
    if (!matchedInstallment) {
      let remainingToApply = amount;
      installments = installments.map(inst => {
        if (remainingToApply > 0 && inst.status !== 'Paid') {
          const instDue = Math.max(0, (Number(inst.amount) || 0) - (Number(inst.paidAmount) || 0));
          const payThis = Math.min(remainingToApply, instDue);
          remainingToApply -= payThis;
          const totalPaidForInst = (Number(inst.paidAmount) || 0) + payThis;
          return {
            ...inst,
            paidAmount: totalPaidForInst,
            paidDate: paymentDate,
            paymentMode: paymentRecord.paymentMode,
            transactionRef: paymentRecord.transactionRef,
            status: totalPaidForInst >= inst.amount ? 'Paid' : 'Partially Paid'
          };
        }
        return inst;
      });
    }

    // Persist customer record updates
    Customers.update(customer.id, {
      paidAmount: newPaidTotal,
      pendingAmount: pendingDue,
      paymentStatus: newStatus,
      installments: installments
    });

    // Record activity
    Activities.log({
      action: 'Fee Payment Collected',
      customerId: customer.id,
      description: `Collected ${this.formatCurrency(amount)} (${paymentRecord.paymentMode}) for ${customer.name}. Balance remaining: ${this.formatCurrency(pendingDue)}.`
    });

    const updatedCustomer = Customers.getById(customer.id);
    return {
      success: true,
      payment: paymentRecord,
      customer: updatedCustomer
    };
  },

  /**
   * Update lead placement fee structure and installment plan
   */
  updateFeePlan(customerId, planData) {
    const customer = Customers.getById(customerId);
    if (!customer) return { success: false, message: 'Lead not found.' };

    const totalFee = Number(planData.totalFee) || 0;
    const planType = planData.paymentPlan || customer.paymentPlan || '2 Installments';
    const paidAmount = Number(customer.paidAmount) || 0;
    const pendingDue = Math.max(0, totalFee - paidAmount);

    let paymentStatus = 'Pending';
    if (pendingDue <= 0 && totalFee > 0) {
      paymentStatus = 'Fully Paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'Partially Paid';
    }

    // Auto-generate installments if requested or empty
    let installments = planData.installments;
    if (!installments || !installments.length) {
      installments = this.generateDefaultInstallments(totalFee, planType, paidAmount);
    }

    const res = Customers.update(customer.id, {
      totalFee: totalFee,
      paymentPlan: planType,
      paidAmount: paidAmount,
      pendingAmount: pendingDue,
      paymentStatus: paymentStatus,
      installments: installments
    });

    Activities.log({
      action: 'Placement Fee Plan Updated',
      customerId: customer.id,
      description: `Agreed placement fee set to ${this.formatCurrency(totalFee)} (${planType}) for ${customer.name}.`
    });

    return res;
  },

  /**
   * Helper to generate installment milestones based on plan type
   */
  generateDefaultInstallments(totalFee, planType, paidAmountSoFar = 0) {
    const today = new Date();
    const addDays = (d, n) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + n);
      return copy.toISOString().split('T')[0];
    };

    if (planType === 'Full Upfront') {
      const isPaid = paidAmountSoFar >= totalFee && totalFee > 0;
      return [
        {
          id: 'INST-1',
          title: 'Full Placement Fee (Upfront)',
          amount: totalFee,
          dueDate: addDays(today, 0),
          paidAmount: isPaid ? totalFee : paidAmountSoFar,
          paidDate: isPaid ? today.toISOString().split('T')[0] : null,
          status: isPaid ? 'Paid' : (paidAmountSoFar > 0 ? 'Partially Paid' : 'Pending'),
          paymentMode: isPaid ? 'UPI / Online' : null,
          transactionRef: isPaid ? 'TXN-UPFRONT' : null
        }
      ];
    }

    if (planType === '3 Installments') {
      const part1 = Math.round(totalFee * 0.4);
      const part2 = Math.round(totalFee * 0.3);
      const part3 = totalFee - part1 - part2;

      let remPaid = paidAmountSoFar;
      const getInst = (num, title, amt, dueDays) => {
        const paidThis = Math.min(remPaid, amt);
        remPaid = Math.max(0, remPaid - paidThis);
        return {
          id: `INST-${num}`,
          title: title,
          amount: amt,
          dueDate: addDays(today, dueDays),
          paidAmount: paidThis,
          paidDate: paidThis >= amt ? addDays(today, dueDays - 10) : null,
          status: paidThis >= amt ? 'Paid' : (paidThis > 0 ? 'Partially Paid' : 'Pending'),
          paymentMode: paidThis > 0 ? 'UPI / Online' : null,
          transactionRef: paidThis > 0 ? `TXN-INST-${num}` : null
        };
      };

      return [
        getInst(1, 'Installment 1: Registration & Onboarding', part1, 0),
        getInst(2, 'Installment 2: Mid-Course Interview Prep', part2, 30),
        getInst(3, 'Installment 3: Offer Letter / Placement Confirmation', part3, 75)
      ];
    }

    // Default: 2 Installments (50% upfront, 50% on placement)
    const p1 = Math.round(totalFee * 0.5);
    const p2 = totalFee - p1;

    let remPaid = paidAmountSoFar;
    const paid1 = Math.min(remPaid, p1);
    remPaid = Math.max(0, remPaid - paid1);
    const paid2 = Math.min(remPaid, p2);

    return [
      {
        id: 'INST-1',
        title: 'Installment 1: Enrollment & Training Access',
        amount: p1,
        dueDate: addDays(today, 0),
        paidAmount: paid1,
        paidDate: paid1 >= p1 ? today.toISOString().split('T')[0] : null,
        status: paid1 >= p1 ? 'Paid' : (paid1 > 0 ? 'Partially Paid' : 'Pending'),
        paymentMode: paid1 > 0 ? 'UPI / Online' : null,
        transactionRef: paid1 > 0 ? 'TXN-INST-1' : null
      },
      {
        id: 'INST-2',
        title: 'Installment 2: Placement & Offer Letter Release',
        amount: p2,
        dueDate: addDays(today, 45),
        paidAmount: paid2,
        paidDate: paid2 >= p2 ? addDays(today, 20) : null,
        status: paid2 >= p2 ? 'Paid' : (paid2 > 0 ? 'Partially Paid' : 'Pending'),
        paymentMode: paid2 > 0 ? 'Net Banking' : null,
        transactionRef: paid2 > 0 ? 'TXN-INST-2' : null
      }
    ];
  },

  /**
   * Compute comprehensive revenue & collection summary across candidate pool
   */
  getSummary(scopedCustomers = null) {
    const list = scopedCustomers || Customers.getAll();
    const today = new Date().toISOString().split('T')[0];

    let totalBooked = 0;
    let totalCollected = 0;
    let totalPending = 0;

    let fullyPaidCount = 0;
    let partiallyPaidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    list.forEach(c => {
      const fee = Number(c.totalFee) || 0;
      const paid = Number(c.paidAmount) || 0;
      const pending = Math.max(0, fee - paid);

      totalBooked += fee;
      totalCollected += paid;
      totalPending += pending;

      const status = (c.paymentStatus || 'Pending').toLowerCase();
      if (status === 'fully paid' || pending === 0 && fee > 0) {
        fullyPaidCount++;
      } else if (status === 'partially paid' || (paid > 0 && pending > 0)) {
        partiallyPaidCount++;
      } else {
        pendingCount++;
      }

      // Check if lead has any overdue installment
      if (Array.isArray(c.installments)) {
        const hasOverdue = c.installments.some(inst => {
          return inst.status !== 'Paid' && inst.dueDate && inst.dueDate < today;
        });
        if (hasOverdue) {
          overdueCount++;
        }
      }
    });

    const collectionRate = totalBooked > 0 ? Number(((totalCollected / totalBooked) * 100).toFixed(1)) : 0;

    return {
      totalBooked,
      totalCollected,
      totalPending,
      collectionRate,
      fullyPaidCount,
      partiallyPaidCount,
      pendingCount,
      overdueCount,
      totalLeads: list.length,
      totalStudents: list.length,
      totalLeadsWithFees: list.filter(c => (c.totalFee || 0) > 0).length,
      totalStudentsWithFees: list.filter(c => (c.totalFee || 0) > 0).length
    };
  },

  /**
   * Get list of all pending and overdue installments across leads
   */
  getInstallmentDues(scopedCustomers = null, filterType = 'all') {
    const list = scopedCustomers || Customers.getAll();
    const today = new Date().toISOString().split('T')[0];
    const dues = [];

    list.forEach(c => {
      if (!Array.isArray(c.installments)) return;

      c.installments.forEach((inst, idx) => {
        if (inst.status === 'Paid') return;

        const isOverdue = inst.dueDate && inst.dueDate < today;
        if (filterType === 'overdue' && !isOverdue) return;
        if (filterType === 'upcoming' && isOverdue) return;

        dues.push({
          installmentId: inst.id || `INST-${idx+1}`,
          title: inst.title || `Installment #${idx+1}`,
          dueDate: inst.dueDate || '—',
          amount: Number(inst.amount) || 0,
          paidAmount: Number(inst.paidAmount) || 0,
          balanceDue: Math.max(0, (Number(inst.amount) || 0) - (Number(inst.paidAmount) || 0)),
          isOverdue: isOverdue,
          status: isOverdue ? 'Overdue' : (inst.status || 'Pending'),
          customerId: c.id,
          customerName: c.name,
          mobile: c.mobile,
          degree: c.qualification || 'Lead',
          college: c.college || '',
          stage: c.stage,
          salespersonId: c.salespersonId,
          salespersonName: c.salespersonName || 'Unassigned',
          managerName: c.managerName || '—'
        });
      });
    });

    // Sort: overdue first, then by earliest due date
    dues.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    return dues;
  },

  /**
   * Group fee collection performance by Career Counselor / Sales Rep
   */
  getCounselorRevenueReport(scopedCustomers = null) {
    const customers = scopedCustomers || Customers.getAll();
    const counselors = Users.getSalespeople();
    const repMap = {};

    counselors.forEach(r => {
      repMap[r.id] = {
        id: r.id,
        name: r.name,
        managerName: r.managerName || '—',
        avatar: r.avatar,
        leadsCount: 0,
        studentsCount: 0,
        enrolledCount: 0,
        placedCount: 0,
        totalBooked: 0,
        totalCollected: 0,
        pendingDues: 0
      };
    });

    // Also track unassigned
    repMap['unassigned'] = {
      id: 'unassigned',
      name: 'Unassigned Queue',
      managerName: '—',
      avatar: null,
      leadsCount: 0,
      studentsCount: 0,
      enrolledCount: 0,
      placedCount: 0,
      totalBooked: 0,
      totalCollected: 0,
      pendingDues: 0
    };

    customers.forEach(c => {
      const repKey = c.salespersonId && repMap[c.salespersonId] ? c.salespersonId : 'unassigned';
      const rep = repMap[repKey];
      rep.leadsCount++;
      rep.studentsCount++;

      const stage = (c.stage || '').toLowerCase();
      if (stage === 'enrolled' || stage === 'negotiation') rep.enrolledCount++;
      if (stage === 'converted' || stage.includes('placed')) rep.placedCount++;

      const fee = Number(c.totalFee) || 0;
      const paid = Number(c.paidAmount) || 0;
      const pending = Math.max(0, fee - paid);

      rep.totalBooked += fee;
      rep.totalCollected += paid;
      rep.pendingDues += pending;
    });

    return Object.values(repMap)
      .filter(r => r.leadsCount > 0 || r.id !== 'unassigned')
      .map(r => ({
        ...r,
        collectionRate: r.totalBooked > 0 ? Number(((r.totalCollected / r.totalBooked) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.totalCollected - a.totalCollected);
  },

  /**
   * Group fee collection by pipeline stage
   */
  getRevenueByStage(scopedCustomers = null) {
    const customers = scopedCustomers || Customers.getAll();
    const stageMap = {};

    SeedData.STAGES.forEach(st => {
      stageMap[st] = {
        stage: st,
        count: 0,
        totalBooked: 0,
        totalCollected: 0,
        pendingDues: 0
      };
    });

    customers.forEach(c => {
      const st = c.stage || 'New Lead';
      if (!stageMap[st]) {
        stageMap[st] = { stage: st, count: 0, totalBooked: 0, totalCollected: 0, pendingDues: 0 };
      }
      stageMap[st].count++;
      const fee = Number(c.totalFee) || 0;
      const paid = Number(c.paidAmount) || 0;
      stageMap[st].totalBooked += fee;
      stageMap[st].totalCollected += paid;
      stageMap[st].pendingDues += Math.max(0, fee - paid);
    });

    return Object.values(stageMap).map(s => ({
      ...s,
      collectionRate: s.totalBooked > 0 ? Number(((s.totalCollected / s.totalBooked) * 100).toFixed(1)) : 0
    }));
  },

  /**
   * Group transactions by payment mode (UPI, Net Banking, Card, etc.)
   */
  getPaymentModeStats(transactions = null) {
    const list = transactions || this.getAll();
    const stats = {};

    list.forEach(p => {
      const mode = p.paymentMode || 'UPI / Online';
      if (!stats[mode]) {
        stats[mode] = { count: 0, totalAmount: 0 };
      }
      stats[mode].count++;
      stats[mode].totalAmount += Number(p.amount) || 0;
    });

    return stats;
  },

  /**
   * Generate an HTML receipt for printing or modal preview
   */
  generateReceiptHtml(payment, customer) {
    const p = payment || {};
    const c = customer || {};

    return `
      <div id="printable-receipt" style="padding: 2rem; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #0284c7; letter-spacing: -0.02em;">CAREER APEX CRM</div>
            <div style="font-size: 0.8rem; color: #64748b;">Career Services & Training</div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">GSTIN: 27AABCC1234F1Z9 • Mumbai, India</div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 0.35rem 0.75rem; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.85rem; border-radius: 9999px; border: 1px solid #a7f3d0;">
              ✓ OFFICIAL RECEIPT
            </span>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.4rem; font-family: monospace;">Receipt #: ${p.id || 'CRM-PAY-000000'}</div>
            <div style="font-size: 0.8rem; color: #64748b;">Date: ${p.paymentDate || '—'}</div>
          </div>
        </div>

        <div style="background: #f8fafc; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">Lead Details</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem;">
            <div><strong>Name:</strong> ${Utils.escapeHtml(c.name || p.customerName || '—')}</div>
            <div><strong>Lead ID:</strong> ${Utils.escapeHtml(c.id || p.customerId || '—')}</div>
            <div><strong>Degree / Course:</strong> ${Utils.escapeHtml(c.qualification || p.studentDegree || '—')}</div>
            <div><strong>Mobile:</strong> ${Utils.escapeHtml(c.mobile || '—')}</div>
            <div><strong>College:</strong> ${Utils.escapeHtml(c.college || p.college || '—')}</div>
            <div><strong>Counselor:</strong> ${Utils.escapeHtml(p.receivedBy || c.salespersonName || '—')}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.875rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 0.75rem; text-align: left;">Payment Description / Milestone</th>
              <th style="padding: 0.75rem; text-align: left;">Payment Mode</th>
              <th style="padding: 0.75rem; text-align: left;">Transaction Ref</th>
              <th style="padding: 0.75rem; text-align: right;">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.75rem; font-weight: 600;">${Utils.escapeHtml(p.installmentTitle || 'Placement Training Fee Installment')}</td>
              <td style="padding: 0.75rem;">${Utils.escapeHtml(p.paymentMode || 'UPI')}</td>
              <td style="padding: 0.75rem; font-family: monospace; font-size: 0.8rem;">${Utils.escapeHtml(p.transactionRef || '—')}</td>
              <td style="padding: 0.75rem; text-align: right; font-weight: 700; font-size: 1rem; color: #0f172a;">${this.formatCurrency(p.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #e2e8f0; padding-top: 1rem; margin-bottom: 1.5rem;">
          <div style="font-size: 0.8rem; color: #64748b;">
            ${p.notes ? `<strong>Notes:</strong> ${Utils.escapeHtml(p.notes)}<br>` : ''}
            Total Agreed Fee: ${this.formatCurrency(c.totalFee || 0)} | Total Paid to Date: ${this.formatCurrency(c.paidAmount || 0)} | Balance Due: ${this.formatCurrency(c.pendingAmount || 0)}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #64748b;">Amount Received</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #0284c7;">${this.formatCurrency(p.amount)}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.75rem; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 1rem;">
          <div>This is a computer-generated receipt issued by Career Apex Placement CRM.</div>
          <div style="text-align: center; border-top: 1px solid #64748b; padding-top: 0.25rem; min-width: 140px; color: #475569;">
            Authorized Signature
          </div>
        </div>
      </div>
    `;
  }
};

window.Payments = Payments;
