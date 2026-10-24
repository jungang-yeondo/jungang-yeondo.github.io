// 중앙연도 홈페이지 빌드 스크립트 (외부 패키지 없음 · Node 18+)
// content/*.json  →  _site/ 정적 HTML.  관리자 화면(/admin)에서 JSON을 수정하면 Netlify가 이 스크립트로 다시 빌드합니다.
const fs = require('fs');
const path = require('path');
// 공개 전에는 true (검색엔진 차단). 공개할 때 false 로 바꾸세요.
const PRIVATE = false;

const ROOT = __dirname;
const OUT = path.join(ROOT, '_site');
const load = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', n + '.json'), 'utf8'));
const site = load('site'), home = load('home'), company = load('company'), biz = load('business'),
      prod = load('products'), proj = load('projects'), sup = load('support');

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const br = (s) => esc(s).replace(/\r?\n/g, '<br>');
const paras = (s) => String(s ?? '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${br(p)}</p>`).join('\n');
const lines = (s) => String(s ?? '').split(/\r?\n/).map((l) => `<span>${esc(l)}</span>`).join('');
const list = (a) => (Array.isArray(a) ? a : []);
const img = (src, alt = '', extra = '') => src ? `<img src="${esc(src)}" alt="${esc(alt || site.short_name || '(주)중앙연도')}" loading="lazy"${extra}>` : '';
const telHref = (t) => 'tel:' + String(t).replace(/[^0-9+]/g, '');
const baseUrl = String(site.url || '').replace(/\/$/, '');

const NAV = [
  { key: 'company', label: '회사소개', href: '/company/greeting/', sub: [['인사말', '/company/greeting/'], ['회사개요', '/company/overview/'], ['연혁', '/company/history/'], ['오시는 길', '/company/location/']] },
  { key: 'business', label: '사업분야', href: '/business/', sub: [['사업분야', '/business/']] },
  { key: 'product', label: '제품소개', href: '/product/stack/', sub: [['스테인리스 연도', '/product/stack/'], ['LPF 기밀연도', '/product/lpf/'], ['주요 부품', '/product/parts/']] },
  { key: 'projects', label: '납품실적', href: '/projects/', sub: [['납품실적', '/projects/'], ['현장 사진', '/projects/gallery/'], ['인증·특허', '/projects/certification/']] },
  { key: 'support', label: '고객지원', href: '/support/downloads/', sub: [['자료실', '/support/downloads/'], ['온라인 문의', '/support/contact/']] },
];

const logo = `<svg viewBox="0 0 240 92" aria-hidden="true"><ellipse class="ell" cx="132" cy="52" rx="104" ry="30" transform="rotate(-11 132 52)" fill="none" stroke-width="7"/><path d="M6 13 H56 V62 q0 10 -9 10" fill="none" stroke="#C8303A" stroke-width="6"/><text x="62" y="70" font-family="Cinzel, Times New Roman, serif" font-weight="700" font-size="30" fill="#C8303A" textLength="150" lengthAdjust="spacingAndGlyphs">UNGANG</text></svg>`;

function layout({ title, desc, url, section, body, image }) {
  const fullTitle = title ? `${title} | 중앙연도` : site.seo_title;
  const d = desc || site.seo_description;
  const canonical = baseUrl + url;
  const ogImg = baseUrl + (image || home.about_image || '');
  const gnb = NAV.map((n) => `<div class="item"><a href="${n.href}"${n.key === section ? ' aria-current="true"' : ''}>${n.label}</a><div class="sub">${n.sub.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div></div>`).join('');
  const mnav = NAV.map((n) => `<b>${n.label}</b>${n.sub.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}`).join('');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${PRIVATE ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.short_name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImg)}">
${site.naver_verification ? `<meta name="naver-site-verification" content="${esc(site.naver_verification)}">` : ''}
${site.google_verification ? `<meta name="google-site-verification" content="${esc(site.google_verification)}">` : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Barlow+Condensed:wght@400;500;600&family=Cinzel:wght@700&display=swap">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: site.name, alternateName: ['중앙연도', site.short_name, site.name_en], url: baseUrl || undefined, telephone: site.tel, email: site.email, address: { '@type': 'PostalAddress', streetAddress: site.address, addressCountry: 'KR' }, foundingDate: '2013-03-13' }).replace(/</g, '\\u003c')}</script>
</head>
<body class="over">
<header class="top" id="top">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(site.short_name)} 홈">${logo}<b>${esc(site.short_name)}</b></a>
    <nav class="gnb" aria-label="주 메뉴">${gnb}</nav>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mnav" aria-label="메뉴 열기"><span></span><span></span><span></span></button>
  </div>
  <div class="mnav" id="mnav"><div class="wrap">${mnav}</div></div>
</header>
<main>
${body}
</main>
<section class="cta">
  ${img(home.cta_image)}
  <div class="wrap">
    <div><div class="label" style="color:#F0656C">Contact Us</div><h2 style="margin-top:12px">${esc(home.cta_title)}</h2><p>${esc(home.cta_text)}</p></div>
    <div><a class="tel" href="${telHref(site.tel)}">${esc(site.tel)}</a><div class="mail">${esc(site.email)} · FAX ${esc(site.fax)}</div></div>
  </div>
</section>
<footer>
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(site.short_name)} 홈">${logo}</a>
    <dl>
      <div><dt>상호</dt><dd>${esc(site.name)}</dd></div>
      <div><dt>대표</dt><dd>${esc(site.ceo)}</dd></div>
      <div><dt>사업자등록번호</dt><dd>${esc(site.bizno)}</dd></div>
      <div><dt>주소</dt><dd>${esc(site.address)}</dd></div>
      <div><dt>TEL</dt><dd>${esc(site.tel)}</dd></div>
      <div><dt>FAX</dt><dd>${esc(site.fax)}</dd></div>
      <div><dt>E-mail</dt><dd>${esc(site.email)}</dd></div>
    </dl>
    <div class="c"><span>© ${new Date().getFullYear()} ${esc(site.name_en)} All rights reserved.</span><a href="/privacy/">개인정보처리방침</a></div>
  </div>
