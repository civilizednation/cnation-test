# cnation API 키 설정 가이드

새 앱에 AI 질문/답변 기능을 붙일 때 쓰는 **API 키 설정 지침**입니다.
`cnation-test` 저장소에서 실제로 세팅하고 동작을 확인한 내용을 정리했습니다.

> ⚠️ 이 문서에는 **키 값을 절대 적지 않습니다.** 키 값은 각 발급처와 Vercel에만 보관합니다.
> 채팅, 코드, HTML, 스크린샷에 키 값을 붙여넣지 마세요.

---

## 1. 한눈에 보기

| 환경변수 이름 | 용도 | 발급처 | 값 형태 | 필수 |
|---|---|---|---|---|
| `GEMINI_API_KEY` | 기본 AI (Google Gemini, 무료) | https://aistudio.google.com/apikey | `AQ.Ab…` (새 형식) | ✅ |
| `GITHUB_MODELS_TOKEN` | 1차 대체 AI (GitHub Models, GPT 계열, 무료) | GitHub → Settings → Developer settings → Fine-grained tokens | `github_pat_…` | 권장 |
| `GROQ_API_KEY` | 2차 대체 AI (Groq, Llama 등, 무료·빠름) | https://console.groq.com/keys | `gsk_…` | 권장 |
| `TAVILY_API_KEY` | 🔍 웹 검색 (Tavily, 무료 월 약 1,000회) | https://app.tavily.com | `tvly-…` | 검색 쓸 때 |

- 네 키 모두 **Vercel 팀 공용(Shared) 환경변수**로 한 번만 등록해 두었습니다.
- 새 프로젝트에서는 **Link Shared Variable**로 연결만 하면 됩니다 (→ 4장).
- 코드는 **키가 등록된 것만** 사용합니다. 필요 없는 키는 연결하지 않아도 됩니다.

### 선택 환경변수 (필요할 때만)

| 이름 | 기본값 | 설명 |
|---|---|---|
| `AI_ORDER` | `gemini,github,groq` | AI를 시도하는 순서 |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini 모델 (실패 시 `gemini-flash-lite-latest`로 자동 전환) |
| `GITHUB_MODEL` | `openai/gpt-4.1-mini` | GitHub Models 모델 |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq 모델 |

---

## 2. 키별 발급 방법

### 2-1. Gemini (`GEMINI_API_KEY`)
1. https://aistudio.google.com/apikey 접속 (키를 만든 Google 계정으로 로그인)
2. 키 옆 📋 복사 버튼으로 복사. 키가 없으면 **API 키 만들기**
3. 현재 사용 중인 키: 프로젝트 **Gemini Project Free**, 끝자리 `…E3Hw`, 무료 등급

참고:
- 2026년부터 새 키는 `AQ.Ab…` 형식입니다. 예전 `AIza…` 키는 2026년 9월에 완전히 막혔습니다.
- `AQ.` 키는 **요청 헤더 `x-goog-api-key`** 로 보내야 합니다. URL `?key=` 방식은 동작하지 않습니다 (코드에 이미 반영됨).
- 무료 등급에서는 **Google 검색 연동(Grounding)이 막혀 있습니다** (429). 웹 검색은 Tavily로 합니다.
- 무료 한도는 모델별로 따로 있고, 붐비면 503이 납니다. 코드가 자동으로 재시도하거나 다른 모델·AI로 넘어갑니다.

### 2-2. GitHub Models (`GITHUB_MODELS_TOKEN`)
1. https://github.com/settings/personal-access-tokens/new
   (프로필 → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token)
2. 입력:
   - Token name: 예) `cnation-model`
   - Expiration: 90일 정도 (**만료되면 Regenerate 후 Vercel 값 교체**)
   - Resource owner: `civilizednation`
   - Repository access: **Public repositories** (없으면 Only select repositories → 아무 저장소 1개)
   - Permissions → **Account** → `+` → `models` 검색 → **Models: Read-only** (다른 권한은 켜지 않음)
3. **Generate token** → `github_pat_…` 을 **바로 복사** (다시 볼 수 없음)

참고:
- 현재 토큰 이름: `cnation-model` (만료일은 GitHub 토큰 목록에서 확인)
- 하루 호출 횟수 제한이 적습니다 (대체 AI 용도로 충분).
- **GitHub Actions Secrets 에는 `GITHUB_` 로 시작하는 이름을 쓸 수 없습니다.** Actions에서 쓸 때는 `GH_MODELS_TOKEN` 으로 저장합니다.

