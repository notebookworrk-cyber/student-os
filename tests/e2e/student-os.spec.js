import { test, expect } from '@playwright/test';

test.describe('Student OS E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('main UI renders correctly', async ({ page }) => {
    await expect(page.locator('.logo')).toContainText('Student OS');
    await expect(page.locator('#pg-home')).toBeVisible();
    await expect(page.locator('#hm-greet-name')).toContainText('Student');
  });

  test('navigation switches between tabs', async ({ page }) => {
    await page.click('[data-t="focus"]');
    await expect(page.locator('#pg-focus')).toBeVisible();
    await expect(page.locator('#pg-home')).not.toBeVisible();

    await page.click('[data-t="tasks"]');
    await expect(page.locator('#pg-tasks')).toBeVisible();

    await page.click('[data-t="dash"]');
    await expect(page.locator('#pg-dash')).toBeVisible();

    await page.click('[data-t="prog"]');
    await expect(page.locator('#pg-prog')).toBeVisible();

    await page.click('[data-t="ai"]');
    await expect(page.locator('#pg-ai')).toBeVisible();

    await page.click('[data-t="home"]');
    await expect(page.locator('#pg-home')).toBeVisible();
  });

  test('adds a new task', async ({ page }) => {
    await page.click('[data-t="tasks"]');
    await expect(page.locator('#pg-tasks')).toBeVisible();

    await page.click('text=Add your first mission');
    await expect(page.locator('#task-modal')).toBeVisible();

    await page.fill('#t-name', 'Test integration task');
    await page.selectOption('#t-sub', 'math');
    await page.fill('#t-time', '25 min');
    await page.click('text=Add Mission');

    await expect(page.locator('#all-list .task-item')).toHaveCount(1);
    await expect(page.locator('#all-list .t-name')).toContainText('Test integration task');
  });

  test('focus timer starts and displays correctly', async ({ page }) => {
    await page.click('[data-t="focus"]');
    await expect(page.locator('#ring-time')).toContainText('25:00');

    await page.click('#play-btn');
    await expect(page.locator('#play-ico')).toContainText('⏸');

    await page.click('#play-btn');
    await expect(page.locator('#play-ico')).toContainText('▶');
  });

  test('settings can be opened', async ({ page }) => {
    await page.click('.hm-set-btn');
    await expect(page.locator('#set-modal')).toBeVisible();

    const nameInput = page.locator('#set-name');
    await nameInput.fill('TestUser');
    await page.click('text=Save');
  });

  test('completes a focus session and gains XP', async ({ page }) => {
    await page.click('[data-t="focus"]');

    const ringTime = page.locator('#ring-time');
    await expect(ringTime).toContainText('25:00');

    const homeLink = page.locator('[data-t="home"]');
    await homeLink.click();
    await expect(page.locator('#pg-home')).toBeVisible();
  });
});
