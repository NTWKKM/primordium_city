import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const publicContentDir = path.join(rootDir, 'reader-app', 'public', 'content');

// Create public/content directory if it doesn't exist
if (!fs.existsSync(publicContentDir)) {
  fs.mkdirSync(publicContentDir, { recursive: true });
}

// Extract outline titles
const outlineFiles = fs.readdirSync(rootDir).filter(f => f.includes('OUTLINE') && f.endsWith('.md'));
const chapterTitles = {}; // { "ARC_1_1": "Title", "EPILOGUE_1": "Title" }

outlineFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const lines = content.split('\n');
  
  let currentArc = null;
  if (file.startsWith('ARC_')) {
    const match = file.match(/ARC_(\d+)/);
    if (match) currentArc = match[1];
  } else if (file.startsWith('EPILOGUE')) {
    currentArc = 'Epilogue';
  }

  lines.forEach(line => {
    // Match: **Chapter 1: รสชาติของพิกเซลสีทอง (The Taste of Golden Pixels)**
    const chapMatch = line.match(/\*\*Chapter\s+(\d+):\s+(.*?)\*\*/i);
    if (chapMatch) {
      const chapNum = chapMatch[1];
      const title = chapMatch[2].trim();
      const key = currentArc === 'Epilogue' ? `EPILOGUE_${chapNum}` : `ARC_${currentArc}_${chapNum}`;
      chapterTitles[key] = title;
    }
  });
});

const files = fs.readdirSync(rootDir);
const chapterFiles = files.filter(f => {
  return f.endsWith('.md') && 
    (f.startsWith('ARC_') || f.startsWith('EPILOGUE_')) &&
    !f.includes('OUTLINE') &&
    !f.includes('REPORT') &&
    !f.includes('TEMPLATE');
});

// Helper to extract arc number, chapter number, and part number from filename
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

const chaptersParsed = chapterFiles
  .map(parseFilename)
  .filter(c => c.chapter !== null); // valid chapters

// Group by Arc and Chapter
const groupedChapters = {};
chaptersParsed.forEach(chap => {
  const key = chap.arc === 'Epilogue' ? `EPILOGUE_${chap.chapter}` : `ARC_${chap.arc}_${chap.chapter}`;
  if (!groupedChapters[key]) {
    groupedChapters[key] = {
      arc: chap.arc,
      chapter: chap.chapter,
      key: key,
      parts: []
    };
  }
  groupedChapters[key].parts.push(chap);
});

// Convert grouped object to array and sort
const chapters = Object.values(groupedChapters).sort((a, b) => {
  if (a.arc === 'Epilogue' && b.arc !== 'Epilogue') return 1;
  if (a.arc !== 'Epilogue' && b.arc === 'Epilogue') return -1;
  if (a.arc !== b.arc) return a.arc - b.arc;
  return a.chapter - b.chapter;
});

// Extract titles from files and process content
const catalog = chapters.map((chapGroup, index) => {
  // Sort parts
  chapGroup.parts.sort((a, b) => a.part - b.part);

  let combinedContent = '';
  chapGroup.parts.forEach(part => {
    const content = fs.readFileSync(path.join(rootDir, part.filename), 'utf8');
    combinedContent += content + '\n\n';
  });

  let title = chapterTitles[chapGroup.key];
  if (!title) {
    title = `Chapter ${chapGroup.chapter}`;
  } else {
    title = `Chapter ${chapGroup.chapter}: ${title}`;
  }

  // Calculate reading time
  const wordCount = combinedContent.split(/\s+/).length;
  const readTimeMin = Math.ceil(wordCount / 200);

  // Remove all variations of Editor Notes (e.g. [Note to Editor:], `[Internal Note:]`, etc)
  const cleanContent = combinedContent.replace(/`?\[.*?Note.*?:[\s\S]*?\]`?/gi, '');

  const outputFilename = `${chapGroup.key}.md`;
  
  // Copy markdown file to public folder
  fs.writeFileSync(path.join(publicContentDir, outputFilename), cleanContent);

  return {
    id: outputFilename,
    arc: chapGroup.arc,
    chapter: chapGroup.chapter,
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

console.log(`Generated catalog.json with ${catalog.length} grouped chapters.`);
