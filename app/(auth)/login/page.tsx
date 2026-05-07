import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, signInWithMagicLink } from "@/lib/actions/auth";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <form action={signInWithPassword} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit">Sign in</Button>
      </form>
      <form action={signInWithMagicLink} className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Or get a magic link:</p>
        <div className="flex gap-2">
          <Input name="email" type="email" placeholder="you@example.com" required />
          <Button type="submit" variant="outline">Send link</Button>
        </div>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        No account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
