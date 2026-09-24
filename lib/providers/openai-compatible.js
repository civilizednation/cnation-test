// OpenAI 호환(chat/completions) 형식을 쓰는 서비스들: GitHub Models, Groq
import { coolDown, isCoolingDown } from '../cooldown.js';
import { readSSE } from '../sse.js';

async function* streamDeltas(response) {
  for await (const data of readSSE(response)) {
    if (data === '[DONE]') return;
    const text = JSON.parse(data).choices?.[0]?.delta?.content;
    if (text) yield { text };
  }
}

function openAICompatible({ id, label, envKey, url, modelEnv, defaultModel, images = false, extraHeaders = {} }) {
  return {
    id,
    label,
    envKey,
    // 이미지만 지원 (PDF 는 이 형식으로 보낼 수 없음)
    supports: (kind) => images && kind === 'image',

    async start({ apiKey, text, files = [], systemPrompt }) {
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
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: files.length
                ? [
                    ...files.map((file) => ({
                      type: 'image_url',
                      image_url: { url: `data:${file.mimeType};base64,${file.data}` },
                    })),
                    { type: 'text', text },
                  ]
                : text,
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = data.error?.message || data.message || `HTTP ${response.status}`;
        console.warn(`[${id}] ${model} -> HTTP ${response.status}: ${error}`);
        if (response.status === 429) coolDown(key);
        return { ok: false, status: response.status, error };
      }

      return { ok: true, model, search: false, stream: streamDeltas(response) };
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
  images: true,
  extraHeaders: { 'X-GitHub-Api-Version': '2022-11-28' },
});

export const groq = openAICompatible({
  id: 'groq',
  label: 'Groq',
  envKey: 'GROQ_API_KEY',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  modelEnv: 'GROQ_MODEL',
  defaultModel: 'llama-3.3-70b-versatile',
});
