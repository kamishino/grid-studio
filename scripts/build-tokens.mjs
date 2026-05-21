import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clampRgb, formatHex, parse } from 'culori';
import StyleDictionary from 'style-dictionary';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokenDir = path.join(rootDir, 'tokens');
const buildDir = path.join(tokenDir, '.build');
const generatedTokenFile = path.join(buildDir, 'primitive', 'color.json');

function isToken(node) {
  return node && typeof node === 'object' && '$value' in node;
}

function normalizeColor(value) {
  if (typeof value !== 'string' || value.startsWith('{')) {
    return value;
  }

  const color = parse(value);

  if (!color) {
    throw new Error(`Unable to parse color token value: ${value}`);
  }

  return formatHex(clampRgb(color)).toUpperCase();
}

function convertColorTokens(node) {
  if (Array.isArray(node) || !node || typeof node !== 'object') {
    return node;
  }

  if (isToken(node) && node.$type === 'color') {
    return {
      ...node,
      $value: normalizeColor(node.$value),
    };
  }

  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, convertColorTokens(value)]),
  );
}

await rm(buildDir, { recursive: true, force: true });
await mkdir(path.dirname(generatedTokenFile), { recursive: true });

const primitiveColorPath = path.join(tokenDir, 'primitive', 'color.json');
const primitiveColors = JSON.parse(await readFile(primitiveColorPath, 'utf8'));
await writeFile(
  generatedTokenFile,
  `${JSON.stringify(convertColorTokens(primitiveColors), null, 2)}\n`,
);

const styleDictionary = new StyleDictionary({
  source: [
    'tokens/.build/primitive/**/*.json',
    'tokens/primitive/spacing.json',
    'tokens/primitive/radius.json',
    'tokens/primitive/typography.json',
    'tokens/semantic/**/*.json',
    'tokens/component/**/*.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root',
          },
        },
      ],
    },
  },
});

await styleDictionary.buildAllPlatforms();
