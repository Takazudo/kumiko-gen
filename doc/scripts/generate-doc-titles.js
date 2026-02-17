/**
 * generate-doc-titles.js
 *
 * Scans all .md/.mdx files in docs/ directory, extracts the title from
 * frontmatter (using gray-matter), falls back to first H1 heading or
 * filename, and outputs src/data/doc-titles.json.
 *
 * Output format:
 * {
 *   "intro": "Introduction",
 *   "tutorial-basics/create-a-document": "Create a Document",
 *   ...
 * }
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'doc-titles.json');

/**
 * Recursively find all .md and .mdx files under a directory.
 * Skips _category_.json and non-markdown files.
 */
function findMarkdownFiles(dir, basePath = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Recurse into subdirectories, skip img directories
      if (entry.name !== 'img' && entry.name !== 'node_modules') {
        results.push(...findMarkdownFiles(fullPath, relativePath));
      }
    } else if (entry.isFile()) {
      // Only include .md and .mdx files, skip _category_.json and other files
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.md' || ext === '.mdx') {
        results.push({ fullPath, relativePath });
      }
    }
  }

  return results;
}

/**
 * Extract the title from a markdown file.
 * Priority: frontmatter title > first H1 heading > filename without extension.
 */
function extractTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // 1. Check frontmatter for title
  if (frontmatter.title) {
    return frontmatter.title;
  }

  // 2. Check for sidebar_label in frontmatter
  if (frontmatter.sidebar_label) {
    return frontmatter.sidebar_label;
  }

  // 3. Look for first H1 heading in the body
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) {
    // Strip any inline markdown formatting from the heading
    return h1Match[1].replace(/\*\*/g, '').replace(/\*/g, '').trim();
  }

  // 4. Fall back to filename without extension
  const basename = path.basename(filePath);
  const nameWithoutExt = basename.replace(/\.(md|mdx)$/i, '');
  // Convert kebab-case or snake_case to Title Case
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Convert a relative file path to a Docusaurus doc ID.
 * - Strip .md/.mdx extension
 * - Use forward slashes
 * - Examples:
 *   "intro.md" -> "intro"
 *   "tutorial-basics/create-a-document.md" -> "tutorial-basics/create-a-document"
 */
function pathToDocId(relativePath) {
  return relativePath
    .replace(/\.(md|mdx)$/i, '')
    .split(path.sep)
    .join('/');
}

function main() {
  // Ensure docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Error: docs directory not found at ${DOCS_DIR}`);
    process.exit(1);
  }

  // Find all markdown files
  const files = findMarkdownFiles(DOCS_DIR);

  // Build the titles map
  const titles = {};
  for (const { fullPath, relativePath } of files) {
    const docId = pathToDocId(relativePath);
    const title = extractTitle(fullPath);
    titles[docId] = title;
  }

  // Sort keys for stable output
  const sorted = {};
  for (const key of Object.keys(titles).sort()) {
    sorted[key] = titles[key];
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write the output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
  console.log(`Generated ${OUTPUT_FILE} with ${Object.keys(sorted).length} entries.`);
}

main();
