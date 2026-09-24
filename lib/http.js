// POST /api/chat 처리 (Vercel 함수와 로컬 서버가 함께 사용)
// 응답은 NDJSON 스트림: 한 줄에 하나씩 JSON 이벤트 (lib/chat.js 의 streamAI 참고)
import { streamAI, validatePrompt } from './chat.js';

export async function handleChat(body, res) {
  const invalid = validatePrompt(body?.prompt);
  if (invalid) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: invalid }));
  }

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  });
  try {
    for await (const event of streamAI(body.prompt, { search: body.search === true })) {
      res.write(`${JSON.stringify(event)}\n`);
    }
  } catch (error) {
    console.error('AI 호출 중 오류:', error);
    res.write(`${JSON.stringify({ type: 'error', error: '서버 내부 오류가 발생했습니다.' })}\n`);
  }
  res.end();
}
