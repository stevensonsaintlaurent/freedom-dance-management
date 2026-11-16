import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* NAVBAR AT THE TOP */}
      <Navbar />

      {/* DASHBOARD BODY */}
      <div className="flex min-h-[calc(100vh-5rem)]">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 h-[calc(100vh-5rem)]">
            <Sidebar />
          </div>
        </div>

        {/* MOBILE SIDEBAR */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-72 border-white/10 bg-zinc-950 p-0 text-white"
          >
            <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>

            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="min-w-0 flex-1">
          {/* MOBILE MENU BUTTON */}
          <div className="border-b border-white/10 px-4 py-3 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="border-white/20 bg-transparent text-white"
            >
              <Menu className="mr-2 size-4" />
              Menu
            </Button>
          </div>

          {/* PAGE CONTENT */}
          <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
