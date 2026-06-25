const _RTDB = 'https://bodycalendar-da13e-default-rtdb.firebaseio.com';

async function _get(path) {
  const res = await fetch(`${_RTDB}/${path}.json`);
  if (!res.ok) throw new Error(`읽기 실패 (${res.status})`);
  return res.json();
}
function _set(path, data) {
  fetch(`${_RTDB}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(e => console.error('저장 실패:', path, e));
}
function _del(path) {
  fetch(`${_RTDB}/${path}.json`, { method: 'DELETE' })
    .catch(e => console.error('삭제 실패:', path, e));
}
function _toArr(obj) { return obj ? Object.values(obj) : []; }

const CACHE = {
  members: [], sessions: [], schedules: [],
  pt_packages: [], weight_logs: [], routines: [], notices: [],
  admin_pw: '0000'
};

const DB = {
  async init() {
    const [members, sessions, schedules, pt_packages, weight_logs, routines, notices, config] = await Promise.all([
      _get('members'), _get('sessions'), _get('schedules'),
      _get('pt_packages'), _get('weight_logs'), _get('routines'),
      _get('notices'), _get('config')
    ]);
    CACHE.members    = _toArr(members);
    CACHE.sessions   = _toArr(sessions);
    CACHE.schedules  = _toArr(schedules);
    CACHE.pt_packages = _toArr(pt_packages);
    CACHE.weight_logs = _toArr(weight_logs);
    CACHE.routines   = _toArr(routines);
    CACHE.notices    = _toArr(notices);
    CACHE.admin_pw   = config?.admin_pw || '0000';
  },

  uuid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },

  getAdminPw() { return CACHE.admin_pw; },
  setAdminPw(pw) { CACHE.admin_pw = pw; _set('config/admin_pw', pw); },

  // 회원
  getMembers() { return CACHE.members; },
  getMember(id) { return CACHE.members.find(m => m.id === id); },
  getMemberByName(name) { return CACHE.members.find(m => m.name === name); },
  addMember(data) {
    const m = { id: this.uuid(), joinDate: new Date().toISOString().split('T')[0], ...data };
    CACHE.members.push(m); _set(`members/${m.id}`, m); return m;
  },
  updateMember(id, updates) {
    const i = CACHE.members.findIndex(m => m.id === id);
    if (i !== -1) { CACHE.members[i] = { ...CACHE.members[i], ...updates }; _set(`members/${id}`, CACHE.members[i]); }
  },
  deleteMember(id) {
    ['sessions','schedules','pt_packages','weight_logs'].forEach(col => {
      CACHE[col].filter(r => r.memberId === id).forEach(r => _del(`${col}/${r.id}`));
    });
    _del(`members/${id}`);
    CACHE.members     = CACHE.members.filter(m => m.id !== id);
    CACHE.sessions    = CACHE.sessions.filter(s => s.memberId !== id);
    CACHE.schedules   = CACHE.schedules.filter(s => s.memberId !== id);
    CACHE.pt_packages = CACHE.pt_packages.filter(p => p.memberId !== id);
    CACHE.weight_logs = CACHE.weight_logs.filter(w => w.memberId !== id);
  },

  // 세션
  getSessions() { return CACHE.sessions; },
  getSession(id) { return CACHE.sessions.find(s => s.id === id); },
  getMemberSessions(memberId) { return CACHE.sessions.filter(s => s.memberId === memberId).sort((a,b) => b.date.localeCompare(a.date)); },
  getDateSessions(date) { return CACHE.sessions.filter(s => s.date === date); },
  getMonthSessions(y, m) { const p=`${y}-${String(m).padStart(2,'0')}`; return CACHE.sessions.filter(s=>s.date.startsWith(p)); },
  addSession(data) {
    const s = { id: this.uuid(), exercises: [], ...data };
    CACHE.sessions.push(s); _set(`sessions/${s.id}`, s);
    const sch = CACHE.schedules.find(sc => sc.memberId === data.memberId && sc.date === data.date);
    if (sch) this.updateSchedule(sch.id, { status: 'completed' });
    return s;
  },
  updateSession(id, updates) {
    const i = CACHE.sessions.findIndex(s => s.id === id);
    if (i !== -1) { CACHE.sessions[i] = { ...CACHE.sessions[i], ...updates }; _set(`sessions/${id}`, CACHE.sessions[i]); }
  },
  deleteSession(id) { CACHE.sessions = CACHE.sessions.filter(s => s.id !== id); _del(`sessions/${id}`); },

  // 일정
  getSchedules() { return CACHE.schedules; },
  getMemberSchedules(memberId) { return CACHE.schedules.filter(s => s.memberId === memberId); },
  getDateSchedules(date) { return CACHE.schedules.filter(s => s.date === date); },
  getMonthSchedules(y, m) { const p=`${y}-${String(m).padStart(2,'0')}`; return CACHE.schedules.filter(s=>s.date.startsWith(p)); },
  addSchedule(data) {
    const s = { id: this.uuid(), status: 'scheduled', ...data };
    CACHE.schedules.push(s); _set(`schedules/${s.id}`, s); return s;
  },
  updateSchedule(id, updates) {
    const i = CACHE.schedules.findIndex(s => s.id === id);
    if (i !== -1) { CACHE.schedules[i] = { ...CACHE.schedules[i], ...updates }; _set(`schedules/${id}`, CACHE.schedules[i]); }
  },
  deleteSchedule(id) { CACHE.schedules = CACHE.schedules.filter(s => s.id !== id); _del(`schedules/${id}`); },

  // PT 패키지
  getPtPackages() { return CACHE.pt_packages; },
  getMemberPtPackages(memberId) { return CACHE.pt_packages.filter(p => p.memberId === memberId).sort((a,b) => b.purchaseDate.localeCompare(a.purchaseDate)); },
  getActivePtPackage(memberId) { return this.getMemberPtPackages(memberId).find(p => p.active); },
  addPtPackage(data) {
    CACHE.pt_packages.forEach(p => { if (p.memberId === data.memberId && p.active) { p.active = false; _set(`pt_packages/${p.id}`, p); } });
    const pkg = { id: this.uuid(), active: true, ...data };
    CACHE.pt_packages.push(pkg); _set(`pt_packages/${pkg.id}`, pkg); return pkg;
  },
  updatePtPackage(id, updates) {
    const i = CACHE.pt_packages.findIndex(p => p.id === id);
    if (i !== -1) { CACHE.pt_packages[i] = { ...CACHE.pt_packages[i], ...updates }; _set(`pt_packages/${id}`, CACHE.pt_packages[i]); }
  },
  deletePtPackage(id) { CACHE.pt_packages = CACHE.pt_packages.filter(p => p.id !== id); _del(`pt_packages/${id}`); },
  getPtRemaining(memberId) {
    const pkg = this.getActivePtPackage(memberId); if (!pkg) return null;
    const used = CACHE.sessions.filter(s => s.memberId === memberId && s.attendance !== false && s.date >= pkg.purchaseDate).length;
    return { total: pkg.total, used, remaining: Math.max(0, pkg.total - used), pkg };
  },

  // 체중 기록
  getWeightLogs() { return CACHE.weight_logs; },
  getMemberWeightLogs(memberId) { return CACHE.weight_logs.filter(w => w.memberId === memberId).sort((a,b) => a.date.localeCompare(b.date)); },
  addWeightLog(data) {
    const ei = CACHE.weight_logs.findIndex(w => w.memberId === data.memberId && w.date === data.date);
    if (ei !== -1) { CACHE.weight_logs[ei] = { ...CACHE.weight_logs[ei], ...data }; _set(`weight_logs/${CACHE.weight_logs[ei].id}`, CACHE.weight_logs[ei]); return CACHE.weight_logs[ei]; }
    const log = { id: this.uuid(), ...data }; CACHE.weight_logs.push(log); _set(`weight_logs/${log.id}`, log); return log;
  },
  deleteWeightLog(id) { CACHE.weight_logs = CACHE.weight_logs.filter(w => w.id !== id); _del(`weight_logs/${id}`); },

  // 루틴
  getRoutines() { return CACHE.routines; },
  getRoutine(id) { return CACHE.routines.find(r => r.id === id); },
  addRoutine(data) { const r = { id: this.uuid(), ...data }; CACHE.routines.push(r); _set(`routines/${r.id}`, r); return r; },
  updateRoutine(id, updates) {
    const i = CACHE.routines.findIndex(r => r.id === id);
    if (i !== -1) { CACHE.routines[i] = { ...CACHE.routines[i], ...updates }; _set(`routines/${id}`, CACHE.routines[i]); }
  },
  deleteRoutine(id) { CACHE.routines = CACHE.routines.filter(r => r.id !== id); _del(`routines/${id}`); },

  // 공지사항
  getNotices() { return CACHE.notices; },
  getNotice(id) { return CACHE.notices.find(n => n.id === id); },
  addNotice(data) {
    const n = { id: this.uuid(), date: new Date().toISOString().split('T')[0], pinned: false, ...data };
    CACHE.notices.unshift(n); _set(`notices/${n.id}`, n); return n;
  },
  updateNotice(id, updates) {
    const i = CACHE.notices.findIndex(n => n.id === id);
    if (i !== -1) { CACHE.notices[i] = { ...CACHE.notices[i], ...updates }; _set(`notices/${id}`, CACHE.notices[i]); }
  },
  deleteNotice(id) { CACHE.notices = CACHE.notices.filter(n => n.id !== id); _del(`notices/${id}`); },

  // 인증
  loginAdmin(pw) { if (pw === CACHE.admin_pw) { sessionStorage.setItem('bc_role','admin'); return true; } return false; },
  loginMember(name, pw) {
    const m = this.getMemberByName(name);
    if (m && m.password === pw) { sessionStorage.setItem('bc_role','member'); sessionStorage.setItem('bc_member_id',m.id); return m; }
    return null;
  },
  logout() { sessionStorage.removeItem('bc_role'); sessionStorage.removeItem('bc_member_id'); },
  getRole() { return sessionStorage.getItem('bc_role'); },
  getCurrentMemberId() { return sessionStorage.getItem('bc_member_id'); },

  // 통계
  getMemberStats(memberId) {
    const sessions = this.getMemberSessions(memberId), schedules = this.getMemberSchedules(memberId);
    const now = new Date();
    const thisMonth = sessions.filter(s => s.date.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`));
    const attended = sessions.filter(s => s.attendance !== false).length;
    return { total: sessions.length, thisMonth: thisMonth.length, attendance: sessions.length>0?Math.round(attended/sessions.length*100):0, upcomingCount: schedules.filter(s=>s.status==='scheduled'&&s.date>=now.toISOString().split('T')[0]).length };
  },
  getExerciseStats(memberId) {
    const stats = {};
    this.getMemberSessions(memberId).forEach(s => {
      (s.exercises||[]).forEach(e => {
        if (!stats[e.name]) stats[e.name] = { name:e.name, maxWeight:0, totalSets:0, count:0 };
        stats[e.name].count++; stats[e.name].totalSets += (e.sets||[]).length;
        (e.sets||[]).forEach(set => { const w=parseFloat(set.weight)||0; if(w>stats[e.name].maxWeight) stats[e.name].maxWeight=w; });
      });
    });
    return Object.values(stats).sort((a,b) => b.count-a.count);
  },

  exportBackup() {
    return JSON.stringify({ members:CACHE.members, sessions:CACHE.sessions, schedules:CACHE.schedules, pt_packages:CACHE.pt_packages, weight_logs:CACHE.weight_logs, routines:CACHE.routines, notices:CACHE.notices, admin_pw:CACHE.admin_pw }, null, 2);
  },
  async importBackup(jsonStr) {
    const data = JSON.parse(jsonStr);
    const cols = ['members','sessions','schedules','pt_packages','weight_logs','routines','notices'];
    cols.forEach(col => { if (data[col]) CACHE[col] = data[col]; });
    if (data.admin_pw) { CACHE.admin_pw = data.admin_pw; _set('config/admin_pw', data.admin_pw); }
    for (const col of cols) {
      if (!data[col]) continue;
      const obj = {};
      data[col].forEach(item => { if (item.id) obj[item.id] = item; });
      await fetch(`${_RTDB}/${col}.json`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(obj) });
    }
  },
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
