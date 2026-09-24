// Server-Sent Events 응답에서 "data: ..." 줄의 내용을 하나씩 꺼냅니다.
export async function* readSSE(response) {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
  const rest = buffer.trim();
  if (rest.startsWith('data:')) yield rest.slice(5).trim();
}
