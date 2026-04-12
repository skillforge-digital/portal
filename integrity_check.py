import os
import re
from pathlib import Path

def check_portal_integrity():
    root_dir = Path(os.getcwd())
    html_files = list(root_dir.rglob("*.html"))
    js_files = list(root_dir.rglob("*.js"))
    
    # Files to exclude from deep link check (e.g. documentation or huge site folders)
    exclude_dirs = ["skill forge site", "node_modules", ".git"]
    
    print(f"--- SkillForge Integrity Scan ---")
    print(f"Scanning {len(html_files)} HTML files and {len(js_files)} JS files...")
    print(f"Excluding directories: {', '.join(exclude_dirs)}\n")

    broken_links = []
    firebase_version_mismatch = []
    placeholders_found = []
    
    # Patterns for links and assets
    patterns = {
        'href': r'href=["\'](?!http|#|mailto|tel|https)(.*?)["\']',
        'src': r'src=["\'](?!http|https)(.*?)["\']',
        'js_import': r'from\s+["\'](?!http|https)(.*?)["\']',
        'js_fetch': r'fetch\(["\'](?!http|https)(.*?)["\']'
    }

    # Firebase version pattern
    firebase_pattern = r'firebasejs/(\d+\.\d+\.\d+)/'

    for file_path in html_files + js_files:
        if any(excl in str(file_path) for excl in exclude_dirs): continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for mismatched script tags
                if file_path.suffix == '.html':
                    script_opens = content.count('<script')
                    script_closes = content.count('</script>')
                    if script_opens != script_closes:
                        print(f"  [!] {file_path.relative_to(root_dir)}: Mismatched script tags ({script_opens} vs {script_closes})")

                # Check Firebase versions
                fb_matches = re.findall(firebase_pattern, content)
                if fb_matches:
                    versions = set(fb_matches)
                    if len(versions) > 1:
                        firebase_version_mismatch.append({
                            'file': str(file_path.relative_to(root_dir)),
                            'versions': list(versions)
                        })

                # Check for broken links/assets
                for key, pattern in patterns.items():
                    matches = re.findall(pattern, content)
                    for match in matches:
                        clean_path = match.split('?')[0].split('#')[0]
                        if not clean_path or clean_path.startswith('data:') or clean_path.startswith('//'): continue
                        
                        # Handle relative vs absolute-like paths in our MPA
                        if clean_path.startswith('/'):
                            target_path = (root_dir / clean_path.lstrip('/')).resolve()
                        else:
                            target_path = (file_path.parent / clean_path).resolve()
                        
                        if not target_path.exists():
                            broken_links.append({
                                'file': str(file_path.relative_to(root_dir)),
                                'target': clean_path,
                                'type': key
                            })
                
                # Check for placeholders
                if "https://via.placeholder.com" in content or "placeholder" in content.lower():
                    if "placeholder" in content.lower() and file_path.suffix == '.html':
                        # Only report if it looks like a real placeholder in the UI
                        if re.search(r'>[^<]*placeholder[^<]*<', content, re.I):
                            placeholders_found.append(str(file_path.relative_to(root_dir)))

        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    # Report results
    if broken_links:
        print(f"\n❌ FOUND {len(broken_links)} BROKEN LINKS/ASSETS:")
        for link in broken_links:
            print(f"  [!] {link['file']} -> Missing: {link['target']} (Type: {link['type']})")
    
    if firebase_version_mismatch:
        print(f"\n⚠️ FIREBASE VERSION MISMATCH:")
        for mismatch in firebase_version_mismatch:
            print(f"  [!] {mismatch['file']} uses multiple versions: {mismatch['versions']}")

    if placeholders_found:
        print(f"\n📝 PLACEHOLDERS/TODOs FOUND IN:")
        for p in sorted(set(placeholders_found)):
            print(f"  [i] {p}")

    if not broken_links and not firebase_version_mismatch:
        print("\n✅ Portal Core Integrity looks solid!")

if __name__ == "__main__":
    check_portal_integrity()

