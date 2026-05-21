import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('calculates, previews, and downloads a grid SVG', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Column systems/i })).toBeVisible();

  await page.getByRole('textbox', { name: 'Overall width' }).fill('960');
  await page.getByRole('textbox', { name: 'Columns', exact: true }).fill('8');

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
  await expect(preview.getByRole('button', { name: 'Fit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
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

test('fits wide previews and calculates custom column spans', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('textbox', { name: 'Overall width' }).fill('1170');
  await page.getByRole('textbox', { name: 'Columns', exact: true }).fill('12');

  const targetRow = page.getByRole('row').filter({ hasText: '70px' }).filter({
    hasText: '30px',
  });

  await targetRow.getByRole('button', { name: /Preview/i }).click();

  const preview = page.getByLabel('Selected grid preview');
  await expect(preview).toContainText('70px columns, 30px gutters');
  await expect(preview.getByRole('button', { name: 'Fit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const fitGeometry = await page.locator('.svg-preview').evaluate((previewNode) => {
    const measurement = previewNode.querySelector('.preview-measurement');
    const svg = previewNode.querySelector('.svg-preview-canvas svg');

    if (!measurement || !svg) {
      throw new Error('Missing preview measurement elements');
    }

    return {
      clientWidth: previewNode.clientWidth,
      scrollWidth: previewNode.scrollWidth,
      measurementWidth: Math.round(measurement.getBoundingClientRect().width),
      svgWidth: Math.round(svg.getBoundingClientRect().width),
    };
  });

  expect(fitGeometry.scrollWidth).toBeLessThanOrEqual(fitGeometry.clientWidth);
  expect(fitGeometry.measurementWidth).toBeLessThan(1170);
  expect(fitGeometry.svgWidth).toBe(fitGeometry.measurementWidth);

  await page.getByRole('button', { name: 'Actual' }).click();
  await expect(preview.getByRole('button', { name: 'Actual' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const actualGeometry = await page.locator('.svg-preview').evaluate((previewNode) => {
    const svg = previewNode.querySelector('.svg-preview-canvas svg');

    if (!svg) {
      throw new Error('Missing preview SVG');
    }

    return {
      scrollable: previewNode.scrollWidth > previewNode.clientWidth,
      svgWidth: Math.round(svg.getBoundingClientRect().width),
    };
  });

  expect(actualGeometry.scrollable).toBe(true);
  expect(actualGeometry.svgWidth).toBe(1170);

  await page.getByRole('textbox', { name: 'Span columns' }).fill('3');
  const spanResults = page.getByLabel('Selected span dimensions');

  await expect(spanResults).toContainText('Span width');
  await expect(spanResults).toContainText('270px');
  await expect(spanResults).toContainText('Remaining width');
  await expect(spanResults).toContainText('900px');
  await expect(spanResults).toContainText('Complement');
  await expect(spanResults).toContainText('9 columns, 870px');
  await expect(spanResults).toContainText('Separator gutter');
  await expect(spanResults).toContainText('30px');

  const rulerBoxes = await preview.evaluate((previewNode) => {
    const column = previewNode.querySelector('[aria-label="Column Width 70px"]');
    const gutter = previewNode.querySelector('[aria-label="Gutter Width 30px"]');

    if (!column || !gutter) {
      throw new Error('Missing ruler labels');
    }

    const columnBox = column.getBoundingClientRect();
    const gutterBox = gutter.getBoundingClientRect();

    return {
      columnRight: columnBox.right,
      gutterLeft: gutterBox.left,
    };
  });

  expect(rulerBoxes.gutterLeft).toBeGreaterThan(rulerBoxes.columnRight);

  const svgState = await page.locator('.svg-preview-canvas svg').evaluate((svg) => {
    const rects = Array.from(svg.querySelectorAll('rect')).slice(1);
    const activeRect = rects[0];
    const inactiveRect = rects[3];

    return {
      activeStroke: activeRect.getAttribute('stroke'),
      activeDash: activeRect.getAttribute('stroke-dasharray'),
      inactiveStroke: inactiveRect.getAttribute('stroke'),
      inactiveDash: inactiveRect.getAttribute('stroke-dasharray'),
    };
  });

  expect(svgState.activeStroke).toBe('#C55120');
  expect(svgState.activeDash).toBeNull();
  expect(svgState.inactiveStroke).toBe('#C55120');
  expect(svgState.inactiveDash).toBe('6 5');

  await page.getByRole('button', { name: 'Primary color' }).click();
  await expect(page.getByLabel('Primary color controls')).toBeVisible();
  await page.getByRole('textbox', { name: 'Hex Code' }).fill('#3366FF');
  await expect(page.locator('.svg-preview-canvas svg rect').nth(1)).toHaveAttribute(
    'stroke',
    '#3366FF',
  );

  await page.getByLabel('HSL Hue').fill('220');
  await page.getByLabel('OKLCH Hue').fill('240');
  const colorAfterSliders = await page
    .locator('.svg-preview-canvas svg rect')
    .nth(1)
    .getAttribute('stroke');
  expect(colorAfterSliders).toMatch(/^#[0-9A-F]{6}$/);

  await page.getByRole('textbox', { name: 'Hex Code' }).fill('#3366FF');
  await page.reload();
  await expect(page.locator('.svg-preview-canvas svg rect').nth(1)).toHaveAttribute(
    'stroke',
    '#3366FF',
  );

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download SVG/i }).first().click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  if (!downloadPath) {
    throw new Error('Missing downloaded SVG path');
  }

  await expect.poll(async () => readFile(downloadPath, 'utf8')).toContain('#3366FF');
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
