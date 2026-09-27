// 하늘섬 키우기 — 구름 위의 작은 섬을 키우는 방치형 게임
const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- 숫자 표시 (만·억·조…) ----------
const UNITS = [[1e48, '극'], [1e44, '재'], [1e40, '정'], [1e36, '간'], [1e32, '구'], [1e28, '양'], [1e24, '자'], [1e20, '해'], [1e16, '경'], [1e12, '조'], [1e8, '억'], [1e4, '만']];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1e4) return n < 100 && n % 1 ? n.toFixed(1) : Math.floor(n).toLocaleString('ko-KR');
  for (const [u, name] of UNITS) if (n >= u) {
    const x = n / u;
    return (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x).toLocaleString('ko-KR')) + name;
  }
}
function fmtTime(s) {
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}시간 ${m}분` : m ? `${m}분` : `${s}초`;
}

// ---------- 건물 ----------
const B = [
  ['풀꽃밭', '섬 곳곳에 작은 꽃이 피어나요'],
  ['사과나무', '빨간 사과가 주렁주렁'],
  ['벌집', '꿀벌이 윙윙 꿀을 모아요'],
  ['옹달샘', '맑은 물이 섬 밖으로 흘러내려요'],
  ['풍차', '바람이 불면 빙글빙글'],
  ['유리 온실', '사계절 내내 꽃이 자라요'],
  ['등대', '구름 바다를 비추는 불빛'],
  ['천문대', '밤하늘의 별을 모아요'],
  ['구름 양 목장', '폭신한 구름 양이 둥실둥실'],
  ['무지개 다리', '섬과 하늘을 잇는 다리'],
  ['하늘 고래', '섬 주위를 느긋하게 헤엄쳐요'],
  ['별 우물', '떨어진 별빛이 고이는 우물'],
].map(([name, desc], i) => ({ name, desc, cost: 12 * Math.pow(7.5, i) * (1 + i * 0.1), prod: 0.25 * Math.pow(5.2, i) }));
const GROWTH = 1.15;

// ---------- 강화 ----------
const TIER_AT = [10, 25, 50, 100, 150, 200];
const TIER_COST = [10, 60, 800, 5e4, 3e6, 2e8];
const TIER_NAME = ['반짝이는', '튼튼한', '빛나는', '신비한', '전설의', '별빛'];
const UPS = [];
B.forEach((b, i) => TIER_AT.forEach((at, t) => UPS.push({
  id: `b${i}t${t}`, icon: i, name: `${TIER_NAME[t]} ${b.name}`, desc: `${b.name} 생산 2배`, cost: b.cost * TIER_COST[t],
  req: () => S.owned[i] >= at, reqText: `${b.name} ${at}개`,
})));
[['따뜻한 손길', '누를 때 얻는 빛방울 2배', 100, 0], ['두 손 가득', '누를 때 얻는 빛방울 2배', 1500, 10], ['빛의 손끝', '누를 때 초당 생산의 1%를 더 얻어요', 5e4, 25], ['햇살 손길', '누를 때 초당 생산의 1%를 더 얻어요', 5e6, 60], ['무지개 손길', '누를 때 초당 생산의 1%를 더 얻어요', 5e8, 120], ['별빛 손길', '누를 때 초당 생산의 2%를 더 얻어요', 5e10, 200]]
  .forEach(([name, desc, cost, need], k) => UPS.push({ id: `tap${k}`, icon: '✋', name, desc, cost, req: () => totalOwned() >= need, reqText: `건물 ${need}개` }));
[5e4, 5e6, 5e8, 5e10, 5e12, 5e14].forEach((cost, k) => {
  const need = [20, 60, 120, 200, 300, 400][k];
  UPS.push({ id: `bless${k}`, icon: '✨', name: `섬의 축복 ${'Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ Ⅵ'.split(' ')[k]}`, desc: '모든 생산 1.25배', cost, req: () => totalOwned() >= need, reqText: `건물 ${need}개` });
});
UPS.push({ id: 'bird0', icon: '🐦', name: '새 모이 그릇', desc: '파랑새가 더 자주 찾아와요', cost: 2e4, req: () => S.birds >= 1, reqText: '파랑새 1번 잡기' });
UPS.push({ id: 'bird1', icon: '🪺', name: '포근한 새 둥지', desc: '파랑새 행운이 2배 오래 가요', cost: 2e6, req: () => S.birds >= 5, reqText: '파랑새 5번 잡기' });
UPS.push({ id: 'off0', icon: '🌙', name: '밤을 지키는 등불', desc: '자리를 비운 동안 모이는 양 50% → 100%', cost: 1e6, req: () => S.owned[6] >= 1, reqText: '등대 1개' });
UPS.push({ id: 'off1', icon: '💤', name: '긴 꿈', desc: '자리를 비운 동안 최대 8시간 → 24시간', cost: 1e8, req: () => S.owned[7] >= 1, reqText: '천문대 1개' });
UPS.sort((a, b) => a.cost - b.cost);

// ---------- 상태 ----------
const FRESH = () => ({ v: 1, drops: 0, run: 0, all: 0, taps: 0, birds: 0, owned: B.map(() => 0), ups: [], feathers: 0, rebirths: 0, last: Date.now(), started: Date.now(), buy: 1 });
let S = Object.assign(FRESH(), store.get('si-save', {}));
S.owned = B.map((_, i) => S.owned?.[i] || 0);
let owned = new Set(S.ups);
const has = (id) => owned.has(id);
const totalOwned = () => S.owned.reduce((a, b) => a + b, 0);
let buffs = [];
const D = { pps: 0, basePps: 0, tap: 1 };
function recalc() {
  const now = Date.now();
  buffs = buffs.filter((b) => b.until > now);
  let glob = 1 + 0.05 * S.feathers;
  for (let k = 0; k < 6; k++) if (has(`bless${k}`)) glob *= 1.25;
  let base = 0;
  B.forEach((b, i) => {
    let m = 1;
    for (let t = 0; t < 6; t++) if (has(`b${i}t${t}`)) m *= 2;
    b.each = b.prod * m * glob;
    base += b.each * S.owned[i];
  });
  const prodBuff = buffs.filter((b) => b.kind === 'prod').reduce((a, b) => a * b.mul, 1);
  const tapBuff = buffs.filter((b) => b.kind === 'tap').reduce((a, b) => a * b.mul, 1);
  let tapMul = 1, tapPct = 0;
  if (has('tap0')) tapMul *= 2;
  if (has('tap1')) tapMul *= 2;
  ['tap2', 'tap3', 'tap4'].forEach((id) => has(id) && (tapPct += 0.01));
  if (has('tap5')) tapPct += 0.02;
  D.basePps = base;
  D.pps = base * prodBuff;
  D.tap = (tapMul * (1 + 0.05 * S.feathers) + D.pps * tapPct) * tapBuff;
}
function gain(n) { S.drops += n; S.run += n; S.all += n; }
const costOf = (i, n = 1) => B[i].cost * Math.pow(GROWTH, S.owned[i]) * (Math.pow(GROWTH, n) - 1) / (GROWTH - 1);
function maxAfford(i) {
  const c0 = B[i].cost * Math.pow(GROWTH, S.owned[i]);
  return Math.max(0, Math.floor(Math.log((S.drops * (GROWTH - 1)) / c0 + 1) / Math.log(GROWTH)));
}
function buyCount(i) { return S.buy === 'max' ? Math.max(1, maxAfford(i)) : S.buy; }
function buyBuilding(i) {
  const n = buyCount(i), c = costOf(i, n);
  if (c > S.drops) { Snd.play('no'); return; }
  S.drops -= c; S.owned[i] += n;
  Snd.play('buy'); recalc(); pop(i); refreshShop(true); save();
}
function buyUp(u) {
  if (has(u.id) || u.cost > S.drops || !u.req()) { Snd.play('no'); return; }
  S.drops -= u.cost; owned.add(u.id); S.ups = [...owned];
  Snd.play('upgrade'); recalc(); refreshShop(true); save();
  toast(`${u.name} — ${u.desc}`);
}

// ---------- 저장 / 자리 비움 ----------
function save() { S.last = Date.now(); store.set('si-save', S); }
function offlineGain() {
  const away = (Date.now() - (S.last || Date.now())) / 1000;
  if (away < 60 || D.basePps <= 0) return;
  const cap = has('off1') ? 24 * 3600 : 8 * 3600, rate = has('off0') ? 1 : 0.5;
  const t = Math.min(away, cap), amt = D.basePps * t * rate;
  gain(amt);
  modal('다녀오셨어요?', `자리를 비운 <b>${fmtTime(away)}</b> 동안 섬이 부지런히 일했어요.<br><span class="big-num">✦ ${fmt(amt)}</span>${away > cap ? `<br><small>최대 ${cap / 3600}시간까지만 모여요</small>` : ''}`, [['받기', () => Snd.play('collect')]]);
}

// ---------- 새로 띄우기 (깃털) ----------
const featherGain = () => Math.floor(Math.sqrt(S.run / 1e9));
function rebirth() {
  const f = featherGain();
  if (f < 1) return;
  modal('섬을 더 높이 띄울까요?', `지금까지 모은 건물과 강화, 빛방울이 모두 사라지고 처음부터 다시 시작해요.<br>대신 <b>깃털 ${f}개</b>를 얻어요. 깃털 하나마다 <b>모든 생산과 누르기 +5%</b>가 영원히 붙어요.`, [
    ['다시 띄우기', () => {
      const keep = { feathers: S.feathers + f, rebirths: S.rebirths + 1, all: S.all, taps: S.taps, birds: S.birds, started: S.started, buy: S.buy };
      S = Object.assign(FRESH(), keep); owned = new Set(); buffs = [];
      recalc(); refreshShop(true); save(); Snd.play('rebirth'); flashSky = 1;
      toast(`깃털 ${f}개를 얻었어요! 섬이 더 높이 떠올라요`);
    }],
    ['아직이요', null, 'sub'],
  ]);
}

// ---------- 화면: 섬 ----------
const cv = $('#cv'), g = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1, K = 1, CX = 0, CY = 0;
function fit() {
  const r = $('#world').getBoundingClientRect();
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = r.width; VH = r.height;
  cv.width = VW * DPR; cv.height = VH * DPR;
  cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  K = Math.min(VW / 740, VH / 660);
  CX = VW / 2; CY = VH * 0.56 + 10 * K;
}
window.addEventListener('resize', () => { fit(); });

const FLOWER_SPOTS = [[-200, 38], [-150, 52], [-50, -18], [30, -12], [140, 50], [175, 10], [-100, -20], [235, -25], [-265, 30], [45, 58], [-55, 55], [120, -10], [-225, 55], [95, 45], [-30, 12], [270, 25], [15, 35], [-120, 60], [200, -8], [-180, -30]];
const TREE_SPOTS = [[-255, -5], [-140, -45], [95, -55], [205, 42], [-10, 42]];
const SHEEP_SPOTS = [[-360, 120], [345, 95], [-250, 235], [270, 215], [-400, -30], [395, -50]];
const clouds = Array.from({ length: 7 }, (_, i) => ({ x: Math.random(), y: rand(0.05, 0.95), s: rand(0.6, 1.4), v: rand(0.004, 0.012), front: i < 2 }));
const skyStars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * 0.8, r: rand(0.6, 1.8), t: rand(0, 6) }));
let parts = [], floats = [], squash = 0, flashSky = 0;
let bird = null, birdTimer = rand(40, 80);

function lerpCol(a, b, k) { return a.map((v, i) => Math.round(v + (b[i] - v) * k)); }
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

function drawCloud(x, y, s, a) {
  g.fillStyle = `rgba(255,255,255,${a})`;
  [[0, 0, 40], [38, 8, 30], [-38, 8, 30], [18, -18, 28], [-16, -14, 26]].forEach(([dx, dy, r]) => Art.circle(g, x + dx * s, y + dy * s, r * s));
}
function drawIsland(t) {
  // 섬 몸통 (흙과 바위)
  const body = g.createLinearGradient(0, 0, 0, 280);
  body.addColorStop(0, '#9b6b43'); body.addColorStop(0.5, '#7a5236'); body.addColorStop(1, '#5a3c28');
  g.fillStyle = body;
  g.beginPath(); g.moveTo(-305, 8);
  [[-280, 70], [-240, 110], [-200, 150], [-150, 175], [-110, 220], [-60, 240], [-20, 285], [15, 250], [60, 232], [110, 200], [160, 170], [210, 130], [255, 90], [290, 50], [305, 8]].forEach(([x, y]) => g.lineTo(x, y));
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.12)';
  g.beginPath(); g.moveTo(40, 30); g.lineTo(305, 8); g.lineTo(255, 90); g.lineTo(160, 170); g.lineTo(60, 232); g.lineTo(15, 250); g.closePath(); g.fill();
  g.fillStyle = '#6b6f78'; [[-180, 90, 16], [-60, 140, 12], [120, 110, 14], [40, 190, 10], [-230, 60, 9], [200, 70, 10]].forEach(([x, y, r]) => Art.ell(g, x, y, r, r * 0.7));
  // 늘어진 덩굴
  g.strokeStyle = '#3f9a4a'; g.lineWidth = 3;
  [[-250, 40, 70], [-120, 50, 90], [80, 50, 60], [230, 40, 80]].forEach(([x, y, l], i) => {
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(t + i) * 8, y + l / 2, x + Math.sin(t * 0.8 + i) * 5, y + l); g.stroke();
    g.fillStyle = '#56b85a'; Art.circle(g, x + Math.sin(t * 0.8 + i) * 5, y + l, 4);
  });
  // 윗면 잔디
  g.fillStyle = '#3f8f45'; Art.ell(g, 0, 14, 306, 74);
  const top = g.createRadialGradient(-60, -30, 20, 0, 0, 320);
  top.addColorStop(0, '#8fe07e'); top.addColorStop(1, '#4fb05a');
  g.fillStyle = top; Art.ell(g, 0, 0, 300, 68);
}
function drawWaterfall(t) {
  const x = -292, y = 20;
  const wg = g.createLinearGradient(0, y, 0, y + 330);
  wg.addColorStop(0, 'rgba(120,210,255,.9)'); wg.addColorStop(1, 'rgba(120,210,255,0)');
  g.fillStyle = wg; g.fillRect(x - 12, y, 24, 330);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const yy = y + ((t * 90 + i * 70) % 300); g.beginPath(); g.moveTo(x - 6 + i * 4, yy); g.lineTo(x - 6 + i * 4, yy + 22); g.stroke(); }
  g.strokeStyle = 'rgba(120,210,255,.9)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(-110, 28); g.quadraticCurveTo(-200, 40, x, y + 4); g.stroke();
}
function drawRainbow() {
  const cols = ['#ff6b6b', '#ffb454', '#ffe066', '#6fd88a', '#5cc8ff', '#a88cff'];
  g.globalAlpha = 0.55; g.lineWidth = 16;
  cols.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(0, 120, 470 - i * 15, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); });
  g.globalAlpha = 1;
}
function draw(t) {
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  // 하늘 (5분마다 낮과 밤이 바뀐다)
  const night = Math.max(0, Math.sin((t / 300) * Math.PI * 2 - Math.PI / 2)) ** 1.5;
  const sky = g.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, rgb(lerpCol([110, 190, 255], [14, 18, 52], night)));
  sky.addColorStop(1, rgb(lerpCol([222, 242, 255], [52, 46, 100], night)));
  g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
  if (flashSky > 0) { g.fillStyle = `rgba(255,240,200,${flashSky})`; g.fillRect(0, 0, VW, VH); flashSky = Math.max(0, flashSky - 0.01); }
  if (night > 0.05) for (const s of skyStars) { g.globalAlpha = night * (0.4 + 0.6 * Math.abs(Math.sin(t + s.t))); g.fillStyle = '#fff'; Art.circle(g, s.x * VW, s.y * VH, s.r); }
  g.globalAlpha = 1;
  for (const c of clouds) if (!c.front) drawCloud(c.x * (VW + 300) - 150, c.y * VH, c.s * K * 1.3, 0.75 - night * 0.45);

  const bob = Math.sin(t * 0.8) * 8;
  const sq = 1 - squash * 0.03;
  g.save(); g.translate(CX, CY + bob * K); g.scale(K / sq, K * sq);
  const o = S.owned;
  if (o[9]) drawRainbow();
  if (o[10]) {
    const n = Math.min(3, Math.ceil(Math.log10(o[10] + 1) * 1.5));
    for (let k = 0; k < n; k++) {
      const a = t * 0.07 + k * 2.1, x = Math.cos(a) * 470, y = -250 + Math.sin(a * 2) * 30 + k * 30;
      g.save(); g.translate(x, y); g.scale(0.85 - k * 0.15, 0.85 - k * 0.15); Art.whale(g, t + k, -Math.sin(a) >= 0 ? 1 : -1); g.restore();
    }
  }
  if (o[3]) drawWaterfall(t);
  drawIsland(t);
  // 섬 위의 것들을 뒤에서 앞으로
  const items = [];
  const nf = Math.min(FLOWER_SPOTS.length, o[0]);
  for (let k = 0; k < nf; k++) items.push([FLOWER_SPOTS[k][1], FLOWER_SPOTS[k][0], () => Art.flower(g, Art.FLOWER_COLS[k % 5], t + k)]);
  const nt = Math.min(TREE_SPOTS.length, o[1]);
  for (let k = 0; k < nt; k++) items.push([TREE_SPOTS[k][1], TREE_SPOTS[k][0], () => Art.tree(g, t + k)]);
  if (o[2]) items.push([22, 62, () => Art.beehive(g, t, Math.min(6, 1 + Math.floor(Math.log2(o[2] + 1))))]);
  if (o[3]) items.push([28, -75, () => Art.spring(g, t)]);
  if (o[4]) items.push([-42, 165, () => Art.windmill(g, t, 0.6 + Math.log10(o[4] + 1))]);
  if (o[5]) items.push([30, -185, () => Art.greenhouse(g, t)]);
  if (o[6]) items.push([-2, 262, () => Art.lighthouse(g, t)]);
  if (o[7]) items.push([-50, -30, () => Art.observatory(g, t)]);
  items.sort((a, b) => a[0] - b[0]).forEach(([y, x, fn]) => { g.save(); g.translate(x, y); fn(); g.restore(); });
  const ns = o[8] ? Math.min(SHEEP_SPOTS.length, 1 + Math.floor(Math.log2(o[8]))) : 0;
  for (let k = 0; k < ns; k++) { g.save(); g.translate(SHEEP_SPOTS[k][0], SHEEP_SPOTS[k][1]); if (SHEEP_SPOTS[k][0] > 0) g.scale(-1, 1); Art.sheep(g, t, k); g.restore(); }
  if (o[11]) { g.save(); g.translate(0, -200 + Math.sin(t * 1.2) * 10); Art.starwell(g, t); g.restore(); }
  g.restore();

  for (const c of clouds) if (c.front) drawCloud(c.x * (VW + 300) - 150, c.y * VH * 0.3 + VH * 0.72, c.s * K * 1.1, 0.55 - night * 0.3);

  // 파랑새
  if (bird) {
    const flap = Math.sin(t * 16);
    g.save(); g.translate(bird.x, bird.y); g.scale(bird.dir * K * 1.3, K * 1.3);
    const glow = g.createRadialGradient(0, 0, 4, 0, 0, 50); glow.addColorStop(0, 'rgba(255,240,160,.7)'); glow.addColorStop(1, 'rgba(255,240,160,0)');
    g.fillStyle = glow; Art.circle(g, 0, 0, 50);
    g.fillStyle = '#3d8cff'; Art.ell(g, 0, 0, 22, 15);
    g.fillStyle = '#9fd0ff'; Art.ell(g, 4, 5, 13, 8);
    g.fillStyle = '#3d8cff'; Art.circle(g, 17, -8, 11);
    g.fillStyle = '#ffb02e'; g.beginPath(); g.moveTo(26, -9); g.lineTo(36, -6); g.lineTo(26, -3); g.fill();
    g.fillStyle = '#10204a'; Art.circle(g, 20, -10, 2.6);
    g.fillStyle = '#2a6fe0'; g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(-4, -30 * flap, 10, -26 * flap); g.quadraticCurveTo(8, -6, -6, -4); g.fill();
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-36, -8); g.lineTo(-34, 6); g.fill();
    g.restore();
  }
  // 입자와 숫자
  for (const p of parts) { g.globalAlpha = 1 - p.t / p.life; g.fillStyle = p.c; Art.star(g, p.x, p.y, p.r, p.r * 0.45); }
  g.globalAlpha = 1;
  g.textAlign = 'center';
  for (const f of floats) {
    const k = f.t / f.life;
    g.globalAlpha = 1 - k * k;
    g.font = `900 ${f.size}px Pretendard, "Malgun Gothic", sans-serif`;
    g.lineWidth = 5; g.strokeStyle = 'rgba(30,40,90,.55)'; g.strokeText(f.text, f.x, f.y - k * 60);
    g.fillStyle = f.c; g.fillText(f.text, f.x, f.y - k * 60);
  }
  g.globalAlpha = 1;
}
function burst(x, y, c, n) { for (let i = 0; i < n; i++) { const a = rand(-Math.PI, 0), v = rand(80, 240); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(0.5, 0.9), c, r: rand(4, 8) }); } }
function pop(i) { burst(CX + rand(-120, 120) * K, CY - 40 * K, '#fff6b0', 14); floats.push({ x: CX, y: CY - 120 * K, text: `${B[i].name}!`, t: 0, life: 1.2, size: 34, c: '#ffffff' }); }

cv.addEventListener('pointerdown', (e) => {
  Snd.unlock(); Snd.music(Snd.musicOn);
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (bird && Math.hypot(x - bird.x, y - bird.y) < 60 * K + 20) return catchBird();
  const v = D.tap;
  gain(v); S.taps++;
  squash = 1;
  floats.push({ x: x + rand(-10, 10), y, text: '+' + fmt(v), t: 0, life: 0.9, size: 30, c: '#fff6b0' });
  burst(x, y, '#fff6b0', 4);
  Snd.play('tap');
  refreshTop();
});

// ---------- 파랑새 ----------
function spawnBird() {
  const dir = Math.random() < 0.5 ? 1 : -1;
  bird = { dir, x: dir > 0 ? -60 : VW + 60, y: rand(0.15, 0.4) * VH, t: 0, base: 0 };
  bird.base = bird.y;
  Snd.play('bird');
  if (S.birds === 0) hintOverride = '파랑새가 왔어요! 날아가기 전에 눌러 보세요';
}
function catchBird() {
  const b = bird; bird = null; S.birds++;
  hintOverride = null;
  const long = has('bird1') ? 2 : 1, r = Math.random();
  let msg;
  if (r < 0.5) { buffs.push({ kind: 'prod', mul: 5, until: Date.now() + 30000 * long, name: '행운의 바람: 생산 5배' }); msg = `행운의 바람! ${30 * long}초 동안 생산 5배`; }
  else if (r < 0.85) { const amt = Math.max(D.pps * 600, D.tap * 60, 50); const got = Math.min(amt, Math.max(S.drops * 0.2, D.pps * 60, 50)); gain(got); msg = `선물 꾸러미! 빛방울 +${fmt(got)}`; }
  else { buffs.push({ kind: 'tap', mul: 20, until: Date.now() + 15000 * long, name: '반짝 손길: 누르기 20배' }); msg = `반짝 손길! ${15 * long}초 동안 누르기 20배`; }
  recalc(); Snd.play('bonus'); burst(b.x, b.y, '#9fd0ff', 24);
  floats.push({ x: Math.min(VW - 160, Math.max(160, b.x)), y: b.y, text: msg, t: 0, life: 2.2, size: 30, c: '#ffffff' });
  toast(msg);
}

// ---------- 화면: 상단/상점 ----------
let hintOverride = null;
function refreshTop() {
  $('#amt').textContent = fmt(S.drops);
  $('#pps').textContent = fmt(D.pps);
  $('#tapv').textContent = fmt(D.tap);
  const bf = $('#buff');
  const now = Date.now();
  bf.innerHTML = buffs.filter((b) => b.until > now).map((b) => `<span>${b.name} · ${Math.ceil((b.until - now) / 1000)}초</span>`).join('');
  const side = window.innerWidth > window.innerHeight ? '오른쪽' : '아래';
  const hint = hintOverride || (S.taps < 8 && !S.owned[0] ? '섬을 톡톡 눌러 빛방울을 모으세요' : !S.owned[0] ? `빛방울이 모이면 ${side}에서 ‘풀꽃밭’을 사 보세요` : totalOwned() < 4 && !S.rebirths ? '건물은 가만히 있어도 빛방울을 만들어요. 창을 닫아도 조금씩 모여요' : '');
  $('#hint').textContent = hint; $('#hint').hidden = !hint;
}
let shopKey = '';
let tab = 'b';
function visibleBuildings() {
  const out = [];
  for (let i = 0; i < B.length; i++) {
    if (S.owned[i] > 0 || i === 0 || S.owned[i - 1] > 0) out.push(i);
    else break;
  }
  return out;
}
function refreshShop(force) {
  const vis = visibleBuildings();
  const avail = UPS.filter((u) => !has(u.id) && u.req());
  const key = tab + vis.length + '|' + avail.map((u) => u.id).join(',') + '|' + S.buy + '|' + S.feathers + '|' + S.rebirths;
  if (force || key !== shopKey) { shopKey = key; buildShop(vis, avail); }
  // 매번 바뀌는 숫자만 고친다
  document.querySelectorAll('.b-row').forEach((row) => {
    const i = +row.dataset.i, n = buyCount(i), c = costOf(i, n);
    row.querySelector('.b-own').textContent = S.owned[i];
    row.querySelector('.b-each').textContent = `하나당 초당 ${fmt(B[i].each)}`;
    row.querySelector('.b-cost').textContent = `✦ ${fmt(c)}`;
    row.querySelector('.b-n').textContent = n > 1 ? `${n}개 사기` : '사기';
    row.classList.toggle('no', c > S.drops);
  });
  document.querySelectorAll('.u-card').forEach((el) => el.classList.toggle('no', +el.dataset.cost > S.drops));
  const cnt = avail.filter((u) => u.cost <= S.drops).length;
  $('#upBadge').textContent = cnt || ''; $('#upBadge').hidden = !cnt;
  if (tab === 'f') { $('#fGain').textContent = featherGain(); $('#fRun').textContent = fmt(S.run); $('#fNeed').textContent = fmt(Math.pow(featherGain() + 1, 2) * 1e9); $('#rebirthBtn').disabled = featherGain() < 1; }
}
function buildShop(vis, avail) {
  $('#buyMode').hidden = tab !== 'b';
  document.querySelectorAll('#buyMode button').forEach((b) => b.classList.toggle('on', String(S.buy) === b.dataset.n));
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  const list = $('#list');
  list.replaceChildren();
  if (tab === 'b') {
    vis.forEach((i) => {
      const row = document.createElement('button');
      row.className = 'b-row'; row.dataset.i = i;
      row.innerHTML = `<canvas width="144" height="144"></canvas><div class="b-info"><b class="b-name"></b><span class="b-desc"></span><span class="b-each"></span></div><div class="b-buy"><span class="b-own"></span><em class="b-n"></em><strong class="b-cost"></strong></div>`;
      row.querySelector('.b-name').textContent = B[i].name;
      row.querySelector('.b-desc').textContent = B[i].desc;
      Art.icon(row.querySelector('canvas').getContext('2d'), i);
      row.onclick = () => buyBuilding(i);
      list.append(row);
    });
    const next = vis.length;
    if (next < B.length) {
      const lock = document.createElement('div');
      lock.className = 'b-lock';
      lock.textContent = `다음 건물은 ‘${B[next - 1].name}’을(를) 하나 사면 열려요`;
      list.append(lock);
    }
  } else if (tab === 'u') {
    if (!avail.length) {
      const next = UPS.find((u) => !has(u.id) && !u.req());
      list.innerHTML = `<div class="empty">지금 살 수 있는 강화가 없어요.${next ? `<br><small>다음 강화: ${next.name} (${next.reqText} 필요)</small>` : ''}</div>`;
    }
    avail.forEach((u) => {
      const el = document.createElement('button');
      el.className = 'u-card'; el.dataset.cost = u.cost;
      el.innerHTML = `<div class="u-icon"></div><div class="u-info"><b></b><span></span></div><strong>✦ ${fmt(u.cost)}</strong>`;
      if (typeof u.icon === 'number') { const c = document.createElement('canvas'); c.width = c.height = 112; Art.icon(c.getContext('2d'), u.icon); el.querySelector('.u-icon').append(c); }
      else el.querySelector('.u-icon').textContent = u.icon;
      el.querySelector('b').textContent = u.name; el.querySelector('span').textContent = u.desc;
      el.onclick = () => buyUp(u);
      list.append(el);
    });
  } else {
    const played = (Date.now() - S.started) / 1000;
    list.innerHTML = `
      <div class="f-box">
        <div class="f-have">🪶 깃털 <b>${S.feathers}</b>개 <small>모든 생산·누르기 +${S.feathers * 5}%</small></div>
        <p>섬을 다시 띄우면 처음부터 시작하지만, 이번 판에 모은 빛방울만큼 <b>깃털</b>을 얻어요. 깃털은 사라지지 않고 하나마다 생산이 5%씩 늘어요.</p>
        <div class="f-now">이번 판에 모은 빛방울 <b id="fRun"></b><br>지금 띄우면 얻는 깃털 <b class="gold" id="fGain"></b>개<br><small>깃털 하나 더 받으려면 이번 판 합계 ✦ <span id="fNeed"></span></small></div>
        <button type="button" class="btn-main" id="rebirthBtn">섬을 더 높이 띄우기</button>
      </div>
      <div class="f-stats">
        <div><span>섬을 띄운 횟수</span><b>${S.rebirths}번</b></div>
        <div><span>지금까지 모은 빛방울</span><b>✦ ${fmt(S.all)}</b></div>
        <div><span>섬을 누른 횟수</span><b>${S.taps.toLocaleString('ko-KR')}번</b></div>
        <div><span>잡은 파랑새</span><b>${S.birds}마리</b></div>
        <div><span>처음 시작한 지</span><b>${fmtTime(played)}</b></div>
      </div>
      <button type="button" class="btn-danger" id="wipeBtn">모든 기록 지우기</button>`;
    $('#rebirthBtn').onclick = rebirth;
    $('#wipeBtn').onclick = () => modal('정말 지울까요?', '깃털까지 모든 기록이 사라지고 되돌릴 수 없어요.', [['지우기', () => { S = FRESH(); owned = new Set(); buffs = []; recalc(); save(); refreshShop(true); }, 'danger'], ['취소', null, 'sub']]);
  }
}
document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; Snd.play('click'); refreshShop(true); $('#list').scrollTop = 0; }));
document.querySelectorAll('#buyMode button').forEach((b) => (b.onclick = () => { S.buy = b.dataset.n === 'max' ? 'max' : +b.dataset.n; Snd.play('click'); refreshShop(true); }));

// ---------- 창 ----------
function modal(title, html, btns) {
  $('#mTitle').textContent = title; $('#mText').innerHTML = html;
  $('#mBtns').replaceChildren(...btns.map(([label, fn, cls]) => {
    const b = document.createElement('button'); b.className = cls === 'sub' ? 'btn-sub' : cls === 'danger' ? 'btn-danger' : 'btn-main'; b.textContent = label;
    b.onclick = () => { $('#modal').hidden = true; fn && fn(); refreshTop(); }; return b;
  }));
  $('#modal').hidden = false;
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }
function syncSnd() { $('#musicBtn').classList.toggle('off', !Snd.musicOn); $('#sfxBtn').classList.toggle('off', !Snd.sfxOn); }
$('#musicBtn').onclick = () => { Snd.unlock(); Snd.toggleMusic(); Snd.music(true); syncSnd(); };
$('#sfxBtn').onclick = () => { Snd.unlock(); Snd.toggleSfx(); syncSnd(); };
syncSnd();

// ---------- 반복 ----------
let lastEco = Date.now(), lastFrame = performance.now(), saveT = 0, uiT = 0;
function economy() {
  const now = Date.now(), dt = Math.min(8 * 3600, (now - lastEco) / 1000); lastEco = now;
  recalc();
  gain(D.pps * dt);
  if (!bird) { birdTimer -= dt; if (birdTimer <= 0 && !document.hidden) { spawnBird(); birdTimer = rand(70, 150) * (has('bird0') ? 0.65 : 1); } }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
  uiT += dt; if (uiT > 1) { uiT = 0; document.title = `✦ ${fmt(S.drops)} · 하늘섬 키우기`; }
  refreshTop(); refreshShop(false);
}
setInterval(economy, 150);
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  const t = now / 1000;
  squash = Math.max(0, squash - dt * 6);
  for (const c of clouds) { c.x += c.v * dt * 0.5; if (c.x > 1.2) { c.x = -0.2; c.y = rand(0.05, 0.95); } }
  parts.forEach((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }); parts = parts.filter((p) => p.t < p.life);
  floats.forEach((f) => (f.t += dt)); floats = floats.filter((f) => f.t < f.life);
  if (bird) {
    bird.t += dt; bird.x += bird.dir * VW * 0.09 * dt; bird.y = bird.base + Math.sin(bird.t * 2) * 30 * K;
    if (bird.x < -120 || bird.x > VW + 120) { bird = null; if (hintOverride) hintOverride = null; }
  }
  draw(t);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

// ---------- 시작 ----------
fit();
recalc();
offlineGain();
refreshShop(true); refreshTop();
requestAnimationFrame(frame);
