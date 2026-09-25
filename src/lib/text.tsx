/**
 * 한글 줄바꿈 제어 — 「말 쉬는 자리에서만 꺾는다」.
 *
 * br("신청할 수 있는 | 청약만,")
 *   「|」가 있으면 그 자리에서만 줄이 바뀐다 — 조각 안의 띄어쓰기는 줄바꿈 없는 공백(nbsp)이 된다.
 * br("긴 문장")
 *   「|」가 없으면 띄어쓰기에서 자연스럽게 꺾되(keep-all), 기호(·~/)와 날짜 하이픈에서는 꺾이지 않게만 한다.
 *   (조각을 통째로 묶으면 좁은 화면에서 브라우저가 낱말 가운데를 강제로 자르기 때문에, 긴 문장은 묶지 않는다)
 */
const WJ = "⁠";

const NB = " ";

/**
 * 기호·날짜·짧은 말 덩어리에서 꺾이지 않게(나머지 띄어쓰기는 그대로).
 * 375px에서 「4,542만 / 원」, 「살 수 / 있어요」, 줄 첫머리의 「·」처럼 끊기던 자리를 막는다.
 */
export function soft(text: string): string {
  return text
    .replace(/(?<=\S)([·~/])(?=\S)/g, `${WJ}$1${WJ}`) // 붙어 있는 기호(청년·신혼)만
    .replace(/ · /g, `${NB}· `) // 띄어 쓴 가운뎃점은 앞말에 붙인다(줄 첫머리에 오지 않게)
    .replace(/(\d)-(?=\d)/g, `$1-${WJ}`) // 날짜 2026-02-27
    .replace(/(\d)(㎡|%)/g, `$1${WJ}$2`) // 85㎡, 100%
    .replace(/(\d)(억|만) (?=[\d원])/g, `$1$2${NB}`) // 금액 덩어리: 4,542만 원 · 12억 8,000만 원
    .replace(/(원|세|년|회|%|명|건) (이하|이상|미만|초과|넘음|부터|까지)/g, `$1${NB}$2`) // 300만 원 이하
    .replace(/(\S) 수 (있|없)/g, `$1${NB}수${NB}$2`) // 살 수 있어요
    .replace(/」(?=[가-힣])/g, `」${WJ}`); // 「신청 가능」이 — 닫는 꺾쇠와 조사
}

/** 조각 전체를 한 덩어리로(짧은 말에만) */
export function glue(chunk: string): string {
  return soft(chunk.trim()).replace(/ /g, " ");
}

export function br(text: string): string {
  if (!text.includes("|")) return soft(text);
  return text.split("|").map(glue).join(" ");
}
