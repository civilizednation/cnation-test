import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === '실제키_입력' || apiKey.trim() === '') {
  console.error('\n[오류] .env 파일에서 GEMINI_API_KEY를 찾을 수 없거나 아직 "실제키_입력" 상태입니다.');
  console.error('1. .env.example 파일을 복사하여 .env 파일을 생성하세요.');
  console.error('2. .env 파일 내 GEMINI_API_KEY에 실제 발급받은 키를 입력하세요.\n');
  process.exit(1);
}

async function runGeminiTest() {
  console.log('Gemini API 키 테스트를 시작합니다...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: '안녕하세요! API 키 정상 연동 테스트입니다. 한 문장으로 간단히 인사해 주세요.' }]
          }
        ]
      })
    });

    const data = await response.json();

    if (response.ok) {
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('\n========================================');
      console.log('🎉 [성공] Gemini API 키가 정상 작동합니다!');
      console.log('========================================');
      console.log('Gemini 응답 내용:');
      console.log(reply ? reply.trim() : '응답 텍스트 없음');
      console.log('========================================\n');
    } else {
      console.error('\n❌ [API 호출 실패] 상태 코드:', response.status);
      console.error('오류 상세 내용:\n', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ [통신/실행 오류]:', error.message);
  }
}

runGeminiTest();
