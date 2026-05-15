import { AppShell } from "@/components/nav/app-shell";
import { TagSidebar } from "@/components/notes/tag-sidebar";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getTagCounts, getOpenTaskCount } from "@/lib/queries/notes";
import { getScheduled } from "@/lib/queries/calendar";
import { getUpcomingReminderDates } from "@/lib/queries/reminders";
import { getUserPrefs } from "@/lib/queries/prefs";

export default async function CalendarPage() {
  const [items, tagCounts, openTaskCount, upcomingReminders, prefs] = await Promise.all([
    getScheduled(),
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
          view="calendar"
          reminders={upcomingReminders}
          showRemindersInSidebar={prefs.showRemindersInSidebar}
          hiddenTags={prefs.hiddenTags}
          hiddenReminderDates={prefs.hiddenReminderDates}
        />
      }
    >
      <CalendarView items={items} />
    </AppShell>
  );
}
