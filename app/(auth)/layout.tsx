import Link from "next/link";
import { MinmiMark } from "@/components/brand/minmi-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <MinmiMark className="h-7 w-7" />
        Minmi Email Helper
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
