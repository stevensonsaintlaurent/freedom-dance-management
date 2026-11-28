import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Quote } from "lucide-react";
import { videos } from "../data/video";

const testimonials = videos.filter((video) => video.id === 1 || video.id === 2);

const getVideoId = (url) => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.split("/")[1];
    }

    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.split("/")[2];
    }

    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
};

const TestimonialCard = ({ video, index }) => {
  const [playing, setPlaying] = useState(false);
  const videoId = getVideoId(video.url);

  if (!videoId) return null;

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60">
      <div className="relative aspect-video overflow-hidden bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
            title={`${video.title} ${index + 1}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play student testimonial ${index + 1}`}
            className="group absolute inset-0 h-full w-full"
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover opacity-75 transition group-hover:opacity-100"
            />

            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-yellow-400 text-black shadow-xl transition group-hover:scale-110">
                <Play size={27} fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="p-6">
        <Quote size={28} className="mb-4 text-yellow-400" />

        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
          Student Stories
        </p>

        <h3 className="mt-3 text-xl font-bold text-white">
          A Student’s Experience at Freedom Dance Studio
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Hear directly from our students about their dance journey.
        </p>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-400"
        >
          Watch on YouTube
          <ArrowRight size={16} />
        </a>
      </div>
    </article>
  );
};

export default function StudentTestimonials() {
  return (
    <section className="bg-zinc-950 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="font-semibold uppercase tracking-widest text-yellow-400">
            Real Students. Real Experiences.
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            Hear From Our <span className="text-yellow-400">Community</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-zinc-400">
            Discover what it is like to learn, dance and grow with Freedom Dance
            Studio.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-2">
          {testimonials.map((video, index) => (
            <TestimonialCard key={video.id} video={video} index={index} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/schedule"
            className="inline-flex items-center gap-3 rounded-xl bg-yellow-400 px-7 py-4 font-bold text-black transition hover:bg-yellow-300"
          >
            Start Your Own Dance Journey
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
