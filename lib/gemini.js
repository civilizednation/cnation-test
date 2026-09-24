// Gemini 호출 공통 로직 (Vercel 함수와 로컬 서버가 함께 사용)
// API 키는 서버 환경변수 GEMINI_API_KEY 에서만 읽습니다. 브라우저로 절대 보내지 않습니다.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_PROMPT_LENGTH = 1000;
// 붐빔(503)이나 모델별 한도 초과(429) 때 다음 모델로 넘어갑니다.
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function nowInKorea() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' });
}

// 검색에 사용된 웹 페이지 목록 (중복 제거)
function extractSources(candidate) {
  const seen = new Set();
  return (candidate?.groundingMetadata?.groundingChunks || [])
    .map((chunk) => chunk.web)
    .filter((web) => web?.uri && !seen.has(web.uri) && seen.add(web.uri))
    .map((web) => ({ title: web.title || web.uri, url: web.uri }));
}

async function callModel(model, apiKey, text, useSearch) {
  const response = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 키를 URL(?key=)이 아닌 헤더로 보냅니다. 새 AQ. 형식 키는 헤더 방식만 지원합니다.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      // 모델이 "지금" 을 알 수 있도록 현재 한국 시각을 알려줍니다.
      systemInstruction: { parts: [{ text: `현재 시각(한국): ${nowInKorea()}` }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      // Google 검색 연동: 필요할 때 모델이 직접 검색해서 최신 정보로 답합니다.
      ...(useSearch && { tools: [{ google_search: {} }] }),
    }),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

export async function askGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
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

  // GEMINI_MODEL 을 지정하면 그 모델을 먼저 시도합니다.
  const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean))];

  // 모델마다: 검색 켜고 시도 -> 한도 초과(429)면 검색 끄고 다시 시도 (검색 연동은 무료 한도가 더 적음)
  const attempts = models.flatMap((model) => [
    { model, useSearch: true },
    { model, useSearch: false },
  ]);

  let last;
  for (let i = 0; i < attempts.length; i++) {
    const { model, useSearch } = attempts[i];
    last = await callModel(model, apiKey, text, useSearch);
    if (last.status === 503) {
      // 일시적인 붐빔: 잠깐 쉬고 같은 조건으로 한 번 더
      await sleep(RETRY_DELAY_MS);
      last = await callModel(model, apiKey, text, useSearch);
    }

    if (last.ok) {
      const candidate = last.data.candidates?.[0];
      const reply = (candidate?.content?.parts || [])
        .map((part) => part.text || '')
        .join('')
        .trim();
      if (!reply) {
        return { status: 502, body: { error: 'Gemini 응답이 비어 있습니다.' } };
      }
      return { status: 200, body: { reply, model, search: useSearch, sources: extractSources(candidate) } };
    }

    console.warn(`[gemini] ${model} search=${useSearch} -> HTTP ${last.status}: ${last.data.error?.message}`);

    // 붐빔/한도 초과가 아니면(키 오류 등) 다른 조건으로 바꿔도 소용없습니다.
    if (last.status !== 503 && last.status !== 429) break;
    // 503(붐빔)은 검색과 무관하므로 같은 모델의 "검색 끄고" 단계는 건너뜁니다.
    if (last.status === 503 && useSearch) i++;
  }

  const busy = last.status === 503 || last.status === 429;
  const detail = last.data.error?.message || `HTTP ${last.status}`;
  return {
    status: last.status,
    body: {
      error: busy
        ? `지금 Gemini 서버가 붐비거나 무료 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.\n(Google 응답: ${detail})`
        : detail,
    },
  };
}
