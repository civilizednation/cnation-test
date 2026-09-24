// Vercel 서버리스 함수: POST /api/chat  { "prompt": "...", "search": false, "files": [...] } -> NDJSON 스트림
import { handleChat } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'POST 요청만 허용됩니다.' }));
  }
  return handleChat(req.body, res);
}
