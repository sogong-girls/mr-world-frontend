# mr-world-frontend

미스터 월드 테마 여행 서비스의 웹 화면 (React 18 + Vite, JavaScript, React Router).
고객 화면(투어 목록·예약·결제·내 여행·AI 채팅)과 직원 화면(투어 관리·예약 현황·창고 재고)이 있습니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

- 기본 설정이면 개발 서버가 `/api/ai/*`는 AI 서버(`https://mr-world-ai.duckdns.org`), 나머지 `/api/*`는 백엔드(`https://mr-world-backend.duckdns.org`)로 넘깁니다 (`vite.config.js`).
- 로컬 서버를 쓰려면 `.env.example`을 `.env.local`로 복사하고 `DEV_API_PROXY`, `DEV_AI_PROXY`를 적습니다.
- 서버 없이 화면만 보려면 `.env.local`에 `VITE_USE_MOCK=true` (시험 계정 `user123` / `password123!`, `admin` / `admin123!`). AI 채팅은 mock이 없어 AI 서버가 필요합니다.

## 그 밖의 명령

```bash
npm run lint       # ESLint
npm run build      # dist/ 에 배포용 파일
npm run preview    # build 결과 미리 보기
```

## 환경 변수 (`.env.example`)

| 이름 | 뜻 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 주소. 비워 두면 같은 출처(`/api`) |
| `VITE_AI_BASE_URL` | AI 서버 주소. 비워 두면 같은 출처(`/api/ai`) |
| `VITE_USE_MOCK` | `true`면 `src/mocks/data.js`로 동작 |
| `DEV_API_PROXY`, `DEV_AI_PROXY` | 개발 서버 proxy 대상 (기본: 배포 서버) |

## 배포 (Vercel)

`vercel.json`의 rewrites가 `/api/ai/*` → AI 서버, `/api/*` → 백엔드, 나머지 → `index.html`로 보냅니다.
프론트와 API가 같은 출처가 되어 로그인 쿠키(HttpOnly, `SameSite=Lax`)가 실리고 CORS 설정이 필요 없으며, `/booking` 같은 주소에서 새로고침해도 404가 나지 않습니다.

## 서버와 맞춘 규칙

- 로그인: `POST /api/auth/login`(204 + 쿠키) 뒤 `GET /api/users/me`. 401이면 `POST /api/auth/refresh`를 한 번 부르고 다시 시도합니다 (`src/api/client.js`).
- 오류 문장: 백엔드는 글자 그대로, AI 서버는 `{status, code, message}` → `getErrorMessage` (`src/api/errors.js`).
- 예약 요청: `startAt`/`endAt`은 시간대 없는 KST(`2026-11-27T09:00:00`), 종료일 = 출발일 + (`days` − 1), `bookingAddons: [{addonOptionId, nthDay, meal}]`, 금액은 보내지 않습니다.
- 금액: 프론트가 계산하지 않고 `POST /api/tours/{id}/price`의 `totalPrice`, `discountPrice`, `finalPrice`를 그대로 보여 줍니다.
- AI 채팅: 대화 기록·draft·confirmedFields는 `src/context/AiChatContext.jsx`에 두고 예약 페이지와 함께 씁니다.
- 도메인 상수(최대 인원 `MAXIMUM_N_PEOPLE` 등)와 enum 표기는 `src/constants.js`.
