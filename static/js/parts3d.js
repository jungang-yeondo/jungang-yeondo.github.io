/* 중앙연도 부품 3D 뷰어 (three.js r128) — data-model 이름으로 모델 생성 */
(function () {
  if (!window.THREE) return;
  const T = THREE;

  // ---------- 공용: 광택 스테인리스(SUS304) 재질 ----------
  let ENV = null;
  function envMap(renderer) {
    // 뷰어(캔버스)마다 따로 생성: 다른 WebGL 컨텍스트의 텍스처는 공유 불가
    const pm = new T.PMREMGenerator(renderer);
    const s = new T.Scene();
    s.background = new T.Color(0x05070a);
    const strip = (w, h, x, y, z, rx, ry, c) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
    };
    // 공장 천장 형광등 줄 + 창문 + 어두운 바닥 → 반질반질한 반사 대비
    strip(14, 0.5, 0, 6, -2.5, Math.PI / 2, 0, 0xffffff);
    strip(14, 0.5, 0, 6, 0, Math.PI / 2, 0, 0xf4f4f2);
    strip(14, 0.5, 0, 6, 2.5, Math.PI / 2, 0, 0xffffff);
    strip(4, 6, -8, 1.5, 0, 0, Math.PI / 2, 0xd9d9d6);
    strip(1.2, 6, 8, 1.5, -2, 0, -Math.PI / 2, 0xfff1dc);
    strip(1.2, 6, 8, 1.5, 2, 0, -Math.PI / 2, 0xfff1dc);
    strip(3, 3, 0, 1, -8, 0, 0, 0x8e8e8c);
    strip(20, 20, 0, -5, 0, Math.PI / 2, 0, 0x101216);
    return pm.fromScene(s, 0.02).texture;
  }
  function mats() {
    return {
      steel: new T.MeshStandardMaterial({ color: 0xcfcfcc, metalness: 1, roughness: 0.17, side: T.DoubleSide }),
      steel2: new T.MeshStandardMaterial({ color: 0xbdbdba, metalness: 1, roughness: 0.2, side: T.DoubleSide }),
      // 외부관·FR: 내부관보다 어둡고 은은한 무광 SUS
      outer: new T.MeshStandardMaterial({ color: 0x8c8f93, metalness: 0.9, roughness: 0.34, side: T.DoubleSide }),
      rod: new T.MeshStandardMaterial({ color: 0xd8d8d5, metalness: 1, roughness: 0.12 }),
      weld: new T.MeshStandardMaterial({ color: 0x8e939a, metalness: 0.85, roughness: 0.45 }),
    };
  }

  // ---------- 모델: SK 삿갓 (띠 800A 기준 비율) ----------
  function buildSK() {
    const M = mats();
    const g = new T.Group();
    const R_CONE = 625, R_BOT = 575, H_TOP = 165, H_BOT = 150, R_BAND = 400, H_BAND = 100;
    const Y_RIM = 600 - H_TOP;
    const top = new T.Mesh(new T.ConeGeometry(R_CONE, H_TOP, 180, 1, true), M.steel);
    top.position.y = Y_RIM + H_TOP / 2; g.add(top);
    const bot = new T.Mesh(new T.ConeGeometry(R_BOT, H_BOT, 180, 1, true), M.steel2);
    bot.rotation.x = Math.PI; bot.position.y = Y_RIM - H_BOT / 2; g.add(bot);
    const ring = (r, t, y, m) => { const o = new T.Mesh(new T.TorusGeometry(r, t, 10, 220), m); o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o); };
    ring(R_BOT, 4.5, Y_RIM, M.weld);      // 상·하판 테두리 용접
    ring(R_CONE, 3.5, Y_RIM, M.steel);    // 상판 끝 말림
    const seam = (y0, y1, a, R0) => {
      const p = []; for (let i = 0; i <= 20; i++) { const t = i / 20, r = R0 * (1 - t); p.push(new T.Vector3(Math.cos(a) * r, y0 + (y1 - y0) * t, Math.sin(a) * r)); }
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(p), 40, 2, 6, false), M.weld));
    };
    seam(Y_RIM + 1, Y_RIM + H_TOP, 0.6, R_CONE); seam(Y_RIM - 1, Y_RIM - H_BOT, -2.2, R_BOT);
    const band = new T.Mesh(new T.CylinderGeometry(R_BAND, R_BAND, H_BAND, 180, 1, true), M.steel);
    band.position.y = H_BAND / 2; g.add(band);
    ring(R_BAND + 3, 4, 6, M.steel);        // 띠 하단 말림
    ring(R_BAND + 1.5, 2.2, H_BAND, M.weld);
    const rod = (a, b) => {
      const d = b.clone().sub(a), len = d.length(), r = new T.Group();
      r.add(new T.Mesh(new T.CylinderGeometry(6, 6, len * 0.84, 16), M.rod));
      for (const s of [-1, 1]) { const f = new T.Mesh(new T.BoxGeometry(18, len * 0.09, 4), M.rod); f.position.y = s * len * 0.455; r.add(f); }
      r.position.copy(a).add(b).multiplyScalar(0.5);
      r.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
      g.add(r);
    };
    const yLow = (r) => Y_RIM - H_BOT * (1 - r / R_BOT);
    for (let k = 0; k < 4; k++) {
      const ao = k * Math.PI / 2, ai = ao + Math.PI / 4, ro = R_BOT - 35, ri = 150;
      rod(new T.Vector3(Math.cos(ao) * (R_BAND - 6), H_BAND - 4, Math.sin(ao) * (R_BAND - 6)), new T.Vector3(Math.cos(ao) * ro, yLow(ro) - 4, Math.sin(ao) * ro));
      rod(new T.Vector3(Math.cos(ai) * (R_BAND - 6), H_BAND - 4, Math.sin(ai) * (R_BAND - 6)), new T.Vector3(Math.cos(ai) * ri, yLow(ri) - 4, Math.sin(ai) * ri));
    }
    return { obj: g, tilt: 0.16 };
  }


  // ---------- 모델: 977/477 직관 (공기단열 이중관) ----------
  function buildPipe(iv) {
    const M = mats();
    const g = new T.Group();
    const R1 = 150, R2 = 175, L = 480, OUT = 40; // 477 기준: 내부관 480, 외부관 400(-80), D300 / D350(+50A)
    const yT = L / 2, yO = L / 2 - OUT;
    const V = (r, y) => new T.Vector2(r, y);
    // 내부관: 양 끝 10mm 밖으로 꺾음(밑깎이, V밴드 조립용)
    const cyl = (r, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(r, r, y1 - y0, 180, 1, true), m); c.position.y = (y0 + y1) / 2; g.add(c); };
    const ann = (r0, r1, y, m) => { const o = new T.Mesh(new T.RingGeometry(r0, r1, 180), m); o.rotation.x = -Math.PI / 2; o.position.y = y; g.add(o); };
    const ring = (r, t, y, m) => { const o = new T.Mesh(new T.TorusGeometry(r, t, 8, 200), m); o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o); };
    // 내부관 + 양 끝 10mm 밖으로 꺾은 플랜지(밑깎이, V밴드 조립용)
    cyl(R1, -yT, yT, M.steel);
    ann(R1, R1 + 10, yT, M.steel); ann(R1, R1 + 10, -yT, M.steel);
    ring(R1 + 10, 1.2, yT, M.rod); ring(R1 + 10, 1.2, -yT, M.rod);
    // 외부관: 끝에서 20mm 아래 폭 12mm, 깊이 2.5mm 홈 (C카바 체결용)
    const d = 2.5;
    for (const s of [1, -1]) {
      cyl(R2, s > 0 ? yO - 20 : -yO, s > 0 ? yO : -yO + 20, M.outer);
      cyl(R2 - d, s > 0 ? yO - 32 : -yO + 20, s > 0 ? yO - 20 : -yO + 32, M.outer);
      ann(R2 - d, R2, s * (yO - 20), M.outer); ann(R2 - d, R2, s * (yO - 32), M.outer);
    }
    cyl(R2, -yO + 32, yO - 32, M.outer);
    // 공기단열층 틈: 외부관 끝 안쪽을 어둡게 (두 관이 구분되어 보이도록)
    const gapM = new T.MeshStandardMaterial({ color: 0x07090c, metalness: 0, roughness: 1, side: T.DoubleSide });
    for (const s of [1, -1]) {
      ann(R1 + 0.5, R2 - 0.5, s * (yO - 6), gapM);
      const lin = new T.Mesh(new T.CylinderGeometry(R2 - 0.6, R2 - 0.6, 6, 180, 1, true), gapM); lin.position.y = s * (yO - 3); g.add(lin);
    }
    ring(R2, 1, yO, M.rod); ring(R2, 1, -yO, M.rod);
    // 외부관 세로 이음 용접선
    const seam = new T.Mesh(new T.BoxGeometry(3, 2 * yO - 4, 1.2), M.weld);
    seam.position.set(Math.cos(0.4) * (R2 + 0.6), 0, Math.sin(0.4) * (R2 + 0.6)); seam.rotation.y = Math.PI / 2 - 0.4; g.add(seam);
    // 브라켓 (양 끝 4개씩). IV는 중간다리로 보강된 IV 전용 스페이서
    for (const s of [1, -1]) for (let k = 0; k < 4; k++) {
      const grp = new T.Group(); grp.rotation.y = k * Math.PI / 2 + Math.PI / 4;
      const W = iv ? 25 : 22;
      const box = (w, h, d, x, y, z, rx) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), M.rod); m.position.set(x, y, z); if (rx) m.rotation.x = rx; grp.add(m); };
      box(W, 58, 2, 0, s * (yO + 9), R1 + 1.2);                       // 내부관에 붙는 세로판
      box(W, 2, R2 - R1 + 4, 0, s * (yO + 1), (R1 + R2) / 2 + 1);     // 외부관 끝에 걸치는 가로판
      if (iv) {
        box(W, 40, 2, 0, s * (yO - 20), R2 - 1.5);                    // 외부관 안쪽 세로판
        const y0 = s * (yO + 20), y1 = s * (yO - 30), z0 = R1 + 1.2, z1 = R2 - 1.5;
        const len = Math.hypot(y1 - y0, z1 - z0);
        box(W, len, 2, 0, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(z1 - z0, y1 - y0)); // 중간다리 보강
      }
      g.add(grp);
    }
    if (iv) makeFR(g, M, R2 + 1.5, -25, true); // FR 용접 위치: 센터
    return { obj: g, tilt: 0.42 };
  }


  // ---------- FR 유동방지대: 40×3T 앵글을 말아 만든 반쪽 2개 + 엽전(40×40, Ø12) 볼트 체결 ----------
  function makeFR(g, M, R, y0, one) { // one: 한 바퀴를 한 곳만 자른 형태 (IV용)
    const W = 50, TK = 4, gap = 12, gA = 2 * Math.asin(gap / R);
    for (const s0 of (one ? [0] : [0, Math.PI])) {
      const st = s0 + gA / 2, len = (one ? 2 * Math.PI : Math.PI) - gA;
      const band = new T.Mesh(new T.CylinderGeometry(R, R, W, 90, 1, true, st, len), M.outer); band.position.y = y0 + W / 2; g.add(band);
      const bt = new T.Mesh(new T.CylinderGeometry(R + TK, R + TK, W, 90, 1, true, st, len), M.outer); bt.position.y = y0 + W / 2; g.add(bt);
      const fl = new T.Mesh(new T.CylinderGeometry(R + W, R, 0.01, 90, 1, true, st, len), M.outer); fl.position.y = y0; g.add(fl);
      const fl2 = new T.Mesh(new T.CylinderGeometry(R + W, R, 0.01, 90, 1, true, st, len), M.outer); fl2.position.y = y0 + TK; g.add(fl2);
      const edge = new T.Mesh(new T.CylinderGeometry(R + W, R + W, TK, 90, 1, true, st, len), M.rod); edge.position.y = y0 + TK / 2; g.add(edge);
    }
    const sh = new T.Shape(); const h2 = W / 2; sh.moveTo(-h2, -h2); sh.lineTo(h2, -h2); sh.lineTo(h2, h2); sh.lineTo(-h2, h2); sh.lineTo(-h2, -h2); // 엽전 = 링 폭과 같은 크기
    const hole = new T.Path(); hole.absarc(0, 0, 6, 0, Math.PI * 2, true); sh.holes.push(hole);
    const tabG = new T.ExtrudeGeometry(sh, { depth: TK, bevelEnabled: false, curveSegments: 24 }); tabG.translate(0, 0, -TK / 2);
    for (const s0 of (one ? [0] : [0, Math.PI])) {
      const grp = new T.Group(); grp.rotation.y = s0;
      for (const sx of [1, -1]) { const p = new T.Mesh(tabG, M.outer); p.rotation.y = Math.PI / 2; p.position.set(sx * (gap + 1.5), y0 + W / 2, R + W / 2); grp.add(p); }
      const bolt = new T.Mesh(new T.CylinderGeometry(5, 5, gap * 2 + 30, 12), M.rod); bolt.rotation.z = Math.PI / 2; bolt.position.set(0, y0 + W / 2, R + W / 2); grp.add(bolt);
      for (const sx of [1, -1]) { const n = new T.Mesh(new T.CylinderGeometry(9.5, 9.5, 7, 6), M.weld); n.rotation.z = Math.PI / 2; n.position.set(sx * (gap + 3 + 3.5), y0 + W / 2, R + W / 2); grp.add(n); }
      g.add(grp);
    }
  }
  function buildFR() { const M = mats(); const g = new T.Group(); makeFR(g, M, 175, 0); return { obj: g, tilt: 0.55 }; }


  // ---------- 공용: 이중관 한 토막 (y축 방향). lo/hi: 그 끝에 밑깎이·홈·브라켓 마감 ----------
  function doublePipe(gg, M, R1, R2, a0, a1, b0, b1, lo, hi) {
    const cyl = (r, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(r, r, y1 - y0, 160, 1, true), m); c.position.y = (y0 + y1) / 2; gg.add(c); };
    const ann = (r0, r1, y, m) => { const o = new T.Mesh(new T.RingGeometry(r0, r1, 160), m); o.rotation.x = -Math.PI / 2; o.position.y = y; gg.add(o); };
    const ring = (r, t, y, m) => { const o = new T.Mesh(new T.TorusGeometry(r, t, 8, 180), m); o.rotation.x = Math.PI / 2; o.position.y = y; gg.add(o); };
    const gapM = new T.MeshStandardMaterial({ color: 0x07090c, metalness: 0, roughness: 1, side: T.DoubleSide });
    cyl(R1, a0, a1, M.steel);
    const d = 2.5; let s0 = b0, s1 = b1;
    const ends = []; if (lo) ends.push([-1, a0, b0]); if (hi) ends.push([1, a1, b1]);
    for (const [s, a, b] of ends) {
      ann(R1, R1 + 10, a, M.steel); ring(R1 + 10, 1.2, a, M.rod);
      cyl(R2, Math.min(b, b - s * 20), Math.max(b, b - s * 20), M.outer);
      cyl(R2 - d, Math.min(b - s * 20, b - s * 32), Math.max(b - s * 20, b - s * 32), M.outer);
      ann(R2 - d, R2, b - s * 20, M.outer); ann(R2 - d, R2, b - s * 32, M.outer);
      ring(R2, 1, b, M.rod);
      ann(R1 + 0.5, R2 - 0.5, b - s * 6, gapM);
      const lin = new T.Mesh(new T.CylinderGeometry(R2 - 0.6, R2 - 0.6, 6, 160, 1, true), gapM); lin.position.y = b - s * 3; gg.add(lin);
      if (s < 0) s0 = b0 + 32; else s1 = b1 - 32;
      const P = Math.abs(a - b);
      for (let k = 0; k < 4; k++) {
        const grp = new T.Group(); grp.rotation.y = k * Math.PI / 2 + Math.PI / 4;
        const v = new T.Mesh(new T.BoxGeometry(22, P + 18, 2), M.rod); v.position.set(0, b + s * (P - 22) / 2, R1 + 1.2); grp.add(v);
        const h = new T.Mesh(new T.BoxGeometry(22, 2, R2 - R1 + 4), M.rod); h.position.set(0, b + s, (R1 + R2) / 2 + 1); grp.add(h);
        gg.add(grp);
      }
    }
    cyl(R2, s0, s1, M.outer);
  }

  // ---------- 공용: 가지관 (인너는 메인 인너에, 아우트는 메인 아우트에 붙음 / 메인관은 그 자리만 뚫림) ----------
  function holeMat(base, P, u, r, uInv) {
    const m = base.clone();
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uInv = uInv; sh.uniforms.uP = { value: P }; sh.uniforms.uU = { value: u }; sh.uniforms.uR = { value: r };
      sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWP;\nuniform mat4 uInv; uniform vec3 uP; uniform vec3 uU; uniform float uR;\n' +
        sh.fragmentShader.replace('void main() {', 'void main() {\n vec3 lp = (uInv * vec4(vWP, 1.0)).xyz - uP; float tt = dot(lp, uU); if (tt > 0.0 && length(lp - tt * uU) < uR) discard;');
    };
    return m;
  }
  // 메인관 원통(반지름 Rm)과 만나는 곡선(새들)에서 시작해 축 방향 tEnd까지 이어지는 관
  function saddleT(Rm, P, u, r, f) {
    const bx = P.x + r * Math.sin(f) * u.y, bz = r * Math.cos(f);
    return (Math.sqrt(Math.max(Rm * Rm - bz * bz, 0)) - bx) / u.x;
  }
  function saddleTube(g, mat, Rm, P, u, r, tEnd) {
    const N = 180, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N * Math.PI * 2, t0 = saddleT(Rm, P, u, r, f);
      const B = new T.Vector3(P.x + r * Math.sin(f) * u.y, P.y - r * Math.sin(f) * u.x, r * Math.cos(f));
      for (const tt of [t0, tEnd]) pos.push(B.x + tt * u.x, B.y + tt * u.y, B.z);
    }
    for (let i = 0; i < N; i++) { const p = i * 2; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new T.Mesh(geo, mat));
  }
  // 메인 이중관 + 가지관. ang: 메인 축과 가지관 사이 각도, c: 가지관 축이 메인 축과 만나는 높이, extra: 가지관이 메인 밖으로 나오는 길이
  function buildBranched(R1, R2, r1, r2, yT, yO, ang, c, extra, tilt) {
    const M = mats(); const g = new T.Group();
    const P = new T.Vector3(0, c, 0), u = new T.Vector3(Math.sin(ang), Math.cos(ang), 0);
    const uInv = { value: new T.Matrix4() };
    const MM = Object.assign({}, M, { steel: holeMat(M.steel, P, u, r1, uInv), outer: holeMat(M.outer, P, u, r2, uInv) });
    doublePipe(g, MM, R1, R2, -yT, yT, -yO, yO, true, true);
    let tUp = 0; for (let i = 0; i < 180; i++) { const f = i / 180 * Math.PI * 2; tUp = Math.max(tUp, saddleT(R2, P, u, r2, f), saddleT(R1, P, u, r1, f)); }
    const Ls = tUp + 2, Lo = tUp + extra;
    saddleTube(g, M.steel, R1, P, u, r1, Ls);
    saddleTube(g, M.outer, R2, P, u, r2, Ls);
    const bg = new T.Group(); bg.rotation.z = -ang; bg.position.copy(P);
    doublePipe(bg, M, r1, r2, Ls, Lo + 40, Ls, Lo, false, true);
    g.add(bg);
    g.traverse((o) => { if (o.isMesh && (o.material === MM.steel || o.material === MM.outer)) o.onBeforeRender = () => { uInv.value.copy(g.matrixWorld).invert(); }; });
    return { obj: g, tilt };
  }

  // ---------- 모델: MT / NT 90도 합류관 ----------
  // 메인 외부관 길이 = 가지관 관경 + 200, 가지관은 메인 외부관에서 100mm 돌출
  function buildTee(nt) {
    const R1 = 150, R2 = 175, r1 = nt ? 100 : R1, r2 = nt ? 125 : R2;
    const yO = (2 * r2 + 200) / 2;
    return buildBranched(R1, R2, r1, r2, yO + 40, yO, Math.PI / 2, 0, 100, 0.35);
  }

  // ---------- 모델: LT / JT Y형 합류관 (45°) ----------
  // 인너 기준: 메인 인너 길이 = 가지관 관경 × 1.4 + 200 (가지관 구멍 위아래 100씩), 아우트 = 인너 - 80
  function buildY(jt) {
    const R1 = 150, R2 = 175, r1 = jt ? 100 : R1, r2 = jt ? 125 : R2;
    const yT = (2 * r1 * 1.4 + 200) / 2, yO = yT - 40;
    const c = -yT + 100 - R1 + Math.SQRT2 * r1 - 4;   // 인너 구멍 아래끝 = 메인 인너 하단 + 100
    return buildBranched(R1, R2, r1, r2, yT, yO, Math.PI / 4, c, 150, 0.3);
  }

  const MODELS = { sk: buildSK, lt: () => buildY(false), jt: () => buildY(true), mt: () => buildTee(false), nt: () => buildTee(true), pipe977: () => buildPipe(false), iv: () => buildPipe(true), fr: buildFR };

  // ---------- 뷰어 ----------
  function mount(el) {
    const make = MODELS[el.dataset.model]; if (!make) return;
    const canvas = document.createElement('canvas'); el.prepend(canvas);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new T.Scene();
    scene.environment = envMap(renderer);
    scene.add(new T.HemisphereLight(0xffffff, 0x20242c, 0.25));
    const key = new T.DirectionalLight(0xffffff, 0.6); key.position.set(700, 1200, 900); scene.add(key);
    const { obj, tilt } = make();
    const box = new T.Box3().setFromObject(obj); obj.position.sub(box.getCenter(new T.Vector3()));
    const root = new T.Group(); root.add(obj); scene.add(root); root.rotation.set(tilt, 0.5, 0);
    const sphere = box.getBoundingSphere(new T.Sphere());
    const camera = new T.PerspectiveCamera(30, 4 / 3, 1, 50000);
    const halfW = (box.max.x - box.min.x) / 2, halfH = (box.max.y - box.min.y) / 2, tanH = Math.tan(T.MathUtils.degToRad(15));
    const size = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      const d = Math.max(halfW * 1.04 / (tanH * Math.min(camera.aspect, 1.3)), halfH * 1.4 / tanH, sphere.radius * 1.2); camera.position.set(0, sphere.radius * 0.05, d); camera.lookAt(0, 0, 0); };
    size(); window.addEventListener('resize', size);

    let drag = false, lx = 0, ly = 0, vx = 0.004, vy = 0, idle = 999, visible = false;
    el.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; idle = 0; el.setPointerCapture(e.pointerId); el.classList.add('on'); });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      vx = Math.max(-0.06, Math.min(0.06, dx * 0.009)); vy = Math.max(-0.04, Math.min(0.04, dy * 0.009)); root.rotation.y += vx; root.rotation.x = Math.max(-1.45, Math.min(1.45, root.rotation.x + vy));
    });
    const up = () => { drag = false; };
    // 3D 영역을 잡고 움직일 때 페이지 스크롤 막기 (모바일)
    el.addEventListener('touchstart', (e) => { if (e.touches.length === 1) e.preventDefault(); }, { passive: false });
    el.addEventListener('touchmove', (e) => { if (e.touches.length === 1) e.preventDefault(); }, { passive: false });
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(el);
    (function loop() {
      requestAnimationFrame(loop); if (!visible) return;
      if (!drag) { idle++; vx *= 0.95; vy *= 0.9; root.rotation.y += vx; root.rotation.x = Math.max(-1.45, Math.min(1.45, root.rotation.x + vy)); if (idle > 90) root.rotation.y += 0.004; }
      renderer.render(scene, camera);
    })();
  }

  const go = () => document.querySelectorAll('.p3d[data-model]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
