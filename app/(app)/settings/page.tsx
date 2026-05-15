import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { SettingsForm } from "@/components/settings/settings-form";
import { getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";
import { getUpcomingReminderDates } from "@/lib/queries/reminders";
import { getUserPrefs } from "@/lib/queries/prefs";

export default async function SettingsPage() {
  const [tagCounts, openTaskCount, upcomingReminders, prefs] = await Promise.all([
    getTagCounts(),
    getOpenTaskCount(),
    getUpcomingReminderDates(),
    getUserPrefs(),
  ]);

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
        <SettingsForm
          showRemindersInSidebar={prefs.showRemindersInSidebar}
          hiddenTags={prefs.hiddenTags}
          hiddenReminderDates={prefs.hiddenReminderDates}
        />
      </div>
    </AppShell>
  );
}
