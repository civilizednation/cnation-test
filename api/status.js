// Vercel 서버리스 함수: GET /api/status -> 사용 가능한 AI 목록 (키 값은 포함하지 않음)
import { providerStatus } from '../lib/chat.js';

export default function handler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ providers: providerStatus() }));
}