### 2-3. Groq (`GROQ_API_KEY`)
1. https://console.groq.com/keys (Google 계정 가입 가능)
2. **Create API Key** → `gsk_…` 복사 (다시 볼 수 없으면 새로 만들고 예전 키 삭제)

### 2-4. Tavily (`TAVILY_API_KEY`)
1. https://app.tavily.com (Google 계정 가입 가능)
2. Overview → API Keys 에서 키 옆 📋 복사 (`tvly-dev-…`)
3. 무료 한도: 월 약 1,000회 (Usage 에서 확인)

### 2-5. 사용하지 않기로 한 것
- **ChatGPT Plus / Claude Pro 구독에는 API 사용료가 포함되지 않습니다.** OpenAI·Anthropic API는 별도 선불 충전이 필요해서 사용하지 않습니다.
- **DeepSeek / Alibaba(Qwen)**: 콘솔 메뉴가 복잡하고 무료 조건이 불확실해서 사용하지 않습니다.

---

## 3. Vercel 팀 공용(Shared) 변수 등록 — 이미 완료

> 키를 **새로 바꿀 때**만 다시 하면 됩니다.

1. Vercel 첫 화면(프로젝트 목록, **All Projects**) → 상단 **Settings** → **Environment Variables** → **Shared** 탭
2. **Add Environment Variable**
   - 유형: **Secret** (저장 후 값을 다시 볼 수 없음 = 예전의 "Sensitive")
   - Key: 위 표의 이름 그대로 (대소문자 구분)
   - Value: 발급처에서 복사한 값
   - Environments: **Production and Preview**
   - Link to Projects: 비워 둠 (프로젝트에서 연결)
3. **Save**

### 키를 교체할 때
1. Shared 탭 → 해당 변수 **⋯ → Edit** → Value 교체 → Save
2. 이 변수를 쓰는 **각 프로젝트에서 Redeploy** (배포된 앱은 배포 당시 값을 쓰기 때문)

---

## 4. 새 프로젝트(앱)에 키 연결하기

1. Vercel → 새 프로젝트 → **Settings → Environment Variables**
2. **Project** 탭에 같은 이름의 변수가 있으면 먼저 **⋯ → Remove**
   - 같은 이름이 있으면 Shared 변수를 연결할 수 없습니다.
   - 지울 때 "Redeploy 할까요?" 라고 물으면 **아니요** (연결 후 한 번만 Redeploy)
3. **Link Shared Variable** → 필요한 키 선택 → **Save**
   - 목록에 안 보이면 검색창에 이름(`gemini` 등)을 입력
4. **Shared** 탭에 연결된 키가 보이면 성공
   (앱은 Project 탭과 Shared 탭의 변수를 모두 읽습니다)
5. 질문/답변 **코드를 저장소에 추가** (→ 6장). 키만 연결해서는 아무 일도 일어나지 않습니다.
6. **Deployments → 최신 배포 ⋯ → Redeploy** (또는 main 에 머지하면 자동 배포)

### 확인 방법
- 앱에서 질문 → 답변 아래 `Gemini · gemini-flash-latest` 처럼 표시되면 성공
- 화면 하단 `AI: Gemini → GitHub Models → Groq` 에 연결된 AI만 표시됩니다.

---

## 5. 자주 겪은 문제와 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| `API key not valid` | 키 값이 잘못 들어감 | 아래 "붙여넣기 주의" 확인 후 값 다시 입력 → Redeploy |
| 붙여넣은 값이 `https://aq.ab8r…/` 처럼 바뀜 | 모바일 브라우저가 키를 웹 주소로 인식해 **소문자 변환 + https:// 추가** (번역 기능 켜짐 영향) | 브라우저 번역 끄기, 또는 메모 앱에 붙였다가 다시 복사. 저장 전 `AQ.Ab…` 대문자와 앞뒤 `https://`, `/`, 공백 없는지 확인 |
| `등록된 AI 키가 없습니다` | 변수를 연결하기 **전에** 만들어진 배포 | Redeploy |
| Preview 배포에서만 키 없음 | 변수 Environments 에 Preview 가 없음 | Shared 변수를 **Production and Preview** 로 |
| `This model is currently experiencing high demand` (503) | Google 서버 붐빔 (무료 등급에서 흔함) | 코드가 자동 재시도·모델 전환·다른 AI 전환 |
| 1초 안에 "한도 도달" 오류 | 429 한도 초과 (검색 연동 한도 0 등) | 코드가 검색 끄고 재시도 → 다른 AI로 전환. 하루 한도는 한국 시간 오후 4~5시쯤 초기화 |
| 웹 검색이 안 됨 (ℹ️ 안내) | Tavily 키 미연결 / 잘못된 값 / 한도 초과 | Shared 에 `TAVILY_API_KEY` 연결 확인, Tavily Usage 확인 |
| Redeploy 버튼이 안 보임 | 팀 Settings 화면에 있음 | **프로젝트 → Deployments** 탭에서 |

