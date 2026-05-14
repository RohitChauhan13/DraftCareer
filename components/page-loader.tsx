const defaultWords = ["resumes", "templates", "details", "preview", "PDF"];

export function WordLoader({
  label = "Loading",
  words = defaultWords,
  compact = false
}: {
  label?: string;
  words?: string[];
  compact?: boolean;
}) {
  return (
    <div className="word-loader-card">
      <div className={`word-loader ${compact ? "text-lg" : ""}`}>
        <span>{label}</span>
        <span className="word-loader-words" aria-hidden="true">
          {words.map((word) => (
            <span className="word-loader-word" key={word}>
              {word}
            </span>
          ))}
        </span>
      </div>
      <span className="sr-only">{label} {words.join(", ")}</span>
    </div>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <WordLoader label={label} />
    </main>
  );
}

export function FullScreenLoader({
  label = "Loading",
  words = defaultWords
}: {
  label?: string;
  words?: string[];
}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <WordLoader label={label} words={words} />
    </div>
  );
}
