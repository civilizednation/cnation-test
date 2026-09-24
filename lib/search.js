// Tavily 웹 검색 (무료 키). 검색 결과를 AI 질문에 붙여서 어떤 AI 로도 최신 정보 답변이 가능하게 합니다.
// https://docs.tavily.com — TAVILY_API_KEY 가 없으면 사용하지 않습니다.
const TAVILY_URL = 'https://api.tavily.com/search';
const MAX_QUERY_LENGTH = 400;
const MAX_RESULTS = 5;
const MAX_CONTENT_LENGTH = 800;

export const hasWebSearch = () => Boolean(process.env.TAVILY_API_KEY?.trim());

// 체크박스를 켜지 않아도 자동으로 검색할 질문: 지금/최신 정보가 필요한 표현이 들어 있으면
const NEEDS_SEARCH = /오늘|현재|지금|요즘|최신|최근|이번\s?주|이번\s?달|올해|내일|어제|뉴스|속보|날씨|기온|미세먼지|환율|주가|시세|경기\s?결과|스코어|순위|개봉|출시|\b(today|now|latest|news|weather|price)\b/i;
// 날짜/시각만 묻는 질문은 서버가 현재 시각을 이미 알려주므로 검색하지 않습니다.
const ONLY_TIME = /^(지금|현재|오늘)?\s*(은|이)?\s*(몇\s?시|몇\s?월\s?며칠|며칠|무슨\s?요일|날짜|시각|시간)/;
export const needsSearch = (question) => NEEDS_SEARCH.test(question) && !ONLY_TIME.test(question.trim());

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
