/* ============================================================
   GxP 디지털 성숙도 진단 - 홈페이지판 (/solutions/gxp/diagnostic/)
   원본: 9월 박람회/Cluade_박람회/02_프로토타입/bqube-diagnostic.html (KLSW2026 부스용)
   채점 엔진(문항·배점·레벨·T등급)은 원본 그대로다. 바꾼 것은 사이트에 맞춘 부분뿐:
   - 유형은 Ⓐ 기업·Ⓑ 랩 두 갈래만 진단한다. Ⓒ·Ⓓ·Ⓔ(학생·투자·개인) 흐름과 추천 문항은
     부스 방문객용이라 뺐고, "그 밖의 문의" 한 줄로 도입문의 페이지에 보낸다
   - 자체 리드 폼·동의 문안·구글시트 전송·GA 로더·PDF 링크를 걷어냈다.
     상담 신청은 사이트 도입문의 폼(운영본 동의 문안)으로 결과를 담아 보낸다
   - 개선 포인트는 PDF 대신 GxP 솔루션 페이지의 해당 챕터로 보낸다
   - 테마는 사이트 토글을 따른다(레이더만 다시 그린다)
   검증: 같은 폴더가 아니라 프로젝트 루트의 diagnostic.test.js
   ============================================================ */

/* dataLayer 가 있으면 이벤트만 쌓는다. GA4 는 실서비스 배포 때 사이트 공통으로 붙인다 */
function track(ev, params) {
  if (window.dataLayer) window.dataLayer.push(Object.assign({ event: ev }, params || {}));
}

/* 개선 포인트 -> GxP 솔루션 페이지 챕터 앵커 */
var MOD = {
  EDMS: { tag: 'EDMS', name: 'BQUBE-EDMS · 전자문서관리', desc: '문서 전주기 + 전자서명(21 CFR Part 11)', a: 'edms' },
  QMS:  { tag: 'QMS',  name: 'BQUBE-QMS · 품질관리', desc: '일탈·CAPA·변경 표준화 + 실시간 대시보드', a: 'qms' },
  LMS:  { tag: 'LMS',  name: 'BQUBE-LMS · 교육관리', desc: 'SOP 승인 시 자동 배정·이수 추적', a: 'lms' },
  LIMS: { tag: 'LIMS', name: 'LIMS · 통합시험관리', desc: 'LES 연동 성적서·COA 자동생성', a: 'lims' },
  ELN:  { tag: 'ELN',  name: 'ELN · 전자연구노트', desc: 'Audit Trail·전자서명 자동', a: 'eln' },
  DI:   { tag: 'DI',   name: 'BQUBE 플랫폼 · Data Integrity', desc: '통합 플랫폼으로 실사 자료 클릭 즉시 제출', a: 'bqube' }
};
var AREA = { EDMS: '전자문서관리', QMS: '품질관리', LMS: '교육관리', LIMS: '통합시험관리', ELN: '전자연구노트', DI: 'Data Integrity' };
var AXES_A = ['EDMS', 'QMS', 'LMS', 'LIMS', 'ELN', 'DI'];
var AXES_B = ['ELN', 'LIMS', 'DI'];

/* 채점 정책 스위치 - 박람회 7차 회의(2026-08-26) 확정값 그대로 */
var NA_MODE = 'exclude';
var NA_WEAK_FIRST = true;
var NA_UNKNOWN = '잘 모르겠어요';
var NA_NONE = '해당 업무가 없어요';
var NA_IDX = 4;

var SYS_OPTS = ['EDMS · 문서관리', 'QMS · 품질관리', 'LMS · 교육관리', 'LIMS · 시험관리', 'ELN · 전자연구노트', 'POP · 생산운영', 'EBR · 전자배치기록', 'eCTD · 허가문서', 'CTMS · 임상시험관리', '보유한 시스템이 없어요', '잘 모르겠어요'];
var SYS_EXCL = [9, 10];
var PAIN_OPTS = ['현업 사용률이 낮다', '우리 프로세스에 맞게 못 고친다', '다른 시스템과 연동이 안 된다', '속도·UI가 불편하다', '규제(Part 11)·실사 대응이 부족하다', '유지보수·지원이 약하다', '비용 부담이 크다', '문제없이 잘 쓰고 있어요', '보유한 시스템이 없어요'];
var PAIN_EXCL = [7, 8];

