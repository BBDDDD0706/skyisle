// 하늘섬 키우기 — 소리. 외부 음원 없이 Web Audio로 직접 합성한 효과음과 자작 배경음악.
const Snd = (() => {
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch {} };
  let ctx = null, master, musicG, sfxG, verb;
  let musicOn = read('si-music', true), sfxOn = read('si-sfx', true);
  let timer = null, step = 0, nextT = 0, playing = false;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    verb = ctx.createDelay(); verb.delayTime.value = 0.21;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.3;
    verb.connect(fb).connect(verb); verb.connect(wet).connect(master);
    musicG = ctx.createGain(); musicG.gain.value = musicOn ? 0.22 : 0; musicG.connect(master); musicG.connect(verb);
    sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 0.7 : 0; sfxG.connect(master); sfxG.connect(verb);
  }
  function tone(type, f, t, dur, vol, out = sfxG, to) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
  const hz = (semi) => 523.25 * Math.pow(2, semi / 12);
  let lastTap = 0;
  const S = {
    tap: (t) => { const n = PENTA[Math.floor(Math.random() * PENTA.length)]; tone('sine', hz(n), t, 0.22, 0.12); tone('triangle', hz(n + 12), t, 0.08, 0.03); },
    buy: (t) => [0, 7].forEach((x, i) => tone('triangle', hz(x), t + i * 0.06, 0.28, 0.14)),
    upgrade: (t) => [0, 4, 7, 12].forEach((x, i) => tone('sine', hz(x + 5), t + i * 0.06, 0.4, 0.13)),
    bird: (t) => { [0, 0.12].forEach((d) => tone('sine', 2400, t + d, 0.09, 0.07, sfxG, 3400)); },
    bonus: (t) => [0, 4, 7, 12, 16, 19].forEach((x, i) => tone('sine', hz(x), t + i * 0.05, 0.5, 0.13)),
    collect: (t) => [7, 12, 16].forEach((x, i) => tone('triangle', hz(x), t + i * 0.08, 0.5, 0.14)),
    rebirth: (t) => [0, 7, 12, 16, 19, 24].forEach((x, i) => tone('sine', hz(x - 12), t + i * 0.13, 1.2, 0.14)),
    click: (t) => tone('sine', 1100, t, 0.05, 0.08),
    no: (t) => tone('sine', 240, t, 0.12, 0.08, sfxG, 180),
  };
  function play(name) {
    if (!sfxOn) return;
    if (name === 'tap') { const now = performance.now(); if (now - lastTap < 45) return; lastTap = now; }
    try { ensure(); S[name]?.(ctx.currentTime + 0.001); } catch {}
  }

  // 배경음악: 느긋한 오후의 하늘 (직접 작곡)
  const SONG = {
    bpm: 84,
    mel: [72, 0, 76, 79, 0, 76, 74, 0, 71, 0, 74, 76, 0, 72, 69, 0, 72, 0, 76, 81, 0, 79, 76, 0, 74, 0, 76, 74, 72, 0, 0, 0],
    pads: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]],
  };
  const mhz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function sched() {
    const sd = 60 / SONG.bpm / 2;
    while (nextT < ctx.currentTime + 0.3) {
      const i = step % SONG.mel.length, t = nextT;
      if (SONG.mel[i]) tone('sine', mhz(SONG.mel[i]), t, sd * 1.8, 0.06, musicG);
      if (i % 8 === 0) SONG.pads[Math.floor(i / 8) % SONG.pads.length].forEach((n) => tone('triangle', mhz(n), t, sd * 8.5, 0.035, musicG));
      if (i % 4 === 0) tone('sine', mhz(SONG.pads[Math.floor(i / 8) % 4][0] - 12), t, sd * 3, 0.06, musicG);
      nextT += sd; step++;
    }
  }
  function music(on) {
    if (on === playing) return; playing = on;
    try { ensure(); } catch { return; }
    clearInterval(timer);
    if (on) { step = 0; nextT = ctx.currentTime + 0.1; timer = setInterval(sched, 80); }
  }
  return {
    play, music, unlock() { try { ensure(); } catch {} },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    toggleMusic() { musicOn = !musicOn; write('si-music', musicOn); if (musicG) musicG.gain.value = musicOn ? 0.22 : 0; },
    toggleSfx() { sfxOn = !sfxOn; write('si-sfx', sfxOn); if (sfxG) sfxG.gain.value = sfxOn ? 0.7 : 0; },
  };
})();
