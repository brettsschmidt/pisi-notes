interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  return (
    <div className="flex flex-col gap-3 text-center">
      <h1 className="text-xl font-semibold">Check your email</h1>
      <p className="text-sm text-muted-foreground">
        We sent a sign-in link {email ? <>to <span className="font-medium text-foreground">{email}</span></> : null}. Open it on
        this device to continue.
      </p>
    </div>
  );
}
