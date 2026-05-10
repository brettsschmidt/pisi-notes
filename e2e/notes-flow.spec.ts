import { test, expect } from "./fixtures/auth";
import { seedNote } from "./fixtures/supabase-admin";

test("seeded note appears in the timeline", async ({ signedIn, user }) => {
  const marker = `e2e-marker-${Date.now()}`;
  await seedNote(user.id, `seeded body ${marker} #seed`, ["seed"]);

  await signedIn.goto("/notes");
  await expect(signedIn.getByText(marker)).toBeVisible();
});

test("tag from a seeded note shows up in the sidebar", async ({ signedIn, user }) => {
  const tag = `e2e${Date.now().toString().slice(-6)}`;
  await seedNote(user.id, `tagged note body #${tag}`, [tag]);

  await signedIn.goto("/notes");
  // Sidebar lists tags as links/buttons containing "#tag".
  await expect(signedIn.getByText(`#${tag}`).first()).toBeVisible();
});

test("composing a note via the Tiptap editor persists it", async ({ signedIn }) => {
  const body = `composed-${Date.now()}`;
  await signedIn.goto("/notes");

  const editor = signedIn.locator('[aria-label="note composer"]');
  await editor.click();
  await signedIn.keyboard.type(body);
  // Cmd+Enter is the documented submit shortcut on the composer.
  await signedIn.keyboard.press("Meta+Enter");

  await expect(signedIn.getByText(body)).toBeVisible({ timeout: 15_000 });
});

test("search filter narrows the timeline to matching notes", async ({ signedIn, user }) => {
  const needle = `findme-${Date.now()}`;
  await seedNote(user.id, `decoy note about cats`, []);
  await seedNote(user.id, `${needle} the haystack contains a needle`, []);

  await signedIn.goto(`/notes?q=${encodeURIComponent(needle)}`);
  await expect(signedIn.getByText(needle)).toBeVisible();
  await expect(signedIn.getByText(/decoy note about cats/)).toHaveCount(0);
});