</footer>
<script src="/js/main.js" defer></script>
</body>
</html>`;
}

function subPage({ en, title, banner, section, current, body }) {
  const nav = NAV.find((n) => n.key === section);
  const lnb = nav.sub.map(([l, h]) => `<a href="${h}"${h === current ? ' aria-current="true"' : ''}>${l}</a>`).join('');
  return `<section class="subvis">${img(banner, '', ' fetchpriority="high"').replace(' loading="lazy"', '')}<div class="wrap"><div class="en">${esc(en)}</div><h1>${esc(title)}</h1></div></section>
<nav class="lnb" aria-label="${esc(nav.label)} 하위 메뉴"><div class="wrap">${lnb}</div></nav>
<div class="wrap">${body}</div>`;
}
const two = (label, h2, inner, extra = '') => `<div class="two"><header><span class="label">${esc(label)}</span><h2>${h2}</h2>${extra}</header><div>${inner}</div></div>`;

const pages = [];
const add = (url, opts) => pages.push({ url, html: layout({ url, ...opts }) });


const XSEC = `<svg class="xsec" viewBox="0 0 480 380" role="img" aria-label="이중연도 단면: 내부관, 25mm 공기층, 외부 커버">
<defs><radialGradient id="g1" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#3A2A34"/><stop offset="1" stop-color="#121826"/></radialGradient>
<linearGradient id="st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D1DC"/><stop offset=".5" stop-color="#8A95A6"/><stop offset="1" stop-color="#D8DEE6"/></linearGradient></defs>
<circle cx="170" cy="190" r="150" fill="url(#st)"/><circle cx="170" cy="190" r="143" fill="#16233A"/>
<circle cx="170" cy="190" r="143" fill="none" stroke="#2B3B57" stroke-width="22" stroke-dasharray="2 6"/>
<circle cx="170" cy="190" r="112" fill="url(#st)"/><circle cx="170" cy="190" r="106" fill="url(#g1)"/>
<g fill="none" stroke="#F0656C" stroke-width="1.6" opacity=".85"><path d="M170 250 v-104 m-9 13 l9 -13 l9 13"/><path d="M134 236 v-74 m-8 11 l8 -11 l8 11"/><path d="M206 236 v-74 m-8 11 l8 -11 l8 11"/></g>
<g stroke="#7F8BA0" fill="none"><path d="M300 120 L330 90 H350"/><path d="M296 190 H350"/><path d="M262 240 L310 285 H350"/></g>
<circle cx="300" cy="120" r="3.5" fill="#fff"/><circle cx="296" cy="190" r="3.5" fill="#fff"/><circle cx="262" cy="240" r="3.5" fill="#fff"/>
<text x="356" y="86" class="b">외부 커버</text><text x="356" y="106">STS304 또는</text><text x="356" y="124">알루미늄 도금강판</text>
<text x="356" y="186" class="b">공기단열층</text><text x="356" y="208" class="r">25 MM</text>
<text x="356" y="281" class="b">내부관</text><text x="356" y="301">STS304</text></svg>`;
const LPF_SVG = `<svg viewBox="0 0 760 300" role="img" aria-label="LPF 이음부 단면도">
<rect x="40" y="70" width="680" height="4" fill="var(--ink)"/><rect x="40" y="74" width="680" height="110" fill="var(--bg-2)"/>
<rect x="40" y="184" width="320" height="10" fill="var(--muted)"/><rect x="400" y="184" width="320" height="10" fill="var(--muted)"/>
<rect x="350" y="124" width="12" height="70" fill="var(--muted)"/><rect x="398" y="124" width="12" height="70" fill="var(--muted)"/>
<circle cx="380" cy="146" r="10" fill="var(--red)"/>
<path d="M330 116 L380 98 L430 116 L430 134 L414 134 L380 116 L346 134 L330 134 Z" fill="var(--navy)"/>
<g stroke="var(--muted)" fill="none"><path d="M434 112 L520 92"/><path d="M392 150 L520 150"/><path d="M200 189 L200 230"/><path d="M200 74 L200 40"/></g>
<text x="526" y="96">V밴드 · STS304</text><text x="526" y="154">패킹 Ø6–8 (세라믹 / 내열실리콘)</text>
<text x="208" y="44">외부 커버</text><text x="60" y="132" class="r">25 MM AIR</text><text x="208" y="244">STS304 내부관</text>
<path d="M80 270 H680" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="5 5"/><text x="560" y="262" class="r">EXHAUST →</text></svg>`;

// ---------- HOME ----------
{
  const slides = list(home.slides);
  const sl = slides.map((s, i) => `<div class="slide${i === 0 ? ' on' : ''}" data-cap="${esc(s.caption)}">${i === 0 ? `<img src="${esc(s.image)}" alt="${esc(s.caption || site.short_name)}" fetchpriority="high">` : img(s.image, s.caption)}</div>`).join('');
  const pad = (n) => String(n).padStart(2, '0');
  const numItem = (n) => `<b>${esc(n.value)}${n.suffix ? `<sup>${esc(n.suffix)}</sup>` : ''}</b><span>${esc(n.label)}</span>`;
  const numGroups = [];
  list(home.numbers).forEach((n) => { if (n.under && numGroups.length) numGroups[numGroups.length - 1].push(n); else numGroups.push([n]); });
  const nums = numGroups.map((g) => `<div>${g.map((n, i) => i ? `<div class="under">${numItem(n)}</div>` : numItem(n)).join('')}</div>`).join('');
  const specs = list(home.eng_specs).map((s) => `<li><span>${esc(s.label)}</span><span>${esc(s.value)}</span></li>`).join('');
  const names = list(proj.items).map((p) => `<span>${esc(p.name)}</span>`);
  const half = Math.ceil(names.length / 2);
  const row = (a) => a.join('') + a.join('');
  const photos = list(home.project_photos).slice(0, 3).map((p) => `<figure>${img(p.image, p.caption)}<figcaption><b>${esc(p.caption)}</b><span>${esc(p.year)}</span></figcaption></figure>`).join('');
  const ip = list(proj.patents).filter((p) => p.home).slice(0, 4).map((p) => `<div class="r"><span class="k">${esc(p.type)}</span><b>${esc(p.title)}</b><span class="n">${esc(p.number)}</span><span class="y">${esc(p.year)}</span></div>`).join('');

  add('/', {
    section: 'home', image: slides[0]?.image,
    body: `
