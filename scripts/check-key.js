// 등록된 AI 키가 각각 동작하는지 한 번씩 호출해 보는 스크립트 (로컬: npm run check / GitHub Actions 에서도 사용)
import { availableProviders, systemPrompt } from '../lib/chat.js';

const providers = availableProviders();
if (!providers.length) {
  console.error('❌ 등록된 AI 키가 없습니다.');
  process.exit(1);
}

let failed = false;
for (const provider of providers) {
  const started = await provider.start({
    apiKey: process.env[provider.envKey].trim(),
    text: '연결 테스트입니다. 한 문장으로 짧게 인사해 주세요.',
    systemPrompt: systemPrompt(),
  });
  if (!started.ok) {
    failed = true;
    console.error(`❌ ${provider.label} (HTTP ${started.status}): ${started.error}`);
    continue;
  }
  let reply = '';
  for await (const part of started.stream) reply += part.text || '';
  console.log(`✅ ${provider.label} (${started.model}): ${reply.trim()}`);
}
if (failed) process.exit(1);
