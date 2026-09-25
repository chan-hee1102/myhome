import type { NextConfig } from "next";

const SITE_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheongyakfit.vercel.app").host;

const nextConfig: NextConfig = {
  async headers() {
    return [
      // 운영 주소가 아닌 곳(배포별 미리보기 URL 등)은 검색엔진에 올리지 않는다 — 같은 내용이 여러 주소로 색인되는 걸 막는다
      {
        source: "/:path*",
        missing: [{ type: "host", value: SITE_HOST.replace(/\./g, "\.") }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
