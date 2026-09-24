import os
import json
import urllib.request
import urllib.error

# .env 파일 수동 로드 (python-dotenv 미설치 환경 대비)
def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    os.environ[k] = v

load_env_file()

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key or api_key == "실제키_입력" or not api_key.strip():
    print("\n[오류] .env 파일에서 GEMINI_API_KEY를 찾을 수 없거나 아직 '실제키_입력' 상태입니다.")
    print("1. .env.example 파일을 복사하여 .env 파일을 생성하세요.")
    print("2. .env 파일 내 GEMINI_API_KEY에 실제 발급받은 키를 입력하세요.\n")
    exit(1)

print("Gemini API 키 테스트를 시작합니다...")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{"text": "안녕하세요! API 키 정상 연동 테스트입니다. 한 문장으로 간단히 인사해 주세요."}]
    }]
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode("utf-8"))
        reply = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        print("\n========================================")
        print("🎉 [성공] Gemini API 키가 정상 작동합니다!")
        print("========================================")
        print("Gemini 응답 내용:")
        print(reply)
        print("========================================\n")
except urllib.error.HTTPError as e:
    err_body = e.read().decode("utf-8")
    print(f"\n❌ [API 호출 실패] HTTP 상태 코드: {e.code}")
    print("오류 내용:\n", err_body)
except Exception as e:
    print(f"\n❌ [통신/실행 오류]: {e}")
