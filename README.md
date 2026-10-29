# (주)중앙연도 홈페이지

- 사이트 주소: https://jungangyeondo.co.kr
- 관리자 화면: https://jungangyeondo.co.kr/admin
- 저장소: `jungang-yeondo/jungang-yeondo.github.io` (main 브랜치)

`content/` 폴더의 JSON 파일을 읽어 `_site/`에 홈페이지를 만드는 정적 사이트입니다. 외부 패키지 없이 `node build.js` 하나로 빌드됩니다.
main 브랜치에 변경이 올라가면 GitHub Actions(`.github/workflows/pages.yml`)가 빌드해 GitHub Pages에 배포하고, 1~2분 뒤 사이트에 반영됩니다.

## 폴더 구조

| 경로 | 내용 | 관리자 화면에서 수정 |
|---|---|---|
| `content/*.json` | 모든 문구·표·목록 | ⭕ |
| `static/uploads/` | 사진·PDF | ⭕ (업로드) |
| `static/admin/config.yml` | 관리자 화면 항목 설정 | ✕ |
| `static/admin/index.html` | 관리자 화면(Sveltia CMS) 불러오기 | ✕ |
| `static/css/style.css` | 디자인 | ✕ |
| `static/js/main.js` | 슬라이드·필터 동작 | ✕ |
| `build.js` | 페이지 구조(HTML) | ✕ |
| `.github/workflows/pages.yml` | 자동 빌드·배포 | ✕ |

`netlify.toml`은 예전에 Netlify를 쓰던 때의 파일로, 지금은 사용하지 않습니다.

## 내용 수정하기

### 관리자 화면에서
1. `https://jungangyeondo.co.kr/admin`에 접속합니다.
2. GitHub 토큰(Personal Access Token)으로 로그인합니다. 토큰은 `jungang-yeondo.github.io` 저장소에 쓰기 권한(Contents: Read and write)이 있어야 합니다.
3. 문구를 고치거나 사진을 올리고 저장하면 main 브랜치에 바로 커밋되고, 자동으로 배포됩니다.

### 배포 확인
저장소의 Actions 탭에서 "홈페이지 배포" 작업이 초록색 체크로 끝나면 사이트에 반영된 것입니다. 빨간색 X가 뜨면 해당 작업을 눌러 오류 내용을 확인합니다.

## 도메인
`jungangyeondo.co.kr`은 저장소 Settings → Pages → Custom domain에 연결되어 있습니다. 도메인을 바꿀 때는 이곳과 도메인 구입처의 DNS 설정을 함께 바꾸고, `static/admin/config.yml`의 `site_url`·`display_url`과 관리자 화면 → ⑦ 회사 기본정보 → "홈페이지 주소"도 맞춰 줍니다.

## 검색 등록
1. 네이버 서치어드바이저(searchadvisor.naver.com)에서 사이트를 등록하고, HTML 태그 방식의 인증 코드(content="..." 안의 값)를 관리자 화면 → ⑦ → "네이버 인증 코드"에 넣고 저장합니다.
2. 반영된 뒤 서치어드바이저에서 소유 확인을 누르고, 요청 → 사이트맵 제출에 `https://jungangyeondo.co.kr/sitemap.xml`을 입력합니다.
3. 구글 Search Console도 같은 방식으로 등록합니다.
4. 네이버 스마트플레이스(업체 등록)에 홈페이지 주소를 넣습니다.

## 관리자 화면에서 할 수 없는 것
메뉴 추가, 새로운 종류의 섹션, 색상·글꼴·배치 변경은 `build.js`와 `style.css`를 고쳐야 합니다.