<section class="hero" id="hero" data-interval="${Math.max(3, Number(home.slide_seconds) || 6)}">
  ${sl}
  <div class="hero-txt"><div class="wrap">
    <div class="en rise">${esc(home.hero_eyebrow)}</div>
    <h1 class="rise">${lines(home.hero_title)}</h1>
    <p class="rise">${br(home.hero_text)}</p>
  </div></div>
  <div class="hero-bar"><div class="wrap">
    <div class="cnt"><b id="sIdx">01</b> / ${pad(slides.length)}</div>
    <div class="prog"><i id="prog" class="run"></i></div>
    <div class="cap" id="sCap">${esc(slides[0]?.caption)}</div>
    <div class="scroll">Scroll ↓</div>
  </div></div>
</section>

<section class="sec"><div class="wrap about">
  <div class="plate">${img(home.about_image, site.short_name)}</div>
  <div>
    <div class="label">About Jungang</div>
    <h2 class="h2">${br(home.about_title)}</h2>
    <p class="lead">${esc(home.about_text)}</p>
    <a class="arrow" href="/company/greeting/">회사소개 보기</a>
    <div class="nums">${nums}</div>
  </div>
</div></section>

<section class="ptiles">
  <a class="ptile" href="/product/stack/">${img(home.product1_image, home.product1_title)}<span class="plus" aria-hidden="true">+</span><div class="t"><div class="en">Product 01</div><h3>${esc(home.product1_title)}</h3><p>${esc(home.product1_text)}</p></div></a>
  <a class="ptile" href="/product/lpf/">${img(home.product2_image, home.product2_title)}<span class="plus" aria-hidden="true">+</span><div class="t"><div class="en">Product 02</div><h3>${esc(home.product2_title)}</h3><p>${esc(home.product2_text)}</p></div></a>
</section>

<section class="sec eng"><div class="wrap">
  <div>
    <div class="big">25<small>mm</small></div>
    <h2>${esc(home.eng_title)}</h2>
    <p>${esc(home.eng_text)}</p>
    <ul>${specs}</ul>
  </div>
  <img class="eng-motion" src="/uploads/duct-motion.webp" alt="이중연도 단면: 외부 커버, 스페이서, 25mm 공기단열층, 내부관" loading="lazy" decoding="async">
