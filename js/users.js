/**
 * SALES CRM - USERS MODULE
 * User management, team hierarchies, role queries, and account state
 */

const Users = {
  /**
   * Get all registered CRM users
   */
  getAll() {
    try {
      const list = StorageService.getData(CRM_STORAGE_KEYS.USERS, []);
      if (!Array.isArray(list)) return [];
      return list.filter(u => u && typeof u === 'object' && u.id);
    } catch (e) {
      console.error('Error in Users.getAll:', e);
      return [];
    }
  },

  /**
   * Find user by ID
   */
  getById(id) {
    const users = this.getAll();
    return users.find(u => u.id === id) || null;
  },

  /**
   * Get all Sales Managers
   */
  getManagers() {
    return this.getAll().filter(u => u.role === 'manager' && u.status === 'Active');
  },

  /**
   * Get all Sales Team Members, optionally filtered by their assigned manager
   */
  getSalespeople(managerId = null) {
    let sales = this.getAll().filter(u => u.role === 'sales' && u.status === 'Active');
    if (managerId) {
      sales = sales.filter(u => u.managerId === managerId);
    }
    return sales;
  },

  /**
   * Get team members reporting to a given manager
   */
  getTeamMembers(managerId) {
    if (!managerId) return [];
    return this.getAll().filter(u => u.managerId === managerId);
  },

  /**
   * Create a new user (Sales Manager or Sales Team Member)
   */
  create(data) {
    const users = this.getAll();

    // Check duplicate email
    const emailLower = String(data.email || '').trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      return { success: false, message: 'A user with this email address already exists.' };
    }

    const newId = StorageService.generateId('USR');
    let managerName = null;
    if (data.managerId) {
      const mgr = this.getById(data.managerId);
      if (mgr) managerName = mgr.name;
    }

    const newUser = {
      id: newId,
      name: data.name.trim(),
      email: emailLower,
      password: data.password || 'welcome123',
      mobile: data.mobile ? String(data.mobile).trim() : '',
      role: data.role || 'sales',
      managerId: data.role === 'sales' ? data.managerId || null : null,
      managerName: data.role === 'sales' ? managerName : null,
      status: data.status || 'Active',
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=4f46e5&color=fff`,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    StorageService.saveData(CRM_STORAGE_KEYS.USERS, users);

    Activities.log({
      action: 'User Created',
      description: `New user ${newUser.name} (${newUser.role.toUpperCase()}) was created.`
    });

    return { success: true, user: newUser };
  },

  /**
   * Update user details
   */
  update(id, updates) {
    const users = this.getAll();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return { success: false, message: 'User not found.' };
    }

    // Check duplicate email if changed
    if (updates.email) {
      const emailLower = String(updates.email).trim().toLowerCase();
      if (users.some(u => u.id !== id && u.email.toLowerCase() === emailLower)) {
        return { success: false, message: 'Another user already uses this email address.' };
      }
      updates.email = emailLower;
    }

    if (updates.managerId) {
      const mgr = this.getById(updates.managerId);
      updates.managerName = mgr ? mgr.name : null;
    }

    users[idx] = {
      ...users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    StorageService.saveData(CRM_STORAGE_KEYS.USERS, users);

    // If current logged-in user was updated, update session too
    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      StorageService.saveData(CRM_STORAGE_KEYS.CURRENT_USER, users[idx]);
    }

    Activities.log({
      action: 'User Edited',
      description: `User ${users[idx].name} profile was updated.`
    });

    return { success: true, user: users[idx] };
  },

  /**
   * Toggle user active/inactive status
   */
  toggleStatus(id) {
    const user = this.getById(id);
    if (!user) return { success: false, message: 'User not found.' };

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    return this.update(id, { status: newStatus });
  }
};

window.Users = Users;
