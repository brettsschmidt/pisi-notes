import { test, expect } from "./fixtures/auth";
import { seedNote } from "./fixtures/supabase-admin";

// Authed coverage for the monetization / AI / growth surface. These run as
// part of `npm run test:e2e` and skip automatically when
// SUPABASE_SERVICE_ROLE_KEY is absent (see the `user` fixture).

test("settings shows the Free plan billing panel", async ({ signedIn }) => {
  await signedIn.goto("/settings");
  await expect(signedIn.getByRole("heading", { name: /plan & billing/i })).toBeVisible();
  // Fresh accounts are on Free, with the Ask Pisi trial meter shown.
  await expect(signedIn.getByText(/ask pisi free trial/i)).toBeVisible();
  await expect(signedIn.getByRole("link", { name: /upgrade to pro/i })).toBeVisible();
});

test("pricing page badges the free plan as current when signed in", async ({ signedIn }) => {
  await signedIn.goto("/pricing");
  await expect(signedIn).toHaveURL(/\/pricing$/);
  await expect(signedIn.getByText(/current plan/i)).toBeVisible();
});

test("Ask Pisi page loads for a signed-in user", async ({ signedIn }) => {
  await signedIn.goto("/ask");
  await expect(signedIn).toHaveURL(/\/ask$/);
  await expect(signedIn.getByRole("heading", { name: /^ask pisi$/i })).toBeVisible();
  await expect(
    signedIn.getByRole("heading", { name: /ask me anything about your notes/i }),
  ).toBeVisible();
});

test("the per-note AI dialog opens with all three actions", async ({ signedIn, user }) => {
  await seedNote(user.id, `ai-note-${Date.now()}`, []);
  await signedIn.goto("/notes");

  await signedIn.getByRole("button", { name: /note actions/i }).first().click();
  await signedIn.getByRole("menuitem", { name: /ask pisi/i }).click();

  await expect(signedIn.getByRole("button", { name: /^summarize$/i })).toBeVisible();
  await expect(signedIn.getByRole("button", { name: /action items/i })).toBeVisible();
  await expect(signedIn.getByRole("button", { name: /suggest tags/i })).toBeVisible();
});

test("a note can be shared and its public link renders", async ({ signedIn, user }) => {
  const marker = `share-${Date.now()}`;
  await seedNote(user.id, `shareable note ${marker}`, []);
  await signedIn.goto("/notes");

  await signedIn.getByRole("button", { name: /note actions/i }).first().click();
  await signedIn.getByRole("menuitem", { name: /share/i }).click();

  const createBtn = signedIn.getByRole("button", { name: /create public link/i });
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  const linkInput = signedIn.getByLabel("public note link");
  await expect(linkInput).toBeVisible({ timeout: 10_000 });
  const url = await linkInput.inputValue();
  expect(url).toMatch(/\/n\/[a-f0-9]{16,}$/);

  // The public page works without a session and carries the conversion CTA.
  await signedIn.goto(url);
  await expect(signedIn.getByText(marker)).toBeVisible();
  await expect(signedIn.getByRole("link", { name: /start your own/i })).toBeVisible();
});
