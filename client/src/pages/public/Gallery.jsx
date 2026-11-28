import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Video,
  Maximize,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";
import dance2 from "../../assets/recentClip1.jpeg";
import dance3 from "../../assets/recentClip2.jpeg";
import dance5 from "../../assets/lady/followerClip.jpeg";
import party1 from "../../assets/sbkParty/FJ8A6466.jpg";
import party2 from "../../assets/sbkParty/FJ8A6603.jpg";
import concert2 from "../../assets/concert-freedom-jazz/P1990974.jpg";
import { videos } from "../../data/video";

const photos = [
  { id: 1, title: "SBK Social Night", image: party1, category: "Social" },
  { id: 2, title: "Bachata Ladies", image: dance5, category: "Bachata" },
  { id: 3, title: "Salsa Group", image: dance3, category: "Salsa" },
  { id: 4, title: "Party Night", image: party2, category: "Events" },
  {
    id: 5,
    title: "Freedom Dance Family",
    image: dance2,
    category: "Community",
  },
  { id: 6, title: "Live Orchestra", image: concert2, category: "Live Music" },
];
const categories = ["All", ...new Set(photos.map((p) => p.category))];
const galleryVideos = videos.filter(
  (v) => v.title !== "A Student’s Experience at Freedom Dance Studio",
);
function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const id =
      u.hostname === "youtu.be"
        ? parts[0]
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
              u.hostname,
            )
          ? ["shorts", "embed", "live"].includes(parts[0])
            ? parts[1]
            : u.searchParams.get("v")
          : null;
    return /^[\w-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}
const pill = (active) =>
  `rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-amber-400 bg-amber-400 text-zinc-950" : "border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-300"}`;

function VideoCard({ video }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(video.url);
  const url = id ? `https://www.youtube.com/watch?v=${id}` : null;
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="relative aspect-video bg-black">
        {id &&
          (playing ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${video.title}`}
              className="group relative h-full w-full"
            >
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/30">
                <span className="rounded-full bg-amber-400 p-4 text-black group-hover:bg-amber-300">
                  <Play size={26} fill="currentColor" />
                </span>
              </span>
            </button>
          ))}
        {!id && <p className="p-6 text-zinc-400">Video unavailable</p>}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="text-lg font-bold">{video.title}</h3>
        {video.style && <p className="text-sm text-amber-300">{video.style}</p>}
        {video.category && (
          <p className="text-sm text-zinc-400">{video.category}</p>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400"
          >
            Watch on YouTube <ExternalLink size={15} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function Gallery() {
  const [tab, setTab] = useState("photos");
  const [category, setCategory] = useState("All");
  const [index, setIndex] = useState(null);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const visible =
    category === "All" ? photos : photos.filter((p) => p.category === category);
  const selected = index === null ? null : visible[index];
  const count = visible.length;
  const open = index !== null;
  useEffect(() => {
    const el = dialog.current;
    if (!open || !el) return;
    el.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (el.open) el.close();
      document.body.style.overflow = previous;
      trigger.current?.focus();
    };
  }, [open]);
  function move(delta) {
    setIndex((i) => (i === null ? null : (i + delta + count) % count));
  }
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative isolate overflow-hidden border-b border-zinc-800">
        <img
          src={party1}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-black/60" />
        <div className="mx-auto max-w-7xl px-5 py-24 text-center sm:py-32">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
            Freedom Dance Studio · Las Vegas
          </p>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            Our <span className="text-amber-400">Gallery</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            Real people. Real connections. Relive the energy of our classes,
            socials, workshops and live music.
          </p>
          <Link
            to="/schedule"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-black hover:bg-amber-300"
          >
            Explore our classes <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex flex-wrap gap-3" aria-label="Gallery media">
          <button
            type="button"
            aria-pressed={tab === "photos"}
            onClick={() => setTab("photos")}
            className={pill(tab === "photos")}
          >
            <span className="flex items-center gap-2">
              <Camera size={18} /> Photos ({photos.length})
            </span>
          </button>
          <button
            type="button"
            aria-pressed={tab === "videos"}
            onClick={() => setTab("videos")}
            className={pill(tab === "videos")}
          >
            <span className="flex items-center gap-2">
              <Video size={18} /> Videos ({galleryVideos.length})
            </span>
          </button>
        </div>
        {tab === "photos" ? (
          <>
            <div
              className="mb-8 flex flex-wrap gap-2"
              aria-label="Photo categories"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={pill(category === c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    trigger.current = e.currentTarget;
                    setIndex(i);
                  }}
                  className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400"
                  aria-label={`View ${p.title}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-black/70 p-3">
                      <Maximize size={18} />
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {p.category}
                    </p>
                    <h2 className="mt-2 text-xl font-bold">{p.title}</h2>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryVideos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
        <div className="mt-16 rounded-3xl border border-amber-400/30 bg-zinc-900 p-8 text-center sm:p-14">
          <h2 className="text-3xl font-black sm:text-4xl">
            Become part of our story
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Discover Salsa, Bachata, Kizomba, Konpa and a community that loves
            to dance.
          </p>
          <Link
            to="/schedule"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-black hover:bg-amber-300"
          >
            Book a class <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <dialog
        ref={dialog}
        aria-label="Photo viewer"
        onCancel={(e) => {
          e.preventDefault();
          setIndex(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIndex(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
        className="m-auto max-h-[95dvh] w-[95vw] max-w-6xl overflow-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-0 text-white backdrop:bg-black/90"
      >
        {selected && (
          <div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs text-amber-400">
                  {selected.category} · {index + 1} / {count}
                </p>
                <h2 className="font-bold">{selected.title}</h2>
              </div>
              <button
                type="button"
                aria-label="Close photo viewer"
                onClick={() => setIndex(null)}
                className="rounded-full bg-zinc-800 p-3"
              >
                <X size={22} />
              </button>
            </div>
            <img
              src={selected.image}
              alt={selected.title}
              className="max-h-[72dvh] w-full object-contain"
            />
            <div className="flex justify-center gap-5 p-4">
              <button
                type="button"
                disabled={count < 2}
                aria-label="Previous photo"
                onClick={() => move(-1)}
                className="rounded-full bg-zinc-800 p-3 disabled:opacity-30"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                disabled={count < 2}
                aria-label="Next photo"
                onClick={() => move(1)}
                className="rounded-full bg-zinc-800 p-3 disabled:opacity-30"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
