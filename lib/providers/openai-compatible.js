// OpenAI 호환(chat/completions) 형식을 쓰는 서비스들: GitHub Models, Groq
import { coolDown, isCoolingDown } from '../cooldown.js';

function openAICompatible({ id, label, envKey, url, modelEnv, defaultModel, extraHeaders = {} }) {
  return {
    id,
    label,
    envKey,

    async ask({ apiKey, text, systemPrompt }) {
      const model = process.env[modelEnv] || defaultModel;
      const key = `${id}:${model}`;
      if (isCoolingDown(key)) return { ok: false, status: 429, error: '한도 초과로 잠시 대기 중입니다.' };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = data.error?.message || data.message || `HTTP ${response.status}`;
        console.warn(`[${id}] ${model} -> HTTP ${response.status}: ${error}`);
        if (response.status === 429) coolDown(key);
        return { ok: false, status: response.status, error };
      }

      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) return { ok: false, status: 502, error: `${label} 응답이 비어 있습니다.` };
      return { ok: true, reply, model, search: false, sources: [] };
    },
  };
}

export const github = openAICompatible({
  id: 'github',
  label: 'GitHub Models',
  envKey: 'GITHUB_MODELS_TOKEN',
  url: 'https://models.github.ai/inference/chat/completions',
  modelEnv: 'GITHUB_MODEL',
  defaultModel: 'openai/gpt-4.1-mini',
  extraHeaders: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
});

export const groq = openAICompatible({
  id: 'groq',
  label: 'Groq',
  envKey: 'GROQ_API_KEY',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  modelEnv: 'GROQ_MODEL',
  defaultModel: 'llama-3.3-70b-versatile',
});