</div></section>

<section class="sec"><div class="wrap">
  <div class="headrow"><div><div class="label">Projects</div><h2 class="h2">${br(home.projects_title)}</h2></div><a class="arrow" href="/projects/" style="margin-top:0">납품실적 전체</a></div>
</div>
  <div class="marq" aria-hidden="true"><div class="row">${row(names.slice(0, half))}</div><div class="row rev">${row(names.slice(half))}</div></div>
<div class="wrap"><div class="pgrid">${photos}</div></div></section>

<section class="sec tint"><div class="wrap">
  <div class="headrow"><div><div class="label">Technology</div><h2 class="h2">${br(home.tech_title)}</h2></div><a class="arrow" href="/projects/certification/" style="margin-top:0">인증·특허 전체</a></div>
  <div class="iprows">${ip}</div>
</div></section>`,
  });
}

// ---------- COMPANY ----------
add('/company/greeting/', {
  title: '인사말', section: 'company', image: company.banner,
  body: subPage({ en: 'Company', title: '회사소개', banner: company.banner, section: 'company', current: '/company/greeting/', body:
    two('Greeting', '인사말', `<p class="quote">${br(company.greeting_quote)}</p><div class="prose">${paras(company.greeting_body)}</div><div class="sign"><span>${esc(company.greeting_sign_title)}</span><b>${esc(site.ceo)}</b></div>`) +
    (company.greeting_image ? `<div class="greet-img">${img(company.greeting_image)}</div><div style="height:clamp(56px,7vw,96px)"></div>` : '') }),
});
add('/company/overview/', {
  title: '회사개요', section: 'company', image: company.banner,
  body: subPage({ en: 'Company', title: '회사소개', banner: company.banner, section: 'company', current: '/company/overview/', body:
    two('Overview', '회사개요', `<table class="info">${list(company.overview_rows).map((r) => `<tr><th>${esc(r.label)}</th><td>${br(r.value)}</td></tr>`).join('')}</table>`) }),
});
add('/company/history/', {
  title: '연혁', section: 'company', image: company.banner,
  body: subPage({ en: 'Company', title: '회사소개', banner: company.banner, section: 'company', current: '/company/history/', body:
    two('History', '연혁', `<ul class="tl">${list(company.history).map((h) => `<li${h.highlight ? ' class="big"' : ''}><time>${esc(h.date)}</time><div><b>${esc(h.title)}</b>${h.note ? `<small>${esc(h.note)}</small>` : ''}</div></li>`).join('')}</ul>`) }),
});
{
  const q = encodeURIComponent(site.address);
  add('/company/location/', {
    title: '오시는 길', section: 'company', image: company.banner,
    body: subPage({ en: 'Company', title: '회사소개', banner: company.banner, section: 'company', current: '/company/location/', body:
      two('Location', '오시는 길', `<p style="font-size:clamp(20px,2vw,26px);font-weight:700">${esc(site.address)}<button class="copy" data-copy="${esc(site.address)}">주소 복사</button></p>
