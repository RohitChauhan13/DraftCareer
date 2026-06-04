import { WordLoader } from "@/components/page-loader";

export default function StatsDonationLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <WordLoader label="Opening" words={["donation", "settings", "links", "visibility", "support"]} />
    </main>
  );
}
