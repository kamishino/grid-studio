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
  const preview = page.getByLabel('Selected grid preview');
  await expect(preview).toContainText('106px columns, 16px gutters');
  await expect(preview).toContainText('Column Width');
  await expect(preview).toContainText('Gutter Width');
  await expect(preview).toContainText('Number of Columns');
  await expect(preview).toContainText('Overall Width');
  await expect(preview.getByLabel('Column Width 106px')).toBeVisible();
  await expect(preview.getByLabel('Gutter Width 16px')).toBeVisible();
  await expect(preview.getByLabel('Overall Width 960px')).toBeVisible();
  await expect(preview).toContainText('8');
  await expect(preview).toContainText('960px');

  const previewIsDetached = await page
    .locator('.results-panel')
    .evaluate((resultsPanel) => !resultsPanel.querySelector('.preview-panel'));
  expect(previewIsDetached).toBe(true);

  const downloadPromise = page.waitForEvent('download');
  await targetRow.getByRole('button', { name: /Download SVG/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('grid-960px-8col-106px-16px.svg');
});

test('activates preview when a result row is clicked', async ({ page }) => {
  await page.goto('/');

  const targetRow = page.getByRole('row').filter({ hasText: '99px' }).filter({
    hasText: '24px',
  });

  await targetRow.click();

  await expect(page.getByLabel('Selected grid preview')).toContainText(
    '99px columns, 24px gutters',
  );
});

test('activates preview from a focused result row with keyboard', async ({ page }) => {
  await page.goto('/');

  const targetRow = page.getByRole('row').filter({ hasText: '92px' }).filter({
    hasText: '32px',
  });

  await targetRow.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByLabel('Selected grid preview')).toContainText(
    '92px columns, 32px gutters',
  );
});
