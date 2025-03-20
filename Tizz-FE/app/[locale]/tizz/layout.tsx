"use client";

import { useEffect, useRef, useState } from "react";

import { TopNavbar } from "@/tizz-components/Navbar/TopNavbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTop, setIsTop] = useState(true);

  useEffect(() => {
    const div = ref.current;

    if (!div) {
      return () => {};
    }

    const handleScroll = () => {
      setIsTop(div.scrollTop === 0);
    };

    div.addEventListener("scroll", handleScroll);

    return () => {
      div.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-tizz-background-green pb-[60px] pt-[6px] 2xl:p-0"
    >
      <TopNavbar mode={isTop ? "attached" : "sticky"} />

      {children}
    </section>
  );
}
