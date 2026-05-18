import { expect, test } from "@playwright/test";

test("home redirects unauthenticated user to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
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

test("login → signup nav link works", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("/notes bounces to /login when signed out", async ({ page }) => {
  await page.goto("/notes");
  await expect(page).toHaveURL(/\/login$/);
});

test("/tasks bounces to /login when signed out", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);
});

test("/calendar bounces to /login when signed out", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page).toHaveURL(/\/login$/);
});

test("/settings bounces to /login when signed out", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);
});

test("manifest + service worker are served for PWA install", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const manifestJson = await manifest.json();
  expect(manifestJson.name).toBeTruthy();
  expect(Array.isArray(manifestJson.icons)).toBe(true);

  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
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
  for (const path of ["/", "/login", "/signup", "/notes", "/tasks", "/calendar", "/settings"]) {
    const r = await request.get(path);
    expect(r.status(), `unexpected status for ${path}`).toBeLessThan(500);
  }
});
