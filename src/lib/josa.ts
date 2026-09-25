/**
 * 조사 고르기 — 「예치금이(가) 모자라요」 대신 「예치금이 모자라요」.
 *
 * josa("예치금", "이/가")     → "이"
 * withJosa("소득", "은/는")   → "소득은"
 * withJosa("강동구", "이나/나") → "강동구나"
 *
 * 마지막 글자가 한글이면 받침으로, 숫자면 읽는 소리로(1=일, 3=삼 …) 고른다.
 * 괄호·따옴표·공백 같은 꼬리 기호는 건너뛰고 그 앞 글자를 본다(「소득(본인)」 → 「소득」의 「득」이 아니라 「인」).
 */

export type JosaPair = "이/가" | "을/를" | "은/는" | "과/와" | "으로/로" | "이나/나" | "이에요/예요" | "이랑/랑" | "아/야" | "이라/라";

/** 받침 있는 숫자 읽기: 0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 (2 이·4 사·5 오·9 구는 받침 없음) */
const DIGIT_BATCHIM: Record<string, number> = { "0": 21, "1": 8, "3": 16, "6": 1, "7": 8, "8": 8 };
/** 받침 없이 끝나는 단위 기호: ㎡(미터), %(퍼센트) */
const NO_BATCHIM_SYMBOLS = new Set(["㎡", "%", "㎝", "㎞"]);
const SKIP = /[\s)\]}」』"'”’.,·…~!?]/;

/**
 * 마지막 소리의 종성 번호(0 = 받침 없음, 8 = ㄹ). 판별할 수 없으면 undefined.
 */
function lastJong(word: string): number | undefined {
  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i];
    if (SKIP.test(ch)) continue;
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
    if (/[0-9]/.test(ch)) return DIGIT_BATCHIM[ch] ?? 0;
    if (NO_BATCHIM_SYMBOLS.has(ch)) return 0;
    // 영문 등: 흔한 경우만(L·M·N·R은 받침처럼 읽힘)
    if (/[a-z]/i.test(ch)) return /[lmnr]/i.test(ch) ? (/[l]/i.test(ch) ? 8 : 4) : 0;
    return undefined;
  }
  return undefined;
}

/** 받침이 있는가. 판별할 수 없으면 true(「이」 쪽이 덜 어색하다) */
export function hasBatchim(word: string): boolean {
  const j = lastJong(word);
  return j === undefined ? true : j !== 0;
}

export function josa(word: string, pair: JosaPair): string {
  const [withB, withoutB] = pair.split("/");
  const j = lastJong(word);
  // 「으로/로」는 ㄹ 받침도 「로」(서울로, 1년으로… 「일로」)
  if (pair === "으로/로") return j === 0 || j === 8 ? withoutB : withB;
  return j === undefined || j !== 0 ? withB : withoutB;
}

/** 낱말 + 조사 */
export function withJosa(word: string, pair: JosaPair): string {
  return `${word}${josa(word, pair)}`;
}