/* T1~T4 리드 등급 - 정본 Confluence 413892651 배점표, 배포본(Railway)과 같다. 화면에 내지 않는다.
   배포 홈페이지 문의 API 에 받을 칸이 없어 사이트에서는 어디로도 보내지 않는다(2026-09-28) */
var TIMING_OPTS = ['3개월 내 검토 중', '6개월~1년 내', '계획은 있으나 시기 미정', '결정 권한이 없다', '아직 없다'];
var TIMING_SCORE = [5, 3, 1, 0, -2];
var PERSONA_TSCORE = { A: 3, B: 2 };
var T_RATIO = [0.25, 0.5, 0.75];

var PERSONAS = [
  { k: 'A', id: 'A', t: '기업 실무자·책임자', s: '제약·바이오·재생의료·CRO/CDMO' },
  { k: 'B', id: 'B', t: '시험·분석 랩 / 연구소', s: '연구원·QC 등' },
  { k: 'C', id: 'X', t: '그 밖의 문의', s: '투자·제휴·언론·개인 - 도입문의로 연결합니다' }
];

var QA = [
  { id: 'size', type: 'single', q: '회사 규모를 알려주세요', hint: '통계용 · 결과에는 영향 없어요', opts: ['~50명', '50~300명', '300~1,000명', '1,000명+'] },
  { id: 'EDMS', type: 'scale', q: 'SOP·제조/품질 문서를 어떻게 관리하나요?', hint: '문서관리 (EDMS)', opts: ['종이·수기 결재 중심', '파일서버/공유폴더 보관', '문서관리 시스템으로 버전·승인', '통합 EDMS + 전자서명(Part 11)', NA_UNKNOWN], naType: 'unknown' },
  { id: 'QMS', type: 'scale', q: '일탈·CAPA·변경관리는 어떻게 처리하나요?', hint: '품질관리 (QMS)', opts: ['종이 양식/수기 대장', '엑셀·이메일 관리', '개별 QMS로 전산 처리', '실시간 대시보드 + 교육 자동연계', NA_UNKNOWN], naType: 'unknown' },
  { id: 'LMS', type: 'scale', q: 'SOP 개정 교육 배정·이수 관리는?', hint: '교육관리 (LMS)', opts: ['수기 서명 대장', '엑셀 관리', '개별 LMS 운영', '승인 시 자동 배정·이수 추적', NA_UNKNOWN], naType: 'unknown' },
  { id: 'LIMS', type: 'scale', q: '시험 의뢰~성적서(COA) 발행 과정은?', hint: '시험관리 (LIMS)', opts: ['수기 기록·수기 성적서', '엑셀·부분 전산', 'LIMS로 결과 관리', 'LES 연동 COA 자동생성', NA_NONE], naType: 'none' },
  { id: 'ELN', type: 'scale', q: '연구·시험 raw data 기록과 Audit Trail은?', hint: '전자연구노트 (ELN)', opts: ['종이 노트', '파일(엑셀/워드) 저장', '전자연구노트(ELN) 사용', 'Audit Trail·전자서명 자동', NA_NONE], naType: 'none' },
  { id: 'DI', type: 'scale', q: '규제 실사 자료 준비에 걸리는 시간은?', hint: 'Data Integrity · 실사 대응', opts: ['수일 이상 (부서별 취합)', '하루 정도', '수 시간', '클릭 즉시 (통합 검색·제출)', NA_UNKNOWN], naType: 'unknown' },
  { id: 'have', type: 'multi', q: '현재 보유·운영 중인 시스템을 모두 골라주세요', hint: '복수 선택 가능', opts: SYS_OPTS, exclusive: SYS_EXCL },
  { id: 'pain', type: 'multi', q: '그중 잘 활용되지 않는 것이 있다면, 이유는 무엇인가요?', hint: '복수 선택 가능', opts: PAIN_OPTS, exclusive: PAIN_EXCL },
  { id: 'timing', type: 'single', q: '도입이나 교체를 검토하고 계신가요?', hint: '후속 안내 방식을 정하는 데만 씁니다', opts: TIMING_OPTS }
];
var QB = [
  { id: 'ELN', type: 'scale', q: '실험 기록을 어떻게 관리하나요?', hint: '연구 기록 (ELN)', opts: ['종이 노트', '엑셀/파일', 'ELN 사용', 'Audit Trail 자동'] },
  { id: 'LIMS', type: 'scale', q: '시료·시약·기기 이력 관리는?', hint: '시험관리 (LIMS)', opts: ['수기', '엑셀', '부분 전산', 'LIMS 통합'] },
  { id: 'DI', type: 'scale', q: '원자료(raw data) 보존·추적 수준은?', hint: 'Data Integrity', opts: ['없음 · 별도 관리 안 함', '파일 보관', '부분 관리', '자동 감사추적'] },
  { id: 'timing', type: 'single', q: '도입이나 교체를 검토하고 계신가요?', hint: '후속 안내 방식을 정하는 데만 씁니다', opts: TIMING_OPTS }
];

