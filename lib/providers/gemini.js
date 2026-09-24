// Google Gemini (무료 키). 필요하면 Google 검색 연동(Grounding)을 사용합니다.
import { coolDown, isCoolingDown } from '../cooldown.js';
import { readSSE } from '../sse.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 검색에 사용된 웹 페이지 목록
function extractSources(candidate) {
  return (candidate?.groundingMetadata?.groundingChunks || [])
    .map((chunk) => chunk.web)
    .filter((web) => web?.uri)
    .map((web) => ({ title: web.title || web.uri, url: web.uri }));
}

function callModel({ apiKey, model, text, files, systemPrompt, useSearch }) {
  return fetch(`${API_BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 키를 URL(?key=)이 아닌 헤더로 보냅니다. 새 AQ. 형식 키는 헤더 방식만 지원합니다.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [
            ...files.map((file) => ({ inline_data: { mime_type: file.mimeType, data: file.data } })),
            { text },
          ],
        },
      ],
      ...(useSearch && { tools: [{ google_search: {} }] }),
    }),
  });
}

async function* streamParts(response) {
  for await (const data of readSSE(response)) {
    const candidate = JSON.parse(data).candidates?.[0];
    const text = (candidate?.content?.parts || []).map((part) => part.text || '').join('');
    if (text) yield { text };
    const sources = extractSources(candidate);
    if (sources.length) yield { sources };
  }
}

export const gemini = {
  id: 'gemini',
  label: 'Gemini',
  envKey: 'GEMINI_API_KEY',
  supports: (kind) => kind === 'image' || kind === 'pdf',
  models: () => [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean))],

  // 성공하면 { ok: true, model, search, stream } 을, 실패하면 { ok: false, status, error } 를 돌려줍니다.
  async start({ apiKey, text, files = [], systemPrompt, search }) {
    const models = this.models();
    // 검색을 요청하면: 모델마다 검색 켜고 시도 -> 429 면 검색 끄고 시도 (검색은 무료 한도가 더 적음)
    const attempts = models.flatMap((model) =>
      search ? [{ model, useSearch: true }, { model, useSearch: false }] : [{ model, useSearch: false }],
    );

    let last = { status: 0, error: '사용 가능한 Gemini 모델이 없습니다 (잠시 대기 중).' };
    for (let i = 0; i < attempts.length; i++) {
      const { model, useSearch } = attempts[i];
      const key = `gemini:${model}:${useSearch}`;
      if (isCoolingDown(key)) continue;

      let res = await callModel({ apiKey, model, text, files, systemPrompt, useSearch });
      if (res.status === 503) {
        // 일시적인 붐빔: 잠깐 쉬고 같은 조건으로 한 번 더
        await res.body?.cancel();
        await sleep(RETRY_DELAY_MS);
        res = await callModel({ apiKey, model, text, files, systemPrompt, useSearch });
      }

      if (res.ok) return { ok: true, model, search: useSearch, stream: streamParts(res) };

      const data = await res.json().catch(() => ({}));
      last = { status: res.status, error: data.error?.message || `HTTP ${res.status}` };
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
