"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { parseTagFilter } from "@/lib/tags";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { hashtags, rest } = parseTagFilter(value);
    const usp = new URLSearchParams();
    for (const t of hashtags) usp.append("tag", t);
    if (rest) usp.set("q", rest);
    startTransition(() => {
      router.push(`/notes${usp.toString() ? "?" + usp.toString() : ""}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="relative flex-1">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search notes or #tag"
        className="pl-8"
        aria-label="search"
      />
    </form>
  );
}
