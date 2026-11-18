import { test, expect } from "./fixtures/auth";

test("password sign-in lands on /rotators", async ({ signedIn }) => {
  await expect(signedIn).toHaveURL(/\/rotators$/);
  await expect(signedIn.getByRole("heading", { name: /^image links$/i })).toBeVisible();
});

test("sign-out returns to /login", async ({ signedIn }) => {
  await signedIn.getByRole("button", { name: /sign out/i }).click();
  await signedIn.waitForURL(/\/login/, { timeout: 10_000 });
  await expect(signedIn).toHaveURL(/\/login$/);
});
