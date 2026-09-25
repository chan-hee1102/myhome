/** JSON-LD 출력. 상수만 넣으므로 안전하지만, 「</script>」 탈출을 막으려 「<」는 이스케이프한다 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
