/* =====================================================================
   NGHE – SO SÁNH – SỬA LỖI L/N
   - Listener: nhận dạng giọng nói liên tục (Web Speech API, vi-VN)
   - analyze(): so khớp từng âm tiết với từ mục tiêu, phát hiện L↔N
   - TTS: đọc mẫu bằng giọng tiếng Việt của thiết bị
   - Recorder: dự phòng thu âm gửi /api/transcribe khi trình duyệt
     không có SpeechRecognition (ví dụ Firefox)
   ===================================================================== */
(function () {
  'use strict';

  // ---------- chuẩn hoá ----------
  const DIG = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function numVi(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return '';
    if (n < 10) return DIG[n];
    if (n < 20) return 'mười' + (n % 10 ? ' ' + (n % 10 === 5 ? 'lăm' : DIG[n % 10]) : '');
    if (n < 100) {
      const t = Math.floor(n / 10), u = n % 10;
      return DIG[t] + ' mươi' + (u ? ' ' + (u === 1 ? 'mốt' : u === 5 ? 'lăm' : u === 4 ? 'tư' : DIG[u]) : '');
    }
    if (n < 1000) {
      const h = Math.floor(n / 100), r = n % 100;
      return DIG[h] + ' trăm' + (r ? (r < 10 ? ' lẻ ' + DIG[r] : ' ' + numVi(r)) : '');
    }
    return String(n);
  }
  // đưa dấu thanh kiểu cũ (hoà, loè, luỵ) về kiểu mới (hòa, lòe, lụy) để so khớp ổn định
  const OLD = { 'oà':'òa','oá':'óa','oả':'ỏa','oã':'õa','oạ':'ọa','oè':'òe','oé':'óe','oẻ':'ỏe','oẽ':'õe','oẹ':'ọe','uỳ':'ùy','uý':'úy','uỷ':'ủy','uỹ':'ũy','uỵ':'ụy' };
  const newTone = s => s.replace(/(oà|oá|oả|oã|oạ|oè|oé|oẻ|oẽ|oẹ|uỳ|uý|uỷ|uỹ|uỵ)(?=\s|$)/g, m => OLD[m]);
  function norm(s) {
    return newTone(String(s || '').normalize('NFC').toLowerCase()
      .replace(/\d+/g, m => ' ' + numVi(m) + ' ')
      .replace(/[.,!?;:"“”'‘’()\[\]{}…\-–—_/\\*]+/g, ' ')
      .replace(/\s+/g, ' ').trim());
  }
  const syl = s => norm(s).split(' ').filter(Boolean);

  // âm đầu: chỉ quan tâm L và N (loại trừ nh, ng, ngh)
  function initial(w) {
    if (/^ngh|^ng|^nh/.test(w)) return 'X';
    if (w[0] === 'n') return 'N';
    if (w[0] === 'l') return 'L';
    return 'X';
  }
  const rime = w => (initial(w) === 'X' ? w : w.slice(1));
  const baseRime = w => rime(w).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

  // ---------- so khớp âm tiết (Needleman–Wunsch) ----------
  function align(a, b) {
    const n = a.length, m = b.length, D = [], P = [];
    for (let i = 0; i <= n; i++) { D.push(new Array(m + 1).fill(0)); P.push(new Array(m + 1).fill(0)); }
    for (let i = 1; i <= n; i++) { D[i][0] = i; P[i][0] = 1; }
    for (let j = 1; j <= m; j++) { D[0][j] = j; P[0][j] = 2; }
    const cost = (x, y) => x === y ? 0 : rime(x) === rime(y) ? 0.35 : baseRime(x) === baseRime(y) ? 0.6 : 1.2;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const c0 = D[i - 1][j - 1] + cost(a[i - 1], b[j - 1]), c1 = D[i - 1][j] + 1, c2 = D[i][j - 1] + 0.7;
      if (c0 <= c1 && c0 <= c2) { D[i][j] = c0; P[i][j] = 0; } else if (c1 <= c2) { D[i][j] = c1; P[i][j] = 1; } else { D[i][j] = c2; P[i][j] = 2; }
    }
    const pairs = []; let i = n, j = m;
    while (i > 0 || j > 0) {
      const p = P[i][j];
      if (i > 0 && j > 0 && p === 0) { pairs.unshift([i - 1, j - 1]); i--; j--; }
      else if (i > 0 && (j === 0 || p === 1)) { pairs.unshift([i - 1, -1]); i--; }
      else { j--; }
    }
    return pairs;
  }

  /**
   * analyze(target, heard) → {
   *   verdict: 'ok' | 'ln' | 'unclear',
   *   score: 0..1, heard, swaps:[{want, got, kind:'L→N'|'N→L', index}], marks:[{w, st}]
   * }
   */
  function analyze(target, heard) {
    const T = syl(target), Hh = syl(heard);
    if (!Hh.length) return { verdict: 'unclear', score: 0, swaps: [], marks: T.map(w => ({ w, st: 'none' })), heard: '' };
    const pairs = align(T, Hh);
    const marks = [], swaps = [];
    let good = 0, lnTotal = 0, lnGood = 0;
    pairs.forEach(([ti, hi]) => {
      const want = T[ti], got = hi >= 0 ? Hh[hi] : '';
      const iw = initial(want);
      let st = 'miss';
      if (got === want) { st = 'ok'; good++; }
      else if (got && rime(got) === rime(want) && iw !== 'X' && initial(got) !== 'X' && initial(got) !== iw) {
        st = 'swap'; swaps.push({ want, got, kind: iw === 'L' ? 'L→N' : 'N→L', index: ti });
      } else if (got && baseRime(got) === baseRime(want) && initial(got) === iw) { st = 'tone'; good += 0.6; }
      else if (got && rime(got) === rime(want) && iw !== 'X' && initial(got) === 'X') { st = 'other'; }
      if (iw !== 'X') { lnTotal++; if (st === 'ok' || st === 'tone') lnGood++; }
      marks.push({ w: want, got, st });
    });
    const score = T.length ? good / T.length : 0;
    let verdict;
    if (swaps.length) verdict = 'ln';
    else if (score >= 0.999) verdict = 'ok';
    else if (T.length >= 4 && score >= 0.72 && lnGood === lnTotal) verdict = 'ok';          // câu dài: cho phép sai lệch nhỏ không thuộc L/N
    else if (T.length >= 2 && T.length < 4 && score >= 0.66 && lnGood === lnTotal && lnTotal > 0) verdict = 'ok';
    else verdict = 'unclear';
    return { verdict, score, swaps, marks, heard: Hh.join(' ') };
  }

  // ---------- hướng dẫn sửa ----------
  const TIPS = {
    'L→N': {
      title: 'Bạn đang đọc L thành N',
      how: 'Âm L: cong đầu lưỡi chạm vào lợi trên (sau răng cửa), để hơi thoát ra HAI BÊN lưỡi, đường mũi đóng. Kéo dài “lllla” thấy lưỡi rung nhẹ.',
      test: 'Mẹo kiểm tra: bịt mũi rồi đọc “la”. Nếu vẫn đọc rõ là L đúng. Nếu âm bị nghẹt, bí – bạn đang ra N.'
    },
    'N→L': {
      title: 'Bạn đang đọc N thành L',
      how: 'Âm N: áp KÍN đầu lưỡi vào lợi trên, chặn hơi ở miệng, để hơi đi ra đằng MŨI.',
      test: 'Mẹo kiểm tra: đặt ngón tay lên cánh mũi khi đọc “na” – phải thấy mũi rung. Không rung là bạn đang ra L.'
    }
  };

  // ---------- TTS ----------
  const TTS = {
    voice: null, rate: 0.85, enabled: true,
    pick() {
      if (!('speechSynthesis' in window)) return null;
      const vs = speechSynthesis.getVoices().filter(v => /^vi/i.test(v.lang));
      const pref = [/google/i, /hoaimy|hoài my|namminh|nam minh/i, /linh/i, /an\b/i];
      for (const p of pref) { const v = vs.find(v => p.test(v.name)); if (v) return (this.voice = v); }
      return (this.voice = vs[0] || null);
    },
    has() { return !!(this.voice || this.pick()); },
    say(text, opts = {}) {
      return new Promise(res => {
        if (!this.enabled || !('speechSynthesis' in window)) return res();
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'vi-VN'; if (this.voice || this.pick()) u.voice = this.voice;
          u.rate = opts.rate || this.rate; u.pitch = opts.pitch || 1;
          let done = false; const fin = () => { if (!done) { done = true; res(); } };
          u.onend = fin; u.onerror = fin;
          setTimeout(fin, 1500 + text.length * 160);
          speechSynthesis.speak(u);
        } catch (e) { res(); }
      });
    }
  };
  if ('speechSynthesis' in window) { TTS.pick(); speechSynthesis.onvoiceschanged = () => TTS.pick(); }

  // ---------- nhận dạng liên tục ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function Listener(handlers) {
    this.h = handlers || {};
    this.active = false; this.paused = false; this.rec = null; this.finals = ''; this.restarts = 0;
  }
  Listener.supported = !!SR;
  Listener.prototype._make = function () {
    const r = new SR();
    r.lang = 'vi-VN'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 5;
    r.onstart = () => { this.h.state && this.h.state('listening'); };
    r.onaudiostart = () => { this.h.state && this.h.state('listening'); };
    r.onspeechstart = () => { this.h.state && this.h.state('hearing'); };
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alts = []; for (let k = 0; k < res.length; k++) alts.push(res[k].transcript);
        if (res.isFinal) {
          const prev = this.finals;
          this.finals = (this.finals + ' ' + alts[0]).trim();
          this.h.result && this.h.result({ final: true, text: this.finals, alts: alts.map(a => (prev + ' ' + a).trim()), chunk: alts });
        } else interim += res[0].transcript;
      }
      if (interim) this.h.result && this.h.result({ final: false, text: (this.finals + ' ' + interim).trim(), alts: [(this.finals + ' ' + interim).trim()], chunk: [interim] });
    };
    r.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.active = false; this.h.error && this.h.error('denied'); return; }
      this.h.error && this.h.error(e.error);
    };
    r.onend = () => {
      this.rec = null;
      if (this.active && !this.paused) {
        this.restarts++;
        setTimeout(() => this.active && !this.paused && this._start(), this.restarts > 30 ? 800 : 120);
      } else this.h.state && this.h.state(this.paused ? 'paused' : 'off');
    };
    return r;
  };
  Listener.prototype._start = function () {
    if (this.rec) return;
    try { this.rec = this._make(); this.rec.start(); } catch (e) { this.rec = null; }
  };
  Listener.prototype.start = function () { if (!SR) return false; this.active = true; this.paused = false; this._start(); return true; };
  Listener.prototype.stop = function () { this.active = false; this.paused = false; if (this.rec) try { this.rec.abort(); } catch (e) {} this.rec = null; };
  Listener.prototype.pause = function () { this.paused = true; if (this.rec) try { this.rec.abort(); } catch (e) {} };
  Listener.prototype.resume = function () { if (!this.active) return; this.paused = false; this.finals = ''; this._start(); };
  Listener.prototype.reset = function () { this.finals = ''; };

  // ---------- dự phòng: thu âm & gửi máy chủ ----------
  const Recorder = {
    supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    stream: null, rec: null, chunks: [],
    async start() {
      if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
      const mime = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      this.chunks = [];
      this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
      this.rec.ondataavailable = e => e.data && e.data.size && this.chunks.push(e.data);
      this.rec.start();
    },
    stop() {
      return new Promise(res => {
        if (!this.rec || this.rec.state === 'inactive') return res(null);
        this.rec.onstop = () => res(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }));
        this.rec.stop();
      });
    },
    async transcribe(blob) {
      const ext = /mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm';
      const fd = new FormData(); fd.append('audio', blob, 'speech.' + ext);
      const r = await fetch('api/transcribe', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
      return j.text || '';
    },
    release() { if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; } }
  };

  window.LN = { norm, syl, initial, analyze, TIPS, TTS, Listener, Recorder };
})();
