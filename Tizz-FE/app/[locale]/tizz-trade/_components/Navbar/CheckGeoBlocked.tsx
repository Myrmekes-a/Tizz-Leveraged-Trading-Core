"use client";

import { useEffect } from "react";

import { useRouter, usePathname } from "@/navigation";
import { useAccount, useChainId } from "wagmi";
import { testNetChainIds } from "@/utils/tizz";

function getCookie(cname: string) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];

    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }

    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }

  return "";
}

export function CheckGeoBlocked() {
  const router = useRouter();
  const pathname = usePathname();
  const account = useAccount();

  const chainId = useChainId();

  useEffect(() => {
    const isBlocked = getCookie("geo-blocked") === "true";

    if (!pathname.includes("tizz-trade")) {
      return;
    }

    if (!isBlocked) {
      return;
    }

    if (testNetChainIds.includes(chainId)) {
      return;
    }

    if (!account.address) {
      return;
    }

    router.push(`/geo-blocked`);
  }, [account.address, chainId, pathname, router]);

  return null;
}
