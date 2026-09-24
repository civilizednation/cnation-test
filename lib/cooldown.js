// 한도 초과(429)로 거절된 대상을 잠시 건너뛰기 위한 메모리 기록.
// 서버리스 인스턴스가 살아 있는 동안만 유지되며, 새 인스턴스에서는 다시 시도합니다.
const COOLDOWN_MS = 5 * 60 * 1000;
const until = new Map();

export function isCoolingDown(key) {
  const t = until.get(key);
  if (t && t > Date.now()) return true;
  until.delete(key);
  return false;
}

export function coolDown(key) {
  until.set(key, Date.now() + COOLDOWN_MS);
}
