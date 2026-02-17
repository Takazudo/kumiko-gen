/**
 * generate-category-nav.js
 *
 * Scans the docs/ directory for category subdirectories and their pages.
 * Extracts titles from frontmatter (using gray-matter) or H1 headings.
 * Reads sidebar_position from frontmatter for sorting.
 * Reads _category_.json for category label and position.
 * Outputs src/data/category-nav.json with structured navigation data.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Paths relative to the project root (where this script is run from)
const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'category-nav.json');

/**
 * Check if a given path is a directory (not a symlink to a directory).
 */
function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file is a markdown or MDX file.
 */
function isMarkdownFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ext === '.md' || ext === '.mdx';
}

/**
 * Check if a file is an index file (index.md, index.mdx, or a file matching
 * the parent directory name).
 */
function isIndexFile(filename, parentDirName) {
  const basename = path.basename(filename, path.extname(filename));
  return basename === 'index' || basename === parentDirName;
}

/**
 * Convert a filename (without extension) to a human-readable title.
 * E.g., "create-a-blog-post" -> "Create a Blog Post"
 */
function filenameToTitle(filename) {
  const basename = path.basename(filename, path.extname(filename));
  return basename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Extract the first H1 heading from markdown content.
 * Returns null if no H1 is found.
 */
function extractH1(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Parse a markdown/MDX file and extract its metadata.
 * Returns an object with docId, title, and position.
 */
function parseMarkdownFile(filePath, categoryKey) {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(rawContent);

  const filename = path.basename(filePath);
  const basenameNoExt = path.basename(filePath, path.extname(filePath));

  // Build the docId: category-key/filename-without-extension
  const docId = `${categoryKey}/${basenameNoExt}`;

  // Determine title with fallback chain:
  // 1. frontmatter.title
  // 2. First H1 heading in content
  // 3. Filename converted to title case
  let title = frontmatter.title || null;
  if (!title) {
    title = extractH1(content);
  }
  if (!title) {
    title = filenameToTitle(filename);
  }

  // sidebar_position from frontmatter, default to a large number for sorting
  const position =
    frontmatter.sidebar_position != null
      ? Number(frontmatter.sidebar_position)
      : Infinity;

  return { docId, title, position };
}

/**
 * Read _category_.json from a directory if it exists.
 * Returns an object with label and position, or defaults.
 */
function readCategoryMeta(dirPath) {
  const categoryFile = path.join(dirPath, '_category_.json');
  const defaults = {
    label: filenameToTitle(path.basename(dirPath)),
    position: Infinity,
  };

  try {
    const raw = fs.readFileSync(categoryFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      label: parsed.label || defaults.label,
      position: parsed.position != null ? Number(parsed.position) : defaults.position,
    };
  } catch {
    // File doesn't exist or is invalid -- use defaults
    return defaults;
  }
}

/**
 * Check if a directory has an index file (index.md, index.mdx, or a file
 * whose basename matches the directory name).
 */
function findIndexFile(dirPath) {
  const dirName = path.basename(dirPath);
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    if (!isMarkdownFile(entry)) continue;
    const basename = path.basename(entry, path.extname(entry));
    if (basename === 'index' || basename === dirName) {
      return entry;
    }
  }
  return null;
}

/**
 * Process a category directory. Returns an object with pages and subcategories.
 *
 * @param {string} dirPath - Absolute path to the category directory
 * @param {string} categoryKey - The relative key for this category (e.g., "tutorial-basics")
 */
function processCategory(dirPath, categoryKey) {
  const entries = fs.readdirSync(dirPath);
  const dirName = path.basename(dirPath);

  const pages = [];
  const subcategories = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry);

    // Skip _category_.json
    if (entry === '_category_.json') continue;

    if (isDirectory(entryPath)) {
      // Skip img/ directories (they contain images, not docs)
      if (entry === 'img') continue;

      // Process as a subcategory
      const subCategoryKey = `${categoryKey}/${entry}`;
      const subMeta = readCategoryMeta(entryPath);
      const subIndexFile = findIndexFile(entryPath);
      const hasIndex = subIndexFile !== null;

      // docId for the subcategory index page
      const subDocId = hasIndex
        ? `${subCategoryKey}/${path.basename(subIndexFile, path.extname(subIndexFile))}`
        : subCategoryKey;

      // Get pages within the subcategory (non-recursive for now; deeper
      // nesting would require additional handling)
      const subEntries = fs.readdirSync(entryPath);
      const subPages = [];

      for (const subEntry of subEntries) {
        const subEntryPath = path.join(entryPath, subEntry);
        if (subEntry === '_category_.json') continue;
        if (isDirectory(subEntryPath)) continue;
        if (!isMarkdownFile(subEntry)) continue;
        if (isIndexFile(subEntry, entry)) continue;

        subPages.push(parseMarkdownFile(subEntryPath, subCategoryKey));
      }

      // Sort subcategory pages by position, then by title
      subPages.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.title.localeCompare(b.title);
      });

      subcategories.push({
        key: entry,
        title: subMeta.label,
        docId: subDocId,
        hasIndex,
        position: subMeta.position,
        pages: subPages,
      });
    } else if (isMarkdownFile(entry)) {
      // Skip index files in the pages list
      if (isIndexFile(entry, dirName)) continue;

      pages.push(parseMarkdownFile(entryPath, categoryKey));
    }
  }

  // Sort pages by position, then by title
  pages.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.title.localeCompare(b.title);
  });

  // Sort subcategories by position, then by title
  subcategories.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.title.localeCompare(b.title);
  });

  return { pages, subcategories };
}

/**
 * Main function: scan docs/ for top-level category directories and generate
 * the navigation JSON file.
 */
function main() {
  // Ensure the output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const topLevelEntries = fs.readdirSync(DOCS_DIR);
  const result = {};

  for (const entry of topLevelEntries) {
    const entryPath = path.join(DOCS_DIR, entry);

    // Only process directories (categories), skip files at the root level
    if (!isDirectory(entryPath)) continue;

    // Skip img/ directories at the top level too
    if (entry === 'img') continue;

    const categoryData = processCategory(entryPath, entry);
    result[entry] = categoryData;
  }

  // Write the output JSON file with readable formatting
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2) + '\n', 'utf-8');

  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`Categories found: ${Object.keys(result).join(', ')}`);
}

main();
