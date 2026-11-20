/**
 * Skyline Academy - Storage & Data Service (Enhanced)
 * Manages students, courses, intakes, settings, targeted notifications, and student activity logs.
 */

(function () {
  const STORAGE_KEYS = {
    STUDENTS: 'skyline_students_v1',
    COURSES: 'skyline_courses_v1',
    INTAKES: 'skyline_intakes_v1',
    SEMESTERS: 'skyline_semesters_v1',
    ADMIN: 'skyline_admin_v1',
    SETTINGS: 'skyline_settings_v1',
    ANNOUNCEMENTS: 'skyline_announcements_v1',
    ACTIVITY_LOGS: 'skyline_activity_logs_v1'
  };

  const seed = window.SKYLINE_SEED_DATA || {
    students: [],
    courses: [],
    intakes: ['Intake 6', 'Intake 8'],
    semesters: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'],
    admin: {
      id: 'ADM-001',
      name: 'Skyline Administrator',
      email: 'admin@skylineacademy.in',
      role: 'Administrator',
      status: 'Active'
    },
    settings: {
      academyName: 'Skyline Academy',
      university: 'Sri Narayana Guru Open University (SGOU)',
      assignmentPortalUrl: 'https://script.google.com/macros/s/AKfycbz_assignment_distributor_demo/exec',
      contactPhone: '+91 98092 39448',
      contactEmail: 'contact@skylineacademy.in',
      contactHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
      notice: 'Welcome to Skyline Academy. Assignment guidance and study materials for 1st & 3rd Semesters are now accessible through your student dashboard.'
    }
  };

  class SkylineStorage {
    constructor() {
      this.init();
    }

    init() {
      // 1. Students
      if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(seed.students || []));
      }
      // 2. Courses
      if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
        localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(seed.courses || []));
      }
      // 3. Intakes (default includes Intake 6, Intake 8, and Intake 7 ready)
      if (!localStorage.getItem(STORAGE_KEYS.INTAKES)) {
        localStorage.setItem(STORAGE_KEYS.INTAKES, JSON.stringify(seed.intakes || ['Intake 6', 'Intake 8', 'Intake 7']));
      }
      // 4. Semesters
      if (!localStorage.getItem(STORAGE_KEYS.SEMESTERS)) {
        localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(seed.semesters || []));
      }
      // 5. Admin
      if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(seed.admin || {}));
      }
      // 6. Settings
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(seed.settings || {}));
      }
      // 7. Announcements / Targeted Notifications
      if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
        const defaultAnnouncements = [
          {
            id: 'ANN-001',
            title: 'Welcome to Skyline Academy Student Portal',
            date: '2026-11-20',
            time: '09:00 AM',
            target: 'all',
            targetLabel: 'All Students',
            category: 'General',
            priority: 'Normal',
            content: 'Skyline Academy provides academic guidance, study materials, and examination prep for Sri Narayana Guru Open University (SGOU) learners.',
            pinned: true
          },
          {
            id: 'ANN-002',
            title: 'SGOU Assignment Preparation Guidance Released',
            date: '2026-11-19',
            time: '11:30 AM',
            target: 'Intake 6',
            targetLabel: 'Intake 6 (Semester 3)',
            category: 'Assignment Alert',
            priority: 'High',
            content: 'Assignment distribution materials for 3rd Semester have been updated in the Google Apps Script system. Access the link in your dashboard.',
            pinned: false
          },
          {
            id: 'ANN-003',
            title: 'Intake 8 Batch Induction & Course Overview',
            date: '2026-11-18',
            time: '03:15 PM',
            target: 'Intake 8',
            targetLabel: 'Intake 8 (Semester 1)',
            category: 'Class Notice',
            priority: 'Normal',
            content: 'New batch guidance notes for B.Com, BBA, and B.A Honours are now live under your academic course view.',
            pinned: false
          }
        ];
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultAnnouncements));
      }
      // 8. Activity logs
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
        const sampleLogs = [
          {
            id: 'ACT-001',
            studentId: 'SKY-26X-01',
            studentName: 'Amina',
            intake: 'Intake 6',
            timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
            action: 'Logged into Student Dashboard'
          },
          {
            id: 'ACT-002',
            studentId: 'SKY-26X-101',
            studentName: 'Jh',
            intake: 'Intake 8',
            timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
            action: 'Accessed Study Materials & Assignment Link'
          }
        ];
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(sampleLogs));
      }
    }

    /* =================== STUDENTS =================== */
    getStudents() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
      } catch (e) {
        return seed.students || [];
      }
    }

    getStudentById(id) {
      if (!id) return null;
      const targetId = id.trim().toUpperCase();
      return this.getStudents().find(s => s.id && s.id.toUpperCase() === targetId) || null;
    }

    saveStudent(student) {
      const students = this.getStudents();
      const idx = students.findIndex(s => s.id.toUpperCase() === student.id.toUpperCase());
      if (idx >= 0) {
        students[idx] = { ...students[idx], ...student, updatedAt: new Date().toISOString() };
      } else {
        students.push({ ...student, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      return student;
    }

    toggleStudentStatus(id) {
      const students = this.getStudents();
      const student = students.find(s => s.id.toUpperCase() === id.toUpperCase());
      if (student) {
        student.status = student.status === 'Active' ? 'Inactive' : 'Active';
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        return student;
      }
      return null;
    }

    /* =================== STUDENT ACTIVITY TRACKING =================== */
    recordStudentLogin(studentId) {
      const students = this.getStudents();
      const student = students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
      const nowIso = new Date().toISOString();
      if (student) {
        student.lastLogin = nowIso;
        student.loginCount = (student.loginCount || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      }
      // Append to live activity logs
      const logs = this.getActivityLogs();
      logs.unshift({
        id: 'ACT-' + Date.now().toString().slice(-6),
        studentId: studentId.toUpperCase(),
        studentName: student ? student.name : studentId,
        intake: student ? student.intake : '',
        timestamp: nowIso,
        action: 'Logged into Student Dashboard'
      });
      // Keep up to 60 recent entries
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs.slice(0, 60)));
    }

    getActivityLogs() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) || [];
      } catch (e) {
        return [];
      }
    }

    /* =================== INTAKES =================== */
    getIntakes() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.INTAKES)) || ['Intake 6', 'Intake 8', 'Intake 7'];
      } catch (e) {
        return ['Intake 6', 'Intake 8', 'Intake 7'];
      }
    }

    addIntake(name) {
      if (!name) return false;
      const intakes = this.getIntakes();
      const trimmed = name.trim();
      if (!intakes.includes(trimmed)) {
        intakes.push(trimmed);
        localStorage.setItem(STORAGE_KEYS.INTAKES, JSON.stringify(intakes));
        return true;
      }
      return false;
    }

    /* =================== SEMESTERS =================== */
    getSemesters() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEMESTERS)) || [];
      } catch (e) {
        return [];
      }
    }

    /* =================== COURSES & SUBJECTS =================== */
    getCourses() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES)) || [];
      } catch (e) {
        return seed.courses || [];
      }
    }

    saveCourse(course) {
      const courses = this.getCourses();
      const idx = courses.findIndex(c => 
        c.semester.toLowerCase() === course.semester.toLowerCase() && 
        c.programme.toLowerCase() === course.programme.toLowerCase()
      );
      if (idx >= 0) {
        courses[idx] = { ...courses[idx], ...course };
      } else {
        courses.push(course);
      }
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
      return course;
    }

    /* =================== ADMIN PROFILE =================== */
    getAdmin() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN)) || seed.admin;
      } catch (e) {
        return seed.admin;
      }
    }

    saveAdmin(adminData) {
      const admin = { ...this.getAdmin(), ...adminData };
      localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));
      return admin;
    }

    /* =================== SETTINGS =================== */
    getSettings() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || seed.settings;
      } catch (e) {
        return seed.settings;
      }
    }

    saveSettings(settingsData) {
      const settings = { ...this.getSettings(), ...settingsData };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    }

    /* =================== NOTIFICATIONS & BROADCASTS =================== */
    getAnnouncements() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) || [];
      } catch (e) {
        return [];
      }
    }

    getAnnouncementsForStudent(student) {
      if (!student) return [];
      const all = this.getAnnouncements();
      return all.filter(ann => {
        const target = (ann.target || 'all').toLowerCase();
        if (target === 'all') return true;
        if (student.intake && target === student.intake.toLowerCase()) return true;
        if (student.programme && target === student.programme.toLowerCase()) return true;
        if (student.id && target === student.id.toLowerCase()) return true;
        return false;
      });
    }

    addAnnouncement(item) {
      const announcements = this.getAnnouncements();
      const now = new Date();
      const newAnn = {
        id: 'ANN-' + Date.now().toString().slice(-6),
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        target: item.target || 'all',
        targetLabel: item.targetLabel || 'All Students',
        priority: item.priority || 'Normal',
        category: item.category || 'General Notice',
        ...item
      };
      announcements.unshift(newAnn);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
      return newAnn;
    }

    deleteAnnouncement(id) {
      let announcements = this.getAnnouncements();
      announcements = announcements.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
      return true;
    }

    /* =================== IMPORT WORKBOOK / DATA =================== */
    importStudents(newRecords) {
      const existing = this.getStudents();
      const existingMap = new Map(existing.map(s => [s.id.toUpperCase(), s]));
      let added = 0;
      let updated = 0;
      let skipped = 0;
      const issues = [];

      newRecords.forEach((record, index) => {
        if (!record.id) {
          skipped++;
          issues.push({ row: index + 1, reason: 'Missing Student ID' });
          return;
        }

        const normId = record.id.trim().toUpperCase();
        if (existingMap.has(normId)) {
          const curr = existingMap.get(normId);
          existingMap.set(normId, { ...curr, ...record, id: normId, updatedAt: new Date().toISOString() });
          updated++;
        } else {
          existingMap.set(normId, {
            status: 'Active',
            role: 'student',
            createdAt: new Date().toISOString(),
            ...record,
            id: normId
          });
          added++;
        }
      });

      const merged = Array.from(existingMap.values());
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
      return { added, updated, skipped, issues, total: merged.length };
    }

    /* =================== RESET TO SEED =================== */
    resetToSeed() {
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.COURSES);
      localStorage.removeItem(STORAGE_KEYS.INTAKES);
      localStorage.removeItem(STORAGE_KEYS.SEMESTERS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
      this.init();
      return true;
    }
  }

  window.SkylineStorage = new SkylineStorage();
})();
