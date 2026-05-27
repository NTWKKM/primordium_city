import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const thaiDir = path.join(rootDir, 'thai_native');
const engDir = path.join(rootDir, 'english_localization');

const publicContentDir = path.join(rootDir, 'reader-app', 'public', 'content');
const publicThDir = path.join(publicContentDir, 'th');
const publicEnDir = path.join(publicContentDir, 'en');

if (!fs.existsSync(publicThDir)) fs.mkdirSync(publicThDir, { recursive: true });
if (!fs.existsSync(publicEnDir)) fs.mkdirSync(publicEnDir, { recursive: true });

// Read Titles from Outline files (which are in root)
const outlineFiles = fs.readdirSync(rootDir).filter(f => f.includes('OUTLINE') && f.endsWith('.md'));
const chapterTitles = {}; // { "ARC_1_1": { th, en } }

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
    const chapMatch = line.match(/\*\*Chapter\s+(\d+):\s+(.*?)(?:\s+\((.*?)\))?\*\*/i);
    if (chapMatch) {
      const chapNum = chapMatch[1];
      const key = currentArc === 'Epilogue' ? `EPILOGUE_${chapNum}` : `ARC_${currentArc}_${chapNum}`;
      chapterTitles[key] = {
        th: chapMatch[2].trim(),
        en: chapMatch[3] ? chapMatch[3].trim() : `Chapter ${chapNum}`
      };
    }
  });
});

// Process Thai Native
const thaiFiles = fs.readdirSync(thaiDir);
const groupedChaptersTh = {};

function parseThaiFilename(filename) {
  let arc = null; let chapter = null; let part = 1;
  if (filename.startsWith('ARC_')) {
    const match = filename.match(/ARC_(\d+)_(\d+)(?:-(\d+))?\.md/);
    if (match) { arc = parseInt(match[1]); chapter = parseInt(match[2]); part = match[3] ? parseInt(match[3]) : 1; }
  } else if (filename.startsWith('EPILOGUE_')) {
    const match = filename.match(/EPILOGUE_(\d+)(?:-(\d+))?\.md/);
    if (match) { arc = 'Epilogue'; chapter = parseInt(match[1]); part = match[2] ? parseInt(match[2]) : 1; }
  }
  return { arc, chapter, part, filename, lang: 'th', fullPath: path.join(thaiDir, filename) };
}

thaiFiles.forEach(f => {
  const c = parseThaiFilename(f);
  if (!c.chapter) return;
  const key = c.arc === 'Epilogue' ? `EPILOGUE_${c.chapter}` : `ARC_${c.arc}_${c.chapter}`;
  if (!groupedChaptersTh[key]) groupedChaptersTh[key] = { arc: c.arc, chapter: c.chapter, key, parts: [] };
  groupedChaptersTh[key].parts.push(c);
});

// Process English Localization
const engFolders = fs.readdirSync(engDir).filter(f => fs.statSync(path.join(engDir, f)).isDirectory());
const groupedChaptersEn = {};

engFolders.forEach(folder => {
  let arc = null;
  if (folder.startsWith('arc_')) {
    const match = folder.match(/arc_(\d+)_/);
    if (match) arc = parseInt(match[1]);
  } else if (folder === 'epilogue') {
    arc = 'Epilogue';
  }
  
  if (arc) {
    const files = fs.readdirSync(path.join(engDir, folder)).filter(f => f.endsWith('.md'));
    files.forEach(f => {
      // ch_01_the_taste_of_golden_pixels_part_1.md
      const match = f.match(/ch_(\d+)_(?:.*?)_part_(\d+)\.md/);
      let chapter, part = 1;
      if (match) {
        chapter = parseInt(match[1]);
        part = parseInt(match[2]);
      } else {
        const altMatch = f.match(/ch_(\d+)_(.*?)\.md/);
        if (altMatch) chapter = parseInt(altMatch[1]);
      }
      
      if (chapter) {
        const key = arc === 'Epilogue' ? `EPILOGUE_${chapter}` : `ARC_${arc}_${chapter}`;
        if (!groupedChaptersEn[key]) groupedChaptersEn[key] = { arc, chapter, key, parts: [] };
        groupedChaptersEn[key].parts.push({ arc, chapter, part, filename: f, lang: 'en', fullPath: path.join(engDir, folder, f) });
      }
    });
  }
});

function compileCatalog(groupedChapters, langStr, outDir) {
  const chapters = Object.values(groupedChapters).sort((a, b) => {
    if (a.arc === 'Epilogue' && b.arc !== 'Epilogue') return 1;
    if (a.arc !== 'Epilogue' && b.arc === 'Epilogue') return -1;
    if (a.arc !== b.arc) return a.arc - b.arc;
    return a.chapter - b.chapter;
  });

  return chapters.map((chapGroup, index) => {
    chapGroup.parts.sort((a, b) => a.part - b.part);

    let combinedContent = '';
    chapGroup.parts.forEach(part => {
      const content = fs.readFileSync(part.fullPath, 'utf8');
      combinedContent += content + '\n\n';
    });

    const titleObj = chapterTitles[chapGroup.key];
    let titleStr = `Chapter ${chapGroup.chapter}`;
    if (titleObj) {
      titleStr = langStr === 'en' ? titleObj.en : titleObj.th;
    }

    const wordCount = combinedContent.split(/\s+/).length;
    const readTimeMin = Math.ceil(wordCount / (langStr === 'en' ? 250 : 200));

    const cleanContent = combinedContent.replace(/`?\[.*?Note.*?:[\s\S]*?\]`?/gi, '');
    const outputFilename = `${chapGroup.key}.md`;
    
    fs.writeFileSync(path.join(outDir, outputFilename), cleanContent);

    return {
      id: outputFilename,
      arc: chapGroup.arc,
      chapter: chapGroup.chapter,
      title: titleStr,
      readTimeMin,
      index
    };
  });
}

const catalogTh = compileCatalog(groupedChaptersTh, 'th', publicThDir);
const catalogEn = compileCatalog(groupedChaptersEn, 'en', publicEnDir);

// Process WORLD_BIBLE
const biblePath = path.join(rootDir, 'WORLD_BIBLE.md');
if (fs.existsSync(biblePath)) {
  const bibleContent = fs.readFileSync(biblePath, 'utf8');
  fs.writeFileSync(path.join(publicContentDir, 'WORLD_BIBLE.md'), bibleContent);
}

fs.writeFileSync(
  path.join(publicContentDir, 'catalog.json'),
  JSON.stringify({ chapters_th: catalogTh, chapters_en: catalogEn }, null, 2)
);

console.log(`Generated catalog.json (TH: ${catalogTh.length} chapters, EN: ${catalogEn.length} chapters).`);
