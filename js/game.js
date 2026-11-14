/* =====================================================================
   CÁ CHÉP VƯỢT VŨ MÔN V3 — vòng chơi
   Đọc to từ trên cổng → máy nghe → so khớp L/N → cá chép 3D hành động.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LN = window.LN, BANK = window.WORD_BANK;
  const KEY = 'caChepVuMon_v3';

  // ---------- cảnh nền: 100 danh lam thắng cảnh (js/scenes.js), mỗi câu đổi 1 cảnh ----------
  const ALL = window.SCENES_100 || [];
  // ảnh riêng trong assets/ được ưu tiên cho 2 cảnh gốc (nếu có)
  const LOCAL = { 0: 'assets/hoang-thanh-thang-long.jpg', 1: 'assets/dinh-doc-lap.jpg' };
  const cache = {};                       // id → url đã tải
  function loadImg(list) {
    return new Promise(res => {
      let i = 0;
      const next = () => {
        if (i >= list.length) return res(null);
        const url = list[i++]; if (!url) return next();
        const im = new Image();
        im.onload = () => res(url); im.onerror = next; im.src = url;
      };
      next();
    });
  }
  const srcList = sc => [sc.custom, LOCAL[sc.id], sc.url, sc.fallback];
  function preload(sc) { if (sc && !cache[sc.id]) cache[sc.id] = loadImg(srcList(sc)); return cache[sc.id]; }
  let bgFront = 'A', curScene = null, order = [], orderPos = 0;
  function buildOrder() {
    let ids = ALL.map(s => s.id);
    if (opt.scene === 'vn') ids = ALL.filter(s => s.vn).map(s => s.id);
    else if (opt.scene === 'thanglong') ids = [0];
    else if (opt.scene === 'doclap') ids = [1];
    else if (opt.scene === 'world') {
      // xáo trộn nhưng giữ cảnh Việt Nam rải đều
      ids = shuffle(ids);
    }
    if (opt.scene === 'vn') ids = shuffle(ids);
    order = ids; orderPos = Math.floor(Math.random() * ids.length);
  }
  function nextSceneObj() { if (!order.length) buildOrder(); const sc = ALL[order[orderPos % order.length]]; orderPos++; preload(ALL[order[orderPos % order.length]]); return sc; }
  async function setScene(sc) {
    if (!sc || curScene === sc.id) return;
    curScene = sc.id;
    $('placeName').textContent = sc.name; $('placeSub').textContent = sc.place;
    const cr = $('credit'); cr.textContent = sc.custom ? 'Ảnh của bạn' : sc.credit;
    if (sc.link && !sc.custom) cr.href = sc.link; else cr.removeAttribute('href');
    const pt = $('placeTag'); pt.classList.remove('show'); void pt.offsetWidth; pt.classList.add('show');
    const url = await preload(sc);
    if (curScene !== sc.id) return;
    const back = bgFront === 'A' ? 'B' : 'A', el = $('bg' + back), old = $('bg' + bgFront);
    if (url) { el.style.backgroundImage = `url("${url}")`; el.classList.remove('fallback'); $('reflect').style.backgroundImage = `url("${url}")`; }
    else { el.style.backgroundImage = ''; el.classList.add('fallback'); $('reflect').style.backgroundImage = ''; cr.textContent = 'Chưa tải được ảnh – kiểm tra mạng'; }
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    el.classList.add('on'); old.classList.remove('on'); bgFront = back;
  }

  // ---------- lưu trữ ----------
  function load() { try { return Object.assign({ read: 0, ok: 0, weak: {} }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { read: 0, ok: 0, weak: {} }; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  let DB = load();

  // ---------- âm thanh hiệu ứng ----------
  let AC = null;
  const SFX = {
    on: true,
    ctx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; },
    tone(f, t0, d, type, g) {
      const a = this.ctx(); if (!a || !this.on) return;
      const o = a.createOscillator(), v = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, a.currentTime + t0);
      v.gain.setValueAtTime(0, a.currentTime + t0); v.gain.linearRampToValueAtTime(g || 0.18, a.currentTime + t0 + 0.02);
      v.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t0 + d);
      o.connect(v).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + d + 0.05);
    },
    good() { [784, 988, 1319].forEach((f, i) => this.tone(f, i * 0.09, 0.35, 'triangle', 0.16)); this.splash(); },
    bad() { this.tone(220, 0, 0.25, 'sawtooth', 0.08); this.tone(180, 0.12, 0.3, 'sawtooth', 0.07); },
    splash() {
      const a = this.ctx(); if (!a || !this.on) return;
      const len = a.sampleRate * 0.4, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = 0.25; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
    },
    win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, i * 0.12, 0.6, 'triangle', 0.15)); }
  };

  // ---------- cá chép 3D ----------
  let carp = null;
  try { carp = new window.Carp3D($('fish')); } catch (e) { console.warn(e); }
  const fx = $('fx'), fctx = fx.getContext('2d');
  const parts = [];
  function sizeFx() { const d = Math.min(devicePixelRatio || 1, 2); fx.width = fx.clientWidth * d; fx.height = fx.clientHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
  function burst(x, y, n, kind) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'gold' ? 3 : 4), life: 1, kind, r: 2 + Math.random() * 4 });
    }
  }
  const bubbles = [];
  function drawFx(dt) {
    const w = fx.clientWidth, h = fx.clientHeight;
    fctx.clearRect(0, 0, w, h);
    if (Math.random() < 0.08) bubbles.push({ x: Math.random() * w, y: h + 10, r: 1.5 + Math.random() * 3, v: 0.4 + Math.random() * 0.8 });
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.y -= b.v * dt * 60; b.x += Math.sin(b.y * 0.05) * 0.3;
      if (b.y < h * 0.45) { bubbles.splice(i, 1); continue; }
      fctx.beginPath(); fctx.arc(b.x, b.y, b.r, 0, 7); fctx.strokeStyle = 'rgba(220,250,255,.45)'; fctx.stroke();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += 0.25 * dt * 60; p.life -= dt * 0.9;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      fctx.globalAlpha = p.life;
      fctx.fillStyle = p.kind === 'gold' ? `hsl(${42 + Math.random() * 10},100%,${60 + Math.random() * 20}%)` : 'rgba(200,240,255,.9)';
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r * (p.kind === 'gold' ? 1 : 0.8), 0, 7); fctx.fill();
    }
    fctx.globalAlpha = 1;
  }

  // ---------- cấu hình ----------
  const AGE = {
    be: { n: 8, time: 12, cats: { tu: 0.55, cap: 0.45 }, maxLv: 2, big: true, model: true, final: 'cum' },
    hs: { n: 10, time: 8.5, cats: { tu: 0.35, cap: 0.3, cum: 0.35 }, maxLv: 3, final: 'cau' },
    nl: { n: 12, time: 7, cats: { tu: 0.15, cap: 0.25, cum: 0.35, cau: 0.25 }, maxLv: 3, final: 'cau' },
    ct: { n: 8, time: 14, cats: { tu: 0.45, cap: 0.25, cum: 0.3 }, maxLv: 3, big: true, final: 'cum' }
  };
  const opt = { age: 'hs', mode: 'tron', scene: 'world', model: false, sound: true, noMic: false };

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = arr => arr[Math.random() * arr.length | 0];
  const byCat = c => BANK.filter(x => x.cat === c);
  const lnCount = t => LN.syl(t).filter(w => LN.initial(w) !== 'X').length;

  function buildQueue() {
    const A = AGE[opt.age], q = [], used = new Set();
    const take = (cat, filter) => {
      let pool = byCat(cat).filter(x => !used.has(x.text) && (filter ? filter(x) : true));
      if (cat === 'cum' && opt.age === 'be') pool = pool.filter(x => LN.syl(x.text).length <= 2);
      if (!pool.length) pool = byCat(cat);
      // ưu tiên từ hay sai
      const weak = pool.filter(x => DB.weak[x.text]);
      const it = weak.length && Math.random() < 0.3 ? pick(weak) : pick(pool);
      used.add(it.text); return it;
    };
    const addPair = () => {
      const it = take('cap'); const mate = BANK.find(x => x.cat === 'cap' && x.text === it.pair) || { text: it.pair, cat: 'cap' };
      used.add(mate.text);
      const pr = Math.random() < 0.5 ? [it, mate] : [mate, it];
      pr.forEach((p, k) => q.push(Object.assign({}, p, { pairLabel: pr[0].text + '  ·  ' + pr[1].text, pairStep: k })));
    };
    if (opt.mode === 'on') {
      const weak = Object.entries(DB.weak).sort((a, b) => b[1] - a[1]).map(([t]) => BANK.find(x => x.text === t) || { text: t, cat: 'tu' });
      shuffle(weak).slice(0, A.n).forEach(x => q.push(x));
      while (q.length < Math.min(A.n, 6)) q.push(take('tu'));
    } else if (opt.mode === 'cap') {
      while (q.length < A.n) addPair();
    } else if (opt.mode !== 'tron') {
      while (q.length < A.n) q.push(take(opt.mode, opt.age === 'be' && opt.mode === 'tu' ? x => x.text.length <= 4 : null));
    } else {
      while (q.length < A.n) {
        let r = Math.random(), cat = 'tu';
        for (const [c, p] of Object.entries(A.cats)) { if ((r -= p) <= 0) { cat = c; break; } }
        if (cat === 'cap' && q.length < A.n - 1) addPair(); else q.push(take(cat === 'cap' ? 'tu' : cat));
      }
    }
    // cửa ải cuối: Vũ Môn
    const fin = opt.mode === 'on' ? take('cum', x => lnCount(x.text) >= 2) : take(A.final, x => lnCount(x.text) >= 2 && (A.final !== 'cau' || LN.syl(x.text).length <= (opt.age === 'hs' ? 8 : 14)));
    q.push(Object.assign({}, fin, { final: true }));
    return q;
  }

  // ---------- trạng thái lượt ----------
  const G = {
    q: [], i: 0, score: 0, combo: 0, right: 0, fixed: 0, miss: 0, weakRound: {},
    phase: 'idle', tLeft: 0, tTotal: 0, gateX: 1, tries: 0, cur: null, paused: false, retryLater: []
  };
  let listener = null, micReady = false, usePTT = false;

  function kindLabel(it) {
    if (it.final) return '🐉 VŨ MÔN – ĐỌC CẢ CÂU ĐỂ HOÁ RỒNG';
    if (it.pairLabel) return 'CẶP TỪ ĐÔI L – N';
    return ({ tu: 'ĐỌC TO TỪ NÀY', cum: 'ĐỌC TO TỪ ĐÔI', cau: 'ĐỌC TO CẢ CÂU', cap: 'CẶP TỪ ĐÔI L – N' })[it.cat] || 'ĐỌC TO';
  }
  function wordHTML(text, marks) {
    const ws = text.split(/(\s+)/); let k = 0;
    return ws.map(w => {
      if (/^\s+$/.test(w)) return w;
      const s = LN.norm(w), mk = marks && marks[k]; k++;
      const ini = s && LN.initial(s);
      if (ini === 'L' || ini === 'N') {
        const cls = mk ? (mk.st === 'swap' ? ' bad' : (mk.st === 'ok' || mk.st === 'tone') ? ' ok' : '') : '';
        return `<span class="ln${cls}">${w[0]}</span>${w.slice(1)}`;
      }
      return w;
    }).join('');
  }

  function heard(html) { $('heard').innerHTML = html; }
  function toast(text, cls) {
    const t = $('toast'); t.className = 'toast ' + (cls || 'good'); t.textContent = text; t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 1150);
  }
  function setMicState(s) {
    const b = $('micBtn');
    b.classList.remove('off', 'listening', 'hearing');
    b.classList.add(s === 'hearing' ? 'hearing' : s === 'listening' ? 'listening' : 'off');
    $('micLabel').textContent = usePTT ? 'Giữ nút để nói – thả ra để chấm' : s === 'hearing' ? 'Đang nghe bạn đọc…' : s === 'listening' ? 'Micro đang mở – đọc to nhé' : s === 'paused' ? 'Micro tạm dừng' : 'Chạm để bật micro';
  }

  // ---------- micro ----------
  function initMic() {
    if (opt.noMic) return false;
    if (LN.Listener.supported) {
      listener = new LN.Listener({
        state: setMicState,
        error: e => {
          if (e === 'denied') { heard('⚠️ Chưa được phép dùng micro. Bật quyền micro cho trang này (biểu tượng 🔒 trên thanh địa chỉ) rồi chạm nút micro.'); setMicState('off'); micReady = false; }
          else if (e === 'network') heard('⚠️ Nhận dạng giọng nói cần Internet. Kiểm tra mạng rồi đọc lại.');
          else if (e === 'audio-capture') heard('⚠️ Không tìm thấy micro trên thiết bị.');
        },
        result: onSpeech
      });
      listener.start(); micReady = true; usePTT = false; return true;
    }
    if (LN.Recorder.supported) { usePTT = true; micReady = true; $('micBtn').classList.add('ptt'); setMicState('listening'); return true; }
    return false;
  }
  function pauseMic() { if (listener) listener.pause(); }
  function resumeMic() { if (listener && !G.paused) listener.resume(); }

  // nút micro: bật lại / giữ để nói (dự phòng)
  const mb = $('micBtn');
  mb.addEventListener('click', () => {
    if (usePTT) return;
    SFX.ctx();
    if (!listener) { initMic(); return; }
    if (!listener.active) { listener.start(); } else if (listener.paused) { listener.resume(); }
  });
  const pttDown = async e => {
    if (!usePTT || G.phase === 'idle') return; e.preventDefault();
    mb.classList.add('down'); heard('🎙 Đang thu… đọc to rồi thả tay.');
    try { await LN.Recorder.start(); } catch (err) { heard('⚠️ Không mở được micro: ' + err.message); mb.classList.remove('down'); }
  };
  const pttUp = async e => {
    if (!usePTT || !mb.classList.contains('down')) return; e.preventDefault();
    mb.classList.remove('down');
    const blob = await LN.Recorder.stop(); if (!blob) return;
    heard('⏳ Đang chấm…');
    try { const text = await LN.Recorder.transcribe(blob); onSpeech({ final: true, text, alts: [text] }); }
    catch (err) { heard('⚠️ Máy chủ nhận dạng chưa sẵn sàng (' + err.message + '). Bạn có thể chơi chế độ “nghe & chọn L/N”.'); }
  };
  mb.addEventListener('pointerdown', pttDown); mb.addEventListener('pointerup', pttUp); mb.addEventListener('pointerleave', pttUp);

  // ---------- xử lý lời đọc ----------
  function onSpeech(r) {
    if (G.paused) return;
    const cur = G.cur; if (!cur) return;
    if (G.phase !== 'reading' && G.phase !== 'fixing') return;
    const target = G.phase === 'fixing' ? G.fixTarget : cur.text;
    const results = r.alts.map(a => LN.analyze(target, a));
    const best = results.find(x => x.verdict === 'ok');
    const top = results[0];
    heard(`Máy nghe: <b>${escapeHTML(top.heard || r.text || '…')}</b>`);
    if (!r.final) {
      if (best) return success(best, false);
      // gợi ý màu ngay trong lúc đọc (không chấm lỗi khi chưa đọc xong)
      $('cardWord').innerHTML = wordHTML(cur.text, top.marks.map(m => m.st === 'swap' ? { st: '' } : m));
      return;
    }
    if (best) return success(best, best !== top);
    if (top.verdict === 'ln') return mistake(top);
    // chưa rõ: nếu đã nói quá dài so với mục tiêu thì xoá đệm
    if (listener && LN.syl(r.text).length > LN.syl(target).length * 1.6 + 2) listener.reset();
    $('cardWord').innerHTML = wordHTML(cur.text, top.marks);
    heard(`Máy nghe: <b>${escapeHTML(top.heard || '…')}</b> – chưa khớp, đọc lại <b>to, rõ, chậm</b> nhé.`);
  }
  const escapeHTML = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function record(text, ok) {
    DB.read++; if (ok) DB.ok++;
    if (!ok) DB.weak[text] = (DB.weak[text] || 0) + 1;
    else if (DB.weak[text]) { DB.weak[text]--; if (DB.weak[text] <= 0) delete DB.weak[text]; }
    save(DB);
  }

  function success(res, nearly) {
    const cur = G.cur;
    const wasFixing = G.phase === 'fixing';
    G.phase = 'jump';
    if (listener) listener.reset();
    $('cardWord').innerHTML = wordHTML(cur.text, res.marks);
    let pts;
    if (wasFixing) { closeFix(); G.fixed++; pts = 5; G.combo = 0; toast('Sửa được rồi! +5', 'good'); }
    else { G.right++; G.combo++; pts = 10 + Math.min(10, (G.combo - 1) * 2) + (cur.final ? 20 : 0); toast((cur.final ? 'VƯỢT VŨ MÔN! ' : nearly ? 'Đạt! ' : pick(['Chuẩn! ', 'Hay quá! ', 'Tuyệt! ', 'Rất rõ! '])) + '+' + pts, 'good'); }
    if (G.tries === 0 && !wasFixing) record(cur.text, true); else if (wasFixing) { /* đã ghi lỗi trước đó */ }
    G.score += pts; hud();
    if (cur.final) G.finalOk = true;
    SFX.good();
    if (carp) carp.play(cur.final ? 'dragon' : 'jump');
    const g = $('gate'); g.classList.add('pass');
    const sp = carp ? carp.screenPos([1, 0, 0]) : { x: 100, y: 200 };
    burst(sp.x, sp.y, 26, 'water'); setTimeout(() => burst(sp.x + 40, sp.y - 120, 30, 'gold'), 350);
    setTimeout(next, cur.final ? 2600 : 1350);
  }

  // ---------- sửa lỗi ----------
  function mouthSVG(kind) {
    const wantL = kind === 'L→N';
    // lát cắt dọc khoang miệng: lưỡi chạm lợi trên; L – hơi ra hai bên miệng; N – hơi lên mũi
    return `<svg viewBox="0 0 240 150" aria-label="Vị trí lưỡi">
      <path d="M20 40 Q60 8 130 14 Q170 18 200 40 L214 58 Q200 62 192 66" fill="none" stroke="#7a4a12" stroke-width="4"/>
      <path d="M200 40 Q222 46 226 70" fill="none" stroke="#7a4a12" stroke-width="4"/>
      <path d="M30 120 Q100 136 190 112 L214 104" fill="none" stroke="#7a4a12" stroke-width="4"/>
      <path d="M48 112 Q90 70 160 78 Q190 66 198 60 Q196 84 168 96 Q110 112 48 112Z" fill="#f08a7a" stroke="#b5483a" stroke-width="2"/>
      <circle cx="199" cy="58" r="6" fill="#11804a"/>
      <text x="118" y="62" font-size="11" fill="#5a1406">lợi trên →</text>
      ${wantL
        ? `<path d="M150 88 Q190 92 232 82" stroke="#11804a" stroke-width="4" fill="none" marker-end="url(#a)"/><text x="8" y="146" font-size="12" fill="#11804a" font-weight="700">L: hơi ra hai bên lưỡi, qua miệng</text>
           <path d="M160 30 L210 10" stroke="#d92d20" stroke-width="3" stroke-dasharray="5 4"/><text x="120" y="12" font-size="11" fill="#d92d20">✕ không qua mũi</text>`
        : `<path d="M150 60 Q150 20 200 6" stroke="#11804a" stroke-width="4" fill="none" marker-end="url(#a)"/><text x="8" y="146" font-size="12" fill="#11804a" font-weight="700">N: lưỡi bịt kín, hơi lên MŨI</text>
           <path d="M205 82 L232 90" stroke="#d92d20" stroke-width="3" stroke-dasharray="5 4"/><text x="150" y="128" font-size="11" fill="#d92d20">✕ không thoát ra miệng</text>`}
      <defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#11804a"/></marker></defs>
    </svg>`;
  }

  async function mistake(res) {
    const cur = G.cur;
    if (G.phase === 'fixing') {
      // đọc lại vẫn sai
      G.fixTries++;
      SFX.bad(); if (carp) carp.play('wiggle');
      $('fixGot').textContent = res.swaps[0] ? res.swaps.map(s => s.got).join(' ') : res.heard;
      if (G.fixTries >= 3) { $('fixSay').innerHTML = 'Chưa đạt – không sao! Ghi vào <b>“Ôn từ hay sai”</b> để luyện tiếp.'; setTimeout(() => { closeFix(); fail(true); }, 1800); return; }
      $('fixSay').innerHTML = `Gần rồi! Lần ${G.fixTries + 1}/3 – đọc chậm: <b>${escapeHTML(G.fixTarget)}</b>`;
      pauseMic(); await LN.TTS.say(G.fixTarget, { rate: 0.7 }); resumeMic();
      return;
    }
    G.phase = 'fixing'; G.tries++; G.fixTries = 0; G.combo = 0; hud();
    record(cur.text, false); G.weakRound[cur.text] = 1;
    SFX.bad(); if (carp) carp.play('hurt');
    $('gate').classList.add('hit'); setTimeout(() => $('gate').classList.remove('hit'), 500);
    $('cardWord').innerHTML = wordHTML(cur.text, res.marks);
    const sw = res.swaps[0], tip = LN.TIPS[sw.kind];
    // từ cần đọc lại: nếu câu dài thì tập trung vào âm tiết sai
    const focus = LN.syl(cur.text).length > 4 ? res.swaps.map(s => s.want).join(' ') : cur.text;
    G.fixTarget = focus;
    $('fixTitle').textContent = tip.title;
    $('fixGot').textContent = res.swaps.length > 1 && LN.syl(cur.text).length <= 4 ? res.heard : res.swaps.map(s => s.got).join(' ');
    $('fixWant').textContent = res.swaps.length > 1 && LN.syl(cur.text).length <= 4 ? LN.norm(cur.text) : res.swaps.map(s => s.want).join(' ');
    $('fixHow').textContent = tip.how; $('fixTest').textContent = tip.test;
    $('fixMouth').innerHTML = mouthSVG(sw.kind);
    $('fixAgain').textContent = focus;
    $('fixSay').innerHTML = `🎙 Nghe mẫu rồi đọc lại: <b>${escapeHTML(focus)}</b>`;
    $('fix').hidden = false;
    pauseMic();
    await LN.TTS.say(focus, { rate: 0.72 });
    if (G.phase !== 'fixing') return;
    $('fixSay').classList.add('listen');
    if (listener) listener.resume();
  }
  function closeFix() { $('fix').hidden = true; $('fixSay').classList.remove('listen'); }
  $('fixHear').onclick = async () => { pauseMic(); await LN.TTS.say(G.fixTarget || '', { rate: 0.7 }); resumeMic(); };
  $('fixNext').onclick = () => { closeFix(); fail(true); };

  function fail(skipAnim) {
    const cur = G.cur;
    if (G.phase === 'next' || !cur) return;
    G.phase = 'next'; G.combo = 0; G.miss++;
    if (!G.weakRound[cur.text]) { record(cur.text, false); G.weakRound[cur.text] = 1; }
    // đưa lại từ này vào lượt sau 3 cổng (lặp lại ngắt quãng)
    if (!cur.final && !cur.again && G.q.length - G.i > 2) G.q.splice(G.i + 3, 0, Object.assign({}, cur, { again: true, pairLabel: null }));
    if (!skipAnim) { SFX.bad(); if (carp) carp.play('hurt'); toast('Hết giờ! Nghe mẫu nhé', 'warn'); }
    hud();
    pauseMic();
    $('cardWord').innerHTML = wordHTML(cur.text);
    LN.TTS.say(cur.text, { rate: 0.8 }).then(() => setTimeout(next, 500));
  }

  // ---------- vòng cổng ----------
  function hud() {
    $('hudScore').textContent = G.score;
    $('hudCombo').textContent = G.combo > 1 ? `chuỗi ×${G.combo}` : 'chuỗi 0';
    $('hudCount').textContent = `${Math.min(G.i + 1, G.q.length)}/${G.q.length}`;
    $('progBar').style.width = (G.i / G.q.length * 100) + '%';
  }


  async function showGate() {
    const cur = G.cur = G.q[G.i];
    G.tries = 0; G.phase = 'pre'; G.weakRound[cur.text] = G.weakRound[cur.text] && cur.again ? 1 : 0;
    const sc = nextSceneObj();
    setScene(sc);
    $('hudStage').textContent = cur.final ? 'Vũ Môn' : sc.name;
    hud();
    $('cardKind').textContent = kindLabel(cur) + (cur.again ? ' · ĐỌC LẠI' : '');
    const cw = $('cardWord'); cw.innerHTML = opt.noMic ? blankHTML(cur) : wordHTML(cur.text);
    cw.classList.toggle('long', LN.syl(cur.text).length > 3);
    $('cardPair').textContent = cur.pairLabel ? 'Phân biệt: ' + cur.pairLabel : '';
    $('gateWord').textContent = cur.text;
    const g = $('gate'); g.hidden = false; g.classList.remove('pass', 'hit');
    G.gateX = 1.15;
    const A = AGE[opt.age];
    G.tTotal = G.tLeft = A.time + Math.max(0, LN.syl(cur.text).length - 1) * (opt.age === 'be' ? 1.4 : 1.0) + (cur.final ? 4 : 0);
    if (listener) listener.reset();
    heard(opt.noMic ? 'Nghe máy đọc rồi chọn âm đầu đúng: <b>L</b> hay <b>N</b>?' : usePTT ? 'Giữ nút micro, đọc to rồi thả tay.' : 'Đọc to từ trên cổng…');
    if (opt.model || opt.noMic) { pauseMic(); await LN.TTS.say(cur.text, { rate: 0.8 }); if (G.cur !== cur) return; resumeMic(); }
    G.phase = 'reading';
    if (listener && listener.active && listener.paused) listener.resume();
  }
  function blankHTML(cur) {
    // chế độ không micro: che âm đầu L/N của âm tiết đầu tiên có L/N
    const ws = cur.text.split(' '); let done = false;
    G.blankAnswer = null;
    return ws.map(w => {
      const ini = LN.initial(LN.norm(w));
      if (!done && (ini === 'L' || ini === 'N')) { done = true; G.blankAnswer = ini; return `<span class="ln">_</span>${w.slice(1)}`; }
      return w;
    }).join(' ');
  }
  document.querySelectorAll('#choice .ch').forEach(b => b.addEventListener('click', () => {
    if (G.phase !== 'reading') return;
    const cur = G.cur;
    if (b.dataset.v === G.blankAnswer) success({ marks: LN.analyze(cur.text, cur.text).marks }, false);
    else {
      record(cur.text, false); G.weakRound[cur.text] = 1;
      toast(`Chưa đúng – là ${G.blankAnswer}`, 'warn'); SFX.bad(); if (carp) carp.play('hurt');
      fail(true);
    }
  }));

  const CHANG = 5;                      // số cổng mỗi chặng
  async function next() {
    $('gate').hidden = true;
    G.i++;
    if (G.i >= G.q.length) return finish();
    // qua mỗi chặng: cảnh động cá chép hóa rồng + pháo hoa
    if (G.i % CHANG === 0 && window.HoaRong) {
      const chang = G.i / CHANG;
      G.phase = 'stage'; pauseMic(); G.score += 30; hud();
      await window.HoaRong.play({ title: 'HÓA RỒNG!', sub: `Qua chặng ${chang} · thưởng +30 điểm`, sound: opt.sound });
      if (G.phase !== 'stage') return;
      resumeMic();
    }
    showGate();
  }

  function start() {
    SFX.ctx(); SFX.on = opt.sound; LN.TTS.enabled = opt.sound || opt.noMic;
    document.body.classList.toggle('big', !!AGE[opt.age].big);
    Object.assign(G, { q: buildQueue(), i: 0, score: 0, combo: 0, right: 0, fixed: 0, miss: 0, weakRound: {}, paused: false, finalOk: false });
    $('home').hidden = true; $('end').hidden = true;
    ['hud', 'card', 'micbar'].forEach(id => $(id).hidden = false);
    $('choice').hidden = !opt.noMic; $('micBtn').hidden = opt.noMic; $('micLabel').hidden = opt.noMic;
    if (!opt.noMic) {
      if (!listener && !usePTT) {
        if (!initMic()) { opt.noMic = true; $('choice').hidden = false; $('micBtn').hidden = true; $('micLabel').hidden = true; toast('Trình duyệt chưa hỗ trợ micro – chuyển sang nghe & chọn', 'info'); }
      } else if (listener) listener.start();
    }
    curScene = null; buildOrder();
    showGate();
  }

  async function finish() {
    G.phase = 'idle'; G.cur = null;
    if (listener) listener.stop();
    ['hud', 'card', 'micbar'].forEach(id => $(id).hidden = true);
    if (G.finalOk && window.HoaRong) await window.HoaRong.play({ title: 'CÁ CHÉP HÓA RỒNG!', sub: 'Vượt Vũ Môn thành công · ' + G.score + ' điểm', big: true, sound: opt.sound });
    const total = G.q.length, rate = G.right / total;
    $('enScore').textContent = G.score; $('enRight').textContent = G.right; $('enFixed').textContent = G.fixed; $('enMiss').textContent = G.miss;
    $('endStars').textContent = rate >= 0.85 ? '★★★' : rate >= 0.6 ? '★★☆' : '★☆☆';
    const finalOk = !!G.finalOk;
    $('endTitle').textContent = finalOk ? 'Cá chép đã vượt Vũ Môn, hoá rồng!' : 'Cá chép đã đến chân Vũ Môn!';
    const weak = Object.keys(G.weakRound).filter(k => G.weakRound[k]);
    $('enWeak').innerHTML = weak.length ? '<b>Từ cần luyện thêm:</b><br>' + weak.map(w => `<span>${escapeHTML(w)}</span>`).join('') : '<b>Không có từ nào đọc sai – xuất sắc!</b>';
    $('end').hidden = false;
    SFX.win();
    if (carp) carp.play('cheer');
    refreshHome();
  }

  // ---------- vòng lặp khung hình ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (G.phase === 'reading' && !G.paused) {
      G.tLeft -= dt;
      if (G.tLeft <= 0) { G.tLeft = 0; fail(false); }
    }
    const k = G.tTotal ? G.tLeft / G.tTotal : 1;
    $('timerBar').style.transform = `scaleX(${Math.max(0, k)})`;
    // cổng trôi về phía cá
    if (carp) {
      const fr = carp.frame(now);
      const nose = carp.screenPos([1.25, 0, 0]);
      const st = $('stage'), W = st.clientWidth, Hh = st.clientHeight;
      const startX = W * 1.05, endX = nose.x + W * 0.04;
      if (G.phase === 'reading' || G.phase === 'pre' || G.phase === 'fixing') G.gateX = k;
      const gx = endX + (startX - endX) * Math.max(0, Math.min(1, G.gateX));
      const g = $('gate'); g.style.left = gx + 'px'; g.style.top = (carp.screenPos([0, 0.1, 0]).y) + 'px';
    }
    drawFx(dt);
    requestAnimationFrame(loop);
  }
  function onResize() { if (carp) carp.resize(); sizeFx(); }
  addEventListener('resize', onResize); onResize();
  requestAnimationFrame(loop);

  // ---------- điều khiển ----------
  $('btnHear').onclick = async () => { if (!G.cur) return; pauseMic(); await LN.TTS.say(G.cur.text, { rate: 0.8 }); resumeMic(); };
  $('btnSkip').onclick = () => { if (G.phase === 'reading') fail(false); };
  $('btnPause').onclick = () => { G.paused = true; pauseMic(); window.speechSynthesis && window.speechSynthesis.cancel(); $('pause').hidden = false; };
  $('btnResume').onclick = () => { $('pause').hidden = true; G.paused = false; resumeMic(); };
  $('btnQuit').onclick = () => { $('pause').hidden = true; G.paused = false; G.phase = 'idle'; G.cur = null; if (listener) listener.stop(); closeFix(); $('gate').hidden = true; ['hud', 'card', 'micbar'].forEach(id => $(id).hidden = true); refreshHome(); $('home').hidden = false; };
  $('btnAgain').onclick = () => start();
  $('btnHome').onclick = () => { $('end').hidden = true; $('home').hidden = false; refreshHome(); };

  function seg(id, key, cb) {
    const el = $(id);
    el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      opt[key] = b.dataset.v; cb && cb(b.dataset.v);
    }));
  }
  seg('ageSeg', 'age', v => { $('optModel').checked = !!AGE[v].model; opt.model = !!AGE[v].model; });
  seg('modeSeg', 'mode');
  seg('sceneSeg', 'scene', () => { buildOrder(); setScene(nextSceneObj()); });
  $('optModel').onchange = e => opt.model = e.target.checked;
  $('optSound').onchange = e => opt.sound = e.target.checked;
  $('btnStart').onclick = () => { opt.noMic = false; start(); };
  $('btnNoMic').onclick = () => { opt.noMic = true; if (listener) listener.stop(); start(); };
  document.querySelectorAll('.own input').forEach(inp => inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const sc = ALL[+inp.dataset.scene]; sc.custom = URL.createObjectURL(f); delete cache[sc.id];
    curScene = null; setScene(sc); toast('Đã đổi ảnh nền', 'info');
  }));

  function refreshHome() {
    DB = load();
    $('stRead').textContent = DB.read;
    $('stAcc').textContent = (DB.read ? Math.round(DB.ok / DB.read * 100) : 0) + '%';
    const nw = Object.keys(DB.weak).length;
    $('stWeak').textContent = nw;
    $('stBank').textContent = window.WORD_BANK_STATS.total.toLocaleString('vi-VN');
    $('modeReview').disabled = nw === 0;
    if (nw === 0 && opt.mode === 'on') $('modeSeg').querySelector('[data-v=tron]').click();
    const s = window.WORD_BANK_STATS;
    const sup = $('support');
    const parts = [`Kho: ${s.tu} từ đơn · ${s.cap} cặp từ đôi · ${s.cum} từ đôi · ${s.cau} câu.`];
    if (LN.Listener.supported) parts.push('✅ Trình duyệt hỗ trợ nghe giọng nói liên tục.');
    else if (LN.Recorder.supported) parts.push('ℹ️ Trình duyệt này không có nhận dạng giọng nói sẵn – dùng chế độ “giữ nút để nói” (cần máy chủ /api/transcribe). Khuyên dùng Chrome, Edge hoặc Safari.');
    else parts.push('⚠️ Trình duyệt chưa hỗ trợ micro – hãy dùng Chrome/Edge/Safari bản mới, hoặc chơi chế độ “nghe & chọn L/N”.');
    if (!LN.TTS.has()) parts.push('ℹ️ Thiết bị chưa có giọng đọc tiếng Việt cho phần “nghe mẫu”.');
    if (location.protocol === 'file:') parts.push('⚠️ Micro cần chạy qua https:// (Vercel/Netlify) hoặc localhost.');
    sup.innerHTML = parts.join('<br>');
  }
  window.__game = { G, start, opt, onSpeech: r => onSpeech(r) };
  refreshHome();
  buildOrder(); setScene(ALL[0]);
  window.HoaRong && window.HoaRong.preload();
  // giọng đọc có thể tải muộn
  setTimeout(refreshHome, 1200);
})();
