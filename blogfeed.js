// 네이버 블로그 '제작 실적' 글 자동 가져오기 (배포할 때 GitHub Actions가 build.js 전에 실행)
// 블로그 RSS에서 해당 카테고리 글의 제목·날짜·대표 사진을 읽어 content/blogfeed.json 을 만들고,
// 대표 사진은 줄여서 static/uploads/blog/ 에 저장합니다.
// 블로그를 못 읽거나 오류가 나면 아무것도 바꾸지 않습니다 (홈페이지는 기존 목록 그대로 빌드).
const fs = require('fs');
const path = require('path');
let sharp = null;
try { sharp = require('sharp'); } catch (e) { /* 없으면 원본 사진 그대로 저장 */ }

const BLOG = 'jungangyeondo';
const CATEGORY = '제작 실적';
const MAX = 24;
const RSS = `https://rss.blog.naver.com/${BLOG}.xml`;
const IMG_DIR = path.join(__dirname, 'static', 'uploads', 'blog');
const OUT = path.join(__dirname, 'content', 'blogfeed.json');
const UA = { 'User-Agent': 'Mozilla/5.0 (jungangyeondo.co.kr blog feed)', Referer: `https://blog.naver.com/${BLOG}` };

const cdata = (s) => String(s || '').replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
const tag = (xml, t) => { const m = new RegExp(`<${t}>([\\s\\S]*?)</${t}>`).exec(xml); return m ? cdata(m[1]) : ''; };
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function get(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
}

// 썸네일 주소의 type= 값을 바꿔 큰 사진부터 시도
async function bestImage(src) {
  const tries = [];
  for (const t of ['w966', 'w800', 'w2']) tries.push(/[?&]type=/.test(src) ? src.replace(/([?&]type=)[^&]*/, `$1${t}`) : `${src}${src.includes('?') ? '&' : '?'}type=${t}`);
  tries.push(src);
  let best = null;
  for (const u of tries) {
    try {
      const r = await get(u);
      if (!/^image\//.test(r.headers.get('content-type') || '')) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const w = sharp ? ((await sharp(buf).metadata()).width || 0) : buf.length;
      if (!best || w > best.w) best = { buf, w };
      if (sharp && w >= 700) break;
    } catch (e) { /* 다음 크기 시도 */ }
  }
  return best && best.buf;
}

(async () => {
  let xml;
  try { xml = await (await get(RSS)).text(); } catch (e) { console.log('blogfeed: 블로그 RSS를 못 읽음 — 기존 목록 유지', e.message); return; }
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  if (!items.length) { console.log('blogfeed: 글 없음 — 기존 목록 유지'); return; }
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const posts = [];
  for (const it of items) {
    if (tag(it, 'category').replace(/\s/g, '') !== CATEGORY.replace(/\s/g, '')) continue;
    const guid = tag(it, 'guid') || tag(it, 'link');
    const id = (/(\d{6,})/.exec(guid) || [])[1];
    if (!id) continue;
    const d = new Date(tag(it, 'pubDate'));
    const date = isNaN(d) ? '' : new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
    const src = (/<img[^>]+src="([^"]+)"/.exec(unesc(tag(it, 'description'))) || [])[1];
    let image = '';
    const file = path.join(IMG_DIR, `${id}.jpg`);
    if (fs.existsSync(file)) image = `/uploads/blog/${id}.jpg`;
    else if (src) {
      const buf = await bestImage(src);
      if (buf) {
        try {
          if (sharp) await sharp(buf).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(file);
          else fs.writeFileSync(file, buf);
          image = `/uploads/blog/${id}.jpg`;
        } catch (e) { console.log('blogfeed: 사진 저장 실패', id, e.message); }
      }
    }
    posts.push({ id, title: tag(it, 'title'), date, url: `https://blog.naver.com/${BLOG}/${id}`, image });
    if (posts.length >= MAX) break;
  }
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), blog: `https://blog.naver.com/${BLOG}`, posts }, null, 2));
  console.log(`blogfeed: '${CATEGORY}' 글 ${posts.length}개`);
})().catch((e) => console.log('blogfeed: 오류 — 기존 목록 유지', e.message));
