const _RTDB = 'https://bodycalendar-da13e-default-rtdb.firebaseio.com';

// ── 기본 운동 DB ─────────────────────────────────────────────
const EXERCISE_DB = {
  '하체': ['스쿼트','프론트 스쿼트','고블릿 스쿼트','수모 스쿼트','핵 스쿼트','씨씨 스쿼트','스미스 스쿼트','박스 스쿼트','레그프레스','핵 레그프레스','레그컬','레그익스텐션','루마니안 데드리프트','싱글레그 데드리프트','힙쓰러스트','바벨 힙쓰러스트','글루트 브릿지','런지','리버스 런지','워킹 런지','불가리안 스플릿 스쿼트','스텝업','박스 점프','카프레이즈','시티드 카프레이즈','레그 어브덕션','레그 어덕션','힙 어브덕션 머신','힙 어덕션 머신','글루트 킥백','사이드 런지','월 스쿼트','래터럴 밴드 워크'],
  '가슴': ['벤치프레스','인클라인 벤치프레스','디클라인 벤치프레스','클로즈그립 벤치프레스','덤벨 벤치프레스','인클라인 덤벨 프레스','덤벨 플라이','인클라인 덤벨 플라이','케이블 크로스오버','로우 케이블 플라이','하이 케이블 플라이','체스트 프레스 머신','펙덱 플라이','딥스','푸시업','와이드 푸시업','인클라인 푸시업','덤벨 풀오버'],
  '등': ['데드리프트','루마니안 데드리프트','풀업','친업','클로즈그립 풀업','랫풀다운','클로즈그립 랫풀다운','리버스 그립 랫풀다운','시티드 케이블 로우','클로즈그립 로우','바벨 로우','언더그립 바벨 로우','원암 덤벨 로우','티바 로우','케이블 페이스풀','페이스풀','리버스 플라이','슈러그','굿모닝','백 익스텐션','하이퍼익스텐션','덤벨 풀오버'],
  '어깨': ['오버헤드 바벨 프레스','덤벨 숄더프레스','아놀드 프레스','머신 숄더프레스','스미스 숄더프레스','사이드 레터럴 레이즈','케이블 레터럴 레이즈','밴드 레터럴 레이즈','프론트 레이즈','케이블 프론트 레이즈','리어 델트 플라이','케이블 리어 델트','페이스풀','밴드 페이스풀','업라이트 로우','케이블 업라이트 로우'],
  '팔': ['바벨 컬','덤벨 컬','해머 컬','인클라인 덤벨 컬','프리처 컬','케이블 컬','리버스 컬','밴드 컬','21s 컬','컨센트레이션 컬','트라이셉스 푸시다운','V바 푸시다운','로프 푸시다운','오버헤드 트라이셉스 익스텐션','스컬크러셔','클로즈그립 벤치프레스','킥백','케이블 킥백'],
  '복부': ['플랭크','사이드 플랭크','크런치','리버스 크런치','바이시클 크런치','레그레이즈','행잉 레그레이즈','힐터치','토터치','싯업','V업','러시안 트위스트','케이블 크런치','드래곤 플래그','에브 휠 롤아웃','풍차'],
  '코어': ['데드버그','버드독','마운틴 클라이머','슈퍼맨','글루트 브릿지 싱글','팔로프 프레스','케이블 우드찹','롤아웃','터키시 겟업','TRX 파이크','스위스볼 플랭크','할로우 바디홀드','L싯','베어 크롤','코펜하겐 플랭크'],
  '기능성': ['케틀벨 스윙','케틀벨 클린','케틀벨 스내치','케틀벨 고블릿 스쿼트','파워 클린','클린 앤 저크','스내치','배틀로프','메디신볼 슬램','메디신볼 로테이션','파머스워크','슬레드 푸시','슬레드 풀','타이어 플립','버피','점프 스쿼트','박스 점프','래터럴 점프','TRX 로우','TRX 체스트프레스','밴드 몬스터워크'],
  '유산소': ['트레드밀','인클라인 트레드밀','싸이클','에어바이크','로잉머신','스텝밀','일립티컬','스키에르그','줄넘기','스피닝','계단오르기','배틀로프 인터벌'],
  '스트레칭': ['폼롤러 허벅지','폼롤러 종아리','폼롤러 등','폼롤러 IT밴드','고관절 굴곡근 스트레칭','햄스트링 스트레칭','사두근 스트레칭','흉추 스트레칭','어깨 스트레칭','가슴 스트레칭','고양이 낙타 자세','차일드 포즈','피전 포즈','라잉 글루트 스트레칭','월 스트레칭']
};
// 전체 종목 이름 배열 (기본 + 커스텀)
function getAllExerciseNames() {
  const base = Object.values(EXERCISE_DB).flat();
  const custom = (typeof CACHE !== 'undefined' ? CACHE.custom_exercises || [] : []).map(e => e.name);
  return [...new Set([...base, ...custom])];
}

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
  pkg_templates: [], personal_logs: [], custom_exercises: [],
  admin_pw: '0000'
};

