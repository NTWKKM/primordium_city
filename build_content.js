import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const publicContentDir = path.join(rootDir, 'reader-app', 'public', 'content');

// Create public/content directory if it doesn't exist
if (!fs.existsSync(publicContentDir)) {
  fs.mkdirSync(publicContentDir, { recursive: true });
}

const files = fs.readdirSync(rootDir);
const chapterFiles = files.filter(f => {
  return f.endsWith('.md') && 
    (f.startsWith('ARC_') || f.startsWith('EPILOGUE_')) &&
    !f.includes('OUTLINE') &&
    !f.includes('REPORT') &&
    !f.includes('TEMPLATE');
});

// Helper to extract arc number, chapter number, and part number from filename
// Examples: ARC_1_1-1.md -> Arc 1, Chap 1, Part 1
// ARC_5_100-2.md -> Arc 5, Chap 100, Part 2
// EPILOGUE_101.md -> Epilogue, Chap 101
function parseFilename(filename) {
  let arc = null;
  let chapter = null;
  let part = null;

  if (filename.startsWith('ARC_')) {
    const match = filename.match(/ARC_(\d+)_(\d+)(?:-(\d+))?\.md/);
    if (match) {
      arc = parseInt(match[1]);
      chapter = parseInt(match[2]);
      part = match[3] ? parseInt(match[3]) : 1;
    }
  } else if (filename.startsWith('EPILOGUE_')) {
    const match = filename.match(/EPILOGUE_(\d+)(?:-(\d+))?\.md/);
    if (match) {
      arc = 'Epilogue';
      chapter = parseInt(match[1]);
      part = match[2] ? parseInt(match[2]) : 1;
    }
  }

  return { arc, chapter, part, filename };
}

const chapters = chapterFiles
  .map(parseFilename)
  .filter(c => c.chapter !== null) // valid chapters
  .sort((a, b) => {
    if (a.arc === 'Epilogue' && b.arc !== 'Epilogue') return 1;
    if (a.arc !== 'Epilogue' && b.arc === 'Epilogue') return -1;
    if (a.arc !== b.arc) return a.arc - b.arc;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.part - b.part;
  });

// Extract titles from files
const catalog = chapters.map((chap, index) => {
  const content = fs.readFileSync(path.join(rootDir, chap.filename), 'utf8');
  
  // Extract title (assume first line starting with #)
  const lines = content.split('\n');
  let title = `Chapter ${chap.chapter}`;
  if (chap.part > 1) {
    title += ` Part ${chap.part}`;
  }

  for (let line of lines) {
    if (line.trim().startsWith('# ')) {
      title = line.replace('# ', '').trim();
      break;
    }
  }

  // Calculate reading time (assuming ~250 words per minute for Thai/English)
  const wordCount = content.split(/\s+/).length;
  const readTimeMin = Math.ceil(wordCount / 200); // 200 words per minute is a good estimate

  // Remove Editor Notes
  const cleanContent = content.replace(/\[Note (to|for) Editor:[\s\S]*?\]/gi, '');

  // Copy markdown file to public folder
  fs.writeFileSync(path.join(publicContentDir, chap.filename), cleanContent);

  return {
    id: chap.filename,
    arc: chap.arc,
    chapter: chap.chapter,
    part: chap.part,
    title,
    readTimeMin,
    index
  };
});

// Process WORLD_BIBLE.md specifically
const biblePath = path.join(rootDir, 'WORLD_BIBLE.md');
if (fs.existsSync(biblePath)) {
  const bibleContent = fs.readFileSync(biblePath, 'utf8');
  fs.writeFileSync(path.join(publicContentDir, 'WORLD_BIBLE.md'), bibleContent);
}

fs.writeFileSync(
  path.join(publicContentDir, 'catalog.json'),
  JSON.stringify({ chapters: catalog }, null, 2)
);

console.log(`Generated catalog.json with ${catalog.length} chapters.`);