<div class="maplinks"><a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="https://map.kakao.com/?q=${q}" target="_blank" rel="noopener">카카오맵 ↗</a></div>
<table class="info" style="margin-top:44px"><tr><th>대표전화</th><td class="num"><a href="${telHref(site.tel)}">${esc(site.tel)}</a></td></tr><tr><th>팩스</th><td class="num">${esc(site.fax)}</td></tr><tr><th>이메일</th><td><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></td></tr><tr><th>방문 안내</th><td>${esc(company.visit_note)}</td></tr></table>`) }),
  });
}

// ---------- BUSINESS ----------
add('/business/', {
  title: '사업분야', section: 'business', image: biz.banner,
  body: subPage({ en: 'Business', title: '사업분야', banner: biz.banner, section: 'business', current: '/business/', body:
    two('Field', '적용 분야', `<div class="biz3">${list(biz.fields).map((f) => `<article><div class="im">${img(f.image, f.title)}</div><span class="en">${esc(f.label)}</span><b>${esc(f.title)}</b><p>${esc(f.text)}</p></article>`).join('')}</div>`) +
    two('Process', '수주부터 납품까지', `<ol class="steps" style="grid-template-columns:repeat(${Math.min(5, list(biz.process).length) || 1},1fr)">${list(biz.process).map((p) => `<li><b style="color:var(--ink);display:block;margin-bottom:6px">${esc(p.title)}</b>${esc(p.text)}</li>`).join('')}</ol>`) +
    (list(biz.facilities).length ? two('Facility', esc(biz.facilities_title || '보유 설비 · 제작 기술'), `<div class="facil">${list(biz.facilities).map((f) => `<div class="row"><div class="ph">${img(f.image1, f.title)}${f.image2 ? img(f.image2, f.title) : ''}</div><div class="tx">${f.en ? `<span class="en">${esc(f.en)}</span>` : ''}<b>${esc(f.title)}</b><p>${br(f.text)}</p></div></div>`).join('')}</div>`) : '') }),
});

// ---------- PRODUCTS ----------
const ICONS = [
  `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="34" fill="none" stroke="var(--ink)" stroke-width="5"/></svg>`,
  `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--navy)" stroke-width="3"/><circle cx="60" cy="60" r="34" fill="none" stroke="var(--ink)" stroke-width="5"/></svg>`,
  `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="none" stroke="var(--navy)" stroke-width="3"/><circle cx="60" cy="60" r="49" fill="var(--bg-2)" stroke="var(--line)"/><circle cx="60" cy="60" r="42" fill="var(--bg)" stroke="var(--navy)" stroke-width="2"/><circle cx="60" cy="60" r="32" fill="none" stroke="var(--ink)" stroke-width="5"/></svg>`,
];
add('/product/stack/', {
  title: '스테인리스 연도', section: 'product', image: prod.stack_image,
  desc: '스테인리스 조립식 이중연도 — STS304 내부관, 25mm 공기단열층, 단관·이중관·보온 삼중관, 재질·두께 규격과 주요 부품.',
  body: subPage({ en: 'Products', title: '스테인리스 연도', banner: prod.stack_banner || prod.banner, section: 'product', current: '/product/stack/', body:
    two('Double-wall Stack', br(prod.stack_title), `<p class="quote" style="margin-bottom:20px">${br(prod.stack_quote)}</p><p class="lead" style="margin-top:0">${esc(prod.stack_intro)}</p>${prod.stack_image ? `<div class="wideimg">${img(prod.stack_image, '스테인리스 이중연도 납품 현장')}</div>` : ''}`) +
    two('Feature', '특징', `<div class="feat4">${list(prod.features).map((f) => `<div><span class="en">${esc(f.en)}</span><b>${esc(f.title)}</b><p>${esc(f.text)}</p></div>`).join('')}</div>`) +
    two('Line-up', '구성 · 관경 산정', `<div class="lineup2">${list(prod.lineup).map((l, i) => `<div class="row">${l.image ? `<div class="ph">${img(l.image, l.title)}</div>` : `<div class="ph ic">${ICONS[Math.min(i, 2)]}</div>`}<div class="tx">${l.en ? `<span class="en">${esc(l.en)}</span>` : ''}<b>${esc(l.title)}</b><p>${esc(l.text)}</p><span class="f">${esc(l.formula)}</span></div></div>`).join('')}</div><p class="note">${esc(prod.lineup_note)}</p>`) +
    two('Specification', '재질 · 두께', `<div class="tw"><table class="tbl"><thead><tr><th>구분</th><th class="c">~ Ø900</th><th class="c">Ø1000 – 1500</th><th class="c">Ø1600 ~</th><th>재질</th></tr></thead><tbody>${list(prod.spec_rows).map((r) => `<tr><td>${esc(r.name)}</td><td class="c num">${esc(r.a)}</td><td class="c num">${esc(r.b)}</td><td class="c num">${esc(r.c)}</td><td>${esc(r.material)}</td></tr>`).join('')}</tbody></table></div><p class="note">${esc(prod.spec_note)}</p>
<div class="tw" style="margin-top:44px"><table class="tbl"><thead><tr><th>지지 철물</th><th>규격</th><th>설치 위치</th></tr></thead><tbody>${list(prod.support_rows).map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.spec)}</td><td>${esc(r.where)}</td></tr>`).join('')}</tbody></table></div>`) +
    two('Components', '주요 부품', `<div class="parts">${list(prod.parts).map((p) => `<div><code>${esc(p.code)}</code><b>${esc(p.title)}</b><span>${esc(p.text)}</span></div>`).join('')}</div><p class="parts-more"><a href="/product/parts/">부품 사진으로 보기 →</a></p>`) }),
});

add('/product/parts/', {
  title: '주요 부품', section: 'product', image: prod.stack_image,
  desc: '중앙연도 연도 주요 부품 — 합류관, 지지대, 길이 조절관, 삿갓, 드레인 엔드캡, 엘보, 플랜지 어댑터 등 부품별 사진과 설명.',
  body: subPage({ en: 'Products', title: '주요 부품', banner: prod.parts_banner || prod.stack_banner || prod.banner, section: 'product', current: '/product/parts/', body:
    two('Components', '주요 부품', `${prod.parts_intro ? `<p class="lead" style="margin-bottom:28px">${br(prod.parts_intro)}</p>` : ''}<div class="pcards">${list(prod.parts).map((p) => `<div class="pcard"><div class="ph">${p.image ? img(p.image, p.title) : '<div class="noimg">사진 준비 중</div>'}</div><div class="tx"><code>${esc(p.code)}</code><b>${esc(p.title)}</b><span>${esc(p.text)}</span></div></div>`).join('')}</div>`) }),
});
add('/product/lpf/', {
  title: 'LPF 기밀연도', section: 'product', image: prod.banner,
  desc: 'LPF(Leakage Prevention Flange) 기밀연도 — 플랜지 홈 패킹과 V밴드 체결로 이음부 누설을 막는 이중연도. 발전기·콘덴싱 보일러용.',
  body: subPage({ en: 'Products', title: 'LPF 기밀연도', banner: prod.lpf_banner || prod.banner, section: 'product', current: '/product/lpf/', body:
    two('Leakage Prevention Flange', 'LPF 기밀연도', `<p class="quote" style="margin-bottom:20px">${br(prod.lpf_quote)}</p><p class="lead" style="margin-top:0">${esc(prod.lpf_intro)}</p><p class="note">${esc(prod.lpf_note)}</p><div class="lpf-story"><figure class="wide"><img src="/uploads/lpf-flange-groove-01.jpg" alt="패킹 홈을 가공한 LPF 플랜지" loading="lazy"><figcaption><b>플랜지 패킹 홈</b>이음부 플랜지 둘레에 패킹이 들어앉을 홈을 성형합니다. 패킹이 홈에 고정되어 조립 중에 밀리거나 빠지지 않고, V밴드를 조이면 플랜지 사이에서 고르게 눌려 이음부를 막습니다.</figcaption></figure><figure><img src="/uploads/lpf-tee-01.jpg" alt="실란트 패킹을 장착한 LPF T분기관" loading="lazy"><figcaption><b>이형관까지 같은 방식으로</b>직관뿐 아니라 T분기관·엘보 같은 이형관에도 홈과 패킹을 똑같이 적용합니다. 모든 이음부가 같은 기밀 조건을 갖춥니다.</figcaption></figure><figure><img src="/uploads/lpf-sealant-02.jpg" alt="관경별로 실란트 패킹을 장착한 LPF 직관" loading="lazy"><figcaption><b>공장에서 장착해 출하</b>관경에 맞춰 패킹을 끊김 없이 한 바퀴 둘러 장착한 상태로 출하합니다. 현장에서는 맞대고 V밴드만 체결하면 됩니다.</figcaption></figure><figure><img src="/uploads/lpf-packing-gray-01.jpg" alt="회색 실란트 패킹" loading="lazy"><figcaption><b>실란트 패킹</b>현재는 연도 외관과 어울리는 회색 실란트 패킹을 씁니다. 기존 주황색 패킹과 소재·성능은 같고 색만 바꿨습니다.</figcaption></figure><figure><img src="/uploads/lpf-packing-ceramic-01.jpg" alt="고온용 세라믹 패킹" loading="lazy"><figcaption><b>고온용 세라믹 패킹</b>배기 온도가 높은 발전기 라인에는 세라믹 패킹을 씁니다. 800℃ 이상에서 24시간 가열 시험을 견딘 것을 시험성적서로 확인했습니다. <a class="get" href="/uploads/lpf-세라믹-패킹-시험성적서.pdf" target="_blank" rel="noopener">시험성적서 보기 →</a></figcaption></figure><figure class="wide"><img src="/uploads/lpf-shipped-gray-01.jpg" alt="회색 실란트 패킹을 장착해 출하 대기 중인 LPF 기밀연도" loading="lazy"><figcaption><b>회색 실란트 패킹 장착 제품</b>현재 실란트 패킹은 주황색에서 회색으로 변경됐습니다.<br>소재와 성능은 그대로 두고 패킹 색만 연도와 같은 회색으로 바꿔, 제품 전체가 한 톤으로 깔끔합니다.</figcaption></figure></div>`) +
    two('Packing', '패킹 선택', `<div class="tw"><table class="tbl"><thead><tr><th>패킹</th><th>적용 조건</th><th>대표 장비</th></tr></thead><tbody>${list(prod.packing).map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.cond)}</td><td>${esc(r.equip)}</td></tr>`).join('')}</tbody></table></div><p class="note">${esc(prod.packing_note)}</p>`) +
    two('Assembly', '조립 순서', `<ol class="steps">${list(prod.steps).map((s) => `<li>${esc(s.text)}</li>`).join('')}</ol>`) +
    two('Manufacturing', '제작 기준', `<div class="tw"><table class="tbl"><thead><tr><th>연도 직경</th><th class="c">~ Ø900</th><th class="c">Ø1000 – 1500</th><th class="c">Ø1600 ~</th></tr></thead><tbody><tr><td>STS304 내부관 두께</td><td class="c num">${esc(prod.lpf_thickness?.a)}</td><td class="c num">${esc(prod.lpf_thickness?.b)}</td><td class="c num">${esc(prod.lpf_thickness?.c)}</td></tr></tbody></table></div><ul style="margin:32px 0 0;padding-left:20px;color:var(--muted);display:grid;gap:8px">${list(prod.mfg).map((m) => `<li>${esc(m.text)}</li>`).join('')}</ul>`) }),
});