const DB = {
  async init() {
    const [members, sessions, schedules, pt_packages, weight_logs, routines, notices, pkg_templates, personal_logs, custom_exercises, config] = await Promise.all([
      _get('members'), _get('sessions'), _get('schedules'),
      _get('pt_packages'), _get('weight_logs'), _get('routines'),
      _get('notices'), _get('pkg_templates'), _get('personal_logs'), _get('custom_exercises'), _get('config')
    ]);
    CACHE.members          = _toArr(members);
    CACHE.sessions         = _toArr(sessions);
    CACHE.schedules        = _toArr(schedules);
    CACHE.pt_packages      = _toArr(pt_packages);
    CACHE.weight_logs      = _toArr(weight_logs);
    CACHE.routines         = _toArr(routines);
    CACHE.notices          = _toArr(notices);
    CACHE.pkg_templates    = _toArr(pkg_templates);
    CACHE.personal_logs    = _toArr(personal_logs);
    CACHE.custom_exercises = _toArr(custom_exercises);
    CACHE.admin_pw         = config?.admin_pw || '0000';
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

  // 커스텀 운동 종목
  getCustomExercises() { return CACHE.custom_exercises; },
  addCustomExercise(name, category='기타') {
    if (CACHE.custom_exercises.find(e => e.name === name)) return null;
    const e = { id: this.uuid(), name: name.trim(), category };
    CACHE.custom_exercises.push(e); _set(`custom_exercises/${e.id}`, e); return e;
  },
  deleteCustomExercise(id) { CACHE.custom_exercises = CACHE.custom_exercises.filter(e => e.id !== id); _del(`custom_exercises/${id}`); },

  // 개인 운동 기록
  getPersonalLogs() { return CACHE.personal_logs; },
  getMemberPersonalLogs(memberId) { return CACHE.personal_logs.filter(l => l.memberId === memberId).sort((a,b) => b.date.localeCompare(a.date)); },
  addPersonalLog(data) { const l = { id: this.uuid(), createdAt: new Date().toISOString(), ...data }; CACHE.personal_logs.push(l); _set(`personal_logs/${l.id}`, l); return l; },
  updatePersonalLog(id, updates) {
    const i = CACHE.personal_logs.findIndex(l => l.id === id);
    if (i !== -1) { CACHE.personal_logs[i] = { ...CACHE.personal_logs[i], ...updates }; _set(`personal_logs/${id}`, CACHE.personal_logs[i]); }
  },
  deletePersonalLog(id) { CACHE.personal_logs = CACHE.personal_logs.filter(l => l.id !== id); _del(`personal_logs/${id}`); },

  // 패키지 템플릿
  getPkgTemplates() { return CACHE.pkg_templates; },
  addPkgTemplate(data) { const t = { id: this.uuid(), ...data }; CACHE.pkg_templates.push(t); _set(`pkg_templates/${t.id}`, t); return t; },
  updatePkgTemplate(id, updates) {
    const i = CACHE.pkg_templates.findIndex(t => t.id === id);
    if (i !== -1) { CACHE.pkg_templates[i] = { ...CACHE.pkg_templates[i], ...updates }; _set(`pkg_templates/${id}`, CACHE.pkg_templates[i]); }
  },
  deletePkgTemplate(id) { CACHE.pkg_templates = CACHE.pkg_templates.filter(t => t.id !== id); _del(`pkg_templates/${id}`); },

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
