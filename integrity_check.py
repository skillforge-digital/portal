import os
import re
from pathlib import Path

def check_portal_integrity():
    root_dir = Path(os.getcwd())
    html_files = list(root_dir.rglob("*.html"))
    js_files = list(root_dir.rglob("*.js"))
    
    print(f"--- SkillForge Integrity Scan ---")
    print(f"Scanning {len(html_files)} HTML files and {len(js_files)} JS files...\n")

    broken_links = []
    
    # Patterns for links and assets
    patterns = {
        'href': r'href=["\'](?!http|#|mailto|tel|https)(.*?)["\']',
        'src': r'src=["\'](?!http|https)(.*?)["\']',
        'js_import': r'from\s+["\'](?!http|https)(.*?)["\']',
        'js_fetch': r'fetch\(["\'](?!http|https)(.*?)["\']'
    }

    for file_path in html_files + js_files:
        if "node_modules" in str(file_path): continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                if file_path.suffix == '.html':
                    script_opens = content.count('<script')
                    script_closes = content.count('</script>')
                    if script_opens != script_closes:
                        print(f"  [!] {file_path.relative_to(root_dir)}: Mismatched script tags ({script_opens} vs {script_closes})")

                for key, pattern in patterns.items():
                    matches = re.findall(pattern, content)
                    for match in matches:
                        clean_path = match.split('?')[0].split('#')[0]
                        if not clean_path or clean_path.startswith('data:'): continue
                        
                        target_path = (file_path.parent / clean_path).resolve()
                        
                        if not target_path.exists():
                            root_relative = (root_dir / clean_path.lstrip('/')).resolve()
                            if not root_relative.exists():
                                # Check if it might be in a sibling directory (e.g. from trainee-dashboard/dmc/ to assets/)
                                # The above resolve() should handle this if the path is "../../assets/..."
                                # Let's also check if the path is relative to the root but missing the leading slash
                                root_relative_alt = (root_dir / clean_path).resolve()
                                
                                if not target_path.is_dir() and not root_relative.is_dir() and not root_relative_alt.exists():
                                    broken_links.append({
                                        'file': str(file_path.relative_to(root_dir)),
                                        'target': clean_path,
                                        'type': key
                                    })
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    if broken_links:
        print(f"\nFOUND {len(broken_links)} BROKEN LINKS/ASSETS:")
        for link in broken_links:
            print(f"  [!] {link['file']} -> Missing: {link['target']} (Type: {link['type']})")
    else:
        print("\n✅ No local broken links or missing assets found!")

    placeholder_patterns = [
        r'https://via\.placeholder\.com',
    ]
    
    print("\n--- Placeholder Check ---")
    for file_path in html_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for pattern in placeholder_patterns:
                if re.search(pattern, content):
                    print(f"  [i] {file_path.relative_to(root_dir)} contains placeholder: {pattern}")

if __name__ == "__main__":
    check_portal_integrity()
