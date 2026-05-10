import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOut } from "@/lib/actions/auth";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-2 safe-top">
        <Link href="/notes" className="text-base font-semibold tracking-tight">
          pisi-notes
        </Link>
        <div className="flex flex-1 items-center justify-center gap-2 px-4">{topbar}</div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" aria-label="sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
