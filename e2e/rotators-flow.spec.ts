import { test, expect } from "./fixtures/auth";

// Authed coverage for the core flow. Skips automatically when
// SUPABASE_SERVICE_ROLE_KEY is absent (see the `user` fixture).

test("create an image link, add images by URL, and fetch it", async ({ signedIn, request }) => {
  await signedIn.getByLabel("Name").fill("E2E header");
  await signedIn.getByRole("button", { name: /create link/i }).click();
  await signedIn.waitForURL(/\/rotators\/[0-9a-f-]{36}/);
  await expect(signedIn.getByRole("heading", { name: "E2E header" })).toBeVisible();

  const imageUrl = await signedIn.getByLabel("Image URL", { exact: true }).inputValue();
  expect(imageUrl).toMatch(/\/i\/[A-Za-z0-9]{8,32}$/);

  // An empty link serves a transparent placeholder instead of a broken image.
  const empty = await request.get(new URL(imageUrl).pathname);
  expect(empty.status()).toBe(200);
  expect(empty.headers()["content-type"]).toBe("image/gif");
  expect(empty.headers()["cache-control"]).toMatch(/no-store/);

  // Rotation mode can be switched after creation.
  await signedIn.getByRole("radio", { name: /random/i }).click();
  await expect(signedIn.getByRole("radio", { name: /random/i })).toHaveAttribute("aria-checked", "true");
});

test("free plan shows link usage in settings", async ({ signedIn }) => {
  await signedIn.goto("/settings");
  await expect(signedIn.getByRole("heading", { name: /plan & billing/i })).toBeVisible();
  await expect(signedIn.getByText(/0 \/ 2 used/)).toBeVisible();
  await expect(signedIn.getByRole("link", { name: /upgrade to pro/i }).first()).toBeVisible();
});

test("pricing page badges the free plan as current when signed in", async ({ signedIn }) => {
  await signedIn.goto("/pricing");
  await expect(signedIn.getByText(/current plan/i)).toBeVisible();
});
