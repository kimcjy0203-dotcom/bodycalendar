const DB = {
  init() {
    if (!localStorage.getItem('bc_admin_pw')) localStorage.setItem('bc_admin_pw', '0000');
    ['bc_members','bc_sessions','bc_schedules','bc_pt_packages','bc_weight_logs','bc_routines','bc_notices'].forEach(k => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify([]));
    });
  },

  uuid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },

  // Admin auth
  getAdminPw() { return localStorage.getItem('bc_admin_pw'); },
  setAdminPw(pw) { localStorage.setItem('bc_admin_pw', pw); },

  // Members
  getMembers() { return JSON.parse(localStorage.getItem('bc_members') || '[]'); },
  getMember(id) { return this.getMembers().find(m => m.id === id); },
  getMemberByName(name) { return this.getMembers().find(m => m.name === name); },
  addMember(data) {
    const members = this.getMembers();
    const member = { id: this.uuid(), joinDate: new Date().toISOString().split('T')[0], ...data };
    members.push(member);
    localStorage.setItem('bc_members', JSON.stringify(members));
    return member;
  },
  updateMember(id, updates) {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx !== -1) { members[idx] = { ...members[idx], ...updates }; localStorage.setItem('bc_members', JSON.stringify(members)); }
  },
  deleteMember(id) {
    localStorage.setItem('bc_members', JSON.stringify(this.getMembers().filter(m => m.id !== id)));
    localStorage.setItem('bc_sessions', JSON.stringify(this.getSessions().filter(s => s.memberId !== id)));
    localStorage.setItem('bc_schedules', JSON.stringify(this.getSchedules().filter(s => s.memberId !== id)));
    localStorage.setItem('bc_pt_packages', JSON.stringify(this.getPtPackages().filter(p => p.memberId !== id)));
    localStorage.setItem('bc_weight_logs', JSON.stringify(this.getWeightLogs().filter(w => w.memberId !== id)));
  },

  // Sessions
  getSessions() { return JSON.parse(localStorage.getItem('bc_sessions') || '[]'); },
  getSession(id) { return this.getSessions().find(s => s.id === id); },
  getMemberSessions(memberId) { return this.getSessions().filter(s => s.memberId === memberId).sort((a,b) => b.date.localeCompare(a.date)); },
  getDateSessions(date) { return this.getSessions().filter(s => s.date === date); },
  getMonthSessions(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return this.getSessions().filter(s => s.date.startsWith(prefix));
  },
  addSession(data) {
    const sessions = this.getSessions();
    const session = { id: this.uuid(), exercises: [], ...data };
    sessions.push(session);
    localStorage.setItem('bc_sessions', JSON.stringify(sessions));
    const sch = this.getSchedules().find(s => s.memberId === data.memberId && s.date === data.date);
    if (sch) this.updateSchedule(sch.id, { status: 'completed' });
    return session;
  },
  updateSession(id, updates) {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx !== -1) { sessions[idx] = { ...sessions[idx], ...updates }; localStorage.setItem('bc_sessions', JSON.stringify(sessions)); }
  },
  deleteSession(id) { localStorage.setItem('bc_sessions', JSON.stringify(this.getSessions().filter(s => s.id !== id))); },

  // Schedules
  getSchedules() { return JSON.parse(localStorage.getItem('bc_schedules') || '[]'); },
  getMemberSchedules(memberId) { return this.getSchedules().filter(s => s.memberId === memberId); },
  getDateSchedules(date) { return this.getSchedules().filter(s => s.date === date); },
  getMonthSchedules(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return this.getSchedules().filter(s => s.date.startsWith(prefix));
  },
  addSchedule(data) {
    const schedules = this.getSchedules();
    const schedule = { id: this.uuid(), status: 'scheduled', ...data };
    schedules.push(schedule);
    localStorage.setItem('bc_schedules', JSON.stringify(schedules));
    return schedule;
  },
  updateSchedule(id, updates) {
    const schedules = this.getSchedules();
    const idx = schedules.findIndex(s => s.id === id);
    if (idx !== -1) { schedules[idx] = { ...schedules[idx], ...updates }; localStorage.setItem('bc_schedules', JSON.stringify(schedules)); }
  },
  deleteSchedule(id) { localStorage.setItem('bc_schedules', JSON.stringify(this.getSchedules().filter(s => s.id !== id))); },

  // PT Packages
  getPtPackages() { return JSON.parse(localStorage.getItem('bc_pt_packages') || '[]'); },
  getMemberPtPackages(memberId) { return this.getPtPackages().filter(p => p.memberId === memberId).sort((a,b) => b.purchaseDate.localeCompare(a.purchaseDate)); },
  getActivePtPackage(memberId) { return this.getMemberPtPackages(memberId).find(p => p.active); },
  addPtPackage(data) {
    const pkgs = this.getPtPackages();
    // deactivate previous active package
    pkgs.forEach(p => { if (p.memberId === data.memberId && p.active) p.active = false; });
    const pkg = { id: this.uuid(), used: 0, active: true, ...data };
    pkgs.push(pkg);
    localStorage.setItem('bc_pt_packages', JSON.stringify(pkgs));
    return pkg;
  },
  updatePtPackage(id, updates) {
    const pkgs = this.getPtPackages();
    const idx = pkgs.findIndex(p => p.id === id);
    if (idx !== -1) { pkgs[idx] = { ...pkgs[idx], ...updates }; localStorage.setItem('bc_pt_packages', JSON.stringify(pkgs)); }
  },
  deletePtPackage(id) { localStorage.setItem('bc_pt_packages', JSON.stringify(this.getPtPackages().filter(p => p.id !== id))); },
  getPtRemaining(memberId) {
    const pkg = this.getActivePtPackage(memberId);
    if (!pkg) return null;
    const used = this.getSessions().filter(s => s.memberId === memberId && s.attendance !== false && s.date >= pkg.purchaseDate).length;
    return { total: pkg.total, used, remaining: Math.max(0, pkg.total - used), pkg };
  },

  // Weight Logs
  getWeightLogs() { return JSON.parse(localStorage.getItem('bc_weight_logs') || '[]'); },
  getMemberWeightLogs(memberId) { return this.getWeightLogs().filter(w => w.memberId === memberId).sort((a,b) => a.date.localeCompare(b.date)); },
  addWeightLog(data) {
    const logs = this.getWeightLogs();
    // update if same date exists
    const existing = logs.findIndex(w => w.memberId === data.memberId && w.date === data.date);
    if (existing !== -1) { logs[existing] = { ...logs[existing], ...data }; localStorage.setItem('bc_weight_logs', JSON.stringify(logs)); return logs[existing]; }
    const log = { id: this.uuid(), ...data };
    logs.push(log);
    localStorage.setItem('bc_weight_logs', JSON.stringify(logs));
    return log;
  },
  deleteWeightLog(id) { localStorage.setItem('bc_weight_logs', JSON.stringify(this.getWeightLogs().filter(w => w.id !== id))); },

  // Routines (운동 루틴 템플릿)
  getRoutines() { return JSON.parse(localStorage.getItem('bc_routines') || '[]'); },
  getRoutine(id) { return this.getRoutines().find(r => r.id === id); },
  addRoutine(data) {
    const routines = this.getRoutines();
    const routine = { id: this.uuid(), ...data };
    routines.push(routine);
    localStorage.setItem('bc_routines', JSON.stringify(routines));
    return routine;
  },
  updateRoutine(id, updates) {
    const routines = this.getRoutines();
    const idx = routines.findIndex(r => r.id === id);
    if (idx !== -1) { routines[idx] = { ...routines[idx], ...updates }; localStorage.setItem('bc_routines', JSON.stringify(routines)); }
  },
  deleteRoutine(id) { localStorage.setItem('bc_routines', JSON.stringify(this.getRoutines().filter(r => r.id !== id))); },

  // Notices (공지사항)
  getNotices() { return JSON.parse(localStorage.getItem('bc_notices') || '[]'); },
  getNotice(id) { return this.getNotices().find(n => n.id === id); },
  addNotice(data) {
    const notices = this.getNotices();
    const notice = { id: this.uuid(), date: new Date().toISOString().split('T')[0], pinned: false, ...data };
    notices.unshift(notice);
    localStorage.setItem('bc_notices', JSON.stringify(notices));
    return notice;
  },
  updateNotice(id, updates) {
    const notices = this.getNotices();
    const idx = notices.findIndex(n => n.id === id);
    if (idx !== -1) { notices[idx] = { ...notices[idx], ...updates }; localStorage.setItem('bc_notices', JSON.stringify(notices)); }
  },
  deleteNotice(id) { localStorage.setItem('bc_notices', JSON.stringify(this.getNotices().filter(n => n.id !== id))); },

  // Auth
  loginAdmin(pw) {
    if (pw === this.getAdminPw()) { sessionStorage.setItem('bc_role', 'admin'); return true; }
    return false;
  },
  loginMember(name, pw) {
    const m = this.getMemberByName(name);
    if (m && m.password === pw) {
      sessionStorage.setItem('bc_role', 'member');
      sessionStorage.setItem('bc_member_id', m.id);
      return m;
    }
    return null;
  },
  logout() { sessionStorage.removeItem('bc_role'); sessionStorage.removeItem('bc_member_id'); },
  getRole() { return sessionStorage.getItem('bc_role'); },
  getCurrentMemberId() { return sessionStorage.getItem('bc_member_id'); },

  // Stats
  getMemberStats(memberId) {
    const sessions = this.getMemberSessions(memberId);
    const schedules = this.getMemberSchedules(memberId);
    const now = new Date();
    const thisMonth = sessions.filter(s => s.date.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`));
    const attended = sessions.filter(s => s.attendance !== false).length;
    return { total: sessions.length, thisMonth: thisMonth.length, attendance: sessions.length > 0 ? Math.round(attended/sessions.length*100) : 0, upcomingCount: schedules.filter(s => s.status === 'scheduled' && s.date >= now.toISOString().split('T')[0]).length };
  },

  // Exercise stats
  getExerciseStats(memberId) {
    const sessions = this.getMemberSessions(memberId);
    const stats = {};
    sessions.forEach(s => {
      (s.exercises||[]).forEach(e => {
        if (!stats[e.name]) stats[e.name] = { name: e.name, maxWeight: 0, totalSets: 0, count: 0 };
        stats[e.name].count++;
        stats[e.name].totalSets += (e.sets||[]).length;
        (e.sets||[]).forEach(set => {
          const w = parseFloat(set.weight) || 0;
          if (w > stats[e.name].maxWeight) stats[e.name].maxWeight = w;
        });
      });
    });
    return Object.values(stats).sort((a,b) => b.count - a.count);
  },

  // Backup / Restore
  exportBackup() {
    const data = {};
    ['bc_members','bc_sessions','bc_schedules','bc_pt_packages','bc_weight_logs','bc_routines','bc_notices','bc_admin_pw'].forEach(k => {
      data[k] = JSON.parse(localStorage.getItem(k) || 'null');
    });
    return JSON.stringify(data, null, 2);
  },
  importBackup(jsonStr) {
    const data = JSON.parse(jsonStr);
    Object.keys(data).forEach(k => { if (data[k] !== null) localStorage.setItem(k, JSON.stringify(data[k])); });
  },

  // CSV Export
  exportSessionsCsv(memberId) {
    let sessions = this.getSessions().sort((a,b) => a.date.localeCompare(b.date));
    if (memberId) sessions = sessions.filter(s => s.memberId === memberId);
    const rows = [['날짜','회원','출석','운동 수','운동 목록','트레이너 메모','다음 계획']];
    sessions.forEach(s => {
      const m = this.getMember(s.memberId);
      rows.push([
        s.date, m?.name||'', s.attendance===false?'결석':'출석',
        s.exercises?.length||0,
        (s.exercises||[]).map(e=>e.name).join(' / '),
        s.trainerNote||'', s.nextPlan||''
      ]);
    });
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  }
};
