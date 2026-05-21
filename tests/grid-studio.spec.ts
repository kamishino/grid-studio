import { expect, test } from '@playwright/test';

test('calculates, previews, and downloads a grid SVG', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Column systems/i })).toBeVisible();

  await page.getByRole('textbox', { name: 'Overall width' }).fill('960');
  await page.getByRole('textbox', { name: 'Columns' }).fill('8');

  const targetRow = page.getByRole('row').filter({ hasText: '106px' }).filter({
    hasText: '16px',
  });

  await expect(targetRow).toBeVisible();
  await targetRow.getByRole('button', { name: /Preview/i }).click();
  await expect(page.getByLabel('Selected grid preview')).toContainText(
    '106px columns, 16px gutters',
  );

  const downloadPromise = page.waitForEvent('download');
  await targetRow.getByRole('button', { name: /Download SVG/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('grid-960px-8col-106px-16px.svg');
});
