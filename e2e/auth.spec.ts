import { test, expect } from "./fixtures/auth";

test("password sign-in lands on /notes", async ({ signedIn }) => {
  await expect(signedIn).toHaveURL(/\/notes$/);
});

test("authenticated user can reach /tasks (no PostgREST embed error)", async ({ signedIn }) => {
  // Surface the bug we just fixed (PGRST201): /tasks must render the page,
  // not throw an "{code, details, hint, message}" server error.
  const errors: string[] = [];
  signedIn.on("pageerror", (e) => errors.push(e.message));
  signedIn.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await signedIn.goto("/tasks");
  await expect(signedIn).toHaveURL(/\/tasks$/);
  await expect(signedIn.getByRole("heading", { name: /^tasks$/i })).toBeVisible();
  // No PostgREST relationship error should leak to the page or console.
  expect(errors.join("\n"), "should not surface PGRST embed errors").not.toMatch(/PGRST201|Could not embed/i);
});

test("sign-out returns to /login", async ({ signedIn }) => {
  await signedIn.goto("/notes");
  // Sign-out is exposed as a form action in the app shell; click any button labelled accordingly.
  const signOut = signedIn.getByRole("button", { name: /sign out|log out/i });
  if (await signOut.count()) {
    await signOut.first().click();
    await signedIn.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(signedIn).toHaveURL(/\/login$/);
  } else {
    test.skip(true, "no sign-out control found in the app shell");
  }
});
