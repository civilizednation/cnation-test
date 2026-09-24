# Gemini Q&A 웹앱 (루트 단일 폴더 구성)

하위 폴더(`api/` 등) 없이 **모든 파일이 최상위(루트)에 위치**하도록 설계된 Vercel 배포용 프로젝트입니다.

---

## 📁 파일 목록 (루트에 모두 위치)

1. `index.html` : 프론트엔드 UI 화면 (API 키 입력창 없음, 1,000자 제한)
2. `chat.js` : 백엔드 서버리스 함수 (서버 내부에서만 키를 읽어 Gemini 호출)
3. `vercel.json` : `chat.js`를 백엔드 함수로 자동 연결하는 Vercel 라우팅 설정
4. `package.json` : 프로젝트 메타데이터
5. `.gitignore` : 보안 제외 설정
6. `.env.example` : 환경변수 템플릿

---

## 🚀 배포 방법 (초간단)

1. 이 폴더 안의 파일들을 깃허브 저장소 루트에 올립니다.
2. Vercel에서 해당 저장소를 연결(Import)합니다.
3. Vercel의 **Settings > Environment Variables**에 `GEMINI_API_KEY`를 등록합니다.
4. 배포 완료 후 생성된 Vercel 링크로 접속하면 키 입력 없이 바로 질문-답변이 가능합니다!
