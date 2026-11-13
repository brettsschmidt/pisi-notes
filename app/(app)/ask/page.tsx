import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { AskPisi } from "@/components/ai/ask-pisi";
import { getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";
import { getUpcomingReminderDates } from "@/lib/queries/reminders";
import { getUserPrefs } from "@/lib/queries/prefs";
import { getSubscription } from "@/lib/billing/subscription";
import { entitlementsFor } from "@/lib/billing/plans";
import { isAiConfigured } from "@/lib/ai/client";

export default async function AskPage() {
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
          view="ask"
          reminders={upcomingReminders}
          showRemindersInSidebar={prefs.showRemindersInSidebar}
          hiddenTags={prefs.hiddenTags}
          hiddenReminderDates={prefs.hiddenReminderDates}
        />
      }
    >
      <AskPisi entitlements={entitlements} aiConfigured={isAiConfigured()} />
    </AppShell>
  );
}
