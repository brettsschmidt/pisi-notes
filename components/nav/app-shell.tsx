"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsButton } from "@/components/pwa/notifications-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-close the drawer on any route or filter change.
  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 safe-top sm:px-4">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "close sidebar" : "open sidebar"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/notes" className="text-base font-semibold tracking-tight">
            pisi-notes
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2 px-2">{topbar}</div>
        <div className="flex items-center gap-1">
          <NotificationsButton />
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" aria-label="sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        {/* Desktop sidebar — flows in the layout. */}
        <div className="hidden md:flex">{sidebar}</div>

        {/* Mobile drawer — slides in from the left. Same content as desktop. */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 max-w-[80vw] transform pt-[calc(env(safe-area-inset-top)+3rem)] transition-transform duration-200 md:hidden",
            open ? "translate-x-0 shadow-xl" : "-translate-x-full",
          )}
          aria-hidden={!open}
        >
          {sidebar}
        </div>

        {/* Mobile backdrop. */}
        <button
          type="button"
          aria-label="close sidebar"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            "fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 md:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
