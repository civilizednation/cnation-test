export default async function handler(req, res) {
  // POST 메소드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: '질문 내용을 입력해주세요.' });
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      return res.status(400).json({ error: '질문이 비어 있습니다.' });
    }

    if (trimmedPrompt.length > 1000) {
      return res.status(400).json({ error: '질문은 1,000자 이내로 입력해주세요.' });
    }

    // 서버 환경변수에서 키 조회 (외부 절대 비노출)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
      return res.status(500).json({ error: '서버에 API Key가 설정되지 않았습니다. Vercel Settings에서 환경변수를 확인하세요.' });
    }

    // 구글 Gemini 2.5 Flash 호출
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: trimmedPrompt }] }]
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: data.error?.message || 'Gemini API 호출에 실패했습니다.'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return res.status(500).json({ error: 'Gemini 응답이 비어 있습니다.' });
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    console.error('서버 에러:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
