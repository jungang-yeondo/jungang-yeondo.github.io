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
    s.background = new T.Color(0x1f1f1e);
    const strip = (w, h, x, y, z, rx, ry, c) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
    };
    // 공장 천장 형광등 줄 + 창문 + 어두운 바닥 → 반질반질한 반사 대비
    strip(14, 0.5, 0, 6, -2.5, Math.PI / 2, 0, 0xffffff);
    strip(14, 0.5, 0, 6, 0, Math.PI / 2, 0, 0xf4f4f2);
    strip(14, 0.5, 0, 6, 2.5, Math.PI / 2, 0, 0xffffff);
    strip(4, 6, -8, 1.5, 0, 0, Math.PI / 2, 0xb4b4b4);
    strip(1.2, 6, 8, 1.5, -2, 0, -Math.PI / 2, 0xeef1f4);
    strip(1.2, 6, 8, 1.5, 2, 0, -Math.PI / 2, 0xeef1f4);
    strip(10, 4, 0, 1, -8, 0, 0, 0x8e8e8e);
    strip(10, 4, 0, 1, 8, 0, 0, 0x5e5e5e);
    strip(20, 20, 0, -5, 0, Math.PI / 2, 0, 0x262625);
    return pm.fromScene(s, 0.02).texture;
  }
  // 압연 결: 아주 옇은 줄무늬 거칠기 (실제 판재처럼 빛이 고르게 번지게)
  let BR = null;
  (function () {
    const c = document.createElement('canvas'); c.width = 8; c.height = 256; const x = c.getContext('2d');
    for (let y = 0; y < 256; y++) { const v = 200 + Math.round((Math.random() - 0.5) * 70); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(0, y, 8, 1); }
    BR = new T.CanvasTexture(c); BR.wrapS = BR.wrapT = T.RepeatWrapping; BR.repeat.set(1, 3);
  })();
  function mats() {
    return {
      steel: new T.MeshStandardMaterial({ color: 0x9a9c9d, metalness: 1, roughness: 0.18, roughnessMap: BR, side: T.DoubleSide }),
      steel2: new T.MeshStandardMaterial({ color: 0x909293, metalness: 1, roughness: 0.22, roughnessMap: BR, side: T.DoubleSide }),
      // 외부관·FR: 내부관보다 어둡고 은은한 무광 SUS
      outer: new T.MeshStandardMaterial({ color: 0x87898a, metalness: 1, roughness: 0.3, roughnessMap: BR, side: T.DoubleSide }),
      rod: new T.MeshStandardMaterial({ color: 0xa0a2a3, metalness: 1, roughness: 0.15 }),
      weld: new T.MeshStandardMaterial({ color: 0x9a9185, metalness: 0.85, roughness: 0.5 }),
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


  // ---------- FR 유동방지대: 40×3T 앵글을 말아 만든 반쪽 2개 + 엽전(40×40, Ø12 구멍) — 볼트·너트 없이 구멍만 ----------
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

  // ---------- 공용: 외부관 세로 이음 용접선 (ang: 관 둘레 각도 — 가지관·점검구 등 달린 부속의 반대편은 Math.PI) ----------
  function vSeam(g, M, R, y0, y1, ang) {
    const s = new T.Mesh(new T.BoxGeometry(3, y1 - y0, 1.2), M.weld);
    s.position.set(Math.cos(ang) * (R + 0.6), (y0 + y1) / 2, Math.sin(ang) * (R + 0.6)); s.rotation.y = Math.PI / 2 - ang; g.add(s);
  }

  // 띠·호퍼 세로 용접선 (Rt: 위쪽 반지름, Rb: 아래쪽 반지름, sa: 관 둘레 각도 — 한 모델 안에서는 같은 각도로 한 줄로 맞춤)
  function sSeam(g, M, Rt, Rb, y0, y1, sa) {
    const H = y1 - y0, mr = (Rt + Rb) / 2 + 0.6;
    const s = new T.Mesh(new T.BoxGeometry(3, Math.hypot(H, Rt - Rb), 1.2), M.weld);
    s.position.set(Math.sin(sa) * mr, (y0 + y1) / 2, Math.cos(sa) * mr); s.rotation.set(0, sa, 0); s.rotateX(Math.atan2(Rt - Rb, H)); g.add(s);
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
    const sm = new T.Mesh(geo, mat); g.add(sm);
    // 가지관 쪽 끝(tEnd)은 이어지는 관과 매끈하게 붙으므로 경계선 없음
    const onEnd = (x, y) => Math.abs((x - P.x) * u.x + (y - P.y) * u.y - tEnd) < 0.5;
    sm.userData.edgeSkip = (x1, y1, z1, x2, y2) => onEnd(x1, y1) && onEnd(x2, y2);
  }
  // 메인 이중관 + 가지관. ang: 메인 축과 가지관 사이 각도, c: 가지관 축이 메인 축과 만나는 높이, extra: 가지관이 메인 밖으로 나오는 길이
  function buildBranched(R1, R2, r1, r2, yT, yO, ang, c, extra, tilt) {
    const M = mats(); const g = new T.Group();
    const P = new T.Vector3(0, c, 0), u = new T.Vector3(Math.sin(ang), Math.cos(ang), 0);
    const uInv = { value: new T.Matrix4() };
    const MM = Object.assign({}, M, { steel: holeMat(M.steel, P, u, r1, uInv), outer: holeMat(M.outer, P, u, r2, uInv) });
    doublePipe(g, MM, R1, R2, -yT, yT, -yO, yO, true, true);
    vSeam(g, M, R2, -yO + 4, yO - 4, Math.PI); // 가지관 반대편 세로 용접선
    let tUp = 0; for (let i = 0; i < 180; i++) { const f = i / 180 * Math.PI * 2; tUp = Math.max(tUp, saddleT(R2, P, u, r2, f), saddleT(R1, P, u, r1, f)); }
    const Ls = tUp + 2, Lo = tUp + extra;
    saddleTube(g, M.steel, R1, P, u, r1, Ls);
    saddleTube(g, M.outer, R2, P, u, r2, Ls);
    const bg = new T.Group(); bg.rotation.z = -ang; bg.position.copy(P);
    doublePipe(bg, M, r1, r2, Ls, Lo + 40, Ls, Lo, false, true);
    // 새들관과 이어지는 가지관 시작 끝단은 경계선 없음
    bg.children.forEach((o) => {
      if (!o.isMesh || o.geometry.type !== 'CylinderGeometry') return;
      const h = o.geometry.parameters.height / 2;
      if (Math.abs(o.position.y - h - Ls) < 0.5) o.userData.edgeSkip = (x1, y1, z1, x2, y2) => y1 < -h + 0.5 && y2 < -h + 0.5;
    });
    // 가지관 세로 용접선: 윗면(메인관 반대쪽 가장자리)을 따라 새들 끝부터 가지관 끝까지
    vSeam(bg, M, r2, saddleT(R2, P, u, r2, Math.PI * 1.5) + 1, Lo - 4, Math.PI);
    g.add(bg);
    g.traverse((o) => { if (o.isMesh && (o.material === MM.steel || o.material === MM.outer)) o.onBeforeRender = () => { uInv.value.copy(g.matrixWorld).invert(); }; });
    return { obj: g, tilt };
  }

  // ---------- 모델: MT / NT 90도 합류관 ----------
  // 메인 외부관 길이 = 가지관 관경 + 200, 가지관은 메인 외부관에서 100mm 돌출
  function buildTee(nt) {
    const R1 = 150, R2 = 175, r1 = nt ? 75 : R1, r2 = nt ? 100 : R2;
    const yO = (2 * r2 + 200) / 2;
    return buildBranched(R1, R2, r1, r2, yO + 40, yO, Math.PI / 2, 0, 100, 0.35);
  }

  // ---------- 모델: LT / JT Y형 합류관 (45°) ----------
  // 가지관 아래 접합부 = 메인 하단 + 100, 위쪽 사타구니(가지관 윗선이 메인에 붙는 점)에서
  // 메인관 끝까지와 가지관 끝까지의 짧은 면 길이를 같게(200) 맞춤
  function buildY(jt) {
    const R1 = 150, R2 = 175, r1 = jt ? 75 : R1, r2 = jt ? 100 : R2;
    const S = 200, open = 2 * Math.SQRT2 * r2;           // 메인 외부관 위 가지관 구멍 높이
    const yO = (100 + open + S) / 2, yT = yO + 40;
    const c = -yO + 100 - R2 + Math.SQRT2 * r2;          // 가지관 축이 메인 축과 만나는 높이
    return buildBranched(R1, R2, r1, r2, yT, yO, Math.PI / 4, c, S, 0.3);
  }

  // ---------- 모델: EL90 / EL45 곡관 (마디형, 이중관) ----------
  function mitreTube(g, mat, pts, r) {
    const Z = new T.Vector3(0, 0, 1), N = 140;
    const nrm = (k) => {
      if (k === 0) return pts[1].clone().sub(pts[0]).normalize();
      if (k === pts.length - 1) return pts[k].clone().sub(pts[k - 1]).normalize();
      const a = pts[k].clone().sub(pts[k - 1]).normalize(), b = pts[k + 1].clone().sub(pts[k]).normalize();
      return a.add(b).normalize();
    };
    for (let s = 0; s < pts.length - 1; s++) {
      const A = pts[s], B = pts[s + 1], d = B.clone().sub(A).normalize();
      const v = new T.Vector3().crossVectors(d, Z).normalize();
      const nA = nrm(s), nB = nrm(s + 1), pos = [], idx = [];
      for (let j = 0; j <= N; j++) {
        const f = j / N * Math.PI * 2;
        const off = Z.clone().multiplyScalar(Math.cos(f) * r).add(v.clone().multiplyScalar(Math.sin(f) * r));
        for (const [P, n] of [[A, nA], [B, nB]]) {
          const q = P.clone().add(off); const tt = -(q.clone().sub(P).dot(n)) / d.dot(n); q.add(d.clone().multiplyScalar(tt)); pos.push(q.x, q.y, q.z);
        }
      }
      for (let j = 0; j < N; j++) { const p = j * 2; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      g.add(new T.Mesh(geo, mat));
    }
  }
  function buildElbow(deg) {
    const M = mats(); const g = new T.Group();
    const R1 = 150, R2 = 175, Rb = R2 * 1.5, th = deg * Math.PI / 180, n = Math.round(deg / 45) + 1, u = th / (n - 1);
    const arc = (f) => new T.Vector3(Rb - Rb * Math.cos(f), Rb * Math.sin(f), 0);
    const tan = (f) => new T.Vector3(Math.sin(f), Math.cos(f), 0);
    const meet = (p1, d1, p2, d2) => { const den = d1.x * d2.y - d1.y * d2.x; const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / den; return p1.clone().add(d1.clone().multiplyScalar(t)); };
    const pts = [arc(0)];
    for (let i = 0; i < n - 1; i++) pts.push(meet(arc(i * u), tan(i * u), arc((i + 1) * u), tan((i + 1) * u)));
    pts.push(arc(th));
    mitreTube(g, M.steel, pts, R1);
    mitreTube(g, M.outer, pts, R2);
    const E = 60;
    const sg = new T.Group(); sg.rotation.z = Math.PI; sg.position.copy(arc(0));
    doublePipe(sg, M, R1, R2, 0, E + 40, 0, E, false, true); g.add(sg);
    const eg = new T.Group(); eg.rotation.z = -th; eg.position.copy(arc(th));
    doublePipe(eg, M, R1, R2, 0, E + 40, 0, E, false, true); g.add(eg);
    // 세로 용접선: 마디마다 같은 둘레 위치(옆면)를 따라 꺾이며 이어지고, 양 끝 직관까지 한 줄
    const Zs = new T.Vector3(0, 0, R2 + 0.6);
    for (let s = 0; s < pts.length - 1; s++) {
      const qa = pts[s].clone().add(Zs), qb = pts[s + 1].clone().add(Zs);
      const w = new T.Mesh(new T.BoxGeometry(3, qa.distanceTo(qb) + 1, 1.2), M.weld);
      w.position.copy(qa).add(qb).multiplyScalar(0.5); w.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), qb.clone().sub(qa).normalize()); g.add(w);
    }
    vSeam(sg, M, R2, 0, E - 4, Math.PI / 2); vSeam(eg, M, R2, 0, E - 4, Math.PI / 2);
    return { obj: g, tilt: 0.25 };
  }

  // ---------- 모델: AG / SS 길이 조절관 (슬립섹션 속관) + AG 카바 ----------
  // 속관: 한쪽만 밑깎이, 지름 8 줄여(D292) 다른 관 안쪽으로 끼움
  function buildAGin() {
    const M = mats(); const g = new T.Group();
    const rs = 146, L = 477;
    g.add(new T.Mesh(new T.CylinderGeometry(rs, rs, L, 160, 1, true), M.steel));
    const fl = new T.Mesh(new T.RingGeometry(rs, rs + 10, 160), M.steel); fl.rotation.x = -Math.PI / 2; fl.position.y = L / 2; g.add(fl);
    const rim = new T.Mesh(new T.TorusGeometry(rs + 10, 1.2, 8, 180), M.rod); rim.rotation.x = Math.PI / 2; rim.position.y = L / 2; g.add(rim);
    const seam = new T.Mesh(new T.BoxGeometry(3, L - 4, 1.2), M.weld); seam.position.set(Math.sin(0.5) * (rs + 0.6), 0, Math.cos(0.5) * (rs + 0.6)); seam.rotation.y = 0.5; g.add(seam);
    return { obj: g, tilt: 0.3 };
  }
  // 공용 분할 카바 (체결 전, 벌어진 상태): 스텐 판을 말아 만든 것
  // 한쪽 끝: 겹침판 + 브라켓 / 다른 쪽 끝: 브라켓. 브라켓은 위·아래 2조, 볼트 구멍 2개씩
  // floorR: 있으면 아래쪽에 작은 관 쪽으로 체결되는 발판(도넛 판)을 같은 각도로 벌려서 붙임
  function makeCover(g, M, rc, Hc, floorR) {
    const open = 0.5, ov = 60 / rc, tB = open, tA = Math.PI * 2 - open;
    g.add(new T.Mesh(new T.CylinderGeometry(rc, rc, Hc, 180, 1, true, tB, tA - tB), M.outer));
    g.add(new T.Mesh(new T.CylinderGeometry(rc - 1.6, rc - 1.6, Hc, 40, 1, true, tA - 0.01, ov), M.outer)); // 겹침판
    const step = new T.Mesh(new T.BoxGeometry(1.6, Hc, 2), M.rod); step.position.set(Math.sin(tA) * (rc - 0.8), 0, Math.cos(tA) * (rc - 0.8)); step.rotation.y = tA; g.add(step);
    if (floorR) {
      for (const dy of [0, 2]) { const f = new T.Mesh(new T.RingGeometry(floorR, rc, 120, 1, tB - Math.PI / 2, tA - tB), M.outer); f.rotation.x = -Math.PI / 2; f.position.y = -Hc / 2 + dy; g.add(f); }
    }
    const sh = new T.Shape(); sh.moveTo(0, -55); sh.lineTo(12, -55); sh.lineTo(22, -42); sh.lineTo(22, 42); sh.lineTo(12, 55); sh.lineTo(0, 55); sh.lineTo(0, -55);
    for (const v of [25, -25]) { const h = new T.Path(); h.absarc(12, v, 4.5, 0, Math.PI * 2, true); sh.holes.push(h); }
    const pg = new T.ExtrudeGeometry(sh, { depth: 2.5, bevelEnabled: false, curveSegments: 16 }); pg.translate(0, 0, -1.25);
    const yy = Math.min(80, Hc / 2 - 60);
    for (const th of [tB + 0.03, tA - 0.03]) for (const yc of [Hc / 2 - yy, -Hc / 2 + yy]) {
      const grp = new T.Group(); grp.rotation.y = th;
      const p = new T.Mesh(pg, M.outer); p.rotation.y = -Math.PI / 2; p.position.set(0, yc, rc - 1); grp.add(p);
      g.add(grp);
    }
  }
  // AG 카바: 이중관일 때 아우트(D350)에 덮음
  function buildAGcv() { const M = mats(); const g = new T.Group(); makeCover(g, M, 178, 420); return { obj: g, tilt: 0.3 }; }

  // ---------- 모델: SR 직각형 확대 이음관 ----------
  // 속관: 큰 관 띠(100) + 도넛 판 + 작은 관 띠(100), 양 끝 밑깎이
  function buildSRin() {
    const M = mats(); const g = new T.Group();
    const Rb = 230, Rs = 140, Hb = 100;
    const cyl = (r, y0, y1) => { const c = new T.Mesh(new T.CylinderGeometry(r, r, y1 - y0, 160, 1, true), M.steel); c.position.y = (y0 + y1) / 2; g.add(c); };
    const ann = (r0, r1, y, m) => { const o = new T.Mesh(new T.RingGeometry(r0, r1, 160), m || M.steel); o.rotation.x = -Math.PI / 2; o.position.y = y; g.add(o); };
    const ring = (r, t, y, m) => { const o = new T.Mesh(new T.TorusGeometry(r, t, 8, 180), m); o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o); };
    cyl(Rb, 0, Hb); cyl(Rs, -Hb, 0);
    sSeam(g, M, Rb, Rb, 2, Hb - 2, 0.5); sSeam(g, M, Rs, Rs, -Hb + 2, -2, 0.5); // 세로 용접선 (한 줄)
    ann(Rs, Rb, 0); ann(Rs, Rb, 2);                       // 도넛 판
    ring(Rb, 1.6, 1, M.weld); ring(Rs, 1.6, 0, M.weld);  // 용접선
    ann(Rb, Rb + 10, Hb); ring(Rb + 10, 1.2, Hb, M.rod);  // 위 밑깎이
    ann(Rs, Rs + 10, -Hb); ring(Rs + 10, 1.2, -Hb, M.rod); // 아래 밑깎이
    return { obj: g, tilt: 0.35, zoom: 1.45 };
  }
  // SR 카바: 큰 관 아우트(D510)를 덮고, 아래 발판은 작은 관 아우트(D330)까지
  function buildSRcv() { const M = mats(); const g = new T.Group(); makeCover(g, M, 258, 300, 168); return { obj: g, tilt: 0.3, zoom: 1.35 }; }

  // ---------- 모델: TR 호퍼형 확대 이음관 (단관 / 이중관) ----------
  // SR의 도넛 판 대신 경사(호퍼). 이중관은 카바 대신 아웃트가 같이 경사로 따라감
  function buildTRs() {
    const M = mats(); const g = new T.Group();
    const Rb = 230, Rs = 140;
    const cyl = (r, y0, y1) => { const c = new T.Mesh(new T.CylinderGeometry(r, r, y1 - y0, 160, 1, true), M.steel); c.position.y = (y0 + y1) / 2; g.add(c); };
    const ann = (r0, r1, y) => { const o = new T.Mesh(new T.RingGeometry(r0, r1, 160), M.steel); o.rotation.x = -Math.PI / 2; o.position.y = y; g.add(o); };
    const ring = (r, t, y, m) => { const o = new T.Mesh(new T.TorusGeometry(r, t, 8, 180), m); o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o); };
    cyl(Rb, 130, 200);
    const cone = new T.Mesh(new T.CylinderGeometry(Rb, Rs, 190, 160, 1, true), M.steel); cone.position.y = 35; g.add(cone);
    cyl(Rs, -130, -60);   // 상부 띠와 같은 높이(70)
    sSeam(g, M, Rb, Rb, 132, 198, 0.5); sSeam(g, M, Rb, Rs, -60, 130, 0.5); sSeam(g, M, Rs, Rs, -128, -62, 0.5); // 세로 용접선 (한 줄)
    ring(Rb, 1.6, 130, M.weld); ring(Rs, 1.6, -60, M.weld);
    ann(Rb, Rb + 10, 200); ring(Rb + 10, 1.2, 200, M.rod);
    ann(Rs, Rs + 10, -130); ring(Rs + 10, 1.2, -130, M.rod);
    return { obj: g, tilt: 0.35, zoom: 1.35 };
  }
  function buildTRd() {
    const M = mats(); const g = new T.Group();
    const Rb1 = 230, Rs1 = 140, d = 25;
    doublePipe(g, M, Rb1, Rb1 + d, 140, 240, 140, 200, false, true);     // 큰 쪽 끝
    doublePipe(g, M, Rs1, Rs1 + d, -210, -110, -170, -110, true, false); // 작은 쪽 끝
    const ci = new T.Mesh(new T.CylinderGeometry(Rb1, Rs1, 250, 160, 1, true), M.steel); ci.position.y = 15; g.add(ci);
    const co = new T.Mesh(new T.CylinderGeometry(Rb1 + d, Rs1 + d, 250, 160, 1, true), M.outer); co.position.y = 15; g.add(co);
    sSeam(g, M, Rb1 + d, Rb1 + d, 144, 196, 0.5); sSeam(g, M, Rb1 + d, Rs1 + d, -110, 140, 0.5); sSeam(g, M, Rs1 + d, Rs1 + d, -166, -114, 0.5); // 세로 용접선 (한 줄)
    const ring = (r, y) => { const o = new T.Mesh(new T.TorusGeometry(r, 1.6, 8, 180), M.weld); o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o); };
    ring(Rb1 + d, 140); ring(Rs1 + d, -110);
    return { obj: g, tilt: 0.35, zoom: 1.3 };
  }

  // ---------- 모델: FD 장비 연결용 사각 플랜지 (사각 / 호퍼) ----------
  // 위: 70 띠(예: D500), 사각형은 띠 + 사각판(띠 지름 + 50) + 사각 옆면, 바닥: 볼트 구멍 있는 사각 후렌지
  function fdBase(g, M, Rt, half) {
    // 띠 70 + 위 밑깎이
    const band = new T.Mesh(new T.CylinderGeometry(Rt, Rt, 70, 160, 1, true), M.steel); band.position.y = 335; g.add(band);
    sSeam(g, M, Rt, Rt, 302, 368, 0.5); // 띠 세로 용접선
    const fl = new T.Mesh(new T.RingGeometry(Rt, Rt + 10, 160), M.steel); fl.rotation.x = -Math.PI / 2; fl.position.y = 370; g.add(fl);
    const rim = new T.Mesh(new T.TorusGeometry(Rt + 10, 1.2, 8, 180), M.rod); rim.rotation.x = Math.PI / 2; rim.position.y = 370; g.add(rim);
    // 바닥 후렌지 (현장마다 다름: 보기 쉬운 형태)
    const F = half + 50, sh = new T.Shape();
    sh.moveTo(-F, -F); sh.lineTo(F, -F); sh.lineTo(F, F); sh.lineTo(-F, F); sh.lineTo(-F, -F);
    const hole = new T.Path(); hole.moveTo(-half, -half); hole.lineTo(-half, half); hole.lineTo(half, half); hole.lineTo(half, -half); hole.lineTo(-half, -half); sh.holes.push(hole);
    const hc = half + 25;
    for (const t of [-0.8, -0.27, 0.27, 0.8]) for (const [x, y] of [[t * half, hc], [t * half, -hc], [hc, t * half], [-hc, t * half]]) { const h = new T.Path(); h.absarc(x, y, 9, 0, Math.PI * 2, true); sh.holes.push(h); }
    for (const [x, y] of [[hc, hc], [-hc, hc], [hc, -hc], [-hc, -hc]]) { const h = new T.Path(); h.absarc(x, y, 9, 0, Math.PI * 2, true); sh.holes.push(h); }
    const fg = new T.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: false, curveSegments: 16 });
    const flange = new T.Mesh(fg, M.outer); flange.rotation.x = -Math.PI / 2; flange.position.y = -8; g.add(flange);
  }
  function buildFDsq() {
    const M = mats(); const g = new T.Group();
    const Rt = 250, top = Rt + 25, half = 450;   // 띠 D500 → 사각판 550×550, 바닥 900×900
    fdBase(g, M, Rt, half);
    const flat = M.steel.clone(); flat.flatShading = true;
    // 사각판(띠 지름 + 50) 가운데 원형 구멍
    const ps = new T.Shape(); ps.moveTo(-top, -top); ps.lineTo(top, -top); ps.lineTo(top, top); ps.lineTo(-top, top); ps.lineTo(-top, -top);
    const ph = new T.Path(); ph.absarc(0, 0, Rt, 0, Math.PI * 2, true); ps.holes.push(ph);
    const plate = new T.Mesh(new T.ShapeGeometry(ps, 64), flat); plate.rotation.x = -Math.PI / 2; plate.position.y = 300; g.add(plate);
    // 사각 옆면: 사각판 ~ 바닥 후렌지
    const side = new T.Mesh(new T.CylinderGeometry(top * Math.SQRT2, half * Math.SQRT2, 300, 4, 1, true), flat);
    side.rotation.y = Math.PI / 4; side.position.y = 150; g.add(side);
    // 꺾인 모서리 경계선: 반사 때문에 면끼리 같은 밝기로 보이는 각도에서도 형태가 보이도록
    const edgeM = new T.MeshStandardMaterial({ color: 0x8a857d, metalness: 0.85, roughness: 0.5 }); // 모서리 용접선: 가늘고 은은하게
    const line = (a, b) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A);
      const m = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, d.length(), 8), edgeM); m.userData.noEdge = true; m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m); };
    const cs = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    cs.forEach(([x, z], i) => { const [x2, z2] = cs[(i + 1) % 4];
      line([x * top, 300, z * top], [x * half, 0.5, z * half]);            // 옆면끼리 꺾인 모서리
      line([x * top, 300, z * top], [x2 * top, 300, z2 * top]);             // 사각판 ~ 옆면
      line([x * half, 0.5, z * half], [x2 * half, 0.5, z2 * half]); });     // 옆면 ~ 바닥 후렌지
    return { obj: g, tilt: 0.45, zoom: 0.8 };
  }
  function buildFDhp() {
    const M = mats(); const g = new T.Group();
    const Rt = 250, half = 450;
    fdBase(g, M, Rt, half);
    // 호퍼(원형→사각 변환): 각 변은 평평한 삼각면, 모서리는 판을 말아서 만든 원뿔면(라운드)
    const MS = 32, pos = [], idx = [], add = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; };
    const ring = []; for (let k = 0; k < 4 * MS; k++) { const f = k * (Math.PI / 2) / MS; ring.push(add(Rt * Math.cos(f), 300, Rt * Math.sin(f))); }
    const R_ = (k) => ring[((k % (4 * MS)) + 4 * MS) % (4 * MS)];
    const corner = (q) => { const f = q * Math.PI / 2 + Math.PI / 4; return [half * Math.sign(Math.cos(f)), 0, half * Math.sign(Math.sin(f))]; };
    for (let q = 0; q < 4; q++) {
      const C = corner(q);
      for (let i = 0; i < MS; i++) { const c = add(C[0], C[1], C[2]); idx.push(c, R_(q * MS + i), R_(q * MS + i + 1)); }   // 모서리 원뿔면
      const P = corner(q - 1 < 0 ? 3 : q - 1); const c1 = add(P[0], P[1], P[2]), c2 = add(C[0], C[1], C[2]);
      idx.push(c1, R_(q * MS), c2);                                                                                   // 변의 평면 삼각형
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    // 호퍼는 면이 넓어 반사가 너무 밝음 → 조금 어둡고 덜 반짝이게
    const hopM = new T.MeshStandardMaterial({ color: 0x8c8e8f, metalness: 1, roughness: 0.28, side: T.DoubleSide });
    g.add(new T.Mesh(geo, hopM));
    // 경계선: 평면 삼각형 ~ 모서리 라운드, 바닥 후렌지, 위 띠 이음
    const edgeM = new T.MeshStandardMaterial({ color: 0x8a857d, metalness: 0.85, roughness: 0.5 }); // 모서리 용접선: 가늘고 은은하게
    const line = (a, b) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A);
      const m = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, d.length(), 8), edgeM); m.userData.noEdge = true; m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m); };
    for (let q = 0; q < 4; q++) {
      const C = corner(q), N = corner((q + 1) % 4), f0 = q * Math.PI / 2, f1 = (q + 1) * Math.PI / 2;
      line([C[0], 0.5, C[2]], [Rt * Math.cos(f0), 300, Rt * Math.sin(f0)]);
      line([C[0], 0.5, C[2]], [Rt * Math.cos(f1), 300, Rt * Math.sin(f1)]);
      line([C[0], 0.5, C[2]], [N[0], 0.5, N[2]]);
    }
    const seamT = new T.Mesh(new T.TorusGeometry(Rt, 1.4, 8, 180), edgeM); seamT.rotation.x = Math.PI / 2; seamT.position.y = 300; g.add(seamT);
    return { obj: g, tilt: 0.45, zoom: 1.5 };
  }

  // ---------- 모델: CF 장비 연결용 원형 플랜지 ----------
  // 원형 후렌지(볼트 구멍) 위에 띠 하나, 띠 위 끝 밑깎이
  function buildCF() {
    const M = mats(); const g = new T.Group();
    const Rt = 250, Hb = 110, Ro = 340;
    const band = new T.Mesh(new T.CylinderGeometry(Rt, Rt, Hb, 160, 1, true), M.steel); band.position.y = Hb / 2; g.add(band);
    sSeam(g, M, Rt, Rt, 2, Hb - 2, 0.5); // 띠 세로 용접선
    const fl = new T.Mesh(new T.RingGeometry(Rt, Rt + 10, 160), M.steel); fl.rotation.x = -Math.PI / 2; fl.position.y = Hb; g.add(fl);
    const rim = new T.Mesh(new T.TorusGeometry(Rt + 10, 1.2, 8, 180), M.rod); rim.rotation.x = Math.PI / 2; rim.position.y = Hb; g.add(rim);
    const weld = new T.Mesh(new T.TorusGeometry(Rt + 1, 1.8, 8, 180), M.weld); weld.rotation.x = Math.PI / 2; weld.position.y = 0; g.add(weld);
    const sh = new T.Shape(); sh.absarc(0, 0, Ro, 0, Math.PI * 2, false);
    const inner = new T.Path(); inner.absarc(0, 0, Rt, 0, Math.PI * 2, true); sh.holes.push(inner);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8, h = new T.Path(); h.absarc(Math.cos(a) * 300, Math.sin(a) * 300, 10, 0, Math.PI * 2, true); sh.holes.push(h); }
    const fg = new T.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: false, curveSegments: 64 });
    const flange = new T.Mesh(fg, M.outer); flange.rotation.x = -Math.PI / 2; flange.position.y = -8; g.add(flange);
    return { obj: g, tilt: 0.45, zoom: 1.05 };
  }

  // ---------- 모델: DV477 유속 조절관 (수동 댐퍼) ----------
  // 이중관 477 + 인너를 관통하는 환봉 + 내경보다 30 작은 원판(작은 브라켓으로 환봉에 끼워 용접) + 아우트의 손잡이(OPEN/SHUT 눈금)
  function buildDV() {
    const M = mats(); const g = new T.Group();
    const R1 = 150, R2 = 175;
    // 관은 반투명으로: 안쪽 댐퍼 원판이 열리고 닫히는 모습이 보이도록
    const see = (m, o) => { const c = m.clone(); c.transparent = true; c.opacity = o; c.depthWrite = false; return c; };
    const MP = Object.assign({}, M, { steel: see(M.steel, 0.28), outer: see(M.outer, 0.22), rod: see(M.rod, 0.5) });
    doublePipe(g, MP, R1, R2, -240, 240, -200, 200, true, true);
    // 손잡이 반대편 세로 용접선: 내부가 잘 보이도록 가늘고 반투명하게, 경계선 없이
    const dvs = new T.Mesh(new T.BoxGeometry(1.5, 392, 0.6), see(M.weld, 0.3)); dvs.position.set(-(R2 + 0.4), 0, 0); dvs.rotation.y = Math.PI / 2; dvs.userData.noEdge = true; g.add(dvs);
    // 환봉
    // 손잡이 쪽 아우트 밖에서 시작해 반대편 인너 벽에서 멈춤
    const sx0 = -R1, sx1 = R2 + 12;
    const shaft = new T.Mesh(new T.CylinderGeometry(6, 6, sx1 - sx0, 16), M.rod); shaft.rotation.z = Math.PI / 2; shaft.position.x = (sx0 + sx1) / 2; g.add(shaft);
    // 댐퍼 원판 + 브라켓 (환봉과 함께 회전)
    const dmp = new T.Group(); g.add(dmp);
    const disk = new T.Mesh(new T.CylinderGeometry(R1 - 15, R1 - 15, 3, 96), M.steel); disk.renderOrder = 2; dmp.add(disk);
    for (const x of [-80, 0, 80]) { const b = new T.Mesh(new T.BoxGeometry(24, 8, 22), M.outer); b.position.set(x, 4, 0); dmp.add(b); }
    // ---- 손잡이 (도면 기준 디테일) ----
    const PX = R2 + 1, PW = 130, PH = 120, PY = -10;
    const rr = (w, h, r) => { const s = new T.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
    const toYZ = (mesh, x) => { mesh.rotation.y = Math.PI / 2; mesh.position.x = x; return mesh; };
    // 받침판 (둥근 사각) + 양옆 관 쪽으로 꺾인 날개
    const pl = toYZ(new T.Mesh(new T.ExtrudeGeometry(rr(PW, PH, 10), { depth: 2, bevelEnabled: false }), M.outer), PX); pl.position.y = PY; g.add(pl);
    for (const s of [1, -1]) { const w = new T.Mesh(new T.BoxGeometry(14, PH - 6, 2), M.outer); w.position.set(PX - 6, PY, s * (PW / 2 + 1)); w.rotation.y = s * 0.35; g.add(w); }
    // 눈금판: 반원 눈금 + OPEN / SHUT + 위쪽 지시 삼각형
    const K = 2, cv = document.createElement('canvas'); cv.width = PW * K; cv.height = PH * K; const x = cv.getContext('2d');
    x.fillStyle = '#aeb3b9'; x.fillRect(0, 0, cv.width, cv.height);
    const cx = cv.width / 2, cy = (PH / 2 + PY) * K;
    x.strokeStyle = '#30343b'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 44 * K, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
    for (let k = 0; k <= 8; k++) { const an = Math.PI * 1.15 + k * Math.PI * 0.7 / 8, L = k % 4 ? 6 : 10; x.beginPath(); x.moveTo(cx + Math.cos(an) * 44 * K, cy + Math.sin(an) * 44 * K); x.lineTo(cx + Math.cos(an) * (44 + L) * K, cy + Math.sin(an) * (44 + L) * K); x.stroke(); }
    x.font = 'bold ' + 9 * K + 'px sans-serif'; x.textAlign = 'center';
    x.save(); x.translate(cx - 48 * K, cy - 2 * K); x.rotate(-1.1); x.fillStyle = '#30343b'; x.fillText('OPEN', 0, 0); x.restore();
    x.save(); x.translate(cx + 48 * K, cy - 2 * K); x.rotate(1.1); x.fillStyle = '#b3262e'; x.fillText('SHUT', 0, 0); x.restore();
    const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
    const label = toYZ(new T.Mesh(new T.PlaneGeometry(PW - 8, PH - 8), new T.MeshStandardMaterial({ map: tex, metalness: 0.5, roughness: 0.45 })), PX + 2.2);
    label.scale.set(PW / (PW - 8), PH / (PH - 8), 1); label.scale.set(1, 1, 1); label.position.y = PY; g.add(label);
    // 가이드 호 (레버가 지나가는 고정판)
    const guide = toYZ(new T.Mesh(new T.RingGeometry(34, 46, 40, 1, -Math.PI / 2 - 0.9, 1.8), M.rod), PX + 3.5); g.add(guide);
    const guide2 = toYZ(new T.Mesh(new T.RingGeometry(34, 46, 40, 1, -Math.PI / 2 - 0.9, 1.8), M.rod), PX + 2.8); guide2.rotation.y = -Math.PI / 2; g.add(guide2);
    // 레버 (환봉 끝, 원판과 같이 돌아감)
    const lev = new T.Group(); lev.position.x = PX + 6; g.add(lev);
    const hub = new T.Mesh(new T.CylinderGeometry(15, 15, 8, 32), M.rod); hub.rotation.z = Math.PI / 2; lev.add(hub);
    const nut = new T.Mesh(new T.CylinderGeometry(8, 8, 6, 6), M.weld); nut.rotation.z = Math.PI / 2; nut.position.x = 7; lev.add(nut);
    const ls = new T.Shape(); ls.moveTo(-11, 0); ls.lineTo(-11, -112); ls.absarc(0, -112, 11, Math.PI, 0, false); ls.lineTo(11, 0); ls.lineTo(-11, 0);
    const slot = new T.Path(); slot.moveTo(-2, -55); slot.lineTo(-2, -110); slot.absarc(0, -110, 2, Math.PI, 0, false); slot.lineTo(2, -55); slot.lineTo(-2, -55); ls.holes.push(slot);
    const arm = new T.Mesh(new T.ExtrudeGeometry(ls, { depth: 4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 2, curveSegments: 16 }), M.rod);
    arm.rotation.y = Math.PI / 2; arm.position.x = 2; lev.add(arm);
    // 지시침: 허브 위쪽으로 뾰족하게, 눈금을 가리킴 (레버와 반대 방향)
    const nd = new T.Shape(); nd.moveTo(-7, 12); nd.lineTo(7, 12); nd.lineTo(0, 40); nd.lineTo(-7, 12);
    const needle = new T.Mesh(new T.ExtrudeGeometry(nd, { depth: 2.5, bevelEnabled: false }), M.weld); needle.rotation.y = Math.PI / 2; needle.position.x = 4; lev.add(needle);
    let a = 0, target = 0;   // 0 = SHUT(닫힘), π/2 = OPEN(완전 열림)
    const apply = () => { dmp.rotation.x = -a; lev.rotation.x = -Math.PI / 4 + a; }; // SHUT: 지시침이 SHUT 쪽, OPEN: 90° 돌아 OPEN 쪽
    apply();
    g.userData.tick = () => { if (Math.abs(target - a) > 0.001) { a += (target - a) * 0.08; apply(); } };
    return { obj: g, tilt: 0.55, actions: [['OPEN', () => { target = Math.PI / 2; }], ['SHUT', () => { target = 0; }]], start: 1 };
  }

  // ---------- 모델: CH477 점검구 ----------
  // 이중관 477 센터에 Ø100 체크홀: 인너에서 시작해 공기단열층(25)을 지나 아우트 밖으로 75 돌출, 끝에 원형 후렌지
  function buildCH() {
    const M = mats(); const g = new T.Group();
    const R1 = 150, R2 = 175, rc = 50, out = 75;
    const P = new T.Vector3(0, 0, 0), u = new T.Vector3(1, 0, 0), uInv = { value: new T.Matrix4() };
    const MM = Object.assign({}, M, { steel: holeMat(M.steel, P, u, rc, uInv), outer: holeMat(M.outer, P, u, rc, uInv) });
    doublePipe(g, MM, R1, R2, -240, 240, -200, 200, true, true);
    vSeam(g, M, R2, -196, 196, Math.PI); // 점검구 반대편 세로 용접선
    const xe = R2 + out;
    saddleTube(g, M.steel, R1, P, u, rc, xe);
    // 아우트와 만나는 용접선
    const pts = []; for (let i = 0; i <= 96; i++) { const f = i / 96 * Math.PI * 2, y = rc * Math.sin(f) * -1, z = rc * Math.cos(f); pts.push(new T.Vector3(Math.sqrt(R2 * R2 - z * z) + 0.8, y, z)); }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 128, 1.6, 6, true), M.weld));
    // 끝 원형 후렌지 (볼트 구멍 6개)
    const sh = new T.Shape(); sh.absarc(0, 0, rc + 38, 0, Math.PI * 2, false);
    const hin = new T.Path(); hin.absarc(0, 0, rc, 0, Math.PI * 2, true); sh.holes.push(hin);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, h = new T.Path(); h.absarc(Math.cos(a) * (rc + 22), Math.sin(a) * (rc + 22), 5, 0, Math.PI * 2, true); sh.holes.push(h); }
    const fl = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false, curveSegments: 48 }), M.outer);
    fl.rotation.y = Math.PI / 2; fl.position.x = xe - 4; g.add(fl);
    g.traverse((o) => { if (o.isMesh && (o.material === MM.steel || o.material === MM.outer)) o.onBeforeRender = () => { uInv.value.copy(g.matrixWorld).invert(); }; });
    return { obj: g, tilt: 0.3, zoom: 1.1 };
  }

  // ---------- 모델: DS477 응축수 배출관 ----------
  // 477 이중관 중앙에 25A 니쁠을 인너 벽까지 닿게 용접 (인너 안쪽으로는 돌출 없음)
  function buildDS(vert) {
    const M = mats(); const g = new T.Group();
    const R1 = 150, R2 = 175, rn = 17;
    const P = new T.Vector3(0, 0, 0), u = new T.Vector3(1, 0, 0), uInv = { value: new T.Matrix4() };
    const MM = Object.assign({}, M, { steel: holeMat(M.steel, P, u, rn, uInv), outer: holeMat(M.outer, P, u, rn, uInv) });
    doublePipe(g, MM, R1, R2, -240, 240, -200, 200, true, true);
    vSeam(g, M, R2, -196, 196, Math.PI); // 니쁠 반대편 세로 용접선
    const xw = R2 + 10, xe = xw + 30;
    saddleTube(g, M.rod, R1, P, u, rn, xw); // 민자: 인너 벽면에서 시작 → 아우트 밖 10
    const dark = new T.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.3, roughness: 0.8, side: T.BackSide });
    const along = (geo, x0, x1, mat) => { const m = new T.Mesh(geo, mat); m.rotation.z = Math.PI / 2; m.position.x = (x0 + x1) / 2; g.add(m); return m; };
    along(new T.CylinderGeometry(rn - 1.2, rn - 1.2, xe - xw, 32, 1, true), xw, xe, M.rod); // 나사부
    for (let k = 0; k < 12; k++) { const tr = new T.Mesh(new T.TorusGeometry(rn - 1, 1.1, 6, 40), M.rod); tr.rotation.y = Math.PI / 2; tr.position.x = xw + 3 + k * 2.2; g.add(tr); }
    along(new T.CylinderGeometry(rn - 4, rn - 4, xe - R1, 32, 1, true), R1, xe, dark); // 관통 구멍
    const endR = new T.Mesh(new T.RingGeometry(rn - 4, rn - 1.2, 32), M.rod); endR.rotation.y = Math.PI / 2; endR.position.x = xe; g.add(endR);
    const inR = new T.Mesh(new T.RingGeometry(rn - 4, rn, 32), M.rod); inR.rotation.y = -Math.PI / 2; inR.position.x = R1 + 0.2; g.add(inR); // 인너 벽면과 같은 높이(튀어나옴 없음)
    // 아우트와 만나는 용접선
    const pts = []; for (let i = 0; i <= 96; i++) { const f = i / 96 * Math.PI * 2, z = (rn + 1) * Math.cos(f); pts.push(new T.Vector3(Math.sqrt(R2 * R2 - z * z) + 0.8, -(rn + 1) * Math.sin(f), z)); }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 128, 1.6, 6, true), M.weld));
    if (vert) {
      // 수직관: 벽을 타고 흐르는 물을 받는 도넛 판(니쁠 구멍 바닥 높이) + 안쪽 고임턱(니쁠 구멍보다 높게)
      const yb = -(rn - 4), wP = 35, hL = 40, tk = 2;
      const plate = new T.Mesh(new T.RingGeometry(R1 - wP, R1, 160), M.steel); plate.rotation.x = -Math.PI / 2; plate.position.y = yb; g.add(plate);
      const plateU = new T.Mesh(new T.RingGeometry(R1 - wP, R1, 160), M.steel2); plateU.rotation.x = Math.PI / 2; plateU.position.y = yb - tk; g.add(plateU);
      const lip = new T.Mesh(new T.CylinderGeometry(R1 - wP, R1 - wP, hL + tk, 160, 1, true), M.steel); lip.position.y = yb - tk + (hL + tk) / 2; g.add(lip);
      const lipT = new T.Mesh(new T.TorusGeometry(R1 - wP + 0.4, 1, 6, 160), M.steel); lipT.rotation.x = Math.PI / 2; lipT.position.y = yb + hL; g.add(lipT);
      const wl = new T.Mesh(new T.TorusGeometry(R1 - 0.6, 0.9, 6, 160), M.weld); wl.rotation.x = Math.PI / 2; wl.position.y = yb + 0.5; g.add(wl); // 인너와 판 알곤용접
    }
    g.traverse((o) => { if (o.isMesh && (o.material === MM.steel || o.material === MM.outer)) o.onBeforeRender = () => { uInv.value.copy(g.matrixWorld).invert(); }; });
    if (vert) return { obj: g, tilt: 0.75, zoom: 1.1 };
    const w = new T.Group(); g.rotation.z = -Math.PI / 2; w.add(g); // 수평라인: 니쁠이 아래로
    return { obj: w, tilt: 0.3, zoom: 1.1 };
  }

  // ---------- 모델: PA 하중 지지대 ----------
  // 앵글(50×50×5)을 45°로 절단해 네모로 용접한 틀. 윗면 날개는 안쪽, 세운 날개는 바깥 테두리
  function buildPA() {
    const M = mats(); const g = new T.Group();
    const W = 700, D = 640, A = 50, tk = 5;
    const wM = new T.MeshStandardMaterial({ color: 0x8f877c, metalness: 0.8, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
    const prism = (pts, h, mat) => { const s = new T.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z))); const m = new T.Mesh(new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }), mat); m.rotation.x = Math.PI / 2; return m; };
    for (let k = 0; k < 4; k++) {
      const a = (k % 2 ? D : W) / 2, b = (k % 2 ? W : D) / 2, side = new T.Group(); side.rotation.y = k * Math.PI / 2;
      side.add(prism([[-a, b], [a, b], [a - A, b - A], [-a + A, b - A]], tk, M.steel));           // 윗면 날개 (안쪽으로)
      side.add(prism([[-a, b], [a, b], [a - tk, b - tk], [-a + tk, b - tk]], A, M.steel2));      // 세운 날개 (바깥 테두리)
      // 모서리 45° 용접 자국 (돌출 없음)
      const sw = new T.Mesh(new T.PlaneGeometry(2.4, A * Math.SQRT2), wM); sw.rotation.set(-Math.PI / 2, 0, Math.PI / 4); sw.position.set(a - A / 2, 0.05, b - A / 2); side.add(sw);
      const sv = new T.Mesh(new T.PlaneGeometry(2.4, A), wM); sv.rotation.y = Math.PI / 4; sv.position.set(a + 0.05, -A / 2, b + 0.05); side.add(sv);
      g.add(side);
    }
    return { obj: g, tilt: 0.5, zoom: 1.45 };
  }

  // ---------- 모델: VT 카운터 플래싱 ----------
  // SUS 0.8T 사각판, 사방으로 턱(접어 내림), 윗면 가운데 원형 구멍
  function buildVT() {
    const M = mats(); const g = new T.Group();
    const S = 600, Hs = 100, tk = 0.8, rh = 180;
    const sh = new T.Shape(); sh.moveTo(-S / 2, -S / 2); sh.lineTo(S / 2, -S / 2); sh.lineTo(S / 2, S / 2); sh.lineTo(-S / 2, S / 2); sh.lineTo(-S / 2, -S / 2);
    const hole = new T.Path(); hole.absarc(0, 0, rh, 0, Math.PI * 2, true); sh.holes.push(hole);
    const top = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: tk, bevelEnabled: false, curveSegments: 96 }), M.steel); top.rotation.x = -Math.PI / 2; g.add(top);
    for (let k = 0; k < 4; k++) {
      const side = new T.Group(); side.rotation.y = k * Math.PI / 2;
      const p = new T.Mesh(new T.BoxGeometry(S, Hs, tk), M.steel2); p.position.set(0, tk - Hs / 2, S / 2 - tk / 2); side.add(p);
      const bend = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, S, 8, 1, false, 0, Math.PI / 2), M.steel); bend.rotation.z = Math.PI / 2; bend.position.set(0, tk - 1.2, S / 2 - 1.2); side.add(bend); // 접힌 모서리
      g.add(side);
    }
    return { obj: g, tilt: 0.5, zoom: 1.75 };
  }

  // ---------- 모델: BJ 발전기용 열팽창 주름관 ----------
  // 477로 제작, 주름 때문에 440. 아우트는 민자(반투명으로 보이게), 인너만 주름관(5산 @25 = 125)
  function buildBJ() {
    const M = mats(); const g = new T.Group();
    const R1 = 150, R2 = 175, yT = 220, yO = 180;
    const hide = new T.MeshBasicMaterial({ visible: false });
    const see = (m, o) => { const c = m.clone(); c.transparent = true; c.opacity = o; c.depthWrite = false; return c; };
    doublePipe(g, Object.assign({}, M, { steel: hide, outer: see(M.outer, 0.25), rod: see(M.rod, 0.5) }), R1, R2, -yT, yT, -yO, yO, true, true);
    // 인너 주름관 (회전체)
    const pts = [], V = (r, y) => pts.push(new T.Vector2(r, y));
    V(R1, -yT); V(R1, -82); V(R1 + 6, -70);
    for (let i = 0; i <= 500; i++) { const y = -62.5 + 125 * i / 500, c = Math.cos(2 * Math.PI * (y + 62.5) / 25); V(R1 + 10 - 10 * Math.sign(c) * Math.pow(Math.abs(c), 0.45), y); } // 산·골을 둥글게(U자)
    V(R1 + 6, 70); V(R1, 82); V(R1, yT);
    const inner = new T.Mesh(new T.LatheGeometry(pts.reverse(), 160), M.steel); inner.renderOrder = 2; g.add(inner);
    for (const s of [1, -1]) {
      const fl = new T.Mesh(new T.RingGeometry(R1, R1 + 10, 160), M.steel); fl.rotation.x = -Math.PI / 2; fl.position.y = s * yT; g.add(fl);
      const rim = new T.Mesh(new T.TorusGeometry(R1 + 10, 1.2, 8, 180), M.rod); rim.rotation.x = Math.PI / 2; rim.position.y = s * yT; g.add(rim);
    }
    return { obj: g, tilt: 0.35, zoom: 1.05 };
  }

  // ---------- 모델: VDC / HDC 마감 및 배수용 캡 ----------
  // 원형 띠(위 끝 밑깎이) + 하향 원뿔(꼬깔). VDC는 원뿔 끝에 25A 니쁠(반으로 잘라 용접), HDC는 뾰족하게 막힘
  function buildCap(vdc) {
    const M = mats(); const g = new T.Group();
    const Rb = 200, Hb = 60; // 띠
    const band = new T.Mesh(new T.CylinderGeometry(Rb, Rb, Hb, 160, 1, true), M.steel); band.position.y = Hb / 2; g.add(band);
    const fl = new T.Mesh(new T.RingGeometry(Rb, Rb + 10, 160), M.steel); fl.rotation.x = -Math.PI / 2; fl.position.y = Hb; g.add(fl);
    const rim = new T.Mesh(new T.TorusGeometry(Rb + 10, 1.2, 8, 180), M.rod); rim.rotation.x = Math.PI / 2; rim.position.y = Hb; g.add(rim);
    const wr = new T.Mesh(new T.TorusGeometry(Rb, 1.6, 8, 180), M.weld); wr.rotation.x = Math.PI / 2; g.add(wr);
    const rn = 17, Hc = vdc ? 100 : 120, rt = vdc ? rn : 0.01;
    const cone = new T.Mesh(new T.CylinderGeometry(Rb, rt, Hc, 160, 1, true), M.steel); cone.position.y = -Hc / 2; g.add(cone);
    // 꼬깔 이음 용접선
    const seam = new T.Mesh(new T.BoxGeometry(2.5, Math.hypot(Hc, Rb - rt), 1.2), M.weld);
    const sa = 0.6, mr = (Rb + rt) / 2 + 0.6; seam.position.set(Math.sin(sa) * mr, -Hc / 2, Math.cos(sa) * mr); seam.rotation.set(0, sa, 0); seam.rotateX(Math.atan2(Rb - rt, Hc)); g.add(seam);
    sSeam(g, M, Rb, Rb, 2, Hb - 2, sa); // 띠 세로 용접선 (꼬깔 용접선과 한 줄)
    if (vdc) {
      // 25A 니쁠 반쪽: 민자 부분 용접 + 아래로 나사산
      const y0 = -Hc;
      const plain = new T.Mesh(new T.CylinderGeometry(rn, rn, 10, 32, 1, true), M.rod); plain.position.y = y0 - 5; g.add(plain);
      const thr = new T.Mesh(new T.CylinderGeometry(rn - 1.2, rn - 1.2, 30, 32, 1, true), M.rod); thr.position.y = y0 - 25; g.add(thr);
      // 니쁠 속 구멍 (관통)
      const bore = new T.Mesh(new T.CylinderGeometry(rn - 4, rn - 4, 40, 32, 1, true), new T.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.3, roughness: 0.8, side: T.BackSide })); bore.position.y = y0 - 20; g.add(bore);
      for (let k = 0; k < 13; k++) { const tr = new T.Mesh(new T.TorusGeometry(rn - 1, 1.1, 6, 40), M.rod); tr.rotation.x = Math.PI / 2; tr.position.y = y0 - 12 - k * 2.2; g.add(tr); }
      const wn = new T.Mesh(new T.TorusGeometry(rn + 0.5, 1.6, 8, 48), M.weld); wn.rotation.x = Math.PI / 2; wn.position.y = y0; g.add(wn);
      const hole = new T.Mesh(new T.RingGeometry(rn - 4, rn - 1.2, 32), M.rod); hole.rotation.x = Math.PI / 2; hole.position.y = y0 - 40; g.add(hole);
    }
    return { obj: g, tilt: 0.4, zoom: 1.35 };
  }

  // ---------- 모델: SC 우수 차단판 ----------
  // 판 조각들을 리벳으로 이어 원뿔(경사 길이 120)로 말아 만든 판. 체결 전(벌어진 상태)
  // 한쪽 끝: 겹침판이 더 나와 있고 브라켓은 안쪽에 / 다른 쪽 끝: 브라켓이 끝에. 브라켓은 볼트 구멍 2개
  function buildSC() {
    const M = mats(); const g = new T.Group();
    const Ri = 180, Hc = 95, Ro = Ri + Math.sqrt(120 * 120 - Hc * Hc), L = 120, a = Math.atan2(Hc, Ro - Ri);
    const open = 0.55, tB = open, tA = Math.PI * 2 - open, ov = 0.2;
    g.add(new T.Mesh(new T.CylinderGeometry(Ri, Ro, Hc, 180, 1, true, tB, tA - tB + ov), M.steel));
    // 경사면 위 로컬 좌표계 (th 각도의 모선 기준): x = 둘레 방향(th 감소 쪽), y = 면의 법선, z = 모선(위→아래)
    const onLine = (th, objs) => { const grp = new T.Group(); grp.rotation.y = th; const inner = new T.Group(); inner.position.set(0, 0, (Ri + Ro) / 2); inner.rotation.x = a; grp.add(inner); objs.forEach((o) => inner.add(o)); g.add(grp); };
    const spotM = new T.MeshStandardMaterial({ color: 0x857d72, metalness: 0.7, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 });
    const rivet = (x, z) => { const s = new T.Mesh(new T.CircleGeometry(3, 16), spotM); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.15, z); return s; }; // 용접 자국(돌출 없음)
    // 조각 이음선 + 리벳 (2곳)
    for (const th of [2.0, 4.1]) {
      const line = new T.Mesh(new T.PlaneGeometry(1, L), spotM); line.rotation.x = -Math.PI / 2; line.position.y = 0.1;
      onLine(th, [line, rivet(-6, -45), rivet(-6, -15), rivet(-6, 15), rivet(-6, 45)]);
    }
    // 브라켓: 끝을 비스듬히 깎은 판, 볼트 구멍 2개, 면에 수직으로 섬
    const sh = new T.Shape(); sh.moveTo(0, -48); sh.lineTo(10, -42); sh.lineTo(16, -36); sh.lineTo(16, 36); sh.lineTo(10, 42); sh.lineTo(0, 48); sh.lineTo(0, -48);
    for (const v of [26, -26]) { const h = new T.Path(); h.absarc(8, v, 3.5, 0, Math.PI * 2, true); sh.holes.push(h); }
    const bg = new T.ExtrudeGeometry(sh, { depth: 2, bevelEnabled: false, curveSegments: 16 }); bg.translate(0, 0, -1);
    const bracket = (x, flip) => { const b = new T.Mesh(bg, M.rod); b.rotation.set(0, Math.PI / 2, Math.PI / 2); b.position.set(x, 0, 0); const foot = new T.Mesh(new T.BoxGeometry(18, 1.2, 96), M.rod); foot.position.set(x + (flip ? -9 : 9), 0.7, 0); /* 바깥면: 세운 날개(구멍) + 면에 붙는 받침(꺾임) */ return [b, foot]; };
    // tB 끝: 브라켓이 끝에 / tA 끝: 겹침판이 더 나와 있고 브라켓은 그 안쪽
    const rB = (Ri + Ro) / 2, offA = ov * rB;
    onLine(tB, bracket(2, false)); /* 로컬 x+ = 조각 안쪽 */
    onLine(tA, [...bracket(-2, true), rivet(-22, -30), rivet(-22, 30)]);
    return { obj: g, tilt: 0.45, zoom: 1.2 };
  }

  const MODELS = { sk: buildSK, agin: buildAGin, agcv: buildAGcv, srin: buildSRin, srcv: buildSRcv, trs: buildTRs, trd: buildTRd, fdsq: buildFDsq, fdhp: buildFDhp, cf: buildCF, dv: buildDV, ch: buildCH, dsh: () => buildDS(false), dsv: () => buildDS(true), bj: buildBJ, sc: buildSC, vdc: () => buildCap(true), hdc: () => buildCap(false), el90: () => buildElbow(90), el45: () => buildElbow(45), lt: () => buildY(false), jt: () => buildY(true), mt: () => buildTee(false), nt: () => buildTee(true), pipe977: () => buildPipe(false), iv: () => buildPipe(true), fr: buildFR, pa: buildPA, vt: buildVT };

  // ---------- 경계선: 각진 모서리·끝단에 옅은 선 (밝게 반사돼도 형태가 보이게) ----------
  const EDGE = new T.LineBasicMaterial({ color: 0x24272c, transparent: true, opacity: 0.7 });
  function outline(obj) {
    // UV가 없는 직접 만든 면(새들관·곡관 마디 등)은 결 텍스처가 한 점만 찍혀 색이 달라짐 → 같은 평균 거칠기의 무늬 없는 재질로 맞춤
    const flat = new Map();
    obj.traverse((m) => {
      if (!m.isMesh || Array.isArray(m.material) || !m.material.roughnessMap || m.geometry.attributes.uv) return;
      let f = flat.get(m.material);
      if (!f) { f = m.material.clone(); f.roughnessMap = null; f.roughness = m.material.roughness * 0.78; flat.set(m.material, f); }
      m.material = f;
    });
    const list = [];
    obj.traverse((m) => { if (m.isMesh && !m.userData.noEdge) list.push(m); });
    list.forEach((m) => {
      const mt = Array.isArray(m.material) ? m.material[0] : m.material;
      if (!mt || mt.visible === false) return;
      const t = m.geometry && m.geometry.type;
      if (!t || t === 'TorusGeometry' || t === 'TubeGeometry') return; // 둥근 용접선·봉은 제외
      if (mt.color && mt.color.r + mt.color.g + mt.color.b < 0.3) return; // 어두운 틈·구멍 제외
      let eg = new T.EdgesGeometry(m.geometry, 30);
      const sk = m.userData.edgeSkip;
      if (sk) { // 매끈하게 이어지는 이음매 선은 빼기
        const p = eg.attributes.position.array, keep = [];
        for (let i = 0; i < p.length; i += 6) if (!sk(p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5])) for (let j = 0; j < 6; j++) keep.push(p[i + j]);
        eg = new T.BufferGeometry(); eg.setAttribute('position', new T.Float32BufferAttribute(keep, 3));
      }
      const e = new T.LineSegments(eg, EDGE);
      e.raycast = () => {}; m.add(e);
    });
  }

  // ---------- 뷰어 ----------
  // 전환 버튼으로 함께 보여줄 모델 묶음
  const SETS = { ds: [['수평라인', 'dsh'], ['수직라인', 'dsv']], mt: [['MT', 'mt'], ['NT', 'nt']], lt: [['LT', 'lt'], ['JT', 'jt']], el: [['EL90', 'el90'], ['EL45', 'el45']], ag: [['속관', 'agin'], ['카바', 'agcv']], sr: [['속관', 'srin'], ['카바', 'srcv']], tr: [['단관', 'trs'], ['이중관', 'trd']], fd: [['사각', 'fdsq'], ['호퍼', 'fdhp']], cap: [['VDC', 'vdc'], ['HDC', 'hdc']] };
  function mount(el) {
    const set = SETS[el.dataset.model] || [[null, el.dataset.model]];
    if (!set.every(([, n]) => MODELS[n])) return;
    // 브라우저는 WebGL 화면을 동시에 약 16개까지만 유지 → 화면 근처에 있을 때만 만들고, 벗어나면 정리
    let canvas = null, renderer = null;
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0x2a2a2a, 0.25));
    const key = new T.DirectionalLight(0xffffff, 0.6); key.position.set(700, 1200, 900); scene.add(key);
    const root = new T.Group(); scene.add(root); root.rotation.y = 0.5;
    const camera = new T.PerspectiveCamera(30, 4 / 3, 1, 50000);
    const tanH = Math.tan(T.MathUtils.degToRad(15));
    let cur = null, halfW = 1, halfH = 1, rad = 1, fitK = 1.2, zoomK = 1;
    const size = () => {
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      if (renderer) renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      const d = Math.max(halfW * 1.04 / (tanH * Math.min(camera.aspect, 1.3)), halfH * 1.4 / tanH, rad * fitK) * zoomK;
      camera.position.set(0, rad * 0.05, d); camera.lookAt(0, 0, 0);
    };
    const cache = {};
    const show = (name) => {
      if (!cache[name]) {
        const { obj, tilt, fit, zoom, actions, start } = MODELS[name](); outline(obj);
        const box = new T.Box3().setFromObject(obj); obj.position.sub(box.getCenter(new T.Vector3()));
        const sz = box.getSize(new T.Vector3());
        cache[name] = { obj, tilt, actions, start: start || 0, fit: fit || 1.2, zoom: zoom || 1, hw: sz.x / 2, hh: sz.y / 2, rad: box.getBoundingSphere(new T.Sphere()).radius };
      }
      const m = cache[name];
      if (cur) root.remove(cur);
      cur = m.obj; root.add(cur); root.rotation.x = m.tilt;
      // 동작 버튼 (예: 댐퍼 OPEN / SHUT)
      const old = el.querySelector('.sw.act'); if (old) old.remove();
      if (m.actions) {
        const ad = document.createElement('div'); ad.className = 'sw act';
        m.actions.forEach(([label, fn], i) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (i === m.start) b.classList.add('on');
          b.addEventListener('click', () => { ad.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); fn(); });
          ad.appendChild(b);
        });
        ad.addEventListener('pointerdown', (e) => e.stopPropagation());
        el.appendChild(ad);
      }
      halfW = m.hw; halfH = m.hh; rad = m.rad; fitK = m.fit; zoomK = m.zoom; size();
    };
    if (set.length > 1) {
      const sw = document.createElement('div'); sw.className = 'sw';
      set.forEach(([label, name], i) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (!i) b.classList.add('on');
        b.addEventListener('click', () => { sw.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); show(name); });
        sw.appendChild(b);
      });
      sw.addEventListener('pointerdown', (e) => e.stopPropagation());
      el.appendChild(sw);
    }
    show(set[0][1]);
    window.addEventListener('resize', size);

    let drag = false, lx = 0, ly = 0, vx = 0.004, vy = 0, idle = 999, visible = false;
    const onSw = (e) => !!(e.target && e.target.closest && e.target.closest('.sw'));
    el.addEventListener('pointerdown', (e) => { if (onSw(e)) return; drag = true; lx = e.clientX; ly = e.clientY; idle = 0; el.setPointerCapture(e.pointerId); el.classList.add('on'); });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      vx = Math.max(-0.06, Math.min(0.06, dx * 0.009)); vy = Math.max(-0.04, Math.min(0.04, dy * 0.009));
      root.rotation.y += vx; root.rotation.x = Math.max(-1.45, Math.min(1.45, root.rotation.x + vy));
    });
    const up = () => { drag = false; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    // 3D 영역을 잡고 움직일 때 페이지 스크롤 막기 (모바일). 전환 버튼은 제외
    el.addEventListener('touchstart', (e) => { if (e.touches.length === 1 && !onSw(e)) e.preventDefault(); }, { passive: false });
    el.addEventListener('touchmove', (e) => { if (e.touches.length === 1 && !onSw(e)) e.preventDefault(); }, { passive: false });
    const init = () => {
      canvas = document.createElement('canvas'); el.prepend(canvas);
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      scene.environment = envMap(renderer);
      size();
    };
    const drop = () => { if (!renderer) return; renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); renderer = null; canvas = null; };
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !renderer) init(); else if (!visible && renderer) drop(); }, { rootMargin: '300px' }).observe(el);
    (function loop() {
      requestAnimationFrame(loop); if (!visible) return;
      if (!drag) { idle++; vx *= 0.95; vy *= 0.9; root.rotation.y += vx; root.rotation.x = Math.max(-1.45, Math.min(1.45, root.rotation.x + vy)); if (idle > 90) root.rotation.y += 0.004; }
      if (cur && cur.userData.tick) cur.userData.tick();
      if (renderer) renderer.render(scene, camera);
    })();
  }

  const go = () => document.querySelectorAll('.p3d[data-model]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
