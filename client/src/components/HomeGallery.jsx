import { Link } from "react-router-dom";
import { ArrowRight, Camera, Play } from "lucide-react";

import community from "../assets/recentClip1.jpeg";
import salsa from "../assets/recentClip2.jpeg";
import bachata from "../assets/lady/followerClip.jpeg";
import social from "../assets/sbkParty/FJ8A6466.jpg";
import concert from "../assets/concert-freedom-jazz/P1990974.jpg";

const photos = [
  { id: 1, image: community, title: "Our Dance Family", category: "Community" },
  { id: 2, image: salsa, title: "Salsa Classes", category: "Classes" },
  {
    id: 3,
    image: bachata,
    title: "Bachata Ladies Styling",
    category: "Training",
  },
  { id: 4, image: social, title: "Social Dancing", category: "Nightlife" },
  { id: 5, image: concert, title: "Freedom Live Band", category: "Live Music" },
];

const HomeGallery = () => {
  return (
    <section className="border-y border-zinc-800 bg-zinc-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-400">
            <Camera size={16} />
            Life at Freedom
          </div>

          <h2 className="text-4xl font-black sm:text-5xl">
            More Than Dance.
            <span className="mt-2 block text-yellow-400">A Community.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-zinc-400">
            Discover the people, energy and unforgettable moments that make
            Freedom Dance Studio a special place to learn, connect and grow.
          </p>
        </div>

        <div className="grid auto-rows-[230px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <Link
              key={photo.id}
              to="/gallery"
              className={`group relative isolate overflow-hidden rounded-2xl border border-white/10 ${
                index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            >
              <img
                src={photo.image}
                alt={photo.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-yellow-400">
                  {photo.category}
                </p>

                <h3 className="text-xl font-bold text-white">{photo.title}</h3>
              </div>

              <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition group-hover:bg-yellow-400 group-hover:text-black">
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-3 rounded-xl bg-yellow-400 px-7 py-4 font-bold text-black transition hover:bg-yellow-300"
          >
            <Camera size={19} />
            Explore Our Gallery
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/gallery"
            className="inline-flex items-center gap-3 rounded-xl border border-zinc-700 px-7 py-4 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400"
          >
            <Play size={18} />
            Explore Our Videos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeGallery;
