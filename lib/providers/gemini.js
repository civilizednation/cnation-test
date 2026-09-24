// Google Gemini (무료 키). 필요하면 Google 검색 연동(Grounding)을 사용합니다.
import { coolDown, isCoolingDown } from '../cooldown.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 검색에 사용된 웹 페이지 목록 (중복 제거)
function extractSources(candidate) {
  const seen = new Set();
  return (candidate?.groundingMetadata?.groundingChunks || [])
    .map((chunk) => chunk.web)
    .filter((web) => web?.uri && !seen.has(web.uri) && seen.add(web.uri))
    .map((web) => ({ title: web.title || web.uri, url: web.uri }));
}

async function callModel({ apiKey, model, text, systemPrompt, useSearch }) {
  const response = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 키를 URL(?key=)이 아닌 헤더로 보냅니다. 새 AQ. 형식 키는 헤더 방식만 지원합니다.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      ...(useSearch && { tools: [{ google_search: {} }] }),
    }),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

export const gemini = {
  id: 'gemini',
  label: 'Gemini',
  envKey: 'GEMINI_API_KEY',

  async ask({ apiKey, text, systemPrompt, search }) {
    const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean))];
    // 검색을 요청하면: 모델마다 검색 켜고 시도 -> 429 면 검색 끄고 시도 (검색은 무료 한도가 더 적음)
    const attempts = models.flatMap((model) =>
      search ? [{ model, useSearch: true }, { model, useSearch: false }] : [{ model, useSearch: false }],
    );

    let last = { status: 0, error: '사용 가능한 Gemini 모델이 없습니다 (잠시 대기 중).' };
    for (let i = 0; i < attempts.length; i++) {
      const { model, useSearch } = attempts[i];
      const key = `gemini:${model}:${useSearch}`;
      if (isCoolingDown(key)) continue;

      let res = await callModel({ apiKey, model, text, systemPrompt, useSearch });
      if (res.status === 503) {
        // 일시적인 붐빔: 잠깐 쉬고 같은 조건으로 한 번 더
        await sleep(RETRY_DELAY_MS);
        res = await callModel({ apiKey, model, text, systemPrompt, useSearch });
      }

      if (res.ok) {
        const candidate = res.data.candidates?.[0];
        const reply = (candidate?.content?.parts || []).map((part) => part.text || '').join('').trim();
        if (!reply) return { ok: false, status: 502, error: 'Gemini 응답이 비어 있습니다.' };
        return { ok: true, reply, model, search: useSearch, sources: extractSources(candidate) };
      }

      last = { status: res.status, error: res.data.error?.message || `HTTP ${res.status}` };
      console.warn(`[gemini] ${model} search=${useSearch} -> HTTP ${res.status}: ${last.error}`);

      if (res.status === 429) coolDown(key);
      // 붐빔/한도 초과가 아니면(키 오류 등) 다른 조건으로 바꿔도 소용없습니다.
      if (res.status !== 503 && res.status !== 429) break;
      // 503(붐빔)은 검색과 무관하므로 같은 모델의 "검색 끄고" 단계는 건너뜁니다.
      if (res.status === 503 && useSearch) i++;
    }
    return { ok: false, ...last };
  },
};
