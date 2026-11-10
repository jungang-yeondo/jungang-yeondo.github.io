// 사진 자동 최적화 (배포할 때 GitHub Actions가 build.js 전에 실행)
// static/uploads 의 사진마다 휴대폰용 작은 버전('이름-900w', '이름-1200w')을 만들고,
// 사진 크기 목록(.dims.json)을 남깁니다. build.js가 이 둘을 읽어 srcset·width·height를 자동으로 넣습니다.
// 원본 사진은 건드리지 않습니다. 실패해도 사이트는 원본 사진으로 정상 빌드됩니다.
const fs = require('fs');
const path = require('path');
let sharp;
try { sharp = require('sharp'); } catch (e) { console.log('variants: sharp 없음 — 건너뜀'); process.exit(0); }

const DIR = path.join(__dirname, 'static', 'uploads');
const WIDTHS = [900, 1200];
const QUALITY = 84; // 눈으로 구분하기 어려운 수준의 화질
const isVariant = (f) => /-(900|1200)w\.[^.]+$/.test(f);

(async () => {
  const dims = {};
  let made = 0, kept = 0;
  const walk = async (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { await walk(full); continue; }
      if (!/\.(jpe?g|png)$/i.test(e.name)) continue;
      const url = '/' + path.relative(path.join(__dirname, 'static'), full).split(path.sep).join('/');
      try {
        const meta = await sharp(full).metadata();
        const turned = (meta.orientation || 1) >= 5; // 세로로 찍은 휴대폰 사진
        const w = turned ? meta.height : meta.width, h = turned ? meta.width : meta.height;
        dims[url] = [w, h];
        if (isVariant(e.name) || dir !== DIR) continue;
        const m = /^(.+)(\.[^.]+)$/.exec(e.name);
        for (const tw of WIDTHS) {
          const out = path.join(dir, `${m[1]}-${tw}w${m[2]}`);
          if (fs.existsSync(out)) { kept++; continue; }
          if (w < tw * 1.15) continue; // 원본이 충분히 크지 않으면 만들지 않음
          let img = sharp(full).rotate().resize({ width: tw, withoutEnlargement: true });
          img = /\.png$/i.test(e.name) ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: QUALITY, mozjpeg: true });
          await img.toFile(out);
          const o = await sharp(out).metadata();
          dims[url.replace(/(\.[^.]+)$/, `-${tw}w$1`)] = [o.width, o.height];
          // 작은 버전이 원본보다 오히려 크면 쓰지 않음
          if (fs.statSync(out).size >= fs.statSync(full).size) { fs.unlinkSync(out); continue; }
          made++;
        }
      } catch (err) { console.log('variants: 건너뜀', e.name, String(err.message || err)); }
    }
  };
  await walk(DIR);
  fs.writeFileSync(path.join(__dirname, '.dims.json'), JSON.stringify(dims));
  console.log(`variants: 새로 만든 작은 사진 ${made}장, 기존 ${kept}장, 크기 기록 ${Object.keys(dims).length}장`);
})().catch((e) => { console.log('variants: 실패 — 원본 사진으로 빌드합니다', e); process.exit(0); });
