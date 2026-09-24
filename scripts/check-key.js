// 키가 제대로 동작하는지 한 번 호출해 보는 스크립트 (로컬: npm run check / GitHub Actions 에서도 사용)
import { askGemini } from '../lib/gemini.js';

const { status, body } = await askGemini('연결 테스트입니다. 한 문장으로 짧게 인사해 주세요.');

if (status === 200) {
  console.log(`✅ 성공 (모델: ${body.model})`);
  console.log(body.reply);
} else {
  console.error(`❌ 실패 (HTTP ${status}): ${body.error}`);
  process.exit(1);
}
