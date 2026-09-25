import type { MetadataRoute } from "next";
import { GUIDES, GUIDE_HUB } from "@/lib/guides";
import { PAGE_DATES, SITE } from "@/lib/site";

/** lastModified는 내용이 바뀐 날(고정값). 배포할 때마다 now()로 찍지 않는다 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE.indexable) return [];
  return [
    { url: `${SITE.url}/`, lastModified: PAGE_DATES.home, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}${GUIDE_HUB.path}`, lastModified: GUIDE_HUB.updated, changeFrequency: "monthly", priority: 0.9 },
    ...GUIDES.map((g) => ({
      url: `${SITE.url}/guide/${g.slug}`,
      lastModified: g.updated,
      changeFrequency: "monthly" as const,
      priority: g.category === "기준표" ? 0.9 : 0.8,
    })),
    { url: `${SITE.url}/privacy`, lastModified: PAGE_DATES.privacy, changeFrequency: "yearly", priority: 0.2 },
  ];
}
