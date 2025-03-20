import LogoLink from "@/components/links/LogoLink/LogoLink";

import TopNavbar from "@/tizz-trade-components/Navbar/TopNavbar";
import RightNavbar from "@/tizz-trade-components/Navbar/RightNavbar";
import Footer from "@/tizz-trade-components/Footer/Footer";

import Menu from "@/tizz-trade-components/Navbar/Menu";

export default function TizzTradeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="h-screen w-screen overflow-hidden bg-tizz-background">
      <nav className="fixed top-0 flex w-full items-center justify-between gap-11 border-b border-b-stroke bg-tizz-background p-4">
        <div className="flex items-center gap-3 md:gap-8">
          <Menu />
          <LogoLink label="Tizz" href="/tizz-trade/trade" />
          <TopNavbar pathPrefix="/tizz-trade" />
        </div>
        <RightNavbar />
      </nav>
      <main className="mb-[30px] mt-[79px] h-[calc(100%-109px)] w-full overflow-auto">
        {children}
      </main>
      <Footer />
    </section>
  );
}
