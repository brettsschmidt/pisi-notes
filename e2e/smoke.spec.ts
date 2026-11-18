import { expect, test } from "@playwright/test";

test("home shows the marketing landing page when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /make your first link/i }).first()).toBeVisible();
});

test("landing page explains the product and shows pricing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /new picture/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /set it up in about a minute/i })).toBeVisible();
  await expect(page.getByText(/most popular/i)).toBeVisible();
});

test("pricing page renders both plans", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole("heading", { name: /free to try/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^free$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^pro$/i })).toBeVisible();
});

test("login page renders the sign-in form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await expect(page.locator('input[name="email"]').first()).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
});

test("signup page renders the create-account form", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("signup page has no internal implementation notes", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByText(/baby-food|supabase/i)).toHaveCount(0);
});

test("magic-link email field has an accessible name", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("textbox", { name: "Email for magic link" })).toBeVisible();
});

test("verify page links back to sign in", async ({ page }) => {
  await page.goto("/verify");
  await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
  await page.getByRole("link", { name: /back to sign in/i }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("login → signup nav link works", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

for (const path of ["/rotators", "/settings"]) {
  test(`${path} bounces to /login when signed out`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("manifest is served", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const manifestJson = await manifest.json();
  expect(manifestJson.name).toBe("Minmi Email Helper");
});

test("unknown image link serves an uncached transparent pixel, not an error", async ({ request }) => {
  for (const path of ["/i/doesNotExist0000", "/i/doesNotExist0000.png", "/i/bad!"]) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(200);
    expect(r.headers()["content-type"], path).toBe("image/gif");
    expect(r.headers()["cache-control"], path).toMatch(/no-store/);
  }
});

test("invalid credentials show a friendly error", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').first().fill("nobody-real@test.local");
  await page.locator('input[name="password"]').fill("wrong-password-zzz");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/login\?error=/);
  await expect(page.getByText(/incorrect|invalid/i)).toBeVisible();
});

test("no page returns 5xx on the unauthed surface", async ({ request }) => {
  const paths = ["/", "/login", "/signup", "/pricing", "/rotators", "/settings"];
  for (const path of paths) {
    const r = await request.get(path);
    expect(r.status(), `unexpected status for ${path}`).toBeLessThan(500);
  }
});

test("unknown route renders the branded not-found page", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /isn.t here/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /start your own/i })).toHaveAttribute("href", "/signup");
});
