import { test, expect } from "./fixtures/auth";
import { seedNote, seedTask } from "./fixtures/supabase-admin";

test("open and done tasks split across the tabs", async ({ signedIn, user }) => {
  const noteId = await seedNote(user.id, "task-bearing note", ["seed"]);
  const openText = `open-${Date.now()}`;
  const doneText = `done-${Date.now()}`;
  await seedTask(user.id, noteId, openText, false);
  await seedTask(user.id, noteId, doneText, true);

  await signedIn.goto("/tasks");

  // Open tab is the default.
  await expect(signedIn.getByText(openText)).toBeVisible();
  await expect(signedIn.getByText(doneText)).toHaveCount(0);

  // Switch to the Done tab.
  await signedIn.getByRole("tab", { name: /^done/i }).click();
  await expect(signedIn.getByText(doneText)).toBeVisible();
});

test("tasks page tab labels show counts", async ({ signedIn, user }) => {
  const noteId = await seedNote(user.id, "count check", []);
  await seedTask(user.id, noteId, `o1-${Date.now()}`, false);
  await seedTask(user.id, noteId, `o2-${Date.now()}`, false);
  await seedTask(user.id, noteId, `d1-${Date.now()}`, true);

  await signedIn.goto("/tasks");
  await expect(signedIn.getByRole("tab", { name: /open \(\d+\)/i })).toContainText("(2)");
  await expect(signedIn.getByRole("tab", { name: /done \(\d+\)/i })).toContainText("(1)");
});
