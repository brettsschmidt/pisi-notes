import { AppShell } from "@/components/nav/app-shell";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { getEntitlements } from "@/lib/billing/subscription";
import { countRotators } from "@/lib/queries/rotators";

/** AppShell with the Quiet Upsell sidebar, for every signed-in page. */
export async function SignedInShell({ children }: { children: React.ReactNode }) {
  const [entitlements, rotatorCount] = await Promise.all([getEntitlements(), countRotators()]);
  return (
    <AppShell
      sidebar={
        <AppSidebar
          isPro={entitlements.isPro}
          rotatorCount={rotatorCount}
          maxRotators={entitlements.maxRotators}
        />
      }
    >
      {children}
    </AppShell>
  );
}
