/* =====================================================================
   CÁ CHÉP 3D — WebGL thuần (không cần thư viện)
   Mô hình dựng bằng thủ tục theo hình thái cá chép (Cyprinus carpio):
   thân dày lưng gù, đầu tròn, 2 đôi râu, vây lưng dài, vây đuôi chẻ,
   vây ngực/vây bụng/vây hậu môn, nắp mang, vảy lớn xếp lớp, đường bên.
   Chuyển động bơi uốn sóng thân – đuôi được tính trong vertex shader.
   ===================================================================== */
(function () {
  'use strict';

  // ---------- toán ma trận tối giản ----------
  const M = {
    ident() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
      return o;
    },
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
      o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
      return o;
    },
    lookAt(e, c, u) {
      let zx = e[0]-c[0], zy = e[1]-c[1], zz = e[2]-c[2];
      let l = Math.hypot(zx, zy, zz); zx/=l; zy/=l; zz/=l;
      let xx = u[1]*zz - u[2]*zy, xy = u[2]*zx - u[0]*zz, xz = u[0]*zy - u[1]*zx;
      l = Math.hypot(xx, xy, xz); xx/=l; xy/=l; xz/=l;
      const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
      return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
        -(xx*e[0]+xy*e[1]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]), 1]);
    },
    trs(tx, ty, tz, rx, ry, rz, s) {
      const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
      // R = Ry * Rz * Rx
      const r00 = cy*cz, r01 = -cy*sz*cx + sy*sx, r02 = cy*sz*sx + sy*cx;
      const r10 = sz,    r11 = cz*cx,             r12 = -cz*sx;
      const r20 = -sy*cz, r21 = sy*sz*cx + cy*sx, r22 = -sy*sz*sx + cy*cx;
      return new Float32Array([r00*s,r10*s,r20*s,0, r01*s,r11*s,r21*s,0, r02*s,r12*s,r22*s,0, tx,ty,tz,1]);
    },
    xform(m, p) {
      const x = m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], y = m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
            z = m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14], w = m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];
      return [x / w, y / w, z / w];
    }
  };

  // ---------- hình thái thân cá ----------
  const HMAX = 0.36;          // nửa chiều cao lớn nhất
  const SPEAK = 0.40;         // vị trí lưng cao nhất (tính từ mõm)
  const XN = 1.0, XT = -0.92; // mõm → cuống đuôi
  const sx = s => XN + (XT - XN) * s;
  function half(s) {          // nửa chiều cao
    if (s <= SPEAK) { const t = 1 - s / SPEAK; return HMAX * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.5) * (0.78 + 0.22 * (s / SPEAK)); }
    const t = (s - SPEAK) / (1 - SPEAK);
    return 0.085 + (HMAX - 0.085) * (0.5 + 0.5 * Math.cos(Math.PI * Math.pow(t, 0.85)));
  }
  function headRound(s) { return s < 0.035 ? Math.pow(s / 0.035, 0.5) : 1; }
  function H(s) { return half(s) * headRound(s); }
  function W(s) { return H(s) * (s < 0.25 ? 0.78 - 0.5 * s : 0.66 - 0.2 * (s - 0.25)); } // dẹt bên
  function CY(s) { return -0.035 * Math.sin(Math.PI * Math.min(1, s * 1.2)); }         // bụng sâu hơn
  const TOPK = 1.08, BOTK = 0.92;                                                        // lưng gù
  const yTop = s => CY(s) + H(s) * TOPK;
  const yBot = s => CY(s) - H(s) * BOTK;

  // ---------- tạo lưới ----------
  function Mesh() { this.p = []; this.n = []; this.u = []; this.i = []; }
  Mesh.prototype.v = function (p, n, u) { this.p.push(...p); this.n.push(...n); this.u.push(...u); return this.p.length / 3 - 1; };

  function buildBody() {
    const m = new Mesh(), NS = 90, NA = 40;
    const P = (s, a) => {
      const sn = Math.sin(a), cs = Math.cos(a);
      const hy = sn >= 0 ? H(s) * TOPK : H(s) * BOTK;
      // miệng: lõm nhẹ phía trước – dưới
      return [sx(s), CY(s) + hy * sn, W(s) * cs];
    };
    for (let i = 0; i <= NS; i++) {
      const s = Math.pow(i / NS, 1.15);
      for (let j = 0; j <= NA; j++) {
        const a = (j / NA) * Math.PI * 2;
        const p = P(s, a);
        const ds = 0.002, da = 0.002;
        const p1 = P(Math.min(1, s + ds), a), p0 = P(Math.max(0, s - ds), a);
        const q1 = P(s, a + da), q0 = P(s, a - da);
        const tx = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]], ty = [q1[0]-q0[0], q1[1]-q0[1], q1[2]-q0[2]];
        let n = [ty[1]*tx[2]-ty[2]*tx[1], ty[2]*tx[0]-ty[0]*tx[2], ty[0]*tx[1]-ty[1]*tx[0]];
        let l = Math.hypot(...n);
        if (l < 1e-9 || s < 0.004) n = [1, 0, 0]; else n = n.map(v => v / l);
        if (n[0] * (p[0] - 0) + n[1] * (p[1] - CY(s)) + n[2] * p[2] < 0 && s > 0.01) n = n.map(v => -v);
        m.v(p, n, [s, j / NA]);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j, b = a + NA + 1;
      m.i.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return m;
  }

  // vây: lưới phẳng từ đường gốc base(t) tới mép ngoài tip(t)
  function buildFin(base, tip, NT, NU, side) {
    const m = new Mesh();
    for (let i = 0; i <= NT; i++) {
      const t = i / NT, b = base(t), e = tip(t);
      for (let j = 0; j <= NU; j++) {
        const u = j / NU;
        const p = [b[0] + (e[0] - b[0]) * u, b[1] + (e[1] - b[1]) * u, b[2] + (e[2] - b[2]) * u];
        m.v(p, side || [0, 0, 1], [t, u]);
      }
    }
    for (let i = 0; i < NT; i++) for (let j = 0; j < NU; j++) {
      const a = i * (NU + 1) + j, b = a + NU + 1;
      m.i.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return m;
  }

  function buildSphere(c, r, NS, NA) {
    const m = new Mesh();
    for (let i = 0; i <= NS; i++) {
      const th = i / NS * Math.PI;
      for (let j = 0; j <= NA; j++) {
        const ph = j / NA * Math.PI * 2;
        const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
        m.v([c[0] + n[0] * r, c[1] + n[1] * r, c[2] + n[2] * r], n, [i / NS, j / NA]);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j, b = a + NA + 1;
      m.i.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return m;
  }

  function buildTube(curve, r0, r1, NS, NA) {
    const m = new Mesh();
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, c = curve(t), c2 = curve(Math.min(1, t + 0.01)), c1 = curve(Math.max(0, t - 0.01));
      let T = [c2[0]-c1[0], c2[1]-c1[1], c2[2]-c1[2]]; const l = Math.hypot(...T); T = T.map(v => v / l);
      let A = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let N1 = [T[1]*A[2]-T[2]*A[1], T[2]*A[0]-T[0]*A[2], T[0]*A[1]-T[1]*A[0]]; const l1 = Math.hypot(...N1); N1 = N1.map(v => v / l1);
      const N2 = [T[1]*N1[2]-T[2]*N1[1], T[2]*N1[0]-T[0]*N1[2], T[0]*N1[1]-T[1]*N1[0]];
      const r = r0 + (r1 - r0) * t;
      for (let j = 0; j <= NA; j++) {
        const a = j / NA * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const n = [N1[0]*ca + N2[0]*sa, N1[1]*ca + N2[1]*sa, N1[2]*ca + N2[2]*sa];
        m.v([c[0] + n[0]*r, c[1] + n[1]*r, c[2] + n[2]*r], n, [t, j / NA]);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j, b = a + NA + 1;
      m.i.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return m;
  }

  function buildModel() {
    const parts = [];
    parts.push({ kind: 0, mesh: buildBody() });

    // Vây lưng dài (đặc trưng cá chép): gốc từ s=.30 → .70, phần trước cao có gai cứng
    const dS0 = 0.30, dS1 = 0.70;
    parts.push({ kind: 1, fin: 0, mesh: buildFin(
      t => { const s = dS0 + (dS1 - dS0) * t; return [sx(s), yTop(s) - 0.012, 0]; },
      t => { const s = dS0 + (dS1 - dS0) * t; const h = 0.30 * Math.pow(1 - t, 0.9) * Math.min(1, t * 9 + 0.35) + 0.075; return [sx(s) - 0.10 - 0.05 * t, yTop(s) + h, 0]; },
      30, 6) });

    // Vây đuôi chẻ đôi
    parts.push({ kind: 1, fin: 1, mesh: buildFin(
      t => { const v = t * 2 - 1; return [XT - 0.03, CY(1) + v * 0.075, 0]; },
      t => { const v = t * 2 - 1, a = Math.abs(v); const x = XT - 0.30 - 0.36 * Math.pow(a, 0.7) + 0.10 * Math.pow(a, 6); return [x, CY(1) + v * (0.44 + 0.02 * a), 0]; },
      30, 8) });

    // Vây hậu môn
    const aS0 = 0.76, aS1 = 0.86;
    parts.push({ kind: 1, fin: 2, mesh: buildFin(
      t => { const s = aS0 + (aS1 - aS0) * t; return [sx(s), yBot(s) + 0.01, 0]; },
      t => { const s = aS0 + (aS1 - aS0) * t; return [sx(s) - 0.10, yBot(s) - 0.17 * (1 - t * 0.7), 0]; },
      10, 5) });

    // Vây ngực & vây bụng (đôi)
    for (const side of [1, -1]) {
      const sP = 0.25;
      parts.push({ kind: 1, fin: 3, side, mesh: buildFin(
        t => { const s = sP + 0.06 * t; return [sx(s), yBot(s) + 0.07, side * (W(s) * 0.82)]; },
        t => { const s = sP + 0.06 * t; const L = 0.30 * (1 - Math.pow(Math.abs(t - 0.25) * 1.3, 2)); return [sx(s) - L * 0.95, yBot(s) - L * 0.35, side * (W(s) * 0.82 + L * 0.35)]; },
        8, 5, [0, -0.3, side]) });
      const sV = 0.55;
      parts.push({ kind: 1, fin: 4, side, mesh: buildFin(
        t => { const s = sV + 0.05 * t; return [sx(s), yBot(s) + 0.03, side * W(s) * 0.55]; },
        t => { const s = sV + 0.05 * t; const L = 0.22 * (1 - Math.pow(Math.abs(t - 0.3) * 1.3, 2)); return [sx(s) - L * 0.9, yBot(s) - L * 0.5, side * (W(s) * 0.55 + L * 0.25)]; },
        8, 5, [0, -0.5, side]) });

      // Mắt
      const sE = 0.085;
      parts.push({ kind: 2, side, mesh: buildSphere([sx(sE), CY(sE) + H(sE) * 0.30, side * W(sE) * 0.80], 0.045, 16, 20) });

      // 2 đôi râu: đôi dài ở khoé miệng, đôi ngắn ở môi trên
      const mx = sx(0.025), my = CY(0.025) - H(0.03) * 0.25;
      parts.push({ kind: 3, side, mesh: buildTube(
        t => [mx - 0.02 - 0.12 * t, my - 0.02 - 0.12 * t + 0.05 * t * t, side * (0.035 + 0.06 * t)], 0.009, 0.0025, 12, 6) });
      parts.push({ kind: 3, side, mesh: buildTube(
        t => [mx + 0.01 - 0.03 * t, my + 0.03 - 0.06 * t, side * (0.025 + 0.04 * t)], 0.006, 0.002, 8, 6) });
    }
    return parts;
  }

  // ---------- shader ----------
  const VS = `
  precision highp float;
  attribute vec3 aP; attribute vec3 aN; attribute vec2 aU;
  uniform mat4 uProj, uView, uModel;
  uniform float uTime, uSwim, uKind, uFin, uSide, uFlap;
  varying vec3 vN; varying vec3 vW; varying vec2 vU; varying vec3 vL; varying vec3 vLN;
  void main(){
    vLN = aN;
    vec3 p = aP; vec3 n = aN;
    // sóng bơi: biên độ tăng dần về phía đuôi
    float d = clamp((1.0 - p.x) / 2.6, 0.0, 1.2);
    float amp = uSwim * (0.012 + 0.20 * d * d);
    float ph = 6.0 * d - uTime * (4.0 + 5.0 * uSwim);
    p.z += amp * sin(ph);
    float slope = amp * 6.0 / 2.6 * cos(ph);
    n = normalize(vec3(n.x + n.z * slope, n.y, n.z));
    if (uKind == 1.0 && (uFin == 3.0 || uFin == 4.0)) {
      // vây ngực/bụng quạt nước
      float f = sin(uTime * 5.0 + uFin) * 0.10 * aU.y * uFlap;
      p.z += uSide * f; p.y += f * 0.4;
    }
    if (uKind == 1.0 && uFin == 0.0) p.z += sin(uTime * 3.0 + aU.x * 4.0) * 0.012 * aU.y;
    if (uKind == 3.0) { p.y += sin(uTime * 2.5 + aU.x * 3.0) * 0.012 * aU.x; }
    vec4 w = uModel * vec4(p, 1.0);
    vW = w.xyz; vN = normalize(mat3(uModel) * n); vU = aU; vL = aP;
    gl_Position = uProj * uView * w;
  }`;

  const FS = `
  precision highp float;
  varying vec3 vN; varying vec3 vW; varying vec2 vU; varying vec3 vL; varying vec3 vLN;
  uniform vec3 uEye; uniform float uKind, uFin, uTime, uGlow, uHurt;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(uEye - vW);
    vec3 L1 = normalize(vec3(0.4, 1.0, 0.7));
    vec3 L2 = normalize(vec3(-0.8, 0.3, -0.5));
    vec3 col; float alpha = 1.0; float spec = 0.0; float shin = 40.0; float metal = 0.0;

    if (uKind == 0.0) {
      float s = vU.x; float a = vU.y * 6.2831853;
      float up = sin(a);                         // >0: lưng, <0: bụng
      vec3 back  = vec3(0.72, 0.12, 0.03);
      vec3 flank = vec3(1.0, 0.42, 0.08);
      vec3 gold  = vec3(1.00, 0.72, 0.22);
      vec3 belly = vec3(1.00, 0.88, 0.62);
      col = mix(flank, back, smoothstep(0.05, 0.9, up));
      col = mix(col, gold, (1.0 - smoothstep(-0.30, 0.10, up)) * 0.8);
      col = mix(col, belly, 1.0 - smoothstep(-0.88, -0.50, up));
      // vảy lớn xếp lớp (từ sau nắp mang tới cuống đuôi)
      float sc = smoothstep(0.21, 0.30, s);
      float rows = 26.0, cols = 13.0;
      vec2 g = vec2((s - 0.2) * rows, (a / 6.2831853) * cols * 2.0);
      float odd = mod(floor(g.x), 2.0);
      g.y += odd * 0.5;
      vec2 f = fract(g) - vec2(0.15, 0.5);
      float r = length(vec2(f.x * 1.25, f.y));
      float edge = smoothstep(0.38, 0.52, r);
      float rim  = smoothstep(0.30, 0.46, r) - smoothstep(0.46, 0.55, r);
      float jit = hash(floor(g)) * 0.12;
      col *= mix(1.0, 0.78 - jit, edge * sc);
      col += gold * rim * 0.35 * sc;
      metal = 0.55 * sc + 0.2;
      // đường bên
      float lat = abs(up - 0.05 + 0.10 * s);
      col *= 1.0 - (1.0 - smoothstep(0.0, 0.025, lat)) * 0.35 * sc * step(0.5, fract(g.x));
      // nắp mang
      float og = abs(s - (0.205 + 0.03 * cos(a)));
      col *= 1.0 - (1.0 - smoothstep(0.0, 0.008, og)) * 0.45;
      // miệng hơi sẫm
      col *= 1.0 - (1.0 - smoothstep(0.0, 0.03, s)) * 0.25;
      spec = 0.9; shin = 55.0;
    } else if (uKind == 1.0) {
      // vây: màu cam đỏ trong mờ với tia vây
      float t = vU.x, u = vU.y;
      float rays = uFin == 1.0 ? 16.0 : (uFin == 0.0 ? 14.0 : 7.0);
      float ray = smoothstep(0.65, 1.0, abs(sin(t * rays * 3.14159)));
      col = mix(vec3(1.0, 0.52, 0.16), vec3(0.95, 0.22, 0.08), u);
      col = mix(col, vec3(1.0, 0.75, 0.35), ray * 0.35);
      alpha = mix(0.97, 0.62, u) * (0.82 + 0.18 * ray);
      if (uFin == 1.0) { alpha *= 1.0 - smoothstep(0.88, 1.0, u) * 0.6; }
      spec = 0.35; shin = 20.0;
    } else if (uKind == 2.0) {
      // mắt: tròng vàng – con ngươi đen – điểm sáng
      vec3 sideDir = normalize(vec3(0.15, 0.1, sign(vL.z)));
      float c = dot(normalize(vLN), sideDir);
      col = mix(vec3(0.9, 0.7, 0.2), vec3(0.02), smoothstep(0.80, 0.86, c));
      col = mix(vec3(0.95, 0.85, 0.6), col, smoothstep(0.35, 0.45, c));
      spec = 1.5; shin = 120.0;
    } else {
      col = vec3(0.95, 0.55, 0.25); spec = 0.3;
    }

    float dif = max(dot(N, L1), 0.0) * 0.72 + max(dot(N, L2), 0.0) * 0.22 + (uKind == 1.0 ? 0.6 : 0.34);
    vec3 Hh = normalize(L1 + V);
    float sp = pow(max(dot(N, Hh), 0.0), shin) * spec;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 c = col * dif + mix(vec3(1.0), vec3(1.0, 0.8, 0.4), metal) * sp + vec3(1.0, 0.7, 0.3) * fres * (uKind == 0.0 ? 0.22 : 0.3);
    c += vec3(1.0, 0.85, 0.3) * uGlow * (0.4 + fres);
    c = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))) * vec3(0.7, 0.75, 0.95), uHurt * 0.6);
    gl_FragColor = vec4(c, alpha);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  // ---------- lớp công khai ----------
  function Carp3D(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
               canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
    if (!gl) throw new Error('WebGL không khả dụng');
    this.gl = gl; this.canvas = canvas;
    this.uint32 = !!gl.getExtension('OES_element_index_uint');
    const pr = gl.createProgram();
    gl.attachShader(pr, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    this.pr = pr;
    this.loc = {};
    ['aP', 'aN', 'aU'].forEach(n => this.loc[n] = gl.getAttribLocation(pr, n));
    ['uProj', 'uView', 'uModel', 'uTime', 'uSwim', 'uKind', 'uFin', 'uSide', 'uFlap', 'uEye', 'uGlow', 'uHurt'].forEach(n => this.loc[n] = gl.getUniformLocation(pr, n));

    this.parts = buildModel().map(pt => {
      const m = pt.mesh;
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      const nV = m.p.length / 3, data = new Float32Array(nV * 8);
      for (let i = 0; i < nV; i++) {
        data.set([m.p[i*3], m.p[i*3+1], m.p[i*3+2], m.n[i*3], m.n[i*3+1], m.n[i*3+2], m.u[i*2], m.u[i*2+1]], i * 8);
      }
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      const big = nV > 65535;
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? new Uint32Array(m.i) : new Uint16Array(m.i), gl.STATIC_DRAW);
      return { kind: pt.kind, fin: pt.fin || 0, side: pt.side || 0, vb, ib, count: m.i.length, type: big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
    });

    // trạng thái hoạt cảnh
    this.state = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0, scale: 1, swim: 0.7, glow: 0, hurt: 0 };
    this.anim = null;
    this.t0 = performance.now();
    this.time = 0;
    this.cam = { eye: [0.35, 0.5, 3.6], at: [0, 0.05, 0] };
    this.resize();
  }

  Carp3D.prototype.resize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.aspect = w / Math.max(1, h);
  };

  // các hành động
  Carp3D.prototype.play = function (name, dur) {
    this.anim = { name, t: 0, dur: dur || ({ jump: 1.25, hurt: 0.9, cheer: 1.2, dragon: 2.6, wiggle: 0.6 })[name] || 1 };
  };

  Carp3D.prototype.screenPos = function (local) {
    const p = M.xform(this.mvp || M.ident(), local || [1, 0, 0]);
    return { x: (p[0] * 0.5 + 0.5) * this.canvas.clientWidth, y: (0.5 - p[1] * 0.5) * this.canvas.clientHeight };
  };

  Carp3D.prototype.frame = function (now) {
    const gl = this.gl, st = this.state;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    this.time += dt * (1 + st.swim * 0.3);
    // vị trí đặt cá: lệch trái màn hình
    const base = { x: this.aspect > 1.2 ? -0.7 : -0.2, y: -0.05 };
    let x = base.x, y = base.y + Math.sin(this.time * 1.6) * 0.04, pitch = Math.sin(this.time * 1.6 + 1) * 0.04, yaw = 0, roll = 0, glow = st.glow * 0.95, hurt = st.hurt * 0.93, scale = 1;
    let swim = st.swim;
    if (this.anim) {
      const a = this.anim; a.t += dt; const k = Math.min(1, a.t / a.dur);
      if (a.name === 'jump') {
        const arc = Math.sin(Math.PI * k);
        y += arc * 1.25; x += Math.sin(Math.PI * k) * 0.55;
        pitch = Math.cos(Math.PI * k) * 0.85; roll = Math.sin(2 * Math.PI * k) * 0.15;
        swim = 1.6; glow = Math.max(glow, arc * 0.6);
      } else if (a.name === 'hurt') {
        x -= Math.sin(Math.PI * k) * 0.35; yaw = Math.sin(k * 30) * 0.25 * (1 - k);
        hurt = Math.max(hurt, 1 - k); swim = 0.3;
      } else if (a.name === 'wiggle') {
        yaw = Math.sin(k * 20) * 0.12 * (1 - k); swim = 1.4;
      } else if (a.name === 'cheer') {
        roll = Math.sin(k * Math.PI * 2) * 0.6; y += Math.sin(Math.PI * k) * 0.3; glow = Math.max(glow, 0.5 * (1 - k)); swim = 1.3;
      } else if (a.name === 'dragon') {
        y += Math.sin(Math.PI * Math.min(1, k * 1.4)) * 1.5; pitch = 0.9 * Math.cos(Math.PI * k); x += k * 1.4;
        glow = 1.2; swim = 2.2; scale = 1 + k * 0.25;
      }
      if (k >= 1) this.anim = null;
    }
    st.glow = glow; st.hurt = hurt;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.pr);

    const fov = this.aspect < 0.8 ? 0.95 : 0.62;
    const proj = M.persp(fov, this.aspect, 0.1, 50);
    const view = M.lookAt(this.cam.eye, this.cam.at, [0, 1, 0]);
    const model = M.trs(x, y, 0, 0, yaw - 0.32, pitch, scale * (this.aspect < 0.8 ? 0.72 : 0.82));
    this.mvp = M.mul(proj, M.mul(view, model));
    gl.uniformMatrix4fv(this.loc.uProj, false, proj);
    gl.uniformMatrix4fv(this.loc.uView, false, view);
    gl.uniformMatrix4fv(this.loc.uModel, false, model);
    gl.uniform3fv(this.loc.uEye, this.cam.eye);
    gl.uniform1f(this.loc.uTime, this.time);
    gl.uniform1f(this.loc.uSwim, swim);
    gl.uniform1f(this.loc.uFlap, 1);
    gl.uniform1f(this.loc.uGlow, glow);
    gl.uniform1f(this.loc.uHurt, hurt);
    // vẽ phần đục trước, vây trong mờ sau
    const order = this.parts.filter(p => p.kind !== 1).concat(this.parts.filter(p => p.kind === 1));
    for (const p of order) {
      if (p.kind === 1) { gl.disable(gl.CULL_FACE); gl.depthMask(false); } else { gl.disable(gl.CULL_FACE); gl.depthMask(true); }
      gl.bindBuffer(gl.ARRAY_BUFFER, p.vb);
      gl.enableVertexAttribArray(this.loc.aP); gl.vertexAttribPointer(this.loc.aP, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(this.loc.aN); gl.vertexAttribPointer(this.loc.aN, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(this.loc.aU); gl.vertexAttribPointer(this.loc.aU, 2, gl.FLOAT, false, 32, 24);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib);
      gl.uniform1f(this.loc.uKind, p.kind);
      gl.uniform1f(this.loc.uFin, p.fin);
      gl.uniform1f(this.loc.uSide, p.side);
      gl.drawElements(gl.TRIANGLES, p.count, p.type, 0);
    }
    gl.depthMask(true);
    return { x, y };
  };

  window.Carp3D = Carp3D;
})();
