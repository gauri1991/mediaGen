import Link from "next/link";
import { Sparkles, ImageIcon, Video, Music } from "lucide-react";

export default function LandingPage() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/30 to-white dark:from-background dark:via-cyan-950/10 dark:to-background">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-200 mix-blend-multiply blur-3xl opacity-20 dark:opacity-10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-200 mix-blend-multiply blur-3xl opacity-20 dark:opacity-10" />

      <div className="container mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-1.5 text-sm text-cyan-700 dark:border-cyan-800 dark:from-cyan-950/50 dark:to-blue-950/50 dark:text-cyan-400">
          <Sparkles className="h-3.5 w-3.5" />
          AI media generation
        </div>

        {/* Headline */}
        <h1 className="gradient-text text-5xl font-bold tracking-tight leading-[1.1] md:text-6xl lg:text-7xl mb-6">
          Create images, video,<br />and audio with AI
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A personal studio for generating media with state-of-the-art models.
          Flux, Wan, MusicGen — all in one place, no subscriptions.
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg h-12 px-8 text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Start generating
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg h-12 px-8 text-sm font-medium border border-border bg-background hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Modality icons */}
        <div className="mt-16 flex items-center justify-center gap-12 text-muted-foreground">
          {[
            { icon: ImageIcon, label: "Images", color: "text-cyan-500" },
            { icon: Video, label: "Video", color: "text-blue-500" },
            { icon: Music, label: "Audio", color: "text-magenta-500" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
