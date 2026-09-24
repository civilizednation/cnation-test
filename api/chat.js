// Vercel 서버리스 함수: POST /api/chat  { "prompt": "...", "search": false } -> { "reply": "...", ... }
import { askAI } from '../lib/chat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  try {
    const { status, body } = await askAI(req.body?.prompt, { search: req.body?.search === true });
    return res.status(status).json(body);
  } catch (error) {
    console.error('AI 호출 중 오류:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
