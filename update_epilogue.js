import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = __dirname;

const outlineTitleRegex = /\*\*Chapter\s+(\d+):\s+(.*?)\*\*/g;

function parseEpilogue() {
  const titles = {};
  const epiloguePath = path.join(contentDir, `EPILOGUE_OUTLINE.md`);
  if (fs.existsSync(epiloguePath)) {
    const content = fs.readFileSync(epiloguePath, 'utf-8');
    let match;
    while ((match = outlineTitleRegex.exec(content)) !== null) {
      titles[parseInt(match[1])] = match[2].trim();
    }
  }
  return titles;
}

const titlesMap = parseEpilogue();

const getPrefix = (chapterNum) => {
  const chStr = chapterNum.toString().padStart(2, '0');
  if (chapterNum >= 101 && chapterNum <= 103) {
    return `[ DATA.FOSSIL // EPILOGUE : CH ${chStr} ]`;
  } else if (chapterNum >= 104 && chapterNum <= 106) {
    return `[ ECHO.TOMB // EPILOGUE : CH ${chStr} ]`;
  } else {
    return `[ VANTABLACK // EPILOGUE : CH ${chStr} ]`;
  }
};

function processEpilogue() {
  const files = fs.readdirSync(contentDir);
  let updatedCount = 0;

  for (const file of files) {
    if (file.match(/^EPILOGUE_(\d+)(?:-\d+)?\.md$/)) {
      const match = file.match(/^EPILOGUE_(\d+)/);
      const chapter = parseInt(match[1]);
      const title = titlesMap[chapter] || `Unknown Title`;
      const prefix = getPrefix(chapter);
      
      const newHeader = `\`${prefix}\`\n# ${title}\n---\n\n`;
      const filePath = path.join(contentDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      const lines = content.split('\n');
      let startIdx = 0;
      
      const sepIdx = lines.indexOf('---');
      if (sepIdx !== -1 && sepIdx < 5) {
        startIdx = sepIdx + 1;
      }
      
      while(startIdx < lines.length && lines[startIdx].trim() === '') {
        startIdx++;
      }
      
      const body = lines.slice(startIdx).join('\n');
      const newContent = newHeader + body;
      
      fs.writeFileSync(filePath, newContent);
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} Epilogue files.`);
}

processEpilogue();
