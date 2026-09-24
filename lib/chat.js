// 여러 AI 를 순서대로 시도하는 라우터.
// 키가 등록된 AI 만 사용하며, 앞 AI 가 실패하면 다음 AI 로 넘어갑니다.
// 순서는 AI_ORDER 환경변수로 바꿀 수 있습니다 (기본: gemini,github,groq).
import { gemini } from './providers/gemini.js';
import { github, groq } from './providers/openai-compatible.js';

const MAX_PROMPT_LENGTH = 1000;
const PROVIDERS = { gemini, github, groq };
const DEFAULT_ORDER = 'gemini,github,groq';

function nowInKorea() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' });
}

export function availableProviders() {
  return (process.env.AI_ORDER || DEFAULT_ORDER)
    .split(',')
    .map((id) => PROVIDERS[id.trim()])
    .filter((provider) => provider && process.env[provider.envKey]?.trim());
}

export async function askAI(prompt, { search = false } = {}) {
  const text = typeof prompt === 'string' ? prompt.trim() : '';
  if (!text) return { status: 400, body: { error: '질문을 입력해주세요.' } };
  if (text.length > MAX_PROMPT_LENGTH) {
    return { status: 400, body: { error: `질문은 ${MAX_PROMPT_LENGTH}자 이내로 입력해주세요.` } };
  }

  const providers = availableProviders();
  if (!providers.length) {
    return { status: 500, body: { error: '등록된 AI 키가 없습니다. GEMINI_API_KEY 등 환경변수를 확인하세요.' } };
  }

  // 모델이 "지금" 을 알 수 있도록 현재 한국 시각을 알려줍니다.
  const systemPrompt = `현재 시각(한국): ${nowInKorea()}. 질문한 언어로 답하세요.`;
  const failures = [];

  for (const provider of providers) {
    try {
      const result = await provider.ask({
        apiKey: process.env[provider.envKey].trim(),
        text,
        systemPrompt,
        search,
      });
      if (result.ok) {
        const { ok, ...rest } = result;
        return { status: 200, body: { ...rest, provider: provider.label } };
      }
      failures.push({ provider: provider.label, ...result });
    } catch (error) {
      console.error(`[${provider.id}] 호출 오류:`, error);
      failures.push({ provider: provider.label, status: 500, error: error.message });
    }
  }

  const status = failures.at(-1)?.status || 502;
  const detail = failures.map((f) => `${f.provider}: ${f.error}`).join('\n');
  return {
    status: status >= 400 ? status : 502,
    body: { error: `모든 AI 호출에 실패했습니다. 잠시 후 다시 시도해주세요.\n${detail}` },
  };
}
