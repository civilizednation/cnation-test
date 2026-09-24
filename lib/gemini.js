// Gemini 호출 공통 로직 (Vercel 함수와 로컬 서버가 함께 사용)
// API 키는 서버 환경변수 GEMINI_API_KEY 에서만 읽습니다. 브라우저로 절대 보내지 않습니다.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_PROMPT_LENGTH = 1000;

export async function askGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: 500, body: { error: '서버에 GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' } };
  }

  const text = typeof prompt === 'string' ? prompt.trim() : '';
  if (!text) {
    return { status: 400, body: { error: '질문을 입력해주세요.' } };
  }
  if (text.length > MAX_PROMPT_LENGTH) {
    return { status: 400, body: { error: `질문은 ${MAX_PROMPT_LENGTH}자 이내로 입력해주세요.` } };
  }

  // 모델은 GEMINI_MODEL 로 바꿀 수 있습니다. 기본값은 항상 최신 Flash 를 가리키는 별칭입니다.
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  const response = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 키를 URL(?key=)이 아닌 헤더로 보내 로그에 남지 않게 합니다.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }] }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      status: response.status,
      body: { error: data.error?.message || `Gemini API 호출 실패 (HTTP ${response.status})` },
    };
  }

  const reply = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('')
    .trim();
  if (!reply) {
    return { status: 502, body: { error: 'Gemini 응답이 비어 있습니다.' } };
  }

  return { status: 200, body: { reply, model } };
}