var state = { persona: null, step: 0, queue: [], answers: {} };

function el(id) { return document.getElementById(id); }
/* 링크 원본은 마크업의 a[href] 다. 빌드가 깊이에 맞게 상대화해 두므로 JS 는 그 값을 이어 쓴다 */
function hrefOf(id, fb) { var a = el(id); return (a && a.getAttribute('href')) || fb; }
function go(id) {
  document.querySelectorAll('.dg .scr').forEach(function (s) { s.classList.remove('on'); });
  el(id).classList.add('on');
  /* 진단 상자 위쪽이 화면 밖으로 밀려 있을 때만 끌어올린다(페이지 맨 위로 튀지 않게) */
  var box = el('dg');
  if (box && box.getBoundingClientRect) {
    var t = box.getBoundingClientRect().top;
    if (t < 0) window.scrollTo(0, (window.pageYOffset || 0) + t - 84);
  }
}
function setProg(p) { el('dg-bar').style.width = Math.max(0, Math.min(100, p)) + '%'; }

function renderPersona() {
  var c = el('dg-persona'); c.innerHTML = '';
  PERSONAS.forEach(function (p) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dg-opt';
    b.innerHTML = '<span class="k">' + p.k + '</span><span class="tx">' + p.t + '<small>' + p.s + '</small></span><span class="chk"></span>';
    b.onclick = function () { choosePersona(p.id); };
    c.appendChild(b);
  });
}

function choosePersona(id) {
  state.persona = id; state.step = 0; state.answers = {};
  track('persona_select', { persona: id });
  if (id === 'A') { state.queue = QA; beginSurvey(); }
  else if (id === 'B') { state.queue = QB; beginSurvey(); }
  else { window.location.href = hrefOf('dg-contact', '#'); }   /* 배포 API 는 gxp·enterprise·hospital 만 받는다 */
}

