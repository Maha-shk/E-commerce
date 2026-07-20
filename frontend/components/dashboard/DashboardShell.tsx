"use client";

import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * App shell for the customer dashboard. Fixed sidebar on desktop, a shadcn
 * Sheet drawer on mobile. Page content (Server Components) is passed as children.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="lg:pl-64">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <p className="border-t pt-6 text-center text-xs tracking-wider text-subtle">
            © 2024 CENTO SERVIZI · SECURE CUSTOMER PORTAL
          </p>
        </footer>
      </div>
    </div>
  );
}
