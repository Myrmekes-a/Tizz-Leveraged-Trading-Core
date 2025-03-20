import { redirect } from "@/navigation";

export default function Home() {
  redirect("/tizz-trade");
}

// "use client";

// import { motion } from "framer-motion";
// import { HeroContent } from "@/tizz-components/HeroContent/HeroContent";

// // import { Content1 } from "@/tizz-components/Content1/Content1";
// import { Content2 } from "@/tizz-components/Content2/Content2";
// import { Content4 } from "@/tizz-components/Content4/Content4";
// import { Content5 } from "@/tizz-components/Content5/Content5";
// import { Content6 } from "@/tizz-components/Content6/Content6";
// import { Content7 } from "@/tizz-components/Content7/Content7";
// import { Content8 } from "@/tizz-components/Content8/Content8";
// import { Content9 } from "@/tizz-components/Content9/Content9";

// import { Footer } from "@/tizz-components/Footer/Footer";

// export default function Page() {
//   const contents = [
//     // {
//     //   id: 1,
//     //   component: <Content1 />,
//     // },
//     {
//       id: 2,
//       component: <Content2 />,
//     },
//     {
//       id: 4,
//       component: <Content4 />,
//     },
//     {
//       id: 5,
//       component: <Content5 />,
//     },
//     {
//       id: 6,
//       component: <Content6 />,
//     },
//     {
//       id: 7,
//       component: <Content7 />,
//     },
//     {
//       id: 8,
//       component: <Content8 />,
//     },
//     {
//       id: 9,
//       component: <Content9 />,
//     },
//   ];

//   return (
//     <div className="flex w-full flex-col gap-[120px] px-[15px] py-6 2xl:mx-auto 2xl:max-w-[1400px] 2xl:items-center 2xl:gap-0 2xl:py-0">
//       <HeroContent />

//       {contents.map((item) => (
//         <motion.div
//           key={item.id}
//           initial={{ opacity: 0, y: 100 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, ease: "easeInOut" }}
//         >
//           {item.component}
//         </motion.div>
//       ))}

//       <Footer />
//     </div>
//   );
// }
