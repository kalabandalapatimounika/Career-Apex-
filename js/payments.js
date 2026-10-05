/**
 * Career Apex CRM - Payments Module
 * Payments.recordPayment(), Payments.getAll(), Payments.printReceipt()
 * Strict business rules: amount > 0, amount <= pending, no overpayment allowed.
 */

const Payments = {
  getAll(filters = {}) {
    let payments = StorageService.get(CRM_KEYS.PAYMENTS) || [];
    if (filters.mode && filters.mode !== 'all') {
      payments = payments.filter(p => p.mode === filters.mode);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      payments = payments.filter(p =>
        (p.receiptNo && p.receiptNo.toLowerCase().includes(q)) ||
        (p.studentName && p.studentName.toLowerCase().includes(q)) ||
        (p.reference && p.reference.toLowerCase().includes(q)) ||
        (p.studentId && p.studentId.toLowerCase().includes(q))
      );
    }
    return payments;
  },

  recordPayment({ studentId, amount, installmentNum = 1, mode = 'UPI', reference = '', notes = '' }) {
    const student = Customers.getById(studentId);
    if (!student) {
      Utils.showToast('Student record not found', 'error');
      return null;
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      Utils.showToast('Payment amount must be greater than zero (amount > 0)', 'error');
      return null;
    }

    const pending = Number(student.pendingAmount || 0);
    if (payAmount > pending) {
      Utils.showToast(`Cannot overpay: Amount exceeds outstanding due of ${Utils.formatINR(pending)}`, 'error');
      return null;
    }

    const payments = StorageService.get(CRM_KEYS.PAYMENTS) || [];
    const receiptNo = `RCPT-2026-${String(payments.length + 101).padStart(4, '0')}`;

    const newPayment = {
      id: 'PAY-' + Date.now(),
      receiptNo,
      studentId: student.id,
      studentName: student.name,
      amount: payAmount,
      date: new Date().toISOString().split('T')[0],
      installmentNum: Number(installmentNum) || 1,
      mode,
      reference: reference.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      notes: notes.trim(),
      counselor: student.counselor,
      status: 'Success',
      createdAt: new Date().toISOString()
    };

    payments.unshift(newPayment);
    StorageService.set(CRM_KEYS.PAYMENTS, payments);

    // Update student financials
    const newPaid = Number(student.paidAmount || 0) + payAmount;
    const newPending = Math.max(0, Number(student.placementFee || 0) - newPaid);
    let payStatus = 'Pending';
    if (newPending === 0) payStatus = 'Paid';
    else if (newPaid > 0) payStatus = 'Partially Paid';

    // Update installments schedule
    let remaining = newPaid;
    const installments = (student.installments || []).map(inst => {
      if (remaining >= inst.amount) {
        remaining -= inst.amount;
        return { ...inst, status: 'Paid', paidDate: inst.paidDate || newPayment.date };
      } else if (remaining > 0) {
        remaining = 0;
        return { ...inst, status: 'Partial' };
      } else {
        return { ...inst, status: (new Date(inst.dueDate) < new Date() ? 'Overdue' : 'Pending') };
      }
    });

    Customers.update(student.id, {
      paidAmount: newPaid,
      pendingAmount: newPending,
      paymentStatus: payStatus,
      installments
    });

    Activities.log('Payment Recorded', `Payment of ${Utils.formatINR(payAmount)} received via ${mode} (${reference})`, student.id, student.name);
    Utils.showToast(`Payment of ${Utils.formatINR(payAmount)} successfully recorded!`, 'success');

    return newPayment;
  },

  openRecordModal(preselectedStudentId = null, onSuccess = null) {
    const students = (StorageService.get(CRM_KEYS.STUDENTS) || []).filter(s => (s.pendingAmount || 0) > 0 || s.id === preselectedStudentId);

    let modal = document.getElementById('modal-payment-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-payment-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Record Placement Fee Payment</h3>
            <span class="modal-subtitle">Bank verified collection and official receipt dispatch</span>
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('modal-payment-global').classList.remove('open')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="form-record-pay-dialog">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Select Student Lead <span class="required">*</span></label>
              <select id="pay-dlg-student" class="form-control" required>
                <option value="">-- Choose Candidate --</option>
                ${students.map(s => `
                  <option value="${s.id}" data-fee="${s.placementFee}" data-paid="${s.paidAmount}" data-pending="${s.pendingAmount}" ${s.id === preselectedStudentId ? 'selected' : ''}>
                    ${s.name} (${s.id}) — Pending: ${Utils.formatINR(s.pendingAmount)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div id="pay-dlg-summary" style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: none;">
              <div style="display: flex; justify-content: space-between; font-size: 12.5px;">
                <span>Total Fee: <strong id="pay-dlg-sum-fee">₹0</strong></span>
                <span>Paid: <strong id="pay-dlg-sum-paid" style="color: var(--success-dark);">₹0</strong></span>
                <span>Pending Balance: <strong id="pay-dlg-sum-pending" style="color: var(--warning-dark);">₹0</strong></span>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Installment <span class="required">*</span></label>
                <select id="pay-dlg-installment" class="form-control" required>
                  <option value="1">Installment #1 (Registration)</option>
                  <option value="2">Installment #2 (Placement Agreement)</option>
                  <option value="3">Installment #3 (Offer Confirmation)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Amount (₹) <span class="required">*</span></label>
                <input type="number" id="pay-dlg-amount" class="form-control" min="1" step="100" placeholder="15000" required>
                <span class="form-hint" id="pay-dlg-limit-hint">Max allowed: Pending due</span>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Payment Mode <span class="required">*</span></label>
                <select id="pay-dlg-mode" class="form-control" required>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Credit Card">Credit/Debit Card</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Cheque Deposit</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">UTR / Transaction Ref <span class="required">*</span></label>
                <input type="text" id="pay-dlg-ref" class="form-control" placeholder="e.g. UPI/2290458912" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction Notes</label>
              <textarea id="pay-dlg-notes" class="form-control" rows="2" placeholder="Bank ledger remarks..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="document.getElementById('modal-payment-global').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn-primary-purple">Verify & Record Payment</button>
          </div>
        </form>
      </div>
    `;

    const studentSel = document.getElementById('pay-dlg-student');
    const summaryBox = document.getElementById('pay-dlg-summary');
    const amountInput = document.getElementById('pay-dlg-amount');
    const hint = document.getElementById('pay-dlg-limit-hint');

    const updateFeeUI = () => {
      const opt = studentSel.options[studentSel.selectedIndex];
      if (opt && opt.value) {
        const fee = Number(opt.getAttribute('data-fee') || 0);
        const paid = Number(opt.getAttribute('data-paid') || 0);
        const pending = Number(opt.getAttribute('data-pending') || 0);

        document.getElementById('pay-dlg-sum-fee').textContent = Utils.formatINR(fee);
        document.getElementById('pay-dlg-sum-paid').textContent = Utils.formatINR(paid);
        document.getElementById('pay-dlg-sum-pending').textContent = Utils.formatINR(pending);
        summaryBox.style.display = 'block';

        amountInput.max = pending;
        hint.textContent = `Maximum permissible: ${Utils.formatINR(pending)} (No overpayment)`;
        amountInput.value = Math.min(15000, pending);
      } else {
        summaryBox.style.display = 'none';
      }
    };

    studentSel.addEventListener('change', updateFeeUI);
    updateFeeUI();

    document.getElementById('form-record-pay-dialog').onsubmit = (e) => {
      e.preventDefault();
      const sId = studentSel.value;
      const amount = Number(amountInput.value);
      const installmentNum = document.getElementById('pay-dlg-installment').value;
      const mode = document.getElementById('pay-dlg-mode').value;
      const reference = document.getElementById('pay-dlg-ref').value;
      const notes = document.getElementById('pay-dlg-notes').value;

      const payment = this.recordPayment({
        studentId: sId,
        amount,
        installmentNum,
        mode,
        reference,
        notes
      });

      if (payment) {
        modal.classList.remove('open');
        if (typeof onSuccess === 'function') onSuccess();
        else if (typeof window.refreshPageData === 'function') window.refreshPageData();
        // Immediately offer to print receipt
        this.printReceipt(payment.id);
      }
    };

    modal.classList.add('open');
  },

  printReceipt(paymentId) {
    const payment = (StorageService.get(CRM_KEYS.PAYMENTS) || []).find(p => p.id === paymentId);
    if (!payment) {
      Utils.showToast('Payment record not found', 'error');
      return;
    }

    const student = Customers.getById(payment.studentId);
    const settings = StorageService.get(CRM_KEYS.SETTINGS) || {};

    let modal = document.getElementById('modal-receipt-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-receipt-global';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">Placement Fee Tax Invoice Receipt</h3>
            <span class="modal-subtitle">Official computer generated acknowledgment</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary-purple" onclick="window.printReceiptSheet()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print Receipt
            </button>
            <button class="modal-close-btn" onclick="document.getElementById('modal-receipt-global').classList.remove('open')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="receipt-printable-container" id="printable-receipt-sheet">
            <div class="receipt-header-row">
              <div>
                <div class="receipt-brand-logo">CAREER APEX CRM</div>
                <div style="font-size: 11px; color: #64748b;">STUDENT PLACEMENT &amp; CAREER COUNSELING SALES CRM</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">GSTIN: ${settings.gstin || '29AABCU9603R1Z7'}</div>
              </div>
              <div class="receipt-meta-box">
                <div style="font-size: 16px; font-weight: 800;">TAX INVOICE RECEIPT</div>
                <div style="font-family: monospace; font-size: 13px; font-weight: 700; color: var(--primary);">${payment.receiptNo}</div>
                <div style="font-size: 12px; margin-top: 2px;">Date: <strong>${payment.date}</strong></div>
              </div>
            </div>

            <div class="dossier-grid" style="margin-bottom: 20px;">
              <div>
                <span class="dossier-label">STUDENT DETAILS:</span>
                <div style="font-size: 15px; font-weight: 700; margin-top: 2px;">${payment.studentName}</div>
                <div style="font-size: 12.5px; color: #475569;">Lead ID: <strong>${payment.studentId}</strong></div>
                <div style="font-size: 12.5px; color: #475569;">Role: ${student?.targetRole || 'Full Stack Placement Track'}</div>
              </div>
              <div style="text-align: right;">
                <span class="dossier-label">COUNSELOR IN-CHARGE:</span>
                <div style="font-size: 14px; font-weight: 700; margin-top: 2px;">${payment.counselor || 'Counselor'}</div>
                <div style="font-size: 12.5px; color: #475569;">Status: <span class="badge badge-green">VERIFIED</span></div>
              </div>
            </div>

            <div class="receipt-amount-banner">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #047857;">Realized Amount</div>
              <div class="receipt-amount-val">${Utils.formatINR(payment.amount)}</div>
              <div style="font-size: 12px; color: #065f46; margin-top: 2px;">(${Utils.numberToWordsINR(payment.amount)} Rupees Only)</div>
            </div>

            <div style="border: 1px solid var(--border-light); border-radius: 8px; padding: 12px 14px; margin-bottom: 20px;">
              <div class="dossier-row"><span class="dossier-label">Payment Mode:</span><span class="dossier-value">${payment.mode}</span></div>
              <div class="dossier-row"><span class="dossier-label">Transaction Ref:</span><span class="dossier-value" style="font-family: monospace;">${payment.reference}</span></div>
              <div class="dossier-row"><span class="dossier-label">Contracted Total Fee:</span><span class="dossier-value">${Utils.formatINR(student?.placementFee || payment.amount)}</span></div>
              <div class="dossier-row"><span class="dossier-label">Remaining Balance:</span><span class="dossier-value" style="color: var(--warning-dark);">${Utils.formatINR(student?.pendingAmount || 0)}</span></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 16px; border-top: 1px dashed var(--border-light);">
              <div style="font-size: 11px; color: #94a3b8;">* Computer generated official tax invoice receipt.</div>
              <div style="text-align: center;">
                <div style="font-family: cursive; font-size: 15px; color: var(--primary); font-weight: 700;">Career Apex Accounts</div>
                <div style="border-top: 1px solid #334155; width: 130px; margin-top: 4px; padding-top: 2px; font-size: 10.5px; font-weight: 600;">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    window.printReceiptSheet = () => {
      const contents = document.getElementById('printable-receipt-sheet').innerHTML;
      const printWin = window.open('', '_blank');
      printWin.document.write(`
        <html>
          <head>
            <title>Receipt_${payment.receiptNo}</title>
            <link rel="stylesheet" href="../css/style.css">
            <style>body { background: #fff; padding: 40px; font-family: sans-serif; }</style>
          </head>
          <body>
            ${contents}
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
          </body>
        </html>
      `);
      printWin.document.close();
    };

    modal.classList.add('open');
  }
};

window.Payments = Payments;
