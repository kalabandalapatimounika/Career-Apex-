/**
 * Career Apex CRM - Customers Module
 * Architecture designed for future REST API compatibility:
 * Customers.getAll(), Customers.getById(), Customers.create(), Customers.update()
 */

const Customers = {
  getAll(filters = {}) {
    let students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    const session = Auth.getSession();

    // Scoping by role
    if (session && session.role === 'COUNSELOR') {
      students = students.filter(s => s.counselor === session.name);
    } else if (session && session.role === 'MANAGER') {
      students = students.filter(s => s.manager === session.name);
    }

    if (filters.stage && filters.stage !== 'all') {
      students = students.filter(s => s.stage === filters.stage);
    }
    if (filters.counselor && filters.counselor !== 'all') {
      students = students.filter(s => s.counselor === filters.counselor);
    }
    if (filters.payment && filters.payment !== 'all') {
      students = students.filter(s => s.paymentStatus === filters.payment);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      students = students.filter(s => {
        const skillsStr = Array.isArray(s.skills) ? s.skills.join(' ').toLowerCase() : '';
        return (
          (s.id && s.id.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.college && s.college.toLowerCase().includes(q)) ||
          (s.degree && s.degree.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          skillsStr.includes(q)
        );
      });
    }

    return students;
  },

  getById(id) {
    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    return students.find(s => s.id === id || s.leadId === id) || null;
  },

  create(studentData) {
    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];

    const cleanMobile = Utils.cleanPhone(studentData.mobile || studentData.phone || '');
    const cleanAltMobile = Utils.cleanPhone(studentData.alternateMobile || studentData.alternatePhone || '');
    const emailLower = (studentData.email || '').toLowerCase().trim();

    // Check duplicate primary mobile
    if (cleanMobile) {
      const dup = students.find(s => {
        const sM = Utils.cleanPhone(s.mobile || s.phone || '');
        const sA = Utils.cleanPhone(s.alternateMobile || s.alternatePhone || '');
        return sM === cleanMobile || sA === cleanMobile;
      });
      if (dup) {
        throw new Error(`Duplicate Student: Primary mobile number ${studentData.mobile || studentData.phone} matches existing candidate ${dup.name} (${dup.id}).`);
      }
    }

    // Check duplicate alternate mobile
    if (cleanAltMobile) {
      const dup = students.find(s => {
        const sM = Utils.cleanPhone(s.mobile || s.phone || '');
        const sA = Utils.cleanPhone(s.alternateMobile || s.alternatePhone || '');
        return sM === cleanAltMobile || sA === cleanAltMobile;
      });
      if (dup) {
        throw new Error(`Duplicate Student: Alternate mobile number ${studentData.alternateMobile || studentData.alternatePhone} matches existing candidate ${dup.name} (${dup.id}).`);
      }
    }

    // Check duplicate email
    if (emailLower) {
      const dup = students.find(s => (s.email || '').toLowerCase().trim() === emailLower);
      if (dup) {
        throw new Error(`Duplicate Student: Email address ${studentData.email} is already registered under ${dup.name} (${dup.id}).`);
      }
    }

    const maxId = students.reduce((max, s) => {
      const m = (s.id || '').match(/CAPX-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 1000);
    const newId = `CAPX-${maxId + 1}`;

    const newRecord = {
      id: newId,
      leadId: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAmount: 0,
      placementFee: Number(studentData.placementFee) || 45000,
      pendingAmount: Number(studentData.placementFee) || 45000,
      paymentStatus: 'Pending',
      stage: studentData.stage || 'New Lead',
      ...studentData
    };

    students.unshift(newRecord);
    StorageService.set(CRM_KEYS.STUDENTS, students);
    Activities.log('Lead Created', newId, newRecord.name, `New student lead ${newId} created for ${newRecord.name}`);
    return newRecord;
  },


  update(id, updates) {
    const students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return null;

    students[idx] = {
      ...students[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    StorageService.set(CRM_KEYS.STUDENTS, students);
    Activities.log('Lead Updated', `Student ${students[idx].name} (${id}) updated`, id, students[idx].name);
    return students[idx];
  },

  delete(id) {
    if (!Auth.canAccess('delete_lead')) {
      Utils.showToast('Permission denied: Only Admin can delete student records', 'error');
      return false;
    }
    let students = StorageService.get(CRM_KEYS.STUDENTS) || [];
    const target = students.find(s => s.id === id);
    if (!target) return false;

    students = students.filter(s => s.id !== id);
    StorageService.set(CRM_KEYS.STUDENTS, students);
    Activities.log('Lead Deleted', `Student record ${target.name} (${id}) removed`, id, target.name);
    return true;
  },

  addNote(id, noteText) {
    const student = this.getById(id);
    if (!student) return false;
    if (!student.notes) student.notes = [];
    const author = Auth.getSession()?.name || 'Staff';
    student.notes.unshift({
      id: 'NOTE-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      author,
      text: noteText
    });
    this.update(id, { notes: student.notes });
    return true;
  },

  exportCSV() {
    const students = this.getAll();
    if (students.length === 0) {
      Utils.showToast('No leads available to export', 'warning');
      return;
    }

    const headers = ['Lead ID', 'Student Name', 'Mobile', 'Email', 'College', 'Degree', 'Skills', 'Stage', 'Counselor', 'Total Fee', 'Paid', 'Pending', 'Payment Status'];
    const rows = students.map(s => [
      s.id,
      `"${s.name}"`,
      `"${s.phone}"`,
      `"${s.email || ''}"`,
      `"${s.college || ''}"`,
      `"${s.degree || ''}"`,
      `"${Array.isArray(s.skills) ? s.skills.join(', ') : ''}"`,
      `"${s.stage}"`,
      `"${s.counselor}"`,
      s.placementFee || 0,
      s.paidAmount || 0,
      s.pendingAmount || 0,
      `"${s.paymentStatus}"`
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Career_Apex_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Utils.showToast(`Exported ${students.length} leads to CSV`, 'success');
  }
};

window.Customers = Customers;
