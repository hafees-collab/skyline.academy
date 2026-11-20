/**
 * Skyline Academy - Main Application Controller (Dynamic & Lightning Edition)
 * Handles Public Website, Dynamic Student Dashboard, and Administrator Control Panel.
 */

(function () {
  // State
  let currentView = 'public-home';
  let studentFilters = { search: '', intake: '', semester: '', programme: '', lsc: '' };
  let selectedStudentForModal = null;

  // Helpers
  function $(selector) { return document.querySelector(selector); }
  function $$(selector) { return document.querySelectorAll(selector); }

  function showToast(message, type = 'navy') {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatLastActive(isoString) {
    if (!isoString) return '<span style="color:#94A3B8;">Never logged in</span>';
    const date = new Date(isoString);
    const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return '<span style="color:#10B981; font-weight:600;"><span class="pulse-dot"></span>Just now</span>';
    if (diffMin < 60) return `<span style="color:#10B981;">${diffMin}m ago</span>`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
    return date.toLocaleDateString();
  }

  function getDynamicGreeting(name) {
    const hour = new Date().getHours();
    let greet = 'Good evening';
    let icon = '✨';
    if (hour >= 5 && hour < 12) {
      greet = 'Good morning';
      icon = '☀️';
    } else if (hour >= 12 && hour < 17) {
      greet = 'Good afternoon';
      icon = '🌤️';
    }
    return `${greet}, ${name}! ${icon}`;
  }

  // Parse raw subjects into categorized academic components
  function parseSubjectBreakdown(student) {
    const raw = student.subjectsRaw || '';
    const items = raw.split(/[;\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    const breakdown = {
      major: '',
      minor: '',
      aec: '',
      vac: '',
      sec: '',
      mdc: '',
      allSubjects: items
    };

    items.forEach(item => {
      const lower = item.toLowerCase();
      if (lower.includes('(major)') || lower.includes('mc)') || lower.includes('– drishyakalasahithyam') || lower.includes('– classical') || lower.includes('– marketing') || lower.includes('– introduction to literary genres') || lower.includes('– history of kerala')) {
        if (!breakdown.major) breakdown.major = item;
      }
      else if (lower.includes('(minor)') || lower.includes('mi)')) {
        if (!breakdown.minor) breakdown.minor = item;
      }
      else if (lower.includes('b24eg01ac') || lower.includes('communication') || lower.includes('prayogik malayalam')) {
        if (!breakdown.aec) breakdown.aec = item;
      }
      else if (lower.includes('md)') || lower.includes('historical tourism') || lower.includes('computer system') || lower.includes('legal literacy') || lower.includes('technology and society')) {
        if (!breakdown.mdc) breakdown.mdc = item;
      }
      else if (lower.includes('mahatma gandhi') || lower.includes('humanism and logic') || lower.includes('social ethics') || lower.includes('environmental')) {
        if (!breakdown.vac) breakdown.vac = item;
      }
      else if (lower.includes('financial literacy') || lower.includes('banking and insurance')) {
        if (!breakdown.sec) breakdown.sec = item;
      }
    });

    if (!breakdown.major && items.length > 0) breakdown.major = items[0];
    if (!breakdown.minor && items.length > 1) breakdown.minor = items[1];

    return breakdown;
  }

  /* ==========================================================================
     Navigation & View Switching
     ========================================================================== */
  function navigateTo(viewId) {
    currentView = viewId;
    
    // Check authentication guards
    if (viewId === 'student-dashboard' && !window.SkylineAuth.isStudent()) {
      navigateTo('student-login');
      return;
    }
    if (viewId.startsWith('admin-') && viewId !== 'admin-login' && !window.SkylineAuth.isAdmin()) {
      navigateTo('admin-login');
      return;
    }

    // Hide all view containers
    $$('.view-container').forEach(el => el.style.display = 'none');

    // Show active container
    const target = $(`#view-${viewId}`);
    if (target) {
      target.style.display = 'block';
    }

    // Update active nav links
    $$('.nav-link').forEach(link => {
      if (link.dataset.target === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Run view lifecycle loaders
    if (viewId === 'student-dashboard') renderStudentDashboard();
    if (viewId.startsWith('admin-') && viewId !== 'admin-login') renderAdminDashboard(viewId);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ==========================================================================
     Public Website Renderers
     ========================================================================== */
  function setupPublicWebsite() {
    const settings = window.SkylineStorage.getSettings();
    const noticeEl = $('#public-notice-text');
    if (noticeEl) noticeEl.textContent = settings.notice;

    const contactPhoneEl = $('#public-contact-phone');
    if (contactPhoneEl) contactPhoneEl.textContent = settings.contactPhone;

    const contactEmailEl = $('#public-contact-email');
    if (contactEmailEl) contactEmailEl.textContent = settings.contactEmail;

    const contactHoursEl = $('#public-contact-hours');
    if (contactHoursEl) contactHoursEl.textContent = settings.contactHours;
  }

  /* ==========================================================================
     DYNAMIC STUDENT DASHBOARD RENDERER
     ========================================================================== */
  function renderStudentDashboard() {
    const student = window.SkylineAuth.getUser();
    if (!student) return;

    const current = window.SkylineStorage.getStudentById(student.id) || student;

    // Check if Admin Impersonation / Preview is active
    const previewBanner = $('#admin-impersonation-banner');
    if (previewBanner) {
      if (window.SkylineAuth.isImpersonating()) {
        previewBanner.style.display = 'flex';
        $('#preview-student-target-name').textContent = `${current.name} (${current.id}) [${current.intake} • ${current.semester}]`;
      } else {
        previewBanner.style.display = 'none';
      }
    }

    // Dynamic Greeting Header
    $('#student-dynamic-greeting').textContent = getDynamicGreeting(current.name);
    $('#student-display-name').textContent = current.name;
    $('#student-display-id').textContent = current.id;
    $('#student-badge-intake').textContent = current.intake;
    $('#student-badge-sem').textContent = current.semester;
    $('#student-badge-status').innerHTML = `<span class="pulse-dot"></span>${current.status}`;
    $('#student-badge-status').className = `badge ${current.status === 'Active' ? 'badge-active' : 'badge-inactive'}`;

    // Subject breakdown
    const breakdown = parseSubjectBreakdown(current);

    // Digital Smart ID Card Widget
    $('#idcard-student-name').textContent = current.name;
    $('#idcard-student-id').textContent = current.id;
    $('#idcard-student-prog').textContent = current.programme;
    $('#idcard-student-intake').textContent = current.intake;
    $('#idcard-student-sem').textContent = current.semester;
    $('#idcard-student-lsc').textContent = current.lscCentre ? current.lscCentre.slice(0, 32) + '...' : 'SGOU Learning Centre';
    $('#idcard-student-avatar').textContent = current.name ? current.name.charAt(0).toUpperCase() : 'S';

    // Semester Progress (Dynamic Calculation)
    const semNum = current.semester.includes('3') ? 3 : (current.semester.includes('1') ? 1 : 2);
    const progressPct = semNum === 3 ? 55 : (semNum === 1 ? 25 : 40);
    $('#student-progress-text').textContent = `Semester ${semNum} of 6 — ${progressPct}% Completed`;
    $('#student-progress-bar').style.width = `${progressPct}%`;

    // 14 Profile details in organized grid
    const detailsGrid = $('#student-profile-details');
    detailsGrid.innerHTML = `
      <div class="detail-item"><div class="detail-label">1. Student Name</div><div class="detail-value">${current.name}</div></div>
      <div class="detail-item"><div class="detail-label">2. Student ID</div><div class="detail-value text-gold">${current.id}</div></div>
      <div class="detail-item"><div class="detail-label">3. Phone Number</div><div class="detail-value">${current.phone || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">4. Address</div><div class="detail-value">${current.address || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">5. Intake Batch</div><div class="detail-value">${current.intake}</div></div>
      <div class="detail-item"><div class="detail-label">6. Current Semester</div><div class="detail-value">${current.semester}</div></div>
      <div class="detail-item"><div class="detail-label">7. Enrolled Programme</div><div class="detail-value">${current.programme}</div></div>
      <div class="detail-item"><div class="detail-label">8. Major / Core Subject</div><div class="detail-value">${breakdown.major || 'Assigned per course schedule'}</div></div>
      <div class="detail-item"><div class="detail-label">9. Minor Subject</div><div class="detail-value">${breakdown.minor || 'Assigned per course schedule'}</div></div>
      <div class="detail-item"><div class="detail-label">10. AEC (Ability Enhancement)</div><div class="detail-value">${breakdown.aec || 'English / Modern Language'}</div></div>
      <div class="detail-item"><div class="detail-label">11. VAC (Value Added Course)</div><div class="detail-value">${breakdown.vac || 'Ethics & Logic / Social Values'}</div></div>
      <div class="detail-item"><div class="detail-label">12. SEC (Skill Enhancement)</div><div class="detail-value">${breakdown.sec || 'Applied Skill Course'}</div></div>
      <div class="detail-item"><div class="detail-label">13. MDC (Multidisciplinary)</div><div class="detail-value">${breakdown.mdc || 'Open Elective / Digital Tech'}</div></div>
      <div class="detail-item"><div class="detail-label">14. LSC / Study Centre</div><div class="detail-value">${current.lscCentre || '—'}</div></div>
    `;

    // Render Subjects as dynamic interactive cards
    const subjectsList = $('#student-subjects-list');
    subjectsList.innerHTML = breakdown.allSubjects.map((sub, idx) => `
      <div class="subject-item-row">
        <div>
          <span style="display:inline-block; width:28px; height:28px; border-radius:50%; background:#14243A; color:#E7D29B; text-align:center; line-height:28px; font-size:12px; font-weight:700; margin-right:8px; border:1px solid #C9A44C;">${idx + 1}</span>
          <span class="subject-name">${sub}</span>
        </div>
        <span class="badge badge-gold">Active Paper</span>
      </div>
    `).join('') || '<p class="text-muted">No specific subjects mapped yet.</p>';

    // Assignment portal link button
    const settings = window.SkylineStorage.getSettings();
    const btnAssignment = $('#btn-open-assignment-distributor');
    if (btnAssignment) {
      btnAssignment.onclick = () => {
        window.open(settings.assignmentPortalUrl, '_blank', 'noopener,noreferrer');
      };
    }

    // Render Live Targeted Notifications for Student
    renderStudentNotifications(current);
  }

  function renderStudentNotifications(student) {
    const notifications = window.SkylineStorage.getAnnouncementsForStudent(student);
    const bellBadge = $('#student-notif-badge');
    const drawerList = $('#student-drawer-notif-list');
    const mainList = $('#student-announcements-list');

    if (bellBadge) {
      bellBadge.textContent = notifications.length;
      bellBadge.style.display = notifications.length > 0 ? 'flex' : 'none';
    }

    const notifHtml = notifications.map(ann => {
      const pClass = (ann.priority || 'Normal').toLowerCase();
      return `
        <div class="notif-item ${pClass}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:0.92rem; color:var(--primary-navy);">${ann.title}</strong>
            <span class="badge badge-gold" style="font-size:0.7rem;">${ann.category || 'Notice'}</span>
          </div>
          <p style="font-size:0.85rem; color:#475569; margin-bottom:6px; line-height:1.4;">${ann.content}</p>
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#94A3B8;">
            <span>Target: <strong>${ann.targetLabel || 'All'}</strong></span>
            <span>${ann.date} ${ann.time || ''}</span>
          </div>
        </div>
      `;
    }).join('') || '<div style="padding:20px; text-align:center; color:#94A3B8;">No new notifications right now.</div>';

    if (drawerList) drawerList.innerHTML = notifHtml;
    if (mainList) mainList.innerHTML = notifHtml;
  }

  /* ==========================================================================
     ADMIN DASHBOARD & NOTIFICATIONS BROADCAST CENTER
     ========================================================================== */
  function renderAdminDashboard(activeSubView = 'admin-students') {
    const admin = window.SkylineStorage.getAdmin();
    $('#admin-display-name').textContent = admin.name || 'Skyline Administrator';
    $('#admin-display-id').textContent = admin.id || 'ADM-001';

    // Metrics
    const students = window.SkylineStorage.getStudents();
    const intakes = window.SkylineStorage.getIntakes();
    const courses = window.SkylineStorage.getCourses();
    const notifications = window.SkylineStorage.getAnnouncements();

    $('#stat-total-students').textContent = students.length;
    $('#stat-intake6').textContent = students.filter(s => s.intake === 'Intake 6').length;
    $('#stat-intake8').textContent = students.filter(s => s.intake === 'Intake 8').length;
    $('#stat-programmes').textContent = new Set(courses.map(c => c.programme)).size || '11';

    // Populate Filters & Broadcast Audience Options
    populateAdminFilters();
    populateBroadcastTargets();

    // Render active tab view
    $$('.admin-tab-pane').forEach(p => p.style.display = 'none');
    $$('.admin-nav-item').forEach(i => i.classList.remove('active'));

    const activePane = $(`#pane-${activeSubView}`);
    if (activePane) activePane.style.display = 'block';

    const activeNav = $(`[data-admin-tab="${activeSubView}"]`);
    if (activeNav) activeNav.classList.add('active');

    if (activeSubView === 'admin-students') renderStudentsTable();
    if (activeSubView === 'admin-broadcasts') renderBroadcastsManager();
    if (activeSubView === 'admin-intakes') renderIntakesManager();
    if (activeSubView === 'admin-courses') renderCoursesManager();
    if (activeSubView === 'admin-activity') renderActivityLogs();
    if (activeSubView === 'admin-settings') renderAdminSettings();
  }

  function populateAdminFilters() {
    const students = window.SkylineStorage.getStudents();
    const intakes = window.SkylineStorage.getIntakes();

    const intakeSelect = $('#filter-student-intake');
    if (intakeSelect) {
      intakeSelect.innerHTML = '<option value="">All Intakes</option>' + 
        intakes.map(it => `<option value="${it}" ${studentFilters.intake === it ? 'selected' : ''}>${it}</option>`).join('');
    }

    const semSelect = $('#filter-student-sem');
    if (semSelect) {
      const distinctSems = Array.from(new Set(students.map(s => s.semester))).filter(Boolean);
      semSelect.innerHTML = '<option value="">All Semesters</option>' + 
        distinctSems.map(s => `<option value="${s}" ${studentFilters.semester === s ? 'selected' : ''}>${s}</option>`).join('');
    }

    const progSelect = $('#filter-student-programme');
    if (progSelect) {
      const distinctProgs = Array.from(new Set(students.map(s => s.programme))).filter(Boolean).sort();
      progSelect.innerHTML = '<option value="">All Programmes</option>' + 
        distinctProgs.map(p => `<option value="${p}" ${studentFilters.programme === p ? 'selected' : ''}>${p}</option>`).join('');
    }

    const lscSelect = $('#filter-student-lsc');
    if (lscSelect) {
      const distinctLsc = Array.from(new Set(students.map(s => s.lscCentre))).filter(Boolean).sort();
      lscSelect.innerHTML = '<option value="">All Study Centres (LSC)</option>' + 
        distinctLsc.map(l => `<option value="${l}" ${studentFilters.lsc === l ? 'selected' : ''}>${l}</option>`).join('');
    }
  }

  function populateBroadcastTargets() {
    const intakes = window.SkylineStorage.getIntakes();
    const courses = window.SkylineStorage.getCourses();
    const distinctProgs = Array.from(new Set(courses.map(c => c.programme))).filter(Boolean).sort();

    const select = $('#broadcast-target-select');
    if (!select) return;

    let html = `
      <optgroup label="Broad Audience">
        <option value="all" data-label="All Students">All Enrolled Students (Entire Academy)</option>
      </optgroup>
      <optgroup label="Specific Batches / Intakes">
    `;

    intakes.forEach(it => {
      html += `<option value="${it}" data-label="${it} Students">${it} Only</option>`;
    });

    html += `</optgroup><optgroup label="Specific Programmes">`;
    distinctProgs.forEach(prog => {
      html += `<option value="${prog}" data-label="${prog} Learners">${prog}</option>`;
    });
    html += `</optgroup>`;

    select.innerHTML = html;
  }

  function renderStudentsTable() {
    const students = window.SkylineStorage.getStudents();
    const tbody = $('#students-table-body');
    if (!tbody) return;

    const filtered = students.filter(s => {
      const q = studentFilters.search.toLowerCase();
      const matchSearch = !q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
      const matchIntake = !studentFilters.intake || s.intake === studentFilters.intake;
      const matchSem = !studentFilters.semester || s.semester === studentFilters.semester;
      const matchProg = !studentFilters.programme || s.programme === studentFilters.programme;
      const matchLsc = !studentFilters.lsc || s.lscCentre === studentFilters.lsc;
      return matchSearch && matchIntake && matchSem && matchProg && matchLsc;
    });

    $('#filtered-count-display').textContent = `Showing ${filtered.length} of ${students.length} students`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:40px; color:#6B7280;">No students match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td><strong class="text-navy" style="font-family:monospace; font-size:0.95rem;">${s.id}</strong></td>
        <td><strong>${s.name}</strong></td>
        <td><span class="badge badge-navy">${s.intake}</span></td>
        <td>${s.semester}</td>
        <td><span style="font-size:0.85rem;">${s.programme}</span></td>
        <td><span style="font-size:0.8rem; color:#4B5563;">${s.lscCentre || '—'}</span></td>
        <td>${formatLastActive(s.lastLogin)}</td>
        <td>
          <span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">
            ${s.status}
          </span>
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-gold" onclick="SkylineApp.previewStudent('${s.id}')" title="View exact student portal">👁️ View Portal</button>
          <button class="btn btn-sm btn-outline" onclick="SkylineApp.viewStudent('${s.id}')">Details</button>
          <button class="btn btn-sm btn-outline" onclick="SkylineApp.editStudent('${s.id}')">Edit</button>
          <button class="btn btn-sm ${s.status === 'Active' ? 'btn-outline' : 'btn-gold'}" onclick="SkylineApp.toggleStatus('${s.id}')">
            ${s.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn btn-sm btn-outline" title="Reset temporary password" onclick="SkylineApp.promptResetPassword('${s.id}')">Key</button>
        </td>
      </tr>
    `).join('');
  }

  function renderBroadcastsManager() {
    const announcements = window.SkylineStorage.getAnnouncements();
    const container = $('#broadcast-history-list');
    if (!container) return;

    if (announcements.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding:20px; text-align:center;">No broadcast notifications created yet.</p>';
      return;
    }

    container.innerHTML = announcements.map(ann => `
      <div class="card" style="margin-bottom:14px; border-left:4px solid var(--premium-gold); display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <h4 style="font-size:1.05rem; color:var(--primary-navy);">${ann.title}</h4>
            <span class="badge badge-gold">${ann.category || 'Notice'}</span>
            <span class="badge badge-navy">Target: ${ann.targetLabel || 'All Students'}</span>
          </div>
          <p style="font-size:0.9rem; color:#334155; margin-bottom:8px; line-height:1.5;">${ann.content}</p>
          <span style="font-size:0.75rem; color:#94A3B8;">Broadcasted: ${ann.date} at ${ann.time || ''}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-outline" style="color:var(--error); border-color:#FECACA;" onclick="SkylineApp.deleteBroadcast('${ann.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderActivityLogs() {
    const logs = window.SkylineStorage.getActivityLogs();
    const container = $('#activity-logs-container');
    if (!container) return;

    container.innerHTML = logs.map(log => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #E2E8F0;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="user-avatar-circle" style="width:36px; height:36px; font-size:0.85rem;">🎓</div>
          <div>
            <strong style="color:var(--primary-navy);">${log.studentName}</strong> 
            <span style="font-family:monospace; color:var(--premium-gold); font-size:0.82rem;">(${log.studentId})</span>
            <span class="badge badge-navy" style="font-size:0.7rem; margin-left:6px;">${log.intake || 'Intake'}</span>
            <p style="font-size:0.82rem; color:#64748B; margin:0;">${log.action}</p>
          </div>
        </div>
        <span style="font-size:0.8rem; color:#94A3B8;">${formatLastActive(log.timestamp)}</span>
      </div>
    `).join('') || '<p class="text-muted" style="padding:20px; text-align:center;">No recent logins recorded.</p>';
  }

  function renderIntakesManager() {
    const intakes = window.SkylineStorage.getIntakes();
    const students = window.SkylineStorage.getStudents();
    const list = $('#intakes-list-container');
    if (!list) return;

    list.innerHTML = intakes.map(it => {
      const count = students.filter(s => s.intake === it).length;
      return `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <h4 style="font-size:1.1rem; color:var(--primary-navy);">${it}</h4>
            <p style="font-size:0.85rem; color:var(--secondary-text);">${count} Enrolled Students</p>
          </div>
          <span class="badge badge-navy">Active Batch</span>
        </div>
      `;
    }).join('');
  }

  function renderCoursesManager() {
    const courses = window.SkylineStorage.getCourses();
    const list = $('#courses-list-container');
    if (!list) return;

    list.innerHTML = courses.map((c, idx) => `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div>
            <span class="badge badge-gold" style="margin-bottom:6px;">${c.semester}</span>
            <h3 style="font-size:1.15rem; color:var(--primary-navy);">${c.programme}</h3>
          </div>
        </div>
        <div style="background:#FAF9F6; border:1px solid #E2E8F0; border-radius:8px; padding:12px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:#6B7280; font-weight:600; margin-bottom:8px;">Assigned Subjects:</div>
          <ul style="padding-left:18px; font-size:0.88rem; color:#202B38;">
            ${(c.subjects || []).map(s => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');
  }

  function renderAdminSettings() {
    const admin = window.SkylineStorage.getAdmin();
    const settings = window.SkylineStorage.getSettings();

    $('#setting-admin-name').value = admin.name || '';
    $('#setting-admin-id').value = admin.id || 'ADM-001';
    $('#setting-admin-email').value = admin.email || '';
    $('#setting-portal-url').value = settings.assignmentPortalUrl || '';
    $('#setting-contact-phone').value = settings.contactPhone || '';
    $('#setting-contact-email').value = settings.contactEmail || '';
    $('#setting-notice').value = settings.notice || '';
  }

  /* ==========================================================================
     ADMIN PREVIEW & STUDENT MANAGEMENT ACTIONS
     ========================================================================= */
  function previewStudent(id) {
    try {
      const student = window.SkylineAuth.impersonateStudent(id);
      showToast(`Opening live portal preview for ${student.name}`, 'success');
      navigateTo('student-dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function exitPreview() {
    window.SkylineAuth.stopImpersonating();
    showToast('Returned to Administrator Control Panel.', 'navy');
    navigateTo('admin-students');
  }

  function deleteBroadcast(id) {
    if (confirm('Delete this broadcast notification? Students will no longer see it.')) {
      window.SkylineStorage.deleteAnnouncement(id);
      showToast('Notification deleted.', 'navy');
      renderBroadcastsManager();
    }
  }

  function viewStudent(id) {
    const s = window.SkylineStorage.getStudentById(id);
    if (!s) return;
    selectedStudentForModal = s;
    const breakdown = parseSubjectBreakdown(s);

    $('#modal-view-student-body').innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:14px;">
        <div>
          <h2 style="font-size:1.4rem; color:var(--primary-navy);">${s.name}</h2>
          <span style="font-family:monospace; font-size:1.1rem; color:var(--premium-gold); font-weight:700;">${s.id}</span>
        </div>
        <span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${s.status}</span>
      </div>

      <div class="detail-grid" style="margin-bottom:20px;">
        <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${s.phone || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Intake</div><div class="detail-value">${s.intake}</div></div>
        <div class="detail-item"><div class="detail-label">Semester</div><div class="detail-value">${s.semester}</div></div>
        <div class="detail-item"><div class="detail-label">Programme</div><div class="detail-value">${s.programme}</div></div>
        <div class="detail-item" style="grid-column:1 / -1;"><div class="detail-label">LSC Centre</div><div class="detail-value">${s.lscCentre || '—'}</div></div>
        <div class="detail-item" style="grid-column:1 / -1;"><div class="detail-label">Address</div><div class="detail-value">${s.address || '—'}</div></div>
      </div>

      <h4 style="margin-bottom:10px; font-size:1rem; color:var(--primary-navy);">Academic Course Details:</h4>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:14px;">
        <div style="margin-bottom:6px;"><strong>Major/Core:</strong> ${breakdown.major || '—'}</div>
        <div style="margin-bottom:6px;"><strong>Minor:</strong> ${breakdown.minor || '—'}</div>
        <div style="margin-bottom:6px;"><strong>AEC:</strong> ${breakdown.aec || '—'}</div>
        <div style="margin-bottom:6px;"><strong>VAC:</strong> ${breakdown.vac || '—'}</div>
        <div style="margin-bottom:6px;"><strong>SEC:</strong> ${breakdown.sec || '—'}</div>
        <div style="margin-bottom:6px;"><strong>MDC:</strong> ${breakdown.mdc || '—'}</div>
        <div style="margin-top:10px; font-size:0.82rem; color:#6B7280;">
          <strong>All Enrolled Subjects:</strong><br>${breakdown.allSubjects.join(' • ')}
        </div>
      </div>
    `;

    openModal('modal-view-student');
  }

  function editStudent(id) {
    const s = window.SkylineStorage.getStudentById(id);
    if (!s) return;
    selectedStudentForModal = s;

    $('#edit-student-id').value = s.id;
    $('#edit-student-name').value = s.name;
    $('#edit-student-phone').value = s.phone || '';
    $('#edit-student-intake').value = s.intake;
    $('#edit-student-sem').value = s.semester;
    $('#edit-student-prog').value = s.programme;
    $('#edit-student-lsc').value = s.lscCentre || '';
    $('#edit-student-address').value = s.address || '';
    $('#edit-student-subjects').value = s.subjectsRaw || '';
    $('#edit-student-status').value = s.status;

    openModal('modal-edit-student');
  }

  function toggleStatus(id) {
    const res = window.SkylineStorage.toggleStudentStatus(id);
    if (res) {
      showToast(`Student ${res.id} is now ${res.status}.`, 'navy');
      renderStudentsTable();
    }
  }

  function promptResetPassword(id) {
    const tempPass = prompt(`Set temporary password for student ${id}:`, 'skyline2026');
    if (tempPass) {
      try {
        window.SkylineAuth.adminResetStudentPassword(id, tempPass);
        showToast(`Temporary password updated for ${id}.`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  function openModal(modalId) {
    const m = $(`#${modalId}`);
    if (m) m.classList.add('active');
  }

  function closeModal(modalId) {
    const m = $(`#${modalId}`);
    if (m) m.classList.remove('active');
  }

  /* ==========================================================================
     Event Listeners Setup
     ========================================================================== */
  function initEventListeners() {
    // Navigation clicks
    document.addEventListener('click', e => {
      const navTarget = e.target.closest('[data-navigate]');
      if (navTarget) {
        e.preventDefault();
        navigateTo(navTarget.dataset.navigate);
      }

      const adminTabTarget = e.target.closest('[data-admin-tab]');
      if (adminTabTarget) {
        e.preventDefault();
        renderAdminDashboard(adminTabTarget.dataset.adminTab);
      }

      const modalClose = e.target.closest('[data-close-modal]');
      if (modalClose) {
        closeModal(modalClose.dataset.closeModal);
      }

      // Toggle Notification Drawer
      const bellBtn = e.target.closest('#btn-toggle-notif-drawer');
      if (bellBtn) {
        const drawer = $('#student-notifications-drawer');
        if (drawer) drawer.classList.toggle('active');
      } else if (!e.target.closest('#student-notifications-drawer')) {
        const drawer = $('#student-notifications-drawer');
        if (drawer && drawer.classList.contains('active')) drawer.classList.remove('active');
      }
    });

    // Student Login
    const formStudentLogin = $('#form-student-login');
    if (formStudentLogin) {
      formStudentLogin.addEventListener('submit', async e => {
        e.preventDefault();
        const id = $('#student-login-id').value;
        const pass = $('#student-login-pass').value;
        const remember = $('#student-login-remember')?.checked || false;
        const errBox = $('#student-login-error');

        errBox.style.display = 'none';
        try {
          await window.SkylineAuth.loginStudent(id, pass, remember);
          showToast('Welcome to Skyline Academy Student Portal', 'success');
          navigateTo('student-dashboard');
        } catch (err) {
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        }
      });
    }

    // Admin Login
    const formAdminLogin = $('#form-admin-login');
    if (formAdminLogin) {
      formAdminLogin.addEventListener('submit', async e => {
        e.preventDefault();
        const id = $('#admin-login-id').value;
        const pass = $('#admin-login-pass').value;
        const remember = $('#admin-login-remember')?.checked || false;
        const errBox = $('#admin-login-error');

        errBox.style.display = 'none';
        try {
          await window.SkylineAuth.loginAdmin(id, pass, remember);
          showToast('Administrator session authenticated.', 'success');
          navigateTo('admin-students');
        } catch (err) {
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        }
      });
    }

    // Broadcast Form Submit (Admin)
    const formBroadcast = $('#form-create-broadcast');
    if (formBroadcast) {
      formBroadcast.addEventListener('submit', e => {
        e.preventDefault();
        const select = $('#broadcast-target-select');
        const selectedOption = select.options[select.selectedIndex];
        const targetValue = select.value;
        const targetLabel = selectedOption.getAttribute('data-label') || targetValue;

        const newBroadcast = {
          title: $('#broadcast-title').value.trim(),
          category: $('#broadcast-category').value,
          priority: $('#broadcast-priority').value,
          target: targetValue,
          targetLabel: targetLabel,
          content: $('#broadcast-content').value.trim()
        };

        window.SkylineStorage.addAnnouncement(newBroadcast);
        showToast(`Notification sent to ${targetLabel}!`, 'success');
        formBroadcast.reset();
        renderBroadcastsManager();
      });
    }

    // Student & Admin Logout
    const btnStudentLogout = $('#btn-student-logout');
    if (btnStudentLogout) {
      btnStudentLogout.addEventListener('click', () => {
        window.SkylineAuth.logout();
        showToast('You have been logged out safely.', 'navy');
        navigateTo('public-home');
      });
    }

    const btnAdminLogout = $('#btn-admin-logout');
    if (btnAdminLogout) {
      btnAdminLogout.addEventListener('click', () => {
        window.SkylineAuth.logout();
        showToast('Administrator logged out safely.', 'navy');
        navigateTo('public-home');
      });
    }

    // Student self-service password reset
    const formStudentReset = $('#form-student-reset');
    if (formStudentReset) {
      formStudentReset.addEventListener('submit', e => {
        e.preventDefault();
        const id = $('#reset-student-id').value;
        const phone = $('#reset-student-phone').value;
        const newPass = $('#reset-student-newpass').value;
        const errBox = $('#student-reset-error');
        const successBox = $('#student-reset-success');

        errBox.style.display = 'none';
        successBox.style.display = 'none';

        try {
          window.SkylineAuth.resetStudentPasswordWithPhone(id, phone, newPass);
          successBox.textContent = 'Password reset successful! You can now log in with your new password.';
          successBox.style.display = 'block';
          formStudentReset.reset();
        } catch (err) {
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        }
      });
    }

    // Filter inputs
    const searchInput = $('#filter-student-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        studentFilters.search = e.target.value;
        renderStudentsTable();
      });
    }
    const filterIntake = $('#filter-student-intake');
    if (filterIntake) {
      filterIntake.addEventListener('change', e => {
        studentFilters.intake = e.target.value;
        renderStudentsTable();
      });
    }
    const filterSem = $('#filter-student-sem');
    if (filterSem) {
      filterSem.addEventListener('change', e => {
        studentFilters.semester = e.target.value;
        renderStudentsTable();
      });
    }
    const filterProg = $('#filter-student-programme');
    if (filterProg) {
      filterProg.addEventListener('change', e => {
        studentFilters.programme = e.target.value;
        renderStudentsTable();
      });
    }
    const filterLsc = $('#filter-student-lsc');
    if (filterLsc) {
      filterLsc.addEventListener('change', e => {
        studentFilters.lsc = e.target.value;
        renderStudentsTable();
      });
    }
    const btnResetFilters = $('#btn-reset-student-filters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        studentFilters = { search: '', intake: '', semester: '', programme: '', lsc: '' };
        if (searchInput) searchInput.value = '';
        populateAdminFilters();
        renderStudentsTable();
      });
    }

    // Edit Student Form Submit
    const formEditStudent = $('#form-edit-student');
    if (formEditStudent) {
      formEditStudent.addEventListener('submit', e => {
        e.preventDefault();
        const updated = {
          id: $('#edit-student-id').value,
          name: $('#edit-student-name').value,
          phone: $('#edit-student-phone').value,
          intake: $('#edit-student-intake').value,
          semester: $('#edit-student-sem').value,
          programme: $('#edit-student-prog').value,
          lscCentre: $('#edit-student-lsc').value,
          address: $('#edit-student-address').value,
          subjectsRaw: $('#edit-student-subjects').value,
          status: $('#edit-student-status').value
        };
        window.SkylineStorage.saveStudent(updated);
        closeModal('modal-edit-student');
        showToast(`Student ${updated.id} updated successfully.`, 'success');
        renderStudentsTable();
      });
    }

    // Add Student Form Submit
    const formAddStudent = $('#form-add-student');
    if (formAddStudent) {
      formAddStudent.addEventListener('submit', e => {
        e.preventDefault();
        const newStudent = {
          id: $('#add-student-id').value.trim().toUpperCase(),
          name: $('#add-student-name').value.trim(),
          phone: $('#add-student-phone').value.trim(),
          intake: $('#add-student-intake').value,
          semester: $('#add-student-sem').value,
          programme: $('#add-student-prog').value.trim(),
          lscCentre: $('#add-student-lsc').value.trim(),
          address: $('#add-student-address').value.trim(),
          subjectsRaw: $('#add-student-subjects').value.trim(),
          status: 'Active'
        };

        if (window.SkylineStorage.getStudentById(newStudent.id)) {
          alert(`Student ID ${newStudent.id} already exists. Please use a unique ID.`);
          return;
        }

        window.SkylineStorage.saveStudent(newStudent);
        closeModal('modal-add-student');
        formAddStudent.reset();
        showToast(`New student ${newStudent.id} created successfully.`, 'success');
        renderStudentsTable();
      });
    }

    // Add Intake Form Submit
    const formAddIntake = $('#form-add-intake');
    if (formAddIntake) {
      formAddIntake.addEventListener('submit', e => {
        e.preventDefault();
        const name = $('#add-intake-name').value;
        if (window.SkylineStorage.addIntake(name)) {
          showToast(`Intake "${name}" added successfully.`, 'success');
          $('#add-intake-name').value = '';
          renderIntakesManager();
          populateAdminFilters();
          populateBroadcastTargets();
        } else {
          alert('Intake already exists or invalid.');
        }
      });
    }

    // Add Programme / Course Form Submit
    const formAddCourse = $('#form-add-course');
    if (formAddCourse) {
      formAddCourse.addEventListener('submit', e => {
        e.preventDefault();
        const newCourse = {
          semester: $('#add-course-sem').value,
          programme: $('#add-course-prog').value.trim(),
          subjects: $('#add-course-subjects').value.split('\n').map(s => s.trim()).filter(Boolean)
        };
        window.SkylineStorage.saveCourse(newCourse);
        closeModal('modal-add-course');
        formAddCourse.reset();
        showToast('Programme & subjects updated.', 'success');
        renderCoursesManager();
      });
    }

    // Save Admin Settings
    const formAdminSettings = $('#form-admin-settings');
    if (formAdminSettings) {
      formAdminSettings.addEventListener('submit', e => {
        e.preventDefault();
        window.SkylineStorage.saveAdmin({
          name: $('#setting-admin-name').value.trim(),
          email: $('#setting-admin-email').value.trim()
        });
        window.SkylineStorage.saveSettings({
          assignmentPortalUrl: $('#setting-portal-url').value.trim(),
          contactPhone: $('#setting-contact-phone').value.trim(),
          contactEmail: $('#setting-contact-email').value.trim(),
          notice: $('#setting-notice').value.trim()
        });
        showToast('Administrator settings saved.', 'success');
        setupPublicWebsite();
      });
    }

    // Admin change password
    const formAdminPass = $('#form-admin-change-pass');
    if (formAdminPass) {
      formAdminPass.addEventListener('submit', e => {
        e.preventDefault();
        const oldPass = $('#admin-pass-old').value;
        const newPass = $('#admin-pass-new').value;
        const errBox = $('#admin-pass-error');
        errBox.style.display = 'none';
        try {
          window.SkylineAuth.changePassword('ADM-001', oldPass, newPass);
          showToast('Administrator password changed successfully.', 'success');
          formAdminPass.reset();
        } catch (err) {
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        }
      });
    }

    // Reset to Seed Data
    const btnResetSeed = $('#btn-reset-to-seed');
    if (btnResetSeed) {
      btnResetSeed.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset student and course records back to the original workbook dataset? Any newly added records will be replaced.')) {
          window.SkylineStorage.resetToSeed();
          showToast('Database reset to original 92 student records.', 'navy');
          renderAdminDashboard('admin-students');
        }
      });
    }

    // CSV Importer
    const importFileInput = $('#import-excel-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
          try {
            const text = evt.target.result;
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) {
              alert('File appears empty or missing data rows.');
              return;
            }

            const records = [];
            for (let i = 1; i < lines.length; i++) {
              const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
              if (row.length < 2) continue;

              const rec = {
                name: row[0] || '',
                id: row[1] || '',
                phone: row[2] || '',
                intake: row[3] || 'Intake 8',
                semester: row[4] || '1st Semester',
                programme: row[5] || '',
                subjectsRaw: row[6] || '',
                lscCentre: row[7] || '',
                address: row[8] || ''
              };
              if (rec.id) records.push(rec);
            }

            const result = window.SkylineStorage.importStudents(records);
            $('#import-summary-box').innerHTML = `
              <div class="card" style="background:#F0FDF4; border-color:#86EFAC;">
                <h4 style="color:#166534;">Import Summary</h4>
                <p>Successfully processed ${records.length} records.</p>
                <ul>
                  <li><strong>New students added:</strong> ${result.added}</li>
                  <li><strong>Existing students updated:</strong> ${result.updated}</li>
                  <li><strong>Skipped (missing ID):</strong> ${result.skipped}</li>
                  <li><strong>Total in database:</strong> ${result.total}</li>
                </ul>
              </div>
            `;
            showToast(`Imported ${result.added} new records without duplicates.`, 'success');
            renderStudentsTable();
          } catch (err) {
            alert('Error parsing import file: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // Export CSV
    const btnExportCsv = $('#btn-export-students-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        const students = window.SkylineStorage.getStudents();
        const headers = ['Student ID', 'Student Name', 'Phone Number', 'Intake', 'Semester', 'Programme', 'LSC Centre', 'Address', 'Status', 'Subjects'];
        const rows = students.map(s => [
          `"${s.id}"`,
          `"${s.name}"`,
          `"${s.phone || ''}"`,
          `"${s.intake}"`,
          `"${s.semester}"`,
          `"${s.programme}"`,
          `"${s.lscCentre || ''}"`,
          `"${(s.address || '').replace(/"/g, '""')}"`,
          `"${s.status}"`,
          `"${(s.subjectsRaw || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Skyline_Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Student database exported to CSV.', 'navy');
      });
    }
  }

  // Initial Boot & Global API
  window.SkylineApp = {
    navigateTo,
    viewStudent,
    editStudent,
    previewStudent,
    exitPreview,
    deleteBroadcast,
    toggleStatus,
    promptResetPassword,
    openModal,
    closeModal
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupPublicWebsite();
    initEventListeners();

    if (window.SkylineAuth.isAuthenticated()) {
      if (window.SkylineAuth.isAdmin()) {
        navigateTo('admin-students');
      } else {
        navigateTo('student-dashboard');
      }
    } else {
      navigateTo('public-home');
    }
  });
})();
