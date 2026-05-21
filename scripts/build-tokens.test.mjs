import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('design token build output', () => {
  it('emits primitive, semantic, and component CSS variables', async () => {
    const css = await readFile('src/styles/tokens.css', 'utf8');

    expect(css).toContain('--primitive-color-accent-600');
    expect(css).toContain('--semantic-color-accent');
    expect(css).toContain('--component-preview-column-fill');
  });

  it('normalizes color space values before CSS output', async () => {
    const css = await readFile('src/styles/tokens.css', 'utf8');

    expect(css).not.toContain('oklch(');
  });
});
