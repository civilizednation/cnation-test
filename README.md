# Gemini Q&A 테스트 앱

Gemini API(무료 키)로 간단히 질문하고 답을 받는 웹앱입니다. 의존성 설치(`npm install`)가 필요 없습니다.

```
index.html               화면 (브라우저)
api/chat.js              Vercel 서버리스 함수: POST /api/chat
lib/gemini.js            Gemini 호출 로직 (키는 서버에서만 사용)
scripts/dev-server.js    로컬 실행용 서버
scripts/check-key.js     키 동작 확인 스크립트
.github/workflows/check-gemini-key.yml   GitHub Actions 에서 키 확인
```

API 키는 **서버 쪽 환경변수 `GEMINI_API_KEY`** 에서만 읽습니다. 코드나 HTML 에 키를 직접 쓰지 마세요.

## 1. Vercel 에서 실행

1. Vercel 에서 이 저장소를 Import (Framework Preset: **Other**, Build 설정은 비워둠)
2. Settings → Environment Variables 에 `GEMINI_API_KEY` 등록 (이미 등록됨)
3. 환경변수를 추가/변경했다면 **Redeploy** 해야 반영됩니다.
4. 배포된 주소로 접속해서 질문

## 2. GitHub Actions 로 키 확인

Repository Settings → Secrets and variables → Actions 에 `GEMINI_API_KEY` 가 있으면,
Actions 탭 → **Gemini API Key Check** → **Run workflow** 를 누르면 됩니다. 로그에 ✅ 가 나오면 정상입니다.

## 3. 내 PC 에서 실행 (Node.js 20.6 이상)

```bash
cp .env.example .env      # .env 를 열어 키를 붙여넣기
npm run check             # 키 동작 확인
npm run dev               # http://localhost:3000
```

## 모델 바꾸기

기본값은 최신 Flash 모델을 가리키는 `gemini-flash-latest` 입니다.
다른 모델을 쓰려면 환경변수 `GEMINI_MODEL` 을 설정하세요 (예: `gemini-2.5-flash`).
