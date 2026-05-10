import { test as base, type Page } from "@playwright/test";

import { createTestUser, deleteTestUser, hasAdmin } from "./supabase-admin";

interface TestUser {
  id: string;
  email: string;
  password: string;
}

interface AuthFixtures {
  user: TestUser;
  signedIn: Page;
}

const PASSWORD = "Test123!password";

function uniqueEmail(prefix = "user") {
  return `e2e-pisi-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
}

export const test = base.extend<AuthFixtures>({
  user: async ({}, use) => {
    if (!hasAdmin()) {
      // eslint-disable-next-line playwright/no-skipped-test
      base.skip(true, "SUPABASE_SERVICE_ROLE_KEY not set — skipping auth-gated test");
    }
    const email = uniqueEmail();
    const created = await createTestUser(email, PASSWORD);
    await use({ id: created.id, email, password: PASSWORD });
    try {
      await deleteTestUser(created.id);
    } catch {
      /* user already gone */
    }
  },

  signedIn: async ({ page, user }, use) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').first().fill(user.email);
    await page.locator('input[name="password"]').fill(user.password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/notes/, { timeout: 15_000 });
    await use(page);
  },
});

export { expect } from "@playwright/test";
export { uniqueEmail };
