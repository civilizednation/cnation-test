# Gemini API 깃허브 연동 및 테스트 프로젝트

본 프로젝트는 소스 코드에 API 키를 노출시키지 않고 **깃허브(GitHub)에 올려서 직접 테스트**할 수 있도록 구성된 패키지입니다.

---

## 📁 주요 구성 파일

1. **`.github/workflows/test.yml`**: 깃허브 클라우드 환경(GitHub Actions)에서 자동으로 API 키를 검증하는 워크플로우 설정 파일
2. **`index.html`**: 깃허브 Pages 또는 브라우저에서 바로 질문/답변을 주고받을 수 있는 웹앱 프로토타입
3. **`test_gemini.py` / `test_gemini.js`**: API 정상 작동 테스트 스크립트
4. **`.gitignore`**: 키 정보 파일(`.env`)이 깃허브에 커밋되지 않도록 차단
5. **`.env.example`**: 로컬 환경 변수 템플릿

---

## 🚀 깃허브(GitHub)에 올려서 테스트하는 방법 (4단계)

### 1단계: 깃허브에 코드 올리기
1. 깃허브(GitHub.com)에서 새 저장소(New Repository)를 만듭니다.
2. 다운로드받은 파일들을 해당 저장소에 커밋 & 푸시(Push)합니다.
   * `.github` 폴더와 `test_gemini.py`, `index.html` 등이 깃허브에 업로드됩니다.

### 2단계: 깃허브 저장소에 키 비밀 등록 (가장 중요)
코드에 키를 적는 대신, 깃허브의 보안 금고(Secrets)에 키를 등록합니다.
1. 깃허브 저장소 상단 메뉴의 **Settings** 클릭
2. 좌측 메뉴에서 **Secrets and variables** > **Actions** 클릭
3. **"New repository secret"** 초록색 버튼 클릭
4. 다음 정보를 입력하고 저장:
   * **Name**: `GEMINI_API_KEY`
   * **Secret**: 보유하신 실제 Gemini API 키 (`AIzaSy...`) 붙여넣기

### 3단계: 깃허브 Actions에서 테스트 실행
1. 깃허브 저장소 상단 메뉴의 **Actions** 탭 클릭
2. 좌측 워크플로우 목록에서 **"Gemini API Key Test"** 클릭
3. 우측의 **"Run workflow"** 버튼 클릭 후 초록색 **"Run workflow"** 버튼 클릭
4. 몇 초 후 작업(Job)이 실행되며 초록색 체크(✔) 표시가 뜹니다.
5. 실행 기록을 클릭하여 `Gemini API 테스트 실행` 항목을 펼쳐보면 **`🎉 [성공] Gemini API 키가 정상 작동합니다!`** 와 Gemini의 실제 응답 문장을 깃허브 화면에서 직접 확인하실 수 있습니다.

---

## 🌐 질문-답변 웹앱(index.html) 활용
* 저장소의 `index.html` 파일을 브라우저로 열거나, 깃허브 **Settings > Pages**에서 브라우저 배포를 활성화하면 질문을 입력하고 Gemini의 답변을 받는 웹앱을 즉시 테스트할 수 있습니다.
