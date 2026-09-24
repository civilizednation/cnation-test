// Tavily 웹 검색 (무료 키). 검색 결과를 AI 질문에 붙여서 어떤 AI 로도 최신 정보 답변이 가능하게 합니다.
// https://docs.tavily.com — TAVILY_API_KEY 가 없으면 사용하지 않습니다.
const TAVILY_URL = 'https://api.tavily.com/search';
const MAX_QUERY_LENGTH = 400;
const MAX_RESULTS = 5;
const MAX_CONTENT_LENGTH = 800;

export const hasWebSearch = () => Boolean(process.env.TAVILY_API_KEY?.trim());

// 성공하면 { ok: true, results: [{ title, url, content }] }, 실패하면 { ok: false, error }
export async function webSearch(query) {
  const response = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TAVILY_API_KEY.trim()}`,
    },
    body: JSON.stringify({
      query: query.slice(0, MAX_QUERY_LENGTH),
      max_results: MAX_RESULTS,
      search_depth: 'basic',
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data.detail?.error || data.error || data.message || `HTTP ${response.status}`;
    console.warn(`[tavily] HTTP ${response.status}: ${error}`);
    return { ok: false, error: String(error) };
  }
  const results = (data.results || [])
    .filter((r) => r.url)
    .map((r) => ({ title: r.title || r.url, url: r.url, content: (r.content || '').slice(0, MAX_CONTENT_LENGTH) }));
  return { ok: true, results };
}

// 검색 결과를 질문 앞에 붙인 새 질문을 만듭니다.
export function withSearchResults(question, results) {
  const context = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`).join('\n\n');
  return (
    `아래는 방금 웹 검색한 결과입니다. 이 내용을 근거로 질문에 답하고, 근거로 쓴 결과는 [번호]로 표시하세요. ` +
    `검색 결과에 없는 내용은 추측하지 말고 모른다고 하세요.\n\n${context}\n\n질문: ${question}`
  );
}
