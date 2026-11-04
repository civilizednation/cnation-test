# 붕어빵 장사 (Bungeoppang Tycoon) 🐟✨

Google AI Studio에서 제작된 고퀄리티 붕어빵 가게 운영 시뮬레이션 게임입니다. 
다양한 업그레이드, 12종의 미니게임, 그리고 Gemini(Imagen 4.0) 기반의 AI 홍보 이미지 생성 기능을 제공합니다.

## 🚀 주요 기능
- **타이쿤 시스템**: 주문 접수, 재료 선택, 시간 관리 및 굽기 프로세스.
- **성장 시스템**: 총 8종의 업그레이드 (틀 추가, 굽기 속도, 자동 서빙 로봇 등).
- **보너스 스테이지**: 짝 맞추기, 사다리 타기, 슈팅, 팩맨 등 12가지의 미니게임.
- **AI 홍보**: Imagen 4.0 모델을 사용해 나만의 붕어빵 홍보 이미지 생성 기능.
- **일일 이벤트**: 매일 랜덤하게 발생하는 할인 및 수익 보너스 특가.

## 🛠 GitHub 업로드 방법

### 1. 로컬 저장소 초기화
터미널(또는 명령 프롬프트)을 열고 프로젝트 폴더에서 다음을 입력하세요.
```bash
git init
git add .
git commit -m "Initial commit: 붕어빵 장사 버전 1.0 완료"
```

### 2. GitHub 레포지토리 생성 및 연결
GitHub 웹사이트에서 새 저장소(New Repository)를 만든 후 아래 명령어를 입력하세요.
```bash
git branch -M main
git remote add origin https://github.com/사용자아이디/레포지토리이름.git
git push -u origin main
```

## 🌐 배포 방법 (GitHub Pages)
이 프로젝트는 별도의 빌드 과정 없이 `index.html`을 바로 사용할 수 있습니다.
1. GitHub 저장소의 **Settings > Pages**로 이동합니다.
2. **Build and deployment > Branch**를 `main`으로 선택하고 **Save**를 클릭합니다.
3. 약 1~2분 후 생성된 URL을 통해 웹에서 바로 플레이할 수 있습니다.

## ⚠️ 중요: API KEY 보안
- 본 앱은 `process.env.API_KEY`를 통해 Gemini API를 호출합니다.
- **주의**: GitHub에 코드를 올릴 때 소스 코드 내에 실제 API 키 문자열이 포함되지 않도록 하세요. (현재 코드는 환경 변수를 사용하므로 안전합니다.)
- AI Studio 밖에서 실행할 경우, 이미지 생성 기능을 사용하려면 별도의 API 키 설정이 필요합니다.

---
**Version**: 1.0  
**Powered by**: Google Gemini API & React