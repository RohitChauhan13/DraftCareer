"use client";

import dynamic from "next/dynamic";

const HomeGuideModal = dynamic(
  () => import("@/components/home-guide-modal").then((module) => module.HomeGuideModal),
  { loading: () => null, ssr: false }
);

export function LazyHomeGuideModal({ builderHref }: { builderHref: string }) {
  return <HomeGuideModal builderHref={builderHref} />;
}
