import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKumiko } from './generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SLUGS = Array.from({ length: 100 }, (_, i) => `example-article-${String(i + 1).padStart(3, '0')}`);

function generateSection(title: string, description: string, zoom: number): string {
  const cells = SLUGS.map((slug) => {
    const svg = generateKumiko(slug, { size: 200, zoom });
    return `
    <div style="text-align:center;">
      <div>${svg}</div>
      <div style="font-size:11px; color:#666; margin-top:4px; word-break:break-all;">${slug}</div>
    </div>`;
  });

  return `
  <h2>${title}</h2>
  <p>${description}</p>
  <div class="grid">
    ${cells.join('\n')}
  </div>`;
}

function generateExamplePage(): string {
  const sections = [
    generateSection('zoom: 1 (default)', 'Full pattern view — the entire grid is visible.', 1),
    generateSection('zoom: 5', 'Zoomed into center — shows pattern detail at 5x magnification.', 5),
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kumiko Pattern Examples (100 patterns)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; padding: 24px; background: oklch(14.7% 0.004 49.25); color: #ccc; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin-top: 40px; margin-bottom: 4px; }
    p { color: #666; margin-bottom: 16px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
  </style>
</head>
<body>
  <h1>Kumiko Pattern Examples</h1>
  <p>100 unique patterns generated from different slugs. Each pattern is deterministic based on the slug string.</p>
  ${sections.join('\n')}
</body>
</html>`;
}

function main() {
  const packageDir = resolve(__dirname, '..');
  const outputPath = resolve(packageDir, 'examples.html');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generateExamplePage(), 'utf-8');

  console.log(`Generated example page: ${outputPath}`);
}

main();