// ---------- PROJECTS ----------
{
  const items = list(proj.items);
  const cats = ['전체', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
  const rows = items.map((r) => `<tr data-cat="${esc(r.category)}"><td>${esc(r.name)}</td><td style="color:var(--muted)">${esc(r.category)}</td><td>${esc(r.contractor) || '<span style="color:var(--muted)">—</span>'}</td></tr>`).join('');
  add('/projects/', {
    title: '납품실적', section: 'projects', image: proj.banner,
    desc: `${site.short_name} 연도 납품실적 — ${items.slice(0, 8).map((i) => i.name).join(', ')} 등 13,000곳 이상.`,
    body: subPage({ en: 'Projects', title: '납품실적', banner: proj.banner, section: 'projects', current: '/projects/', body:
      two('Reference', '대표 납품 현장', `<div class="filters" id="filters" role="group" aria-label="분야 필터">${cats.map((c, i) => `<button type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join('')}</div>
<div class="searchrow"><span class="rcnt" id="countLine"><b>${items.length}</b> 개 현장</span><input id="q" type="search" placeholder="현장명 · 시공사 검색" aria-label="현장 검색"></div>
<div class="tw"><table class="tbl" id="rtable"><thead><tr><th>현장명</th><th>분야</th><th>시공사</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="note" id="noResult" hidden>검색 결과가 없습니다. 다른 이름으로 찾아보세요.</p>`, `<p class="note" style="margin-top:14px">${esc(proj.note)}</p>`) }),
  });
}
add('/projects/gallery/', {
  title: '현장 사진', section: 'projects', image: proj.banner,
  body: subPage({ en: 'Projects', title: '현장 사진', banner: proj.banner, section: 'projects', current: '/projects/gallery/', body:
    `<div style="padding-block:clamp(56px,7vw,96px)"><div class="gal">${list(proj.gallery).map((g) => `<figure>${img(g.image, g.caption)}<figcaption>${esc(g.caption)}<span>${esc(g.year)}</span></figcaption></figure>`).join('')}</div></div>` }),
});
add('/projects/certification/', {
  title: '인증·특허', section: 'projects', image: proj.banner,
  body: subPage({ en: 'Projects', title: '인증·특허', banner: proj.banner, section: 'projects', current: '/projects/certification/', body:
    two('Patents', '특허 · 디자인 · 상표', `<div class="iprows" style="margin-top:0">${list(proj.patents).map((p) => `<div class="r"><span class="k">${esc(p.type)}</span><b>${esc(p.title)}</b><span class="n">${esc(p.number)}</span><span class="y">${esc(p.year)}</span></div>`).join('')}</div>`) +
    two('Material', '원자재 인증', `<div class="tw"><table class="tbl"><thead><tr><th>구분</th><th>발행</th><th>내용</th></tr></thead><tbody>${list(proj.materials).map((m) => `<tr><td>${esc(m.kind)}</td><td>${esc(m.issuer)}</td><td>${esc(m.content)}</td></tr>`).join('')}</tbody></table></div><p class="note">${esc(proj.materials_note)}</p>`) }),
});

// ---------- SUPPORT ----------
add('/support/downloads/', {
  title: '자료실', section: 'support', image: sup.banner,
  body: subPage({ en: 'Customer', title: '자료실', banner: sup.banner, section: 'support', current: '/support/downloads/', body:
    two('Download', '자료실', `<div class="dl">${list(sup.downloads).map((d) => {
      const ext = (String(d.file || '').split('.').pop() || 'PDF').toUpperCase();
      const right = d.file ? `<a class="get" href="${esc(d.file)}" download>내려받기 ↓</a>` : `<em>${esc(d.status || '준비 중')}</em>`;
      return `<div><span class="ext">${d.file ? esc(ext) : 'PDF'}</span><div><b>${esc(d.title)}</b><span>${esc(d.desc)}</span></div>${right}</div>`;
    }).join('')}</div>`) }),
});
add('/support/contact/', {
  title: '온라인 문의', section: 'support', image: sup.banner,
  body: subPage({ en: 'Customer', title: '온라인 문의', banner: sup.banner, section: 'support', current: '/support/contact/', body:
    two('Contact', '견적 · 기술 문의', `<form class="form" name="contact" method="POST" action="https://api.web3forms.com/submit">
<input type="hidden" name="access_key" value="f16da7f0-6f2c-494e-abbd-a1a7d74753d4">
<input type="hidden" name="subject" value="[중앙연도 홈페이지] 새 온라인 문의">
<input type="hidden" name="from_name" value="중앙연도 홈페이지">
<input type="hidden" name="redirect" value="${baseUrl}/support/contact/thanks/">
<input type="checkbox" name="botcheck" class="hidden" style="display:none" tabindex="-1" autocomplete="off">
<label>회사명 / 성함<input name="name" id="f-name" required></label>
<label>연락처<input name="phone" id="f-tel" type="tel" required placeholder="010-0000-0000"></label>
<label>이메일<input name="email" id="f-email" type="email" placeholder="선택"></label>
<label>문의 구분<select name="type" id="f-type">${list(sup.contact_types).map((t) => `<option>${esc(t.name)}</option>`).join('')}</select></label>
<label class="full">현장명<input name="site" id="f-site" placeholder="예) ○○병원 기계실"></label>
<label class="full">내용<textarea name="message" id="f-msg" required placeholder="장비 종류, 관경, 수량, 납기 등을 적어 주세요."></textarea></label>
<p class="full note" style="margin:0">도면·사양서는 ${esc(site.email)} 로 메일 보내 주시면 함께 검토합니다.</p>
<label class="agree full"><input type="checkbox" id="f-agree" name="agree" value="동의" required> 개인정보 수집·이용(문의 응대 목적)에 동의합니다. <a href="/privacy/" style="text-decoration:underline">자세히</a></label>
<div class="full"><button class="btn" type="submit">문의 보내기 →</button></div>
</form>`, `<p class="note" style="margin-top:14px">${esc(sup.contact_intro)}</p><p class="num" style="font-size:30px;margin-top:28px;line-height:1.2"><a href="${telHref(site.tel)}">${esc(site.tel)}</a><button class="copy" data-copy="${esc(site.tel)}">복사</button></p><p style="color:var(--muted);margin-top:6px">${esc(site.email)}<button class="copy" data-copy="${esc(site.email)}">복사</button></p>`) }),
});
add('/support/contact/thanks/', {
  title: '문의 접수 완료', section: 'support', image: sup.banner,
  body: subPage({ en: 'Customer', title: '온라인 문의', banner: sup.banner, section: 'support', current: '/support/contact/', body:
    two('Thank you', '문의가 접수되었습니다', `<p class="lead" style="margin-top:0">${esc(sup.thanks_text)}</p><a class="arrow" href="/">홈으로</a>`) }),
});
add('/privacy/', {
  title: '개인정보처리방침', section: '', image: sup.banner,
  body: `<section class="subvis">${img(sup.banner).replace(' loading="lazy"', '')}<div class="wrap"><div class="en">Privacy</div><h1>개인정보처리방침</h1></div></section><div class="wrap">${two('Privacy', '개인정보처리방침', `<div class="prose"><p>${esc(site.name)}(이하 "회사")는 온라인 문의 응대를 위해 아래와 같이 개인정보를 수집·이용합니다.</p>
<p><b>수집 항목</b><br>회사명/성함, 연락처, 이메일(선택), 현장명, 문의 내용, 첨부파일(선택)</p>
<p><b>이용 목적</b><br>견적·기술 문의에 대한 회신 및 상담</p>
<p><b>보유 기간</b><br>문의 처리 완료 후 1년간 보관 후 파기합니다. 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
<p><b>문의처</b><br>${esc(site.name)} · ${esc(site.tel)} · ${esc(site.email)}</p>
<p>위 내용에 동의하지 않을 수 있으며, 동의하지 않을 경우 온라인 문의 이용이 제한될 수 있습니다. 전화·이메일 문의는 동의 없이 가능합니다.</p></div>`)}</div>`,
});

function render() {
  // 404
  pages.push({ url: '/404.html', html: layout({ url: '/404.html', title: '페이지를 찾을 수 없습니다', section: '', body: `<section class="subvis">${img(home.cta_image).replace(' loading="lazy"', '')}<div class="wrap"><div class="en">404</div><h1>페이지를 찾을 수 없습니다</h1></div></section><div class="wrap">${two('Not found', '주소를 다시 확인해 주세요', '<p class="lead" style="margin-top:0">요청하신 페이지가 없거나 이동되었습니다.</p><a class="arrow" href="/">홈으로</a>')}</div>` }) });

  fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(path.join(ROOT, 'static'), OUT);
  for (const p of pages) {
    const file = p.url.endsWith('.html') ? path.join(OUT, p.url) : path.join(OUT, p.url, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, yrs(p.html).replace(/(src|href)="(\/(?:uploads|css|js)\/[^"?]+)"/g, (m, a, s) => a + '="' + s + '?v=' + ver(s) + '"'));
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.filter((p) => !p.url.endsWith('.html') && !p.url.includes('thanks')).map((p) => `<url><loc>${baseUrl}${p.url}</loc><lastmod>${today}</lastmod></url>`).join('');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), PRIVATE ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${baseUrl}/sitemap.xml\n`);
  console.log(`built ${pages.length} pages → _site/`);
}
function yrs(html) {
  const from = 2008; // 중앙스택 창업 연도 기준
  return html.replace(/\{년수\}/g, `<span class="years-since" data-from="${from}">${new Date().getFullYear() - from}</span>`);
}
function ver(s) {
  try { return require('crypto').createHash('md5').update(fs.readFileSync(path.join(ROOT, 'static', s))).digest('hex').slice(0, 8); }
  catch (e) { return Date.now().toString(36); }
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
render();
