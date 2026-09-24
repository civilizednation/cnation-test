// 여러 AI 를 순서대로 시도하는 라우터.
// 키가 등록된 AI 만 사용하며, 앞 AI 가 실패하면 다음 AI 로 넘어갑니다.
// 순서는 AI_ORDER 환경변수로 바꿀 수 있습니다 (기본: gemini,github,groq).
import { gemini } from './providers/gemini.js';
import { github, groq } from './providers/openai-compatible.js';
import { hasWebSearch, needsSearch, webSearch, withSearchResults } from './search.js';

const MAX_PROMPT_LENGTH = 1000;
// Vercel 함수 요청 본문 한도(4.5MB) 안에 들어오도록 첨부파일(base64) 합계를 제한합니다.
const MAX_FILES = 3;
const MAX_FILES_BASE64_LENGTH = 4 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const FILE_TYPES = [...IMAGE_TYPES, 'application/pdf'];
const DEFAULT_FILE_PROMPT = '첨부한 파일의 내용을 설명해 주세요.';
const PROVIDERS = { gemini, github, groq };
const DEFAULT_ORDER = 'gemini,github,groq';

function nowInKorea() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' });
}

export function systemPrompt() {
  // 모델이 "지금" 을 알 수 있도록 현재 한국 시각을 알려줍니다.
  return (
    `현재 시각(한국): ${nowInKorea()}. 질문한 언어로 답하세요. ` +
    '온도는 섭씨(°C), 거리·속도·무게는 미터법(km, km/h, kg)으로 쓰고, 자료가 화씨나 마일이면 변환해서 쓰세요.'
  );
}

export function availableProviders() {
  return (process.env.AI_ORDER || DEFAULT_ORDER)
    .split(',')
    .map((id) => PROVIDERS[id.trim()])
    .filter((provider) => provider && process.env[provider.envKey]?.trim());
}

// 화면 하단 표시용: 사용 가능한 AI 와 모델 (키 값은 절대 포함하지 않음)
export function providerStatus() {
  return availableProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    models: provider.models(),
  }));
}

// 요청 검사. 문제가 있으면 오류 메시지를, 없으면 null 을 돌려줍니다.
export function validateRequest({ prompt, files } = {}) {
  const text = typeof prompt === 'string' ? prompt.trim() : '';
  const list = files ?? [];
  if (!Array.isArray(list)) return '첨부파일 형식이 올바르지 않습니다.';
  if (!text && !list.length) return '질문을 입력해주세요.';
  if (text.length > MAX_PROMPT_LENGTH) return `질문은 ${MAX_PROMPT_LENGTH}자 이내로 입력해주세요.`;
  if (list.length > MAX_FILES) return `파일은 ${MAX_FILES}개까지 첨부할 수 있습니다.`;
  for (const file of list) {
    if (!FILE_TYPES.includes(file?.mimeType) || typeof file.data !== 'string') {
      return '이미지(JPG, PNG, WEBP, GIF)와 PDF 파일만 첨부할 수 있습니다.';
    }
  }
  if (list.reduce((sum, file) => sum + file.data.length, 0) > MAX_FILES_BASE64_LENGTH) {
    return '첨부파일이 너무 큽니다. 합계 약 3MB 이하로 올려주세요.';
  }
  if (!availableProviders().length) return '등록된 AI 키가 없습니다. GEMINI_API_KEY 등 환경변수를 확인하세요.';
  return null;
}

// 답변을 이벤트로 흘려보냅니다:
//   { type: 'meta', provider, model, search }  어떤 AI 가 답하는지 (한 번)
//   { type: 'delta', text }                    답변 조각 (여러 번)
//   { type: 'sources', sources }               검색 출처
//   { type: 'notice', text }                   참고 안내 (검색 실패 등)
//   { type: 'error', error }                   실패
// files: [{ name, mimeType, data(base64) }] — 이미지/PDF 첨부
// 글자가 나오기 전에 실패하면 다음 AI 로 넘어가고, 나오기 시작한 뒤 끊기면 오류로 끝냅니다.
export async function* streamAI({ prompt, files = [], search = false }) {
  const question = (typeof prompt === 'string' && prompt.trim()) || DEFAULT_FILE_PROMPT;
  let text = question;
  const failures = [];

  // 웹 검색: Tavily 키가 있으면 먼저 검색해서 결과를 질문에 붙입니다 (어떤 AI 가 답해도 동작).
  // 체크박스를 켰거나, 켜지 않았어도 "오늘/날씨/뉴스" 처럼 최신 정보가 필요한 질문이면 검색합니다.
  // 체크했는데 Tavily 가 없거나 실패하면 Gemini 의 Google 검색 연동을 시도합니다.
  const autoSearch = !search && !files.length && hasWebSearch() && needsSearch(question);
  let searchSources = [];
  let providerSearch = search;
  if ((search || autoSearch) && hasWebSearch()) {
    try {
      const found = await webSearch(question);
      if (found.ok && found.results.length) {
        text = withSearchResults(question, found.results);
        searchSources = found.results.map(({ title, url }) => ({ title, url }));
        providerSearch = false;
      } else {
        yield { type: 'notice', text: `웹 검색 실패 (${found.ok ? '결과 없음' : found.error})` };
      }
    } catch (error) {
      console.error('[tavily] 호출 오류:', error);
      yield { type: 'notice', text: '웹 검색 실패 (연결 오류)' };
    }
  }
  const hasPdf = files.some((file) => file.mimeType === 'application/pdf');

  for (const provider of availableProviders()) {
    // 첨부파일을 처리할 수 없는 AI 는 건너뜁니다.
    if (files.length && !provider.supports?.(hasPdf ? 'pdf' : 'image')) {
      failures.push(`${provider.label}: ${hasPdf ? 'PDF' : '이미지'} 첨부를 지원하지 않습니다.`);
      continue;
    }
    let started;
    try {
      started = await provider.start({
        apiKey: process.env[provider.envKey].trim(),
        text,
        files,
        systemPrompt: systemPrompt(),
        search: providerSearch,
      });
    } catch (error) {
      console.error(`[${provider.id}] 호출 오류:`, error);
      started = { ok: false, error: error.message };
    }
    if (!started.ok) {
      failures.push(`${provider.label}: ${started.error}`);
      continue;
    }

    const searched = searchSources.length > 0 || started.search;
    yield { type: 'meta', provider: provider.label, model: started.model, search: searched, autoSearch };
    if (search && !searched) yield { type: 'notice', text: '검색을 사용할 수 없어 일반 답변입니다.' };
    if (searchSources.length) yield { type: 'sources', sources: searchSources };
    let gotText = false;
    const seen = new Set();
    try {
      for await (const part of started.stream) {
        if (part.text) {
          gotText = true;
          yield { type: 'delta', text: part.text };
        }
        const sources = (part.sources || []).filter((s) => !seen.has(s.url) && seen.add(s.url));
        if (sources.length) yield { type: 'sources', sources };
      }
    } catch (error) {
      console.error(`[${provider.id}] 스트리밍 중 오류:`, error);
      yield { type: 'error', error: `답변을 받는 중 연결이 끊겼습니다. (${provider.label})` };
      return;
    }
    if (!gotText) yield { type: 'error', error: `${provider.label} 응답이 비어 있습니다.` };
    return;
  }

  yield { type: 'error', error: `모든 AI 호출에 실패했습니다. 잠시 후 다시 시도해주세요.\n${failures.join('\n')}` };
}

