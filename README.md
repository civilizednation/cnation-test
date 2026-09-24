# AI Q&A 테스트 앱

무료 AI API 로 간단히 질문하고 답을 받는 웹앱입니다. 의존성 설치(`npm install`)가 필요 없습니다.

```
index.html                         화면 (브라우저)
api/chat.js                        Vercel 서버리스 함수: POST /api/chat
lib/chat.js                        여러 AI 를 순서대로 시도하는 라우터
lib/providers/gemini.js            Google Gemini (+ Google 검색 연동)
lib/providers/openai-compatible.js GitHub Models, Groq
lib/search.js                      Tavily 웹 검색
lib/cooldown.js                    한도 초과된 AI 를 5분간 건너뛰기
lib/http.js / lib/sse.js           스트리밍 응답 처리
scripts/dev-server.js              로컬 실행용 서버
scripts/check-key.js               등록된 키가 동작하는지 확인
.github/workflows/check-ai-keys.yml  GitHub Actions 에서 키 확인
```

## 사용하는 AI (키가 등록된 것만, 이 순서로 시도)

| 순서 | AI | 환경변수 | 키 발급 |
|---|---|---|---|
| 1 | Gemini | `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| 2 | GitHub Models | `GITHUB_MODELS_TOKEN` | GitHub → Settings → Developer settings → Fine-grained tokens (Account 권한 **Models: Read-only**) |
| 3 | Groq | `GROQ_API_KEY` | https://console.groq.com/keys |

- 답변은 스트리밍으로 생성되는 대로 바로 표시됩니다.
- 앞의 AI 가 붐비거나 한도를 넘으면 다음 AI 로 자동 전환합니다. 한도 초과(429)된 AI 는 5분간 건너뜁니다.
- 순서는 `AI_ORDER` (예: `gemini,groq,github`), 모델은 `GEMINI_MODEL` / `GITHUB_MODEL` / `GROQ_MODEL` 로 바꿀 수 있습니다.
- 키는 서버 환경변수에서만 읽으며 브라우저로 보내지 않습니다. 코드나 HTML 에 키를 직접 쓰지 마세요.

## 파일 첨부

📎 버튼으로 사진(JPG, PNG, WEBP, GIF)과 PDF 를 최대 3개, 합계 약 3MB 까지 첨부할 수 있습니다.
사진은 브라우저에서 긴 변 1600px JPEG 로 줄여서 보냅니다 (Vercel 요청 한도 4.5MB).

| AI | 사진 | PDF |
|---|---|---|
| Gemini | ✅ | ✅ |
| GitHub Models | ✅ | ❌ |
| Groq | ❌ | ❌ |

첨부를 지원하지 않는 AI 는 건너뜁니다.

## 웹 검색

화면의 🔍 체크박스를 켜면 최신 정보를 검색해서 답하고 출처 링크를 보여줍니다.

1. `TAVILY_API_KEY` 가 있으면 [Tavily](https://app.tavily.com) 로 먼저 검색하고, 결과를 질문에 붙여서 보냅니다. Gemini, GitHub Models, Groq 어느 AI 가 답해도 동작합니다.
2. Tavily 키가 없거나 실패하면 Gemini 의 Google 검색 연동을 시도합니다 (무료 키에서는 대부분 막혀 있음).
3. 둘 다 안 되면 검색 없이 답하고, 답변 아래에 ℹ️ 안내를 표시합니다.

## 1. Vercel 에서 실행

1. Vercel 에서 이 저장소를 Import (Framework Preset: **Other**)
2. Settings → Environment Variables 에 위 표의 키 등록
3. 환경변수를 추가/변경했다면 **Redeploy** 해야 반영됩니다.

## 2. GitHub Actions 로 키 확인

Repository Settings → Secrets and variables → Actions 에 키를 등록한 뒤
Actions 탭 → **AI Key Check** → **Run workflow**.
GitHub Secrets 이름은 `GITHUB_` 로 시작할 수 없으므로 GitHub Models 토큰은 `GH_MODELS_TOKEN` 으로 저장하세요.

## 3. 내 PC 에서 실행 (Node.js 20.6 이상)

```bash
cp .env.example .env      # .env 를 열어 키를 붙여넣기
npm run check             # 키 동작 확인
npm run dev               # http://localhost:3000
```
