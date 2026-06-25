const firebaseConfig = {
  apiKey: "AIzaSyAIIFHv2Q-i94QG3N2wsV6SMMPTTxF9zaY",
  authDomain: "bodycalendar-da13e.firebaseapp.com",
  projectId: "bodycalendar-da13e",
  storageBucket: "bodycalendar-da13e.firebasestorage.app",
  messagingSenderId: "140100758261",
  appId: "1:140100758261:web:4538c692deb20e7a2af3bc"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const fsDb = firebase.firestore();
fsDb.settings({ experimentalForceLongPolling: true, merge: true });

// 인메모리 캐시 (Firestore 로드 후 채워짐)
const CACHE = {
  members: [], sessions: [], schedules: [],
  pt_packages: [], weight_logs: [], routines: [], notices: [],
  admin_pw: '0000'
};

const DB = {
  // Firestore에서 전체 데이터 로드
  async init() {
    const cols = ['members','sessions','schedules','pt_packages','weight_logs','routines','notices'];
    const results = await Promise.all([
      ...cols.map(c => fsDb.collection(c).get()),
      fsDb.collection('config').doc('admin').get()
    ]);
    cols.forEach((col, i) => { CACHE[col] = results[i].docs.map(d => d.data()); });
    const cfg = results[cols.length];
    if (cfg.exists) CACHE.admin_pw = cfg.data().pw || '0000';
  },

  uuid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },

  // Firestore 쓰기 헬퍼 (fire-and-forget)
  _set(col, id, data) {
    fsDb.collection(col).doc(id).set(data).catch(e => console.error('set error', col, e));
  },
  _delete(col, id) {
    fsDb.collection(col).doc(id).delete().catch(e => console.error('delete error', col, e));
  },

  // 관리자 비밀번호
  getAdminPw() { return CACHE.admin_pw; },
  setAdminPw(pw) {
    CACHE.admin_pw = pw;
    fsDb.collection('config').doc('admin').set({ pw }).catch(e => console.error(e));
  },

  // 회원
  getMembers() { return CACHE.members; },
  getMember(id) { return CACHE.members.find(m => m.id === id); },
  getMemberByName(name) { return CACHE.members.find(m => m.name === name); },
  addMember(data) {
    const member = { id: this.uuid(), joinDate: new Date().toISOString().split('T')[0], ...data };
    CACHE.members.push(member);
    this._set('members', member.id, member);
    return member;
  },
  updateMember(id, updates) {
    const idx = CACHE.members.findIndex(m => m.id === id);
    if (idx !== -1) {
      CACHE.members[idx] = { ...CACHE.members[idx], ...updates };
      this._set('members', id, CACHE.members[idx]);
    }
  },
  deleteMember(id) {
    CACHE.members = CACHE.members.filter(m => m.id !== id);
    CACHE.sessions = CACHE.sessions.filter(s => s.memberId !== id);
    CACHE.schedules = CACHE.schedules.filter(s => s.memberId !== id);
    CACHE.pt_packages = CACHE.pt_packages.filter(p => p.memberId !== id);
    CACHE.weight_logs = CACHE.weight_logs.filter(w => w.memberId !== id);
    this._delete('members', id);
    ['sessions','schedules','pt_packages','weight_logs'].forEach(col => {
      fsDb.collection(col).where('memberId','==',id).get().then(snap => {
        const batch = fsDb.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        return batch.commit();
      }).catch(e => console.error(e));
    });
  },

  // 세션
  getSessions() { return CACHE.sessions; },
  getSession(id) { return CACHE.sessions.find(s => s.id === id); },
  getMemberSessions(memberId) { return CACHE.sessions.filter(s => s.memberId === memberId).sort((a,b) => b.date.localeCompare(a.date)); },
  getDateSessions(date) { return CACHE.sessions.filter(s => s.date === date); },
  getMonthSessions(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return CACHE.sessions.filter(s => s.date.startsWith(prefix));
  },
  addSession(data) {
    const session = { id: this.uuid(), exercises: [], ...data };
    CACHE.sessions.push(session);
    this._set('sessions', session.id, session);
    const sch = CACHE.schedules.find(s => s.memberId === data.memberId && s.date === data.date);
    if (sch) this.updateSchedule(sch.id, { status: 'completed' });
    return session;
  },
  updateSession(id, updates) {
    const idx = CACHE.sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      CACHE.sessions[idx] = { ...CACHE.sessions[idx], ...updates };
      this._set('sessions', id, CACHE.sessions[idx]);
    }
  },
  deleteSession(id) {
    CACHE.sessions = CACHE.sessions.filter(s => s.id !== id);
    this._delete('sessions', id);
  },

  // 일정
  getSchedules() { return CACHE.schedules; },
  getMemberSchedules(memberId) { return CACHE.schedules.filter(s => s.memberId === memberId); },
  getDateSchedules(date) { return CACHE.schedules.filter(s => s.date === date); },
  getMonthSchedules(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return CACHE.schedules.filter(s => s.date.startsWith(prefix));
  },
  addSchedule(data) {
    const schedule = { id: this.uuid(), status: 'scheduled', ...data };
    CACHE.schedules.push(schedule);
    this._set('schedules', schedule.id, schedule);
    return schedule;
  },
  updateSchedule(id, updates) {
    const idx = CACHE.schedules.findIndex(s => s.id === id);
    if (idx !== -1) {
      CACHE.schedules[idx] = { ...CACHE.schedules[idx], ...updates };
      this._set('schedules', id, CACHE.schedules[idx]);
    }
  },
  deleteSchedule(id) {
    CACHE.schedules = CACHE.schedules.filter(s => s.id !== id);
    this._delete('schedules', id);
  },

  // PT 패키지
  getPtPackages() { return CACHE.pt_packages; },
  getMemberPtPackages(memberId) { return CACHE.pt_packages.filter(p => p.memberId === memberId).sort((a,b) => b.purchaseDate.localeCompare(a.purchaseDate)); },
  getActivePtPackage(memberId) { return this.getMemberPtPackages(memberId).find(p => p.active); },
  addPtPackage(data) {
    CACHE.pt_packages.forEach(p => {
      if (p.memberId === data.memberId && p.active) { p.active = false; this._set('pt_packages', p.id, p); }
    });
    const pkg = { id: this.uuid(), active: true, ...data };
    CACHE.pt_packages.push(pkg);
    this._set('pt_packages', pkg.id, pkg);
    return pkg;
  },
  updatePtPackage(id, updates) {
    const idx = CACHE.pt_packages.findIndex(p => p.id === id);
    if (idx !== -1) { CACHE.pt_packages[idx] = { ...CACHE.pt_packages[idx], ...updates }; this._set('pt_packages', id, CACHE.pt_packages[idx]); }
  },
  deletePtPackage(id) {
    CACHE.pt_packages = CACHE.pt_packages.filter(p => p.id !== id);
    this._delete('pt_packages', id);
  },
  getPtRemaining(memberId) {
    const pkg = this.getActivePtPackage(memberId);
    if (!pkg) return null;
    const used = CACHE.sessions.filter(s => s.memberId === memberId && s.attendance !== false && s.date >= pkg.purchaseDate).length;
    return { total: pkg.total, used, remaining: Math.max(0, pkg.total - used), pkg };
  },

  // 체중 기록
  getWeightLogs() { return CACHE.weight_logs; },
  getMemberWeightLogs(memberId) { return CACHE.weight_logs.filter(w => w.memberId === memberId).sort((a,b) => a.date.localeCompare(b.date)); },
  addWeightLog(data) {
    const existing = CACHE.weight_logs.findIndex(w => w.memberId === data.memberId && w.date === data.date);
    if (existing !== -1) {
      CACHE.weight_logs[existing] = { ...CACHE.weight_logs[existing], ...data };
      this._set('weight_logs', CACHE.weight_logs[existing].id, CACHE.weight_logs[existing]);
      return CACHE.weight_logs[existing];
    }
    const log = { id: this.uuid(), ...data };
    CACHE.weight_logs.push(log);
    this._set('weight_logs', log.id, log);
    return log;
  },
  deleteWeightLog(id) {
    CACHE.weight_logs = CACHE.weight_logs.filter(w => w.id !== id);
    this._delete('weight_logs', id);
  },

  // 루틴 템플릿
  getRoutines() { return CACHE.routines; },
  getRoutine(id) { return CACHE.routines.find(r => r.id === id); },
  addRoutine(data) {
    const routine = { id: this.uuid(), ...data };
    CACHE.routines.push(routine);
    this._set('routines', routine.id, routine);
    return routine;
  },
  updateRoutine(id, updates) {
    const idx = CACHE.routines.findIndex(r => r.id === id);
    if (idx !== -1) { CACHE.routines[idx] = { ...CACHE.routines[idx], ...updates }; this._set('routines', id, CACHE.routines[idx]); }
  },
  deleteRoutine(id) {
    CACHE.routines = CACHE.routines.filter(r => r.id !== id);
    this._delete('routines', id);
  },

  // 공지사항
  getNotices() { return CACHE.notices; },
  getNotice(id) { return CACHE.notices.find(n => n.id === id); },
  addNotice(data) {
    const notice = { id: this.uuid(), date: new Date().toISOString().split('T')[0], pinned: false, ...data };
    CACHE.notices.unshift(notice);
    this._set('notices', notice.id, notice);
    return notice;
  },
  updateNotice(id, updates) {
    const idx = CACHE.notices.findIndex(n => n.id === id);
    if (idx !== -1) { CACHE.notices[idx] = { ...CACHE.notices[idx], ...updates }; this._set('notices', id, CACHE.notices[idx]); }
  },
  deleteNotice(id) {
    CACHE.notices = CACHE.notices.filter(n => n.id !== id);
    this._delete('notices', id);
  },

  // 인증
  loginAdmin(pw) {
    if (pw === CACHE.admin_pw) { sessionStorage.setItem('bc_role', 'admin'); return true; }
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

  // 통계
  getMemberStats(memberId) {
    const sessions = this.getMemberSessions(memberId);
    const schedules = this.getMemberSchedules(memberId);
    const now = new Date();
    const thisMonth = sessions.filter(s => s.date.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`));
    const attended = sessions.filter(s => s.attendance !== false).length;
    return { total: sessions.length, thisMonth: thisMonth.length, attendance: sessions.length > 0 ? Math.round(attended/sessions.length*100) : 0, upcomingCount: schedules.filter(s => s.status === 'scheduled' && s.date >= now.toISOString().split('T')[0]).length };
  },
  getExerciseStats(memberId) {
    const sessions = this.getMemberSessions(memberId);
    const stats = {};
    sessions.forEach(s => {
      (s.exercises||[]).forEach(e => {
        if (!stats[e.name]) stats[e.name] = { name: e.name, maxWeight: 0, totalSets: 0, count: 0 };
        stats[e.name].count++;
        stats[e.name].totalSets += (e.sets||[]).length;
        (e.sets||[]).forEach(set => { const w = parseFloat(set.weight)||0; if (w > stats[e.name].maxWeight) stats[e.name].maxWeight = w; });
      });
    });
    return Object.values(stats).sort((a,b) => b.count - a.count);
  },

  // 백업 (JSON 내보내기)
  exportBackup() {
    return JSON.stringify({ members: CACHE.members, sessions: CACHE.sessions, schedules: CACHE.schedules, pt_packages: CACHE.pt_packages, weight_logs: CACHE.weight_logs, routines: CACHE.routines, notices: CACHE.notices, admin_pw: CACHE.admin_pw }, null, 2);
  },
  async importBackup(jsonStr) {
    const data = JSON.parse(jsonStr);
    const cols = ['members','sessions','schedules','pt_packages','weight_logs','routines','notices'];
    cols.forEach(col => { if (data[col]) CACHE[col] = data[col]; });
    if (data.admin_pw) { CACHE.admin_pw = data.admin_pw; fsDb.collection('config').doc('admin').set({ pw: data.admin_pw }); }
    // Firestore에 전체 업로드
    for (const col of cols) {
      if (!data[col]) continue;
      const batch = fsDb.batch();
      data[col].forEach(item => { if (item.id) batch.set(fsDb.collection(col).doc(item.id), item); });
      await batch.commit();
    }
  },

  // CSV 내보내기
  exportSessionsCsv(memberId) {
    let sessions = [...CACHE.sessions].sort((a,b) => a.date.localeCompare(b.date));
    if (memberId) sessions = sessions.filter(s => s.memberId === memberId);
    const rows = [['날짜','회원','출석','운동 수','운동 목록','트레이너 메모','다음 계획']];
    sessions.forEach(s => {
      const m = this.getMember(s.memberId);
      rows.push([s.date, m?.name||'', s.attendance===false?'결석':'출석', s.exercises?.length||0, (s.exercises||[]).map(e=>e.name).join(' / '), s.trainerNote||'', s.nextPlan||'']);
    });
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  }
};