/* ---- 문항 엔진 (Ⓐ·Ⓑ 공통) ---- */
function beginSurvey() { state.step = 0; go('dg-survey'); renderQ(); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function renderQ() {
  var q = state.queue[state.step], n = state.queue.length;
  el('dg-count').textContent = 'Q ' + pad2(state.step + 1) + ' / ' + pad2(n);
  el('dg-qt').textContent = q.q;
  el('dg-qh').textContent = q.hint || '';
  setProg(8 + (state.step / n) * 72);
  el('dg-qback').onclick = function () {
    if (state.step === 0) { go('dg-start'); setProg(0); }
    else { state.step--; renderQ(); }
  };
  var c = el('dg-qopts'); c.innerHTML = '';
  var cur = state.answers[q.id];
  q.opts.forEach(function (txt, i) {
    var isMulti = (q.type === 'multi');
    var sel = isMulti ? ((cur || []).indexOf(i) >= 0) : (cur === i);
    var b = document.createElement('button'); b.type = 'button';
    b.className = 'dg-opt' + (sel ? ' sel' : '') + ((q.type === 'scale' && i === NA_IDX) ? ' na' : '');
    b.setAttribute('aria-pressed', sel ? 'true' : 'false');
    var kk = (q.type === 'scale') ? String(i + 1) : String.fromCharCode(65 + i);
    b.innerHTML = '<span class="k">' + kk + '</span><span class="tx">' + txt + '</span><span class="chk"></span>';
    b.onclick = function () {
      if (isMulti) {
        var arr = state.answers[q.id] || (state.answers[q.id] = []);
        var ex = q.exclusive;
        ex = (ex == null) ? [] : (ex.length !== undefined ? ex : [ex]);
        if (ex.indexOf(i) >= 0) { arr.length = 0; arr.push(i); }
        else {
          for (var m = arr.length - 1; m >= 0; m--) { if (ex.indexOf(arr[m]) >= 0) arr.splice(m, 1); }
          var k = arr.indexOf(i); if (k >= 0) arr.splice(k, 1); else arr.push(i);
        }
        track('question_answered', { persona: state.persona, qid: q.id, value: i + 1 });
        renderQ();
      } else {
        state.answers[q.id] = i;
        track('question_answered', { persona: state.persona, qid: q.id, value: i + 1 });
        c.querySelectorAll('.dg-opt').forEach(function (o) { o.classList.remove('sel'); });
        b.classList.add('sel');
        setTimeout(nextQ, 230);
      }
    };
    c.appendChild(b);
  });
  var nx = el('dg-next');
  if (q.type === 'multi') {
    var has = !!(cur && cur.length);
    nx.style.display = 'inline-flex'; nx.disabled = !has; nx.onclick = nextQ;
  } else { nx.style.display = 'none'; nx.disabled = false; }
}
function nextQ() {
  if (state.step < state.queue.length - 1) { state.step++; renderQ(); }
  else { finishSurvey(); }
}

/* ---- 채점 ---- */
function naTypeOf(axis) {
  var q = null, list = (state.persona === 'A') ? QA : QB;
  list.forEach(function (x) { if (x.id === axis) q = x; });
  return (q && q.naType) ? q.naType : 'unknown';
}
function scoreAxes() {
  var axes = (state.persona === 'A') ? AXES_A : AXES_B;
  var scores = {}, na = [], naU = [], naN = [], sum = 0, cnt = 0;
  axes.forEach(function (a) {
    var i = state.answers[a];
    if (i == null || i === NA_IDX) {
      na.push(a);
      (naTypeOf(a) === 'none' ? naN : naU).push(a);
      if (NA_MODE === 'one') { scores[a] = 1; sum += 1; cnt++; }
      else { scores[a] = 0; }
    } else { scores[a] = i + 1; sum += i + 1; cnt++; }
  });
  return { axes: axes, scores: scores, na: na, naU: naU, naN: naN, score: sum, max: cnt * 4 };
}
function finishSurvey() {
  var r = scoreAxes();
  state.result = r;
  track('survey_complete', { persona: state.persona, score: r.score, max: r.max, na: r.na.join(',') });
  showResult(r);
}

var BANDS = { A: [10 / 24, 15 / 24, 20 / 24], B: [5 / 12, 8 / 12, 10 / 12] };
function levelOf(sum, persona, max) {
  if (!max) return { n: 1, t: '도입 검토 단계', line: '아직 도입 전 단계로 보입니다. 상담에서 우선순위부터 같이 정리해 드릴게요.' };
  var r = sum / max, b = BANDS[persona] || BANDS.B;
  if (persona === 'A') {
    if (r <= b[0]) return { n: 1, t: '전환 출발선', line: '지금이 시작하기 가장 좋은 시점입니다. 문서나 기록 한 축만 먼저 잡아도 실사 대응이 크게 달라집니다.' };
    if (r <= b[1]) return { n: 2, t: '전산화 진행 중', line: '도구는 이미 갖추셨습니다. 남은 건 서로 연결해 한 번에 꺼내 쓰는 일이에요.' };
    if (r <= b[2]) return { n: 3, t: '시스템 정착', line: '전산화는 충분히 진행됐습니다. 통합으로 마지막 한 칸을 채울 시점이에요.' };
    return { n: 4, t: '통합 플랫폼', line: 'GMP 디지털 성숙도가 상위 수준입니다. 고도화·확장을 함께 논의해요.' };
  }
  if (r <= b[0]) return { n: 1, t: '기록 정비 단계', line: '랩 기록 체계를 세우기 좋은 출발점입니다. ELN 한 축부터 시작하면 부담이 적어요.' };
  if (r <= b[1]) return { n: 2, t: '전산화 진행 랩', line: '일부는 이미 전산화되어 있습니다. ELN·LIMS로 자동 추적만 채우면 됩니다.' };
  if (r <= b[2]) return { n: 3, t: '시스템 운영 랩', line: '시스템이 자리 잡았습니다. 연동·감사추적으로 한 단계 더 올릴 수 있어요.' };
  return { n: 4, t: '디지털 성숙 랩', line: '랩 디지털화가 상위 수준입니다. 통합·확장을 함께 논의해요.' };
}

/* 약한 축·강한 축. '해당 업무가 없어요' 축은 팔 수 있는 영역이 아니라 추천에서 뺀다.
   '잘 모르겠어요' 축은 NA_WEAK_FIRST 를 따라 확인 대상으로 앞에 올린다. */
function pickAxes(res) {
  var scored = res.axes.filter(function (a) { return res.na.indexOf(a) < 0; });
  var sorted = scored.slice().sort(function (a, b) { return res.scores[a] - res.scores[b]; });
  var weak = sorted.filter(function (a) { return res.scores[a] < 4; });
  if (NA_WEAK_FIRST) weak = (res.naU || []).concat(weak);
  weak = weak.slice(0, 3);
  if (weak.length === 0) weak = sorted.slice(0, 1);
  var strong = sorted.slice().reverse().filter(function (a) { return res.scores[a] >= 3; }).slice(0, 2);
  return { weak: weak, strong: strong };
}

function showResult(res) {
  var pn = state.persona, naU = res.naU || [];
  var lv = levelOf(res.score, pn, res.max);
  var pk = pickAxes(res);
  state.result.level = lv.n; state.result.label = lv.t;
  state.result.weak = pk.weak; state.result.strong = pk.strong;

  el('dg-reye').textContent = (pn === 'A' ? 'GMP DIGITAL MATURITY' : 'LAB DIGITAL MATURITY');
  el('dg-lvn').innerHTML = 'LV<b>' + lv.n + '</b><small>/4</small>';
  el('dg-lvt').textContent = lv.t;
  el('dg-lvl').textContent = lv.line;

  var sc = el('dg-strong'), st = el('dg-strongt');
  sc.innerHTML = '';
  pk.strong.forEach(function (a) {
    var sp = document.createElement('span'); sp.textContent = AREA[a]; sc.appendChild(sp);
  });
  sc.style.display = pk.strong.length ? 'flex' : 'none';
  st.style.display = pk.strong.length ? 'block' : 'none';

  var base = hrefOf('dg-gxp', '../index.html');
  var wc = el('dg-weak'); wc.innerHTML = '';
  pk.weak.forEach(function (a) {
    var m = MOD[a], isNa = (naU.indexOf(a) >= 0);
    var d = document.createElement('a'); d.className = 'dg-mod'; d.href = base + '#' + m.a;
    d.innerHTML = '<span class="tag">' + (isNa ? 'CHECK' : m.tag) + '</span><span class="info"><b>' + m.name + '</b><span>' +
      (isNa ? '현황 확인 필요 - 상담에서 함께 점검해요' : m.desc) + '</span></span><span class="arw" aria-hidden="true">&rarr;</span>';
    d.onclick = function () { track('module_click', { persona: pn, module: a }); };
    wc.appendChild(d);
  });
  el('dg-weakt').textContent = pk.weak.length > 1 ? '우선 개선 포인트 (' + pk.weak.length + '개 영역)' : '다음 단계 제안';

  if (pn === 'B') {
    el('dg-cth').textContent = 'LIMS·ELN 데모 신청';
    el('dg-ctp').textContent = '우리 랩 환경에 맞춘 성적서 자동화·감사추적 데모를 안내해 드립니다. 진단 결과는 문의 내용에 자동으로 담깁니다.';
    el('dg-cta').textContent = '데모 신청하기 →';
  } else {
    el('dg-cth').textContent = '진단 결과로 도입 상담 받기';
    el('dg-ctp').textContent = '진단 결과가 문의 내용에 자동으로 담깁니다. 담당자가 우리 회사 상황에 맞춰 회신합니다.';
    el('dg-cta').textContent = '상담 신청하기 →';
  }
  el('dg-cta').href = contactHref();

  go('dg-result'); setProg(100);
  track('result_viewed', { persona: pn, level: lv.n });
  requestAnimationFrame(function () { drawRadar(res.axes, res.scores, res.na); });
}

/* ---- T 등급 (문의 폼 숨은 필드로만 보낸다) ---- */
function gradeLead() {
  var pn = state.persona;
  if (pn !== 'A' && pn !== 'B') return { score: null, max: null, grade: 'T4', timing: '' };
  var sc = PERSONA_TSCORE[pn] || 0, max = 3;
  if (pn === 'A') {
    max += 2;
    var pain = state.answers.pain || [];
    if (pain.filter(function (i) { return PAIN_EXCL.indexOf(i) < 0; }).length) sc += 2;
  }
  max += 5;
  var t = state.answers.timing;
  if (t != null) sc += TIMING_SCORE[t];
  var g;
  if (sc < 0) g = 'T4';
  else if (sc >= max * T_RATIO[2] && t === 0) g = 'T1';
  else if (sc >= max * T_RATIO[1]) g = 'T2';
  else if (sc >= max * T_RATIO[0]) g = 'T3';
  else g = 'T4';
  return { score: sc, max: max, grade: g, timing: (t != null ? TIMING_OPTS[t] : '') };
}

function ansLabels(qid) {
  var q = null; QA.forEach(function (x) { if (x.id === qid) q = x; });
  var a = state.answers[qid];
  if (!q || !a || !a.length) return '';
  return a.map(function (i) { return q.opts[i]; }).join(', ');
}

/* 문의 폼으로 넘길 값. 배포 홈페이지 문의 API 가 받는 칸(분야·제목·내용)만, 방문자가 보고 고칠 수 있게 URL 에 싣는다. */
function contactPayload() {
  var r = state.result || {}, pn = state.persona;
  var names = function (l) { return (l || []).map(function (a) { return AREA[a]; }).join(', '); };
  var lines = ['[GxP 디지털 성숙도 진단 결과]',
    '- 유형: ' + (pn === 'B' ? '시험·분석 랩 / 연구소' : '기업 실무자·책임자'),
    '- 단계: Lv' + r.level + ' ' + r.label + (r.max ? ' (성숙도 ' + Math.round(r.score / r.max * 100) + '%)' : '')];
  if (r.strong && r.strong.length) lines.push('- 이미 잘 갖춘 영역: ' + names(r.strong));
  var weakScored = (r.weak || []).filter(function (a) { return (r.naU || []).indexOf(a) < 0; });
  if (weakScored.length) lines.push('- 우선 개선 포인트: ' + names(weakScored));
  if (r.naU && r.naU.length) lines.push('- 현황 확인이 필요한 영역: ' + names(r.naU));
  if (r.naN && r.naN.length) lines.push('- 해당 업무 없음: ' + names(r.naN));
  if (ansLabels('have')) lines.push('- 보유 시스템: ' + ansLabels('have'));
  if (ansLabels('pain')) lines.push('- 활용이 어려운 이유: ' + ansLabels('pain'));
  var t = state.answers.timing;
  if (t != null) lines.push('- 도입 검토: ' + TIMING_OPTS[t]);
  var sz = state.answers.size;
  if (sz != null) lines.push('- 회사 규모: ' + QA[0].opts[sz]);
  lines.push('', '(추가로 궁금하신 점을 적어 주세요)');
  return {
    sol: 'gxp',
    title: (pn === 'B' ? 'LIMS·ELN 데모 신청 (진단 Lv' : '진단 결과 도입 상담 (Lv') + r.level + ' ' + r.label + ')',
    content: lines.join('\n')
  };
}
function contactHref() {
  var p = contactPayload();
  var qs = ['from=diagnostic'];
  ['sol', 'title', 'content'].forEach(function (k) { if (p[k]) qs.push(k + '=' + encodeURIComponent(p[k])); });
  return hrefOf('dg-contact', '#') + '?' + qs.join('&');
}

/* ---- 레이더 (캔버스). 색은 사이트 토큰에서 읽어 테마를 따른다 ---- */
function cssVar(n, fb) {
  try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; } catch (e) { return fb; }
}
function drawRadar(axes, scores, na) {
  na = na || [];
  var C_OUT = cssVar('--rule-hi', '#332B24'), C_IN = cssVar('--rule', '#221D19'),
      C_LAB = cssVar('--fg-mid', '#ADA49B'), C_NA = cssVar('--fg-dim', '#776E66'),
      C_BG = cssVar('--panel', '#0C0A09'), C_AC = cssVar('--accent', '#FF9A2E');
  var cv = el('dg-radar'); if (!cv || !cv.getContext) return;
  var dpr = window.devicePixelRatio || 1;
  var W = Math.min(440, (el('dg-result').clientWidth || 360)), H = W * 0.86;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  cv.width = W * dpr; cv.height = H * dpr;
  var x = cv.getContext('2d'); x.scale(dpr, dpr);
  var cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) / 2 - 46, N = axes.length, steps = 4;
  x.clearRect(0, 0, W, H);
  function pt(i, r) { var ang = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]; }
  for (var s = 1; s <= steps; s++) {
    x.beginPath();
    for (var i = 0; i <= N; i++) { var p = pt(i % N, R * s / steps); if (i === 0) x.moveTo(p[0], p[1]); else x.lineTo(p[0], p[1]); }
    x.strokeStyle = s === steps ? C_OUT : C_IN; x.lineWidth = 1; x.stroke();
  }
  /* 축 이름은 전부 라틴 약어라 모노를 쓴다(한글이 섞이면 산세리프로 바꿔야 한다 - 캐논) */
  x.font = '600 11.5px "Cascadia Mono", ui-monospace, Consolas, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (var j = 0; j < N; j++) {
    var e = pt(j, R);
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(e[0], e[1]); x.strokeStyle = C_IN; x.lineWidth = 1; x.stroke();
    var l = pt(j, R + 22);
    x.fillStyle = (na.indexOf(axes[j]) >= 0) ? C_NA : C_LAB;
    x.fillText(axes[j], l[0], l[1]);
  }
  x.beginPath();
  for (var k = 0; k <= N; k++) { var v = scores[axes[k % N]] / steps, q = pt(k % N, R * v); if (k === 0) x.moveTo(q[0], q[1]); else x.lineTo(q[0], q[1]); }
  x.closePath(); x.globalAlpha = 0.22; x.fillStyle = C_AC; x.fill(); x.globalAlpha = 1;
  x.strokeStyle = C_AC; x.lineWidth = 1.5; x.stroke();
  for (var m = 0; m < N; m++) {
    var w = scores[axes[m]] / steps, z = pt(m, R * w);
    x.beginPath(); x.arc(z[0], z[1], 3.2, 0, 2 * Math.PI); x.fillStyle = C_AC; x.fill(); x.strokeStyle = C_BG; x.lineWidth = 2; x.stroke();
  }
}
function redrawRadar() {
  var r = state.result, s = el('dg-result');
  if (s && s.classList.contains('on') && r && r.axes) drawRadar(r.axes, r.scores, r.na);
}

function restart() { state = { persona: null, step: 0, queue: [], answers: {} }; go('dg-start'); setProg(0); }

/* ---- 부팅 ---- */
renderPersona();
(function () {
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(redrawRadar, 120); });
  /* 사이트 테마 토글은 html[data-theme] 만 바꾼다. 그 변화를 보고 레이더만 다시 칠한다 */
  if (window.MutationObserver) new MutationObserver(redrawRadar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
