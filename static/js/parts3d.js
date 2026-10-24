/* 중앙연도 부품 3D 뷰어 (three.js r128) — data-model 이름으로 모델 생성 */
(function () {
  if (!window.THREE) return;
  const T = THREE;

  // ---------- 공용: 광택 스테인리스(SUS304) 재질 ----------
  let ENV = null;
  function envMap(renderer) {
    if (ENV) return ENV;
    const pm = new T.PMREMGenerator(renderer);
    const s = new T.Scene();
    s.background = new T.Color(0x05070a);
    const strip = (w, h, x, y, z, rx, ry, c) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
    };
    // 공장 천장 형광등 줄 + 창문 + 어두운 바닥 → 반질반질한 반사 대비
    strip(14, 0.5, 0, 6, -2.5, Math.PI / 2, 0, 0xffffff);
    strip(14, 0.5, 0, 6, 0, Math.PI / 2, 0, 0xf2f6ff);
    strip(14, 0.5, 0, 6, 2.5, Math.PI / 2, 0, 0xffffff);
    strip(4, 6, -8, 1.5, 0, 0, Math.PI / 2, 0xcfdcf0);
    strip(1.2, 6, 8, 1.5, -2, 0, -Math.PI / 2, 0xfff1dc);
    strip(1.2, 6, 8, 1.5, 2, 0, -Math.PI / 2, 0xfff1dc);
    strip(3, 3, 0, 1, -8, 0, 0, 0x8b97a8);
    strip(20, 20, 0, -5, 0, Math.PI / 2, 0, 0x101216);
    ENV = pm.fromScene(s, 0.02).texture;
    return ENV;
  }
  function mats() {
    return {
      steel: new T.MeshStandardMaterial({ color: 0xdfe2e6, metalness: 1, roughness: 0.12, side: T.DoubleSide }),
      steel2: new T.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 1, roughness: 0.16, side: T.DoubleSide }),
      rod: new T.MeshStandardMaterial({ color: 0xe8eaed, metalness: 1, roughness: 0.08 }),
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

  const MODELS = { sk: buildSK };

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
    const halfW = (box.max.x - box.min.x) / 2, tanH = Math.tan(T.MathUtils.degToRad(15));
    const size = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      const d = Math.max(halfW * 1.04 / (tanH * Math.min(camera.aspect, 1.3)), sphere.radius * 1.6); camera.position.set(0, sphere.radius * 0.05, d); camera.lookAt(0, 0, 0); };
    size(); window.addEventListener('resize', size);

    let drag = false, lx = 0, ly = 0, vx = 0.004, vy = 0, idle = 999, visible = false;
    el.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; idle = 0; el.setPointerCapture(e.pointerId); el.classList.add('on'); });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      vx = dx * 0.009; vy = dy * 0.009; root.rotation.y += vx; root.rotation.x = Math.max(-1.45, Math.min(1.45, root.rotation.x + vy));
    });
    const up = () => { drag = false; };
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
