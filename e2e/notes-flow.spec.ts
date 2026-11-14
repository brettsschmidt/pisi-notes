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

test("pinning a note from its menu lifts it into the pinned band", async ({ signedIn, user }) => {
  const marker = `pinme-${Date.now()}`;
  await seedNote(user.id, `${marker} keep this one on top`, []);

  await signedIn.goto("/notes");
  const note = signedIn.locator("article", { hasText: marker });
  await note.getByRole("button", { name: "note actions" }).click();
  await signedIn.getByRole("menuitem", { name: "Pin to top" }).click();

  const band = signedIn.getByRole("region", { name: "pinned notes" });
  await expect(band.locator("article", { hasText: marker })).toBeVisible({ timeout: 15_000 });

  // The menu now offers to undo the pin.
  await band.locator("article", { hasText: marker }).getByRole("button", { name: "note actions" }).click();
  await expect(signedIn.getByRole("menuitem", { name: "Unpin" })).toBeVisible();
});

test("archiving a note keeps it in the timeline but drops it from search and tag filters", async ({
  signedIn,
  user,
}) => {
  const stamp = Date.now();
  const marker = `archiveme-${stamp}`;
  const tag = `arch${stamp.toString().slice(-6)}`;
  await seedNote(user.id, `${marker} soon to be archived #${tag}`, [tag]);

  await signedIn.goto("/notes");
  const note = signedIn.locator("article", { hasText: marker });
  await note.getByRole("button", { name: "note actions" }).click();
  await signedIn.getByRole("menuitem", { name: "Archive" }).click();

  // Still in the default timeline, flagged as archived.
  await expect(note.getByText("archived", { exact: true })).toBeVisible({ timeout: 15_000 });

  await signedIn.goto(`/notes?q=${encodeURIComponent(marker)}`);
  await expect(signedIn.locator("article", { hasText: marker })).toHaveCount(0);

  await signedIn.goto(`/notes?tag=${encodeURIComponent(tag)}`);
  await expect(signedIn.locator("article", { hasText: marker })).toHaveCount(0);
});
