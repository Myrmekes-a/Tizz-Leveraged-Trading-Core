import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

import { locales, defaultLocale, localePrefix } from "./navigation";

const blockedGEOs: string[] = ["us"];

async function getGeo(ip: string): Promise<string> {
  try {
    const res = await fetch(`https://api.iplocation.net/?ip=${ip}`).then(
      (res) => res.json(),
    );

    return res.country_code2;
  } catch (err) {
    console.log(err);
  }

  return "-";
}

export default async function middleware(request: NextRequest) {
  const handleI18nRouting = createMiddleware({
    locales,
    defaultLocale,
    localePrefix,
  });

  const response = handleI18nRouting(request);

  const ip = request.headers.get("X-Forwarded-For");

  // const geo = ip ? await getGeo(ip) : "-";
  const geo = "-";

  response.cookies.set(
    "geo-blocked",
    blockedGEOs.includes(geo.toLowerCase()) ? "true" : "false",
  );

  return response;
}

export const config = {
  matcher: ["/", "/(en|es|fr|hi|ja|pt|zh-CN)/:path*"],
};
