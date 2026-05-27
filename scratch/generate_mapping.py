import os
import re
import json

root_dir = "/Users/ntwkkm/primordium_city"
outlines = [
    ("ARC_1_OUTLINE.md", "1", "arc_1_the_fracture"),
    ("ARC_2_OUTLINE.md", "2", "arc_2_the_covenant"),
    ("ARC_3_OUTLINE.md", "3", "arc_3_the_sump"),
    ("ARC_4_OUTLINE.md", "4", "arc_4_the_dissolution"),
    ("ARC_5_OUTLINE.md", "5", "arc_5_the_evolution"),
    ("EPILOGUE_OUTLINE.md", "Epilogue", "epilogue")
]

mapping = {}

def slugify(text):
    text = text.lower()
    # Keep only alphanumeric characters and spaces
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    # Replace spaces with underscores
    text = re.sub(r'\s+', '_', text)
    return text.strip('_')

# Match Chapter lines like: **Chapter 1: รสชาติของพิกเซลสีทอง (The Taste of Golden Pixels)**
# or Chapter 101: การตื่นรู้ของจักรกลเก็บขยะ (The First Scavenger)
chapter_re = re.compile(r'(?:\*\*|Chapter\s+)(\d+):\s*(.*?)(?:\*\*|\n|$)')

for outline_file, arc_num, folder in outlines:
    path = os.path.join(root_dir, outline_file)
    if not os.path.exists(path):
        print(f"Skipping {outline_file} (not found)")
        continue
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    for line in content.split("\n"):
        match = chapter_re.search(line)
        if match:
            chap_num = int(match[1])
            title_part = match[2]
            
            # Extract English title in parentheses
            eng_match = re.search(r'\((.*?)\)', title_part)
            if eng_match:
                eng_title = eng_match.group(1).strip()
            else:
                eng_title = title_part.strip()
                
            slug = slugify(eng_title)
            chap_str = f"{chap_num:02d}"
            
            if arc_num == "Epilogue":
                src_file = f"EPILOGUE_{chap_num}.md"
                target_file = f"ch_{chap_str}_{slug}.md"
                mapping[src_file] = os.path.join("english_localization", folder, target_file)
            else:
                # Arcs 1 to 5 chapters have Part 1 and Part 2
                src_part1 = f"ARC_{arc_num}_{chap_num}-1.md"
                src_part2 = f"ARC_{arc_num}_{chap_num}-2.md"
                
                target_part1 = f"ch_{chap_str}_{slug}_part_1.md"
                target_part2 = f"ch_{chap_str}_{slug}_part_2.md"
                
                mapping[src_part1] = os.path.join("english_localization", folder, target_part1)
                mapping[src_part2] = os.path.join("english_localization", folder, target_part2)

mapping_path = os.path.join(root_dir, "english_localization", "system_documents", "chapter_mapping.json")
with open(mapping_path, "w", encoding="utf-8") as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)

print(f"Successfully generated mapping for {len(mapping)} files at {mapping_path}")
print(list(mapping.items())[:5])
