/**
 * Skyline Academy - Authentication Service (Enhanced)
 * Manages Student and Administrator authentication without exposing synthetic emails.
 * Supports direct Student ID + Password, Admin ID + Password, and Admin Student-Dashboard-Preview.
 */

(function () {
  const SESSION_KEY = 'skyline_auth_session_v1';
  const CREDENTIALS_KEY = 'skyline_auth_creds_v1';

  // Synthetic Email Mapper (Hidden internally for Firebase Auth compatibility)
  function toSyntheticEmail(id, role) {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = role === 'admin' ? 'admin.skyline.internal' : 'student.skyline.internal';
    return `${role}_${cleanId}@${domain}`;
  }

  // Simple, deterministic salt hashing for standalone browser security
  function hashPassword(password) {
    let hash = 0;
    const str = 'SKYLINE_SALT_2026_' + password;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  class SkylineAuth {
    constructor() {
      this.adminBackupSession = null;
      this.currentSession = this.loadSession();
      this.initDefaultAdminCreds();
    }

    initDefaultAdminCreds() {
      const creds = this.getCredentials();
      if (!creds['ADM-001']) {
        creds['ADM-001'] = {
          role: 'admin',
          hash: hashPassword('admin123'),
          mustChange: true,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
      }
    }

    getCredentials() {
      try {
        return JSON.parse(localStorage.getItem(CREDENTIALS_KEY)) || {};
      } catch (e) {
        return {};
      }
    }

    saveCredentials(creds) {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    }

    loadSession() {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
            return session;
          }
        }
      } catch (e) {}
      return null;
    }

    setSession(user, role, remember = false) {
      const session = {
        user,
        role,
        syntheticEmail: toSyntheticEmail(user.id, role),
        timestamp: Date.now()
      };
      this.currentSession = session;
      const json = JSON.stringify(session);
      if (remember) {
        localStorage.setItem(SESSION_KEY, json);
      } else {
        sessionStorage.setItem(SESSION_KEY, json);
      }
      return session;
    }

    clearSession() {
      this.currentSession = null;
      this.adminBackupSession = null;
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }

    isAuthenticated() {
      return !!this.currentSession;
    }

    getUser() {
      return this.currentSession ? this.currentSession.user : null;
    }

    getRole() {
      return this.currentSession ? this.currentSession.role : null;
    }

    isAdmin() {
      return this.getRole() === 'admin' || (this.adminBackupSession && this.adminBackupSession.role === 'admin');
    }

    isStudent() {
      return this.getRole() === 'student';
    }

    isImpersonating() {
      return !!(this.currentSession && this.currentSession.isImpersonated);
    }

    impersonateStudent(studentId) {
      const student = window.SkylineStorage.getStudentById(studentId);
      if (!student) throw new Error('Student not found in registry');

      if (!this.adminBackupSession && this.currentSession && this.currentSession.role === 'admin') {
        this.adminBackupSession = this.currentSession;
      }

      this.currentSession = {
        user: student,
        role: 'student',
        isImpersonated: true,
        adminOriginal: this.adminBackupSession ? this.adminBackupSession.user : null,
        timestamp: Date.now()
      };
      return student;
    }

    stopImpersonating() {
      if (this.adminBackupSession) {
        this.currentSession = this.adminBackupSession;
        this.adminBackupSession = null;
        return true;
      }
      return false;
    }

    /* =================== STUDENT LOGIN =================== */
    async loginStudent(studentId, password, remember = false) {
      if (!studentId || !studentId.trim()) {
        throw new Error('Please enter your Student ID.');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }

      const id = studentId.trim().toUpperCase();
      const student = window.SkylineStorage.getStudentById(id);

      if (!student) {
        throw new Error('Student ID not found. Please verify your ID or contact administration.');
      }

      if (student.status !== 'Active') {
        throw new Error('This student account is currently inactive. Please contact administration.');
      }

      // Check password
      const creds = this.getCredentials();
      const userCred = creds[id];

      if (userCred && userCred.hash) {
        if (userCred.hash !== hashPassword(password)) {
          throw new Error('Incorrect password. Please try again or use the password reset option.');
        }
      } else {
        const last4 = student.phone ? student.phone.slice(-4) : '2026';
        const validInitial = (password === 'skyline2026' || password === last4 || password === '123456');

        if (!validInitial) {
          throw new Error('Incorrect password. For your first login, please use your temporary password or verify with your registered phone number.');
        }

        creds[id] = {
          role: 'student',
          hash: hashPassword(password),
          updatedAt: new Date().toISOString()
        };
        this.saveCredentials(creds);
      }

      // Record student login activity
      window.SkylineStorage.recordStudentLogin(student.id);

      return this.setSession(student, 'student', remember);
    }

    /* =================== ADMIN LOGIN =================== */
    async loginAdmin(adminId, password, remember = false) {
      if (!adminId || !adminId.trim()) {
        throw new Error('Please enter your Administrator ID.');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }

      const id = adminId.trim().toUpperCase();
      const admin = window.SkylineStorage.getAdmin();

      if (id !== admin.id.toUpperCase() && id !== 'ADM-001') {
        throw new Error('Administrator ID not recognized.');
      }

      const creds = this.getCredentials();
      const adminCred = creds[id] || creds['ADM-001'];

      if (!adminCred || !adminCred.hash) {
        throw new Error('Administrator account requires setup.');
      }

      if (adminCred.hash !== hashPassword(password)) {
        throw new Error('Incorrect administrator password. Please try again.');
      }

      return this.setSession(admin, 'admin', remember);
    }

    /* =================== PASSWORD MANAGEMENT =================== */
    changePassword(id, oldPassword, newPassword) {
      const normId = id.trim().toUpperCase();
      const creds = this.getCredentials();
      const cred = creds[normId];

      if (!cred) {
        throw new Error('Account record not found.');
      }

      if (cred.hash !== hashPassword(oldPassword)) {
        throw new Error('Current password does not match.');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }

      creds[normId].hash = hashPassword(newPassword);
      creds[normId].mustChange = false;
      creds[normId].updatedAt = new Date().toISOString();
      this.saveCredentials(creds);
      return true;
    }

    adminResetStudentPassword(studentId, temporaryPassword) {
      if (!this.isAdmin()) {
        throw new Error('Only administrators can reset student credentials.');
      }
      const normId = studentId.trim().toUpperCase();
      const creds = this.getCredentials();
      creds[normId] = {
        role: 'student',
        hash: hashPassword(temporaryPassword),
        mustChange: true,
        updatedAt: new Date().toISOString()
      };
      this.saveCredentials(creds);
      return true;
    }

    resetStudentPasswordWithPhone(studentId, phoneNumber, newPassword) {
      const normId = studentId.trim().toUpperCase();
      const student = window.SkylineStorage.getStudentById(normId);

      if (!student) {
        throw new Error('Student ID not found in system.');
      }

      const cleanPhoneInput = phoneNumber.replace(/[^0-9]/g, '');
      const cleanStudentPhone = (student.phone || '').replace(/[^0-9]/g, '');

      if (!cleanPhoneInput || !cleanStudentPhone || !cleanStudentPhone.endsWith(cleanPhoneInput.slice(-10))) {
        throw new Error('Phone number does not match registered student profile.');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const creds = this.getCredentials();
      creds[normId] = {
        role: 'student',
        hash: hashPassword(newPassword),
        updatedAt: new Date().toISOString()
      };
      this.saveCredentials(creds);
      return true;
    }

    logout() {
      this.clearSession();
    }
  }

  window.SkylineAuth = new SkylineAuth();
})();
