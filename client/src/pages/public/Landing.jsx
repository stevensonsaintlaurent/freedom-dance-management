import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Music2,
  Users,
  Heart,
  Sparkles,
  MapPin,
  Phone,
  DoorOpen,
  Clock,
  CheckCircle2,
  Globe,
} from "lucide-react";
import HomeGallery from "../../components/HomeGallery";
import StudentTestimonials from "../../components/StudentTestimonials";
import heroImage from "../../assets/recentClip1.jpeg";

const danceStyles = [
  {
    name: "Salsa",
    description: "Discover Latin rhythm, footwork and partner connection.",
    icon: Music2,
  },
  {
    name: "Bachata Sensual",
    description: "Develop musicality, body movement and connection.",
    icon: Heart,
  },
  {
    name: "Kizomba & Urban Kiz",
    description: "Explore smooth movement, technique and connection.",
    icon: Users,
  },
  {
    name: "Konpa",
    description: "Experience the rhythm and culture of Haitian dance.",
    icon: Music2,
  },
  {
    name: "Ladies Styling",
    description: "Build confidence, elegance and personal expression.",
    icon: Sparkles,
  },
  {
    name: "Independent Classes",
    description: "Discover more dance styles with our independent instructors.",
    icon: Users,
  },
];

const benefits = [
  "Beginner-friendly environment",
  "Experienced dance instructors",
  "No partner required for regular group classes",
  "Multiple dance styles",
  "Social dancing and special workshops",
  "A welcoming dance community",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* HERO SECTION */}

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-500/15 via-black to-black" />

        <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />

        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-12">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400">
              <MapPin size={15} />
              Las Vegas & Henderson, Nevada
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Find Your Rhythm.
              <span className="mt-2 block text-yellow-400">
                Discover Your Freedom.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
              Learn to dance, build confidence, meet new people and experience
              the joy of movement at Freedom Dance Studio.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/schedule"
                className="inline-flex items-center gap-3 rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300"
              >
                Book Your First Class
                <ArrowRight size={20} />
              </Link>

              <Link
                to="/events"
                className="inline-flex items-center gap-3 rounded-xl border border-zinc-700 px-6 py-4 font-semibold transition hover:border-yellow-400 hover:text-yellow-400"
              >
                <CalendarDays size={20} />
                Upcoming Events
                <HomeGallery />
                <StudentTestimonials />
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-yellow-400">
              <CheckCircle2 size={18} />
              Your first beginner group class is free!
            </div>
          </div>

          {/* HERO FEATURE CARD */}

          <div className="relative rounded-[2rem] border border-yellow-500/20 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur sm:p-12">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
              <Music2 size={40} />
              <div className="mb-8 overflow-hidden rounded-2xl border border-yellow-400/20">
                <img
                  src={heroImage}
                  alt="Freedom Dance Studio community"
                  fetchPriority="high"
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
              More than a dance studio
            </p>

            <h2 className="mt-4 text-4xl font-bold">Dance. Connect. Belong.</h2>

            <p className="mt-4 leading-relaxed text-zinc-400">
              Whether you are taking your first dance steps or improving your
              technique, there is a place for you in our community.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 text-sm text-zinc-300"
                >
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-yellow-400"
                  />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 text-center lg:grid-cols-4">
          {[
            ["FREE", "First beginner class"],
            ["$15", "Regular group drop-in"],
            ["2", "Studio rooms"],
            ["All Levels", "Dance experience"],
          ].map(([value, label]) => (
            <div key={label}>
              <h3 className="text-3xl font-black text-yellow-400">{value}</h3>
              <p className="mt-2 text-sm text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DANCE STYLES */}

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <p className="font-semibold uppercase tracking-widest text-yellow-400">
            Find your style
          </p>

          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
            Explore Our Dance Classes
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            From your first steps to advanced technique, discover a dance style
            that inspires you.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {danceStyles.map(({ name, description, icon: Icon }) => (
            <Link
              key={name}
              to={name === "Independent Classes" ? "/independent" : "/schedule"}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/60"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <Icon size={28} />
              </div>

              <h3 className="text-xl font-bold">{name}</h3>

              <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-zinc-400">
                {description}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-yellow-400">
                Explore Classes
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* UPCOMING EVENTS */}

      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-semibold uppercase tracking-widest text-yellow-400">
                Save the date
              </p>

              <h2 className="mt-3 text-4xl font-bold">Upcoming Events</h2>

              <p className="mt-3 text-zinc-400">
                Workshops, dance socials, live music and special experiences.
              </p>
            </div>

            <Link
              to="/events"
              className="flex items-center gap-2 font-semibold text-yellow-400 hover:text-yellow-300"
            >
              View All Events
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Temporary section until the Events API is ready */}

          <div className="rounded-3xl border border-dashed border-zinc-700 bg-black/30 px-6 py-16 text-center">
            <CalendarDays size={48} className="mx-auto text-yellow-400" />

            <h3 className="mt-5 text-2xl font-bold">
              More Exciting Events Coming Soon
            </h3>

            <p className="mx-auto mt-3 max-w-lg text-zinc-400">
              Stay connected for upcoming workshops, dance socials, intensives
              and special events.
            </p>

            <Link
              to="/events"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
            >
              Explore Events
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* WEEKLY SCHEDULE */}

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-10 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 md:grid-cols-2 md:p-12">
          <div>
            <Clock size={40} className="mb-5 text-yellow-400" />

            <h2 className="text-4xl font-bold">
              Make Dancing Part of Your Week
            </h2>

            <p className="mt-4 leading-relaxed text-zinc-400">
              Explore our regular weekly classes, find the right level and
              reserve your next dance class directly through our online
              schedule.
            </p>

            <Link
              to="/schedule"
              className="mt-7 inline-flex items-center gap-3 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
            >
              View Weekly Schedule
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              "Beginner Dance Classes",
              "Intermediate & Advanced Training",
              "Open Level Classes",
              "Ladies Styling",
              "Private Dance Lessons",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 p-4"
              >
                <CheckCircle2 size={20} className="text-yellow-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDIO RENTAL */}

      <section className="bg-gradient-to-br from-yellow-500/10 via-zinc-900 to-black">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <DoorOpen size={42} className="mb-5 text-yellow-400" />

            <p className="font-semibold uppercase tracking-widest text-yellow-400">
              Your space to create
            </p>

            <h2 className="mt-3 text-4xl font-bold">Rent Our Dance Studio</h2>

            <p className="mt-5 leading-relaxed text-zinc-400">
              Looking for a professional space to teach, rehearse, host a
              workshop or organize a private event? Explore our two studio
              rooms.
            </p>

            <Link
              to="/rental"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
            >
              Explore Studio Rentals
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["Large Studio", "720 sq. ft."],
              ["Small Studio", "639 sq. ft."],
            ].map(([name, size]) => (
              <div
                key={name}
                className="rounded-2xl border border-yellow-400/20 bg-black/40 p-6"
              >
                <DoorOpen size={30} className="mb-4 text-yellow-400" />
                <h3 className="text-lg font-bold">{name}</h3>
                <p className="mt-2 text-zinc-400">{size}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold">Come Dance With Us</h2>

          <p className="mt-4 text-zinc-400">Your dance journey starts here.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <a
            href="https://www.google.com/maps/search/?api=1&query=3110+E+Sunset+Rd+Suite+C+Las+Vegas+NV+89120"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 transition hover:border-yellow-400"
          >
            <MapPin size={28} className="mb-4 text-yellow-400" />
            <h3 className="font-bold">Visit Our Studio</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              3110 E Sunset Rd, Suite C
              <br />
              Las Vegas, NV 89120
            </p>
          </a>

          <a
            href="https://wa.me/17257240962"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 transition hover:border-yellow-400"
          >
            <Phone size={28} className="mb-4 text-yellow-400" />
            <h3 className="font-bold">Contact Us</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Call or message us on WhatsApp
            </p>
            <p className="mt-2 text-yellow-400">(725) 724-0962</p>
          </a>

          <a
            href="https://vegasfreedomdancestudio.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 transition hover:border-yellow-400"
          >
            <Globe size={28} className="mb-4 text-yellow-400" />
            <h3 className="font-bold">Stay Connected</h3>
            <p className="mt-3 break-all text-sm text-zinc-400">
              vegasfreedomdancestudio.com
            </p>
          </a>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}

      <section className="bg-yellow-400 px-6 py-16 text-center text-black">
        <h2 className="text-4xl font-black">Ready to Start Dancing?</h2>

        <p className="mt-4 font-medium">
          Join our community and discover your freedom through dance.
        </p>

        <Link
          to="/schedule"
          className="mt-7 inline-flex items-center gap-3 rounded-xl bg-black px-8 py-4 font-bold text-white transition hover:bg-zinc-800"
        >
          Book Your First Class
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
};

export default Landing;
