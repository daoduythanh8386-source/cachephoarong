/* =====================================================================
   CẢNH ĐỘNG "CÁ CHÉP HÓA RỒNG" — hiện khi qua mỗi chặng
   Ảnh gốc giữ nguyên (assets/ca-chep-hoa-rong.jpg). Hiệu ứng chỉ phủ lên trên:
   1. Khung hình đi từ cá chép đang nhảy lên tới đầu rồng
   2. Ánh sáng vàng lóe lên, tia sáng xoay, quầng sáng quanh rồng
   3. Pháo hoa bắn lên và nổ liên tục, kèm âm thanh
   4. Chữ "HÓA RỒNG!" và nút "Bơi tiếp"
   Dùng: HoaRong.play({ title, sub, big }) → Promise (khi người chơi bấm tiếp)
   ===================================================================== */
(function () {
  'use strict';
  const IMG = 'assets/ca-chep-hoa-rong.jpg';
  const css = `
  #hr{position:fixed;inset:0;z-index:50;background:#000;overflow:hidden;display:none;touch-action:manipulation}
  #hr.on{display:block;animation:hrIn .35s ease}
  @keyframes hrIn{from{opacity:0}to{opacity:1}}
  #hr .stage{position:absolute;left:50%;top:50%;height:100%;aspect-ratio:941/1672;max-width:none;transform:translate(-50%,-50%)}
  @media (min-aspect-ratio:941/1672){#hr .stage{width:100%;height:auto}}
  #hr .pic{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 50%;will-change:transform}
  #hr.run .pic{animation:hrPan var(--d,2.8s) cubic-bezier(.55,.05,.25,1) forwards, hrBreath 3.6s ease-in-out var(--d,2.8s) infinite alternate}
  @keyframes hrPan{0%{transform:translateY(-34%) scale(1.75);filter:brightness(.75) saturate(1.1)}55%{filter:brightness(1.05) saturate(1.2)}100%{transform:translateY(0) scale(1.03);filter:brightness(1) saturate(1.15)}}
  @keyframes hrBreath{from{transform:scale(1.03)}to{transform:scale(1.07) translateY(-.6%)}}
  #hr .rays{position:absolute;left:50%;top:22%;width:220vmax;height:220vmax;transform:translate(-50%,-50%);opacity:0;mix-blend-mode:screen;
    background:repeating-conic-gradient(from 0deg,rgba(255,226,140,.0) 0deg 7deg,rgba(255,226,140,.22) 9deg 11deg,rgba(255,226,140,0) 13deg 20deg);
    -webkit-mask-image:radial-gradient(circle,#000 0,transparent 55%);mask-image:radial-gradient(circle,#000 0,transparent 55%)}
  #hr.run .rays{animation:hrRays 1.2s ease 1.9s forwards, hrSpin 18s linear infinite}
  @keyframes hrRays{to{opacity:1}}
  @keyframes hrSpin{to{rotate:360deg}}
  #hr .halo{position:absolute;left:50%;top:24%;width:90vmin;height:90vmin;transform:translate(-50%,-50%);border-radius:50%;opacity:0;mix-blend-mode:screen;
    background:radial-gradient(circle,rgba(255,240,180,.85),rgba(255,190,60,.45) 35%,rgba(255,150,40,0) 70%)}
  #hr.run .halo{animation:hrHalo 2.4s ease-in-out 2.1s infinite alternate}
  @keyframes hrHalo{0%{opacity:.25;transform:translate(-50%,-50%) scale(.85)}100%{opacity:.75;transform:translate(-50%,-50%) scale(1.1)}}
  #hr .fishglow{position:absolute;left:46%;top:70%;width:70vmin;height:70vmin;transform:translate(-50%,-50%);border-radius:50%;opacity:0;mix-blend-mode:screen;
    background:radial-gradient(circle,rgba(255,220,120,.9),rgba(255,160,40,.35) 40%,transparent 70%)}
  #hr.run .fishglow{animation:hrFish 1.6s ease-out .2s forwards}
  @keyframes hrFish{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}40%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}}
  #hr .flash{position:absolute;inset:0;opacity:0;pointer-events:none;background:radial-gradient(circle at 50% 30%,#fff 0,rgba(255,236,170,.95) 25%,rgba(255,200,90,.5) 55%,rgba(255,200,90,0) 80%)}
  #hr.run .flash{animation:hrFlash 2.9s ease-out .9s forwards}
  @keyframes hrFlash{0%{opacity:0}10%{opacity:.85}35%{opacity:0}55%{opacity:0}62%{opacity:.95}100%{opacity:0}}
  #hr canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  #hr .txt{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 9%);text-align:center;opacity:0;pointer-events:none}
  #hr.show-txt .txt{animation:hrTxt .7s cubic-bezier(.2,1.4,.4,1) forwards}
  @keyframes hrTxt{from{opacity:0;transform:scale(.6) translateY(20px)}to{opacity:1;transform:none}}
  #hr .txt h2{margin:0;font-family:"Noto Serif",serif;font-weight:900;font-size:clamp(40px,12vw,76px);letter-spacing:.04em;line-height:1;
    background:linear-gradient(180deg,#fffbe6,#ffd65a 45%,#e88a10 80%);-webkit-background-clip:text;background-clip:text;color:transparent;
    filter:drop-shadow(0 3px 0 #7a2d05) drop-shadow(0 0 18px rgba(255,200,80,.9))}
  #hr .txt p{margin:10px 0 0;color:#fff;font-weight:800;font-size:clamp(15px,4.2vw,20px);text-shadow:0 2px 8px rgba(0,0,0,.8)}
  #hr .go{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 2.5%);transform:translateX(-50%);padding:13px 26px;border:0;border-radius:999px;
    font:800 17px "Be Vietnam Pro",system-ui,sans-serif;color:#4a1206;background:linear-gradient(#fff3c4,#f2b63d);box-shadow:0 8px 26px rgba(255,180,40,.55);opacity:0;pointer-events:none}
  #hr.show-go .go{opacity:1;pointer-events:auto;transition:opacity .4s;animation:hrPulse 1.2s ease-in-out infinite}
  @keyframes hrPulse{50%{box-shadow:0 8px 34px rgba(255,200,60,.95)}}
  @media (prefers-reduced-motion:reduce){#hr.run .pic{animation-duration:.01s}#hr.run .flash{animation:none}}
  `;
  let root, pic, cv, ctx, raf, fw = [], sparks = [], last = 0, launchT = 0, running = false, endAt = 0, AC = null, soundOn = true;

  function build() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'hr';
    root.innerHTML = `<div class="stage"><img class="pic" alt="Cá chép hóa rồng" src="${IMG}"><div class="fishglow"></div><div class="halo"></div></div>
      <div class="rays"></div><canvas></canvas><div class="flash"></div>
      <div class="txt"><h2>HÓA RỒNG!</h2><p></p></div><button class="go">Bơi tiếp ▶</button>`;
    document.body.appendChild(root);
    pic = root.querySelector('.pic'); cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
    addEventListener('resize', size);
  }
  function size() { if (!cv) return; const d = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); }

  // ---------- âm thanh ----------
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function whoosh() {
    const a = ac(); if (!a || !soundOn) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(140, a.currentTime); o.frequency.exponentialRampToValueAtTime(900, a.currentTime + 1.6);
    g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.06, a.currentTime + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.8);
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
    o.connect(f).connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 1.9);
    [523, 659, 784, 1047, 1319].forEach((fr, i) => { const o2 = a.createOscillator(), g2 = a.createGain(); o2.type = 'triangle'; o2.frequency.value = fr;
      const t = a.currentTime + 1.7 + i * 0.09; g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(0.11, t + 0.02); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o2.connect(g2).connect(a.destination); o2.start(t); o2.stop(t + 1); });
  }
  function boom(power) {
    const a = ac(); if (!a || !soundOn) return;
    const len = a.sampleRate * 0.9, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5) * (t < 0.02 ? t / 0.02 : 1) + (Math.random() < 0.002 ? (Math.random() - .5) * 2 : 0); }
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'lowpass'; f.frequency.value = 500 + power * 900; g.gain.value = 0.22 * power;
    s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
  }

  // ---------- pháo hoa ----------
  const COLORS = [[255, 120, 200], [255, 205, 90], [255, 150, 60], [190, 120, 255], [255, 240, 200], [120, 210, 255]];
  function launch() {
    const W = innerWidth, H = innerHeight;
    fw.push({ x: W * (0.12 + Math.random() * 0.76), y: H + 10, vy: -(H * (0.011 + Math.random() * 0.005)), ty: H * (0.08 + Math.random() * 0.4), c: COLORS[Math.random() * COLORS.length | 0], trail: [] });
  }
  function explode(r) {
    const n = 70 + (Math.random() * 50 | 0), sp = 2.2 + Math.random() * 2.2, ring = Math.random() < 0.35;
    const c2 = Math.random() < 0.4 ? COLORS[Math.random() * COLORS.length | 0] : r.c;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.1, v = ring ? sp : sp * (0.35 + Math.random() * 0.75);
      sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.009 + Math.random() * 0.01, c: i % 3 ? r.c : c2, tw: Math.random() < 0.3 });
    }
    sparks.push({ x: r.x, y: r.y, vx: 0, vy: 0, life: 1, decay: 0.06, c: [255, 255, 230], big: true });
    boom(0.6 + Math.random() * 0.5);
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const W = innerWidth, H = innerHeight, k = dt * 60;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    launchT -= dt;
    if (launchT <= 0 && now < endAt) { launch(); if (Math.random() < 0.45) launch(); launchT = 0.35 + Math.random() * 0.45; }
    for (let i = fw.length - 1; i >= 0; i--) {
      const r = fw[i]; r.trail.push([r.x, r.y]); if (r.trail.length > 10) r.trail.shift();
      r.y += r.vy * k; r.x += Math.sin(now / 120 + i) * 0.4;
      ctx.strokeStyle = `rgba(${r.c[0]},${r.c[1]},${r.c[2]},.8)`; ctx.lineWidth = 2; ctx.beginPath();
      r.trail.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      if (r.y <= r.ty) { explode(r); fw.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.035 * k; p.vx *= 0.985; p.vy *= 0.985; p.life -= p.decay * k;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      const a = p.tw ? p.life * (0.4 + 0.6 * Math.abs(Math.sin(now / 40 + i))) : p.life;
      if (p.big) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70 * (1.2 - p.life));
        g.addColorStop(0, `rgba(255,250,220,${a})`); g.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 70 * (1.2 - p.life), 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 + p.life * 1.4, 0, 7); ctx.fill();
      }
    }
    // bụi sáng bay lên từ mặt nước
    if (Math.random() < 0.5) sparks.push({ x: W * (0.2 + Math.random() * 0.6), y: H * (0.78 + Math.random() * 0.15), vx: (Math.random() - .5) * 0.6, vy: -(0.8 + Math.random() * 1.6), life: 1, decay: 0.008, c: [255, 215, 120], tw: true });
    raf = requestAnimationFrame(tick);
  }

  function play(opts = {}) {
    build(); size();
    soundOn = opts.sound !== false;
    root.querySelector('.txt h2').textContent = opts.title || 'HÓA RỒNG!';
    root.querySelector('.txt p').textContent = opts.sub || '';
    root.classList.remove('run', 'show-txt', 'show-go');
    root.style.setProperty('--d', opts.big ? '3.4s' : '2.8s');
    root.classList.add('on'); void root.offsetWidth; root.classList.add('run');
    fw = []; sparks = []; launchT = 1.0; last = performance.now(); running = true;
    endAt = performance.now() + (opts.big ? 12000 : 8000);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    whoosh();
    return new Promise(resolve => {
      let done = false, canSkip = false;
      const timers = [
        setTimeout(() => root.classList.add('show-txt'), opts.big ? 3000 : 2500),
        setTimeout(() => { root.classList.add('show-go'); canSkip = true; }, opts.big ? 3600 : 3000),
        setTimeout(() => close(), opts.big ? 11000 : 7000)
      ];
      setTimeout(() => canSkip = true, 1600);
      const close = () => {
        if (done) return; done = true; timers.forEach(clearTimeout);
        root.removeEventListener('click', onTap);
        root.style.transition = 'opacity .4s'; root.style.opacity = '0';
        setTimeout(() => { running = false; cancelAnimationFrame(raf); root.classList.remove('on', 'run', 'show-txt', 'show-go'); root.style.opacity = ''; root.style.transition = ''; resolve(); }, 400);
      };
      const onTap = () => { if (canSkip) close(); };
      root.addEventListener('click', onTap);
    });
  }
  // tải sẵn ảnh để cảnh hiện ngay
  function preload() { const im = new Image(); im.src = IMG; }
  window.HoaRong = { play, preload };
})();
