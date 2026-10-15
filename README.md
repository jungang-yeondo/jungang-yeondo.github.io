# (주)중앙연도 홈페이지

`content/` 폴더의 JSON 파일을 읽어 `_site/`에 홈페이지를 만드는 정적 사이트입니다. 외부 패키지 없이 `node build.js` 하나로 빌드됩니다.
관리자 화면(`/admin`)에서 문구·사진을 바꾸면 GitHub에 저장되고, Netlify가 자동으로 다시 빌드해 1~2분 뒤 사이트에 반영됩니다.

## 폴더 구조

| 경로 | 내용 | 관리자 화면에서 수정 |
|---|---|---|
| `content/*.json` | 모든 문구·표·목록 | ⭕ |
| `static/uploads/` | 사진·PDF | ⭕ (업로드) |
| `static/admin/config.yml` | 관리자 화면 항목 설정 | ✕ |
| `static/css/style.css` | 디자인 | ✕ |
| `static/js/main.js` | 슬라이드·필터 동작 | ✕ |
| `build.js` | 페이지 구조(HTML) | ✕ |

## 배포 순서

### 1. GitHub에 올리기
1. github.com에서 회사용 계정을 만듭니다.
2. 새 저장소(Repository)를 만듭니다. 이름 예: `jungang-website`, Private 선택.
3. 이 폴더의 파일 전체를 업로드합니다. 화면의 "uploading an existing file"을 누르고 폴더 내용을 끌어다 놓으면 됩니다.
4. 저장소 이름은 반드시 `jungang-website`로 만드세요. 관리자 화면 설정(`static/admin/config.yml`)에 `jungang-yeondo/jungang-website`로 이미 들어가 있습니다.

### 2. Netlify에 연결하기
1. netlify.com에서 GitHub 계정으로 가입합니다.
2. Add new site → Import an existing project → GitHub → `jungang-website`를 선택합니다.
3. 빌드 설정은 `netlify.toml`에 들어 있어서 그대로 Deploy를 누르면 됩니다.
4. 몇 분 뒤 `xxxx.netlify.app` 주소로 사이트가 열립니다.

### 3. 관리자 로그인 연결 (GitHub OAuth)
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: 사이트 주소
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. 만들어진 Client ID와 Client Secret을 복사합니다.
3. Netlify → Site configuration → Access & security → OAuth → Install provider → GitHub에 붙여넣습니다.
4. `사이트주소/admin`으로 접속해 "GitHub으로 로그인"하면 관리자 화면이 열립니다.

### 4. 도메인 연결
1. 가비아·후이즈 등에서 도메인을 구입합니다.
2. Netlify → Domain management → Add a domain에 `www.도메인`을 입력합니다.
3. Netlify가 알려주는 DNS 값을 도메인 구입처의 DNS 설정에 넣습니다. https 인증서는 자동으로 발급됩니다.
4. 관리자 화면 → ⑦ 회사 기본정보 → "홈페이지 주소"를 실제 도메인으로 바꿉니다. `config.yml`의 `site_url`과 `display_url`도 같이 바꿉니다.

### 5. 온라인 문의 메일 받기
Netlify → Forms에서 `contact` 폼이 보이면 Form notifications → Email notification에 받을 메일 주소를 등록합니다.

### 6. 검색 등록
1. 네이버 서치어드바이저(searchadvisor.naver.com)에서 사이트를 등록하고, HTML 태그 방식의 인증 코드(content="..." 안의 값)를 관리자 화면 → ⑦ → "네이버 인증 코드"에 넣고 저장합니다.
2. 반영된 뒤 서치어드바이저에서 소유 확인을 누르고, 요청 → 사이트맵 제출에 `https://www.도메인/sitemap.xml`을 입력합니다.
3. 구글 Search Console도 같은 방식으로 등록합니다.
4. 네이버 스마트플레이스(업체 등록)에 홈페이지 주소를 넣습니다.

## 관리자 화면에서 할 수 없는 것
메뉴 추가, 새로운 종류의 섹션, 색상·글꼴·배치 변경은 `build.js`와 `style.css`를 고쳐야 합니다.
