import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const PublicLayouts = () => {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* NAVBAR */}
      <Navbar />

      {/* PUBLIC PAGE CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div>
            <h3 className="text-lg font-black tracking-wider text-white">
              FREEDOM <span className="text-amber-400">DANCE</span>
            </h3>

            <p className="mt-1 text-xs tracking-[0.2em] text-zinc-500">
              DANCE. CONNECT. BELONG.
            </p>
          </div>

          <p className="text-center text-sm text-zinc-500">
            © {new Date().getFullYear()} Freedom Dance Studio. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayouts;
