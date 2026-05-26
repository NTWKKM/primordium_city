import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = __dirname;

const outlineTitleRegex = /\*\*Chapter\s+(\d+):\s+(.*?)(?:\s+\((.*?)\))?\*\*/g;

function parseOutlines() {
  const titles = {};
  
  for (let i = 1; i <= 5; i++) {
    const outlinePath = path.join(contentDir, `ARC_${i}_OUTLINE.md`);
    if (fs.existsSync(outlinePath)) {
      const content = fs.readFileSync(outlinePath, 'utf-8');
      let match;
      while ((match = outlineTitleRegex.exec(content)) !== null) {
        titles[parseInt(match[1])] = {
          th: match[2].trim(),
          en: match[3] ? match[3].trim() : ''
        };
      }
    }
  }

  const epiloguePath = path.join(contentDir, `EPILOGUE_OUTLINE.md`);
  if (fs.existsSync(epiloguePath)) {
    const content = fs.readFileSync(epiloguePath, 'utf-8');
    let match;
    while ((match = outlineTitleRegex.exec(content)) !== null) {
      titles[parseInt(match[1])] = {
        th: match[2].trim(),
        en: match[3] ? match[3].trim() : ''
      };
    }
  }

  return titles;
}

const titlesMap = parseOutlines();

const getPrefix = (arcStr, chapterNum) => {
  const chStr = chapterNum.toString().padStart(2, '0');
  if (arcStr === 'Epilogue') {
    if (chapterNum >= 101 && chapterNum <= 103) {
      return `[ DATA.FOSSIL // EPILOGUE : CH ${chStr} ]`;
    } else if (chapterNum >= 104 && chapterNum <= 106) {
      return `[ ECHO.TOMB // EPILOGUE : CH ${chStr} ]`;
    } else {
      return `[ VANTABLACK // EPILOGUE : CH ${chStr} ]`;
    }
  }
  
  const arcNum = parseInt(arcStr);
  const arcStrFormatted = arcNum.toString().padStart(2, '0');
  
  switch(arcNum) {
    case 1: return `[ SYS.ARCHIVE // ARC ${arcStrFormatted} : CH ${chStr} ]`;
    case 2: return `[ MID.SECTORS // ARC ${arcStrFormatted} : CH ${chStr} ]`;
    case 3: return `[ DATA.SUMP // ARC ${arcStrFormatted} : CH ${chStr} ]`;
    case 4: return `[ CORE.SEPSIS // ARC ${arcStrFormatted} : CH ${chStr} ]`;
    case 5: return `[ ZERO.BIT // ARC ${arcStrFormatted} : CH ${chStr} ]`;
    default: return `[ SYS.UNKNOWN // ARC ${arcStrFormatted} : CH ${chStr} ]`;
  }
};

function processFiles() {
  const files = fs.readdirSync(contentDir);
  let updatedCount = 0;

  for (const file of files) {
    let arc = null;
    let chapter = null;

    if (file.match(/^ARC_(\d+)_(\d+)(?:-\d+)?\.md$/)) {
      const match = file.match(/^ARC_(\d+)_(\d+)/);
      arc = match[1];
      chapter = parseInt(match[2]);
    } else if (file.match(/^EPILOGUE_(\d+)(?:-\d+)?\.md$/)) {
      const match = file.match(/^EPILOGUE_(\d+)/);
      arc = 'Epilogue';
      chapter = parseInt(match[1]);
    }

    if (arc && chapter) {
      const titleObj = titlesMap[chapter] || { th: 'Unknown Title', en: '' };
      const prefix = getPrefix(arc, chapter);
      
      let newHeader = `\`${prefix}\`\n# ${titleObj.th}\n`;
      if (titleObj.en) {
        newHeader += `#### // FILE: ${titleObj.en.toUpperCase().replace(/\s+/g, '_')}\n`;
      }
      newHeader += `---\n\n`;
      
      const filePath = path.join(contentDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      const lines = content.split('\n');
      let startIdx = 0;
      
      if (lines[0] && lines[0].startsWith('`[')) {
         const sepIdx = lines.indexOf('---');
         if (sepIdx !== -1 && sepIdx < 5) {
            startIdx = sepIdx + 1;
         }
      } else {
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          const line = lines[i].trim();
          if (line === '' || 
              line.match(/^#+\s+(ARC|Chapter|Part|EPILOGUE|บทส่งท้าย|Setup|Translating|FILE)/i)) {
            startIdx = i + 1;
          } else {
            break;
          }
        }
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
  
  console.log(`Successfully updated ${updatedCount} files.`);
}

processFiles();
