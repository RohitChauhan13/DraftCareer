import { WordLoader } from "@/components/page-loader";

export default function StatsTemplateConfigLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <WordLoader label="Opening" words={["templates", "tags", "gallery", "previews", "config"]} />
    </main>
  );
}