### 보안 규칙
- 키는 **서버(Vercel 함수)에서만** 읽습니다. 브라우저 코드·HTML·GitHub Pages 에 넣지 않습니다.
  (예전에 GitHub Pages 배포 시 키를 HTML에 주입했다가 키가 공개된 적이 있음 → 해당 키 삭제, Pages 비활성화)
- 키가 노출되면 **즉시 발급처에서 삭제하고 새로 발급** → Vercel Shared 값 교체 → Redeploy
- 앱 주소가 공개되어 있으면 누구나 무료 한도를 쓸 수 있습니다. 필요하면 로그인(Firebase/Supabase Auth)으로 막습니다.

---

## 6. 앱에 넣는 코드 (cnation-test 기준)

저장소: https://github.com/civilizednation/cnation-test (의존성 설치 불필요, Node.js 20.6+)

```
index.html                         채팅 화면 (스트리밍, 마크다운, 📎 첨부, 🔍 검색 체크, 하단 AI 표시)
api/chat.js                        Vercel 함수: POST /api/chat → NDJSON 스트림
api/status.js                      Vercel 함수: GET /api/status → 사용 가능한 AI 목록 (키 값 제외)
lib/chat.js                        AI 라우터 (순서대로 시도, 자동 대체, 첨부/검색 처리)
lib/providers/gemini.js            Gemini (스트리밍, 사진·PDF, Google 검색 연동)
lib/providers/openai-compatible.js GitHub Models, Groq (스트리밍, 사진)
lib/search.js                      Tavily 웹 검색 + 자동 검색 판단
lib/cooldown.js                    한도 초과(429)된 AI 5분간 건너뛰기
lib/http.js, lib/sse.js            스트리밍 응답 처리
scripts/dev-server.js              로컬 실행 (npm run dev)
scripts/check-key.js               등록된 키 동작 확인 (npm run check)
.github/workflows/check-ai-keys.yml  GitHub Actions 에서 키 확인 (수동 실행)
```

### 기능 요약
- **AI 자동 대체**: Gemini → GitHub Models → Groq. 붐빔(503)은 재시도, 한도 초과(429)는 다음 AI로.
- **스트리밍**: 답변이 생성되는 대로 표시.
- **📎 첨부**: 사진·PDF 최대 3개, 합계 약 3MB (사진은 브라우저에서 1600px JPEG로 축소, Vercel 요청 한도 4.5MB).
  | AI | 사진 | PDF |
  |---|---|---|
  | Gemini | ✅ | ✅ |
  | GitHub Models | ✅ | ❌ |
  | Groq | ❌ | ❌ |
- **🔍 웹 검색 (Tavily)**: 체크하면 항상 검색, 체크 안 해도 "오늘/현재/최신/뉴스/날씨/환율/주가…" 질문은 자동 검색. 출처 링크 표시.
- **현재 한국 시각** 과 **섭씨·미터법 표기** 를 AI에 항상 전달.

### 로컬 실행
```bash
cp .env.example .env   # .env 에 키 입력 (.env 는 git 에 올라가지 않음)
npm run check          # 키 확인
npm run dev            # http://localhost:3000
```

---

## 7. Claude 에게 새 앱 작업을 맡길 때 (복사해서 사용)

```
새 앱 <저장소 이름> 에 AI 질문/답변 기능을 넣어줘.
cnation-test 저장소의 cnation-api-key.md 와 코드(api/, lib/, index.html)를 참고해서
같은 구조로 넣어줘. API 키는 Vercel 팀 Shared 환경변수로 이미 등록되어 있어:
GEMINI_API_KEY, GITHUB_MODELS_TOKEN, GROQ_API_KEY, TAVILY_API_KEY.
키 값은 절대 코드나 채팅에 넣지 말고 process.env 로만 읽어줘.
Vercel 프로젝트에서 Link Shared Variable 로 연결하는 순서도 알려줘.
```

작업 후 할 일:
1. Vercel 새 프로젝트 → Link Shared Variable 로 4개 연결 (4장)
2. Redeploy
3. 질문해서 답변 아래 AI 표시 확인
