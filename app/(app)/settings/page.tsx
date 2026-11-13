import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { SettingsForm } from "@/components/settings/settings-form";
import { BillingPanel } from "@/components/billing/billing-panel";
import { getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";
import { getUpcomingReminderDates } from "@/lib/queries/reminders";
import { getUserPrefs } from "@/lib/queries/prefs";
import { getSubscription } from "@/lib/billing/subscription";
import { entitlementsFor } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";

function billingBanner(code: string | undefined): string | null {
  switch (code) {
    case "success":
      return "Payment received — thanks for upgrading! If Pro isn’t showing yet, give it a moment to sync.";
    case "already-pro":
      return "You’re already on the Pro plan.";
    case "error":
      return "Something went wrong with billing. Please try again.";
    default:
      return null;
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const banner = billingBanner(billing);

  const [tagCounts, openTaskCount, upcomingReminders, prefs, subscription] =
    await Promise.all([
      getTagCounts(),
      getOpenTaskCount(),
      getUpcomingReminderDates(),
      getUserPrefs(),
      getSubscription(),
    ]);
  const entitlements = entitlementsFor(subscription);

  return (
    <AppShell
      sidebar={
        <TagSidebar
          tags={tagCounts}
          activeTags={[]}
          openTaskCount={openTaskCount}
          reminders={upcomingReminders}
          showRemindersInSidebar={prefs.showRemindersInSidebar}
          hiddenTags={prefs.hiddenTags}
          hiddenReminderDates={prefs.hiddenReminderDates}
        />
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-4">
        <header>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Your stuff. Your way.</p>
        </header>
        {banner && (
          <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            {banner}
          </p>
        )}
        <BillingPanel
          subscription={subscription}
          entitlements={entitlements}
          stripeConfigured={isStripeConfigured()}
        />
        <SettingsForm
          showRemindersInSidebar={prefs.showRemindersInSidebar}
          hiddenTags={prefs.hiddenTags}
          hiddenReminderDates={prefs.hiddenReminderDates}
        />
      </div>
    </AppShell>
  );
}
