"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Images, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  isPro: boolean;
  rotatorCount: number;
  maxRotators: number;
}

const LINKS = [
  { href: "/rotators", label: "Image links", icon: Images },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ isPro, rotatorCount, maxRotators }: AppSidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background p-3">
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary",
                active && "bg-secondary font-medium",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-border p-3 text-xs">
        {isPro ? (
          <p className="flex items-center gap-1.5 font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Pro plan
          </p>
        ) : (
          <>
            <p className="font-medium">Free plan</p>
            <p className="mt-0.5 text-muted-foreground tabular-nums">
              {Math.min(rotatorCount, maxRotators)} of {maxRotators} image links used
            </p>
            <Link href="/pricing" className="mt-2 inline-block font-medium text-primary hover:underline">
              Upgrade to Pro
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
