/**
 * SALES CRM - VALIDATION MODULE
 * Form field validator, duplicate mobile detector, regex checks
 */

const Validation = {
  /**
   * Validate Indian or International Mobile Number (10 digits)
   */
  isValidMobile(mobile) {
    if (!mobile) return false;
    const clean = String(mobile).replace(/[^0-9]/g, '');
    // Standard Indian 10 digits (6-9 starting), or international 10-14 digits
    return clean.length >= 10 && clean.length <= 15;
  },

  /**
   * Standard Email format validation
   */
  isValidEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Check if mobile number already exists for another customer
   * @param {string} mobile 
   * @param {string} excludeCustomerId Optional customer ID to exclude (when editing)
   * @returns {{ exists: boolean, customer: object | null }}
   */
  checkDuplicateMobile(mobile, excludeCustomerId = null) {
    const cleanTarget = String(mobile).replace(/[^0-9]/g, '');
    if (!cleanTarget) return { exists: false, customer: null };

    const customers = StorageService.getData(CRM_STORAGE_KEYS.CUSTOMERS, []);
    const match = customers.find(c => {
      if (excludeCustomerId && c.id === excludeCustomerId) return false;
      const cMobile = String(c.mobile || '').replace(/[^0-9]/g, '');
      const cAlt = String(c.altMobile || '').replace(/[^0-9]/g, '');
      return (cMobile && cMobile === cleanTarget) || (cAlt && cAlt === cleanTarget);
    });

    return {
      exists: !!match,
      customer: match || null
    };
  },

  /**
   * Set invalid state on an input element
   */
  setError(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add('is-invalid');
    let feedback = inputEl.nextElementSibling;
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      inputEl.parentNode.insertBefore(feedback, inputEl.nextSibling);
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  },

  /**
   * Clear invalid state on an input element
   */
  clearError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid');
    const feedback = inputEl.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = '';
      feedback.style.display = 'none';
    }
  },

  /**
   * Clear all errors within a form
   */
  clearAllErrors(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    formEl.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }
};

window.Validation = Validation;
