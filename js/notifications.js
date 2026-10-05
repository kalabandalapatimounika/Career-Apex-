/**
 * SALES CRM - NOTIFICATIONS MODULE
 * Beautiful toast notifications & confirmation modals
 */

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
      this.container = container;
    }
  },

  show({ title = '', message = '', type = 'info', duration = 3500 }) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    else if (type === 'error') iconClass = 'fa-circle-xmark';
    else if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${Utils.escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${Utils.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" title="Close"><i class="fa-solid fa-xmark"></i></button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      if (toast.classList.contains('removing')) return;
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    };

    closeBtn.addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, duration);

    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    this.container.appendChild(toast);
  },

  success(message, title = 'Success') {
    this.show({ title, message, type: 'success' });
  },

  error(message, title = 'Error') {
    this.show({ title, message, type: 'error' });
  },

  warning(message, title = 'Warning') {
    this.show({ title, message, type: 'warning' });
  },

  info(message, title = 'Info') {
    this.show({ title, message, type: 'info' });
  }
};

const ConfirmModal = {
  modalEl: null,

  init() {
    if (!this.modalEl) {
      let modal = document.getElementById('crm-confirm-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'crm-confirm-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="modal-title" id="confirm-modal-title">Confirm Action</h3>
              <button class="modal-close-btn" id="confirm-modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
              <p id="confirm-modal-message" style="color: var(--slate-600); line-height: 1.5; font-size: 0.95rem;"></p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
              <button class="btn btn-primary" id="confirm-modal-ok">Confirm</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      this.modalEl = modal;
    }
  },

  show({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary', // primary or danger
    onConfirm = () => {}
  }) {
    this.init();

    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const closeBtn = document.getElementById('confirm-modal-close');

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    okBtn.className = `btn btn-${confirmVariant}`;

    const hide = () => {
      this.modalEl.classList.remove('show');
    };

    const handleConfirm = () => {
      hide();
      onConfirm();
      cleanup();
    };

    const handleCancel = () => {
      hide();
      cleanup();
    };

    const cleanup = () => {
      okBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
    };

    okBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);

    this.modalEl.classList.add('show');
  }
};

window.Toast = Toast;
window.ConfirmModal = ConfirmModal;
