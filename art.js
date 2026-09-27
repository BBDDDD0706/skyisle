// 하늘섬 키우기 — 그림. 모든 그림은 코드로 직접 그린 창작물.
// 각 그리기 함수는 원점(0,0)을 바닥 가운데로 보고 위쪽(음수 y)으로 그린다.
const Art = (() => {
  const TAU = Math.PI * 2;
  const circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  const shadow = (c, rx) => { c.fillStyle = 'rgba(20,60,30,.25)'; ell(c, 0, 2, rx, rx * 0.28); };

  const FLOWER_COLS = ['#ff8fb1', '#ffd45c', '#ffffff', '#b99cff', '#ff9f68'];
  function flower(c, col, t = 0) {
    const sway = Math.sin(t * 1.6 + col.length) * 1.5;
    c.strokeStyle = '#3f9a4a'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sway, -8, sway, -16); c.stroke();
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circle(c, sway + Math.cos(a) * 4.6, -16 + Math.sin(a) * 4.6, 3.6); }
    c.fillStyle = '#ffcf3a'; circle(c, sway, -16, 2.8);
  }
  function tree(c, t = 0) {
    shadow(c, 30);
    c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(-7, 0); c.lineTo(-5, -38); c.lineTo(5, -38); c.lineTo(7, 0); c.fill();
    const sw = Math.sin(t * 0.9) * 1.5;
    c.fillStyle = '#3f9a4a'; circle(c, -16 + sw, -48, 20); circle(c, 16 + sw, -48, 20);
    c.fillStyle = '#56b85a'; circle(c, sw, -64, 25);
    c.fillStyle = '#6fcf6b'; circle(c, -6 + sw, -70, 12);
    c.fillStyle = '#e8453c';
    [[-18, -44], [14, -40], [4, -60], [-8, -52], [20, -58]].forEach(([x, y]) => circle(c, x + sw, y, 4.2));
    c.fillStyle = 'rgba(255,255,255,.6)';
    [[-19, -45], [13, -41], [3, -61]].forEach(([x, y]) => circle(c, x + sw, y, 1.3));
  }
  function beehive(c, t = 0, bees = 3) {
    shadow(c, 20);
    c.fillStyle = '#8a5a34'; c.fillRect(-2.5, -26, 5, 26);
    const layers = [[-30, 16], [-40, 19], [-50, 17], [-58, 12]];
    layers.forEach(([y, r], i) => { c.fillStyle = i % 2 ? '#f0b32e' : '#ffc94a'; ell(c, 0, y, r, 7); });
    c.fillStyle = '#5a3a1a'; ell(c, 0, -36, 4.5, 4);
    for (let i = 0; i < bees; i++) {
      const a = t * (1.6 + i * 0.3) + i * 2.1, bx = Math.cos(a) * (24 + i * 4), by = -44 + Math.sin(a * 1.3) * 16;
      c.fillStyle = '#ffd23a'; ell(c, bx, by, 3.6, 2.8);
      c.fillStyle = '#2b2b2b'; c.fillRect(bx - 0.8, by - 2.6, 1.6, 5.2);
      c.fillStyle = 'rgba(255,255,255,.8)'; ell(c, bx - 1, by - 3.5, 2.2, 1.4);
    }
  }
  function spring(c, t = 0) {
    c.fillStyle = '#9aa3ad'; ell(c, 0, 0, 38, 14);
    c.fillStyle = '#b7c0c9'; ell(c, 0, -3, 36, 12);
    const g = c.createLinearGradient(0, -12, 0, 6); g.addColorStop(0, '#6fd3ff'); g.addColorStop(1, '#2f8fe0');
    c.fillStyle = g; ell(c, 0, -3, 29, 8.5);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5;
    const r = (t * 12) % 22;
    c.beginPath(); c.ellipse(0, -3, r, r * 0.3, 0, 0, TAU); c.stroke();
    c.fillStyle = '#7a8591'; [[-30, -4], [28, -6], [-10, 8], [16, 7]].forEach(([x, y]) => ell(c, x, y, 6, 4));
  }
  function windmill(c, t = 0, speed = 1) {
    shadow(c, 30);
    c.fillStyle = '#f4ead7'; c.beginPath(); c.moveTo(-24, 0); c.lineTo(-14, -86); c.lineTo(14, -86); c.lineTo(24, 0); c.fill();
    c.fillStyle = '#e1d2b6'; c.beginPath(); c.moveTo(6, 0); c.lineTo(10, -86); c.lineTo(14, -86); c.lineTo(24, 0); c.fill();
    c.fillStyle = '#b8503c'; c.beginPath(); c.moveTo(-19, -84); c.lineTo(0, -108); c.lineTo(19, -84); c.fill();
    c.fillStyle = '#6b4a2e'; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-6, -16); c.arc(0, -16, 6, Math.PI, 0); c.lineTo(6, 0); c.fill();
    c.fillStyle = '#7ec8ff'; circle(c, 0, -52, 5);
    c.save(); c.translate(0, -88); c.rotate(t * speed);
    for (let i = 0; i < 4; i++) {
      c.rotate(TAU / 4);
      c.fillStyle = '#8a5a34'; c.fillRect(-1.6, 0, 3.2, 58);
      c.fillStyle = 'rgba(255,250,240,.95)'; c.fillRect(2, 12, 13, 44);
      c.strokeStyle = 'rgba(138,90,52,.6)'; c.lineWidth = 1; c.strokeRect(2, 12, 13, 44);
    }
    c.restore();
    c.fillStyle = '#5a3a1a'; circle(c, 0, -88, 4.5);
  }
  function greenhouse(c, t = 0) {
    shadow(c, 48);
    c.fillStyle = '#6b4a2e'; c.fillRect(-46, -6, 92, 6);
    c.fillStyle = '#3f9a4a'; [[-26, -16, 12], [0, -22, 15], [26, -15, 11], [-12, -12, 9], [14, -12, 9]].forEach(([x, y, r]) => circle(c, x, y, r));
    c.fillStyle = '#ff8fb1'; circle(c, -24, -26, 3.5); c.fillStyle = '#ffd45c'; circle(c, 4, -36, 3.5); circle(c, 24, -24, 3.5);
    c.fillStyle = 'rgba(190,240,255,.38)'; c.beginPath(); c.moveTo(-46, -6); c.bezierCurveTo(-46, -70, 46, -70, 46, -6); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-46, -6); c.bezierCurveTo(-46, -70, 46, -70, 46, -6); c.stroke();
    c.lineWidth = 1.4;
    [-23, 0, 23].forEach((x) => { c.beginPath(); c.moveTo(x, -6); c.lineTo(x * 0.9, -53 + Math.abs(x) * 0.5); c.stroke(); });
    c.beginPath(); c.moveTo(-42, -30); c.quadraticCurveTo(0, -40, 42, -30); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-20, -42, 5, 12, 0.6, 0, TAU); c.fill();
  }
  function lighthouse(c, t = 0, beam = true) {
    shadow(c, 26);
    c.save();
    c.beginPath(); c.moveTo(-20, 0); c.lineTo(-12, -104); c.lineTo(12, -104); c.lineTo(20, 0); c.closePath(); c.clip();
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#f6f1e8' : '#e0483c'; c.fillRect(-22, -i * 18 - 18, 44, 18); }
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(6, -110, 20, 110);
    c.restore();
    c.fillStyle = '#394a63'; c.fillRect(-17, -110, 34, 7);
    const glow = 0.7 + 0.3 * Math.sin(t * 3);
    c.fillStyle = `rgba(255,230,120,${glow})`; c.fillRect(-11, -128, 22, 18);
    c.strokeStyle = '#394a63'; c.lineWidth = 2; c.strokeRect(-11, -128, 22, 18);
    c.fillStyle = '#e0483c'; c.beginPath(); c.moveTo(-14, -128); c.lineTo(0, -142); c.lineTo(14, -128); c.fill();
    if (beam) {
      const a = t * 1.2, dir = Math.cos(a), len = 170 * Math.abs(dir) + 20;
      const g = c.createLinearGradient(0, -119, dir * len, -119);
      g.addColorStop(0, 'rgba(255,240,160,.55)'); g.addColorStop(1, 'rgba(255,240,160,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -119); c.lineTo(dir * len, -119 - 26); c.lineTo(dir * len, -119 + 26); c.closePath(); c.fill();
    }
  }
  function observatory(c, t = 0) {
    shadow(c, 42);
    c.fillStyle = '#dfe6f2'; c.fillRect(-38, -40, 76, 40);
    c.fillStyle = '#c3cde0'; c.fillRect(14, -40, 24, 40);
    c.fillStyle = '#4a5c86'; c.fillRect(-8, -24, 16, 24);
    c.fillStyle = '#7ec8ff'; [[-28, -30], [22, -30]].forEach(([x, y]) => c.fillRect(x, y, 10, 10));
    c.fillStyle = '#eef2fa'; c.beginPath(); c.arc(0, -40, 36, Math.PI, 0); c.fill();
    c.fillStyle = '#b9c4da'; c.beginPath(); c.arc(0, -40, 36, -Math.PI / 2, 0); c.lineTo(0, -40); c.fill();
    c.save(); c.translate(0, -52); c.rotate(-0.7 + Math.sin(t * 0.3) * 0.15);
    c.fillStyle = '#394a63'; c.fillRect(-4, -46, 8, 38); c.fillStyle = '#2a3548'; c.fillRect(-5.5, -50, 11, 8);
    c.restore();
    c.fillStyle = '#394a63'; c.fillRect(-5, -76, 10, 36);
  }
  function sheep(c, t = 0, i = 0) {
    const b = Math.sin(t * 1.5 + i) * 4;
    c.save(); c.translate(0, b);
    c.fillStyle = 'rgba(255,255,255,.96)';
    [[-16, -14, 12], [0, -20, 14], [16, -14, 12], [-8, -8, 11], [9, -8, 11], [0, -26, 9]].forEach(([x, y, r]) => circle(c, x, y, r));
    c.fillStyle = '#4b4f63'; ell(c, 20, -16, 7, 8);
    c.fillStyle = '#fff'; circle(c, 22, -18, 1.8);
    c.fillStyle = '#4b4f63'; [[-10, 0], [-3, 1], [6, 1], [12, 0]].forEach(([x, y]) => c.fillRect(x, y - 4, 3, 6));
    c.fillStyle = 'rgba(255,190,200,.8)'; circle(c, 24, -12, 2);
    c.restore();
  }
  function rainbowIcon(c) {
    const cols = ['#ff6b6b', '#ffb454', '#ffe066', '#6fd88a', '#5cc8ff', '#a88cff'];
    c.lineWidth = 5;
    cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(0, 0, 44 - i * 5, Math.PI, 0); c.stroke(); });
    c.fillStyle = '#fff'; [[-38, -2], [38, -2]].forEach(([x, y]) => { circle(c, x, y, 9); circle(c, x + 8, y + 2, 7); circle(c, x - 8, y + 2, 7); });
  }
  function whale(c, t = 0, flip = 1) {
    c.save(); c.scale(flip, 1);
    const tail = Math.sin(t * 2) * 0.25;
    const g = c.createLinearGradient(0, -60, 0, 0); g.addColorStop(0, '#6d7fe0'); g.addColorStop(1, '#4a58b8');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0, -30, 62, 28, 0, 0, TAU); c.fill();
    c.save(); c.translate(-56, -32); c.rotate(tail);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -20); c.quadraticCurveTo(-24, 0, -30, 20); c.closePath(); c.fill();
    c.restore();
    c.fillStyle = '#dfe6ff'; c.beginPath(); c.ellipse(8, -18, 48, 13, 0, 0, Math.PI); c.fill();
    c.strokeStyle = 'rgba(80,90,170,.4)'; c.lineWidth = 1.5;
    for (let i = -2; i <= 3; i++) { c.beginPath(); c.moveTo(8 + i * 12, -14); c.lineTo(6 + i * 12, -6); c.stroke(); }
    c.fillStyle = '#4a58b8'; c.beginPath(); c.ellipse(4, -16, 16, 6, 0.5 + tail, 0, TAU); c.fill();
    c.fillStyle = '#1e2350'; circle(c, 38, -34, 4); c.fillStyle = '#fff'; circle(c, 39, -35.5, 1.4);
    c.fillStyle = 'rgba(255,170,200,.6)'; circle(c, 42, -25, 4);
    c.restore();
  }
  function starwell(c, t = 0) {
    const p = 1 + Math.sin(t * 2) * 0.08;
    const g = c.createRadialGradient(0, -34, 2, 0, -34, 60 * p);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.3, 'rgba(255,220,110,.85)'); g.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = g; circle(c, 0, -34, 60 * p);
    c.fillStyle = '#fffbe6'; star(c, 0, -34, 18 * p, 8 * p);
    for (let i = 0; i < 5; i++) {
      const a = t * 0.8 + (i / 5) * TAU;
      c.fillStyle = 'rgba(255,240,170,.95)'; star(c, Math.cos(a) * 42, -34 + Math.sin(a) * 16, 5, 2.2);
    }
  }
  function star(c, x, y, R, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }

  // 상점 아이콘: 72x72 캔버스에 각 건물을 그린다
  function icon(c, i) {
    const size = c.canvas.width;
    c.clearRect(0, 0, size, size);
    c.save(); c.scale(size / 72, size / 72);
    const at = (x, y, s) => { c.translate(x, y); c.scale(s, s); };
    switch (i) {
      case 0: c.save(); at(36, 60, 1.9); flower(c, '#ff8fb1'); c.restore(); c.save(); at(20, 64, 1.4); flower(c, '#ffd45c'); c.restore(); c.save(); at(54, 64, 1.4); flower(c, '#b99cff'); c.restore(); break;
      case 1: at(36, 66, 0.72); tree(c); break;
      case 2: at(36, 66, 0.95); beehive(c, 1, 2); break;
      case 3: at(36, 48, 0.95); spring(c); break;
      case 4: at(36, 68, 0.52); windmill(c, 0.4); break;
      case 5: at(36, 58, 0.72); greenhouse(c); break;
      case 6: at(36, 68, 0.44); lighthouse(c, 0, false); break;
      case 7: at(36, 66, 0.66); observatory(c); break;
      case 8: at(33, 56, 1.1); sheep(c, 0); break;
      case 9: at(36, 56, 0.72); rainbowIcon(c); break;
      case 10: at(36, 56, 0.48); whale(c, 0); break;
      case 11: at(36, 70, 0.8); starwell(c, 0); break;
    }
    c.restore();
  }
  return { flower, tree, beehive, spring, windmill, greenhouse, lighthouse, observatory, sheep, whale, starwell, star, icon, FLOWER_COLS, circle, ell };
})();
