#!/usr/bin/env python3
"""
Mintlify Link Checker
Validates internal links in .mdx files that use Mintlify's format (/path/to/page)
Now with redirect support, trailing slash handling, and image file support!
"""

import re
import json
from pathlib import Path
from collections import defaultdict

class MintlifyLinkChecker:
    def __init__(self, docs_root):
        self.docs_root = Path(docs_root)
        self.errors = defaultdict(list)
        
        # Load redirects from docs.json
        self.redirects = self._load_redirects()
        
        # Build a map of all valid paths (mdx and static files)
        self.valid_paths = self._build_path_map()
        
    def _load_redirects(self):
        """Load redirects from docs.json"""
        docs_json_path = self.docs_root / 'docs.json'
        redirects = {}
        
        try:
            with open(docs_json_path, 'r', encoding='utf-8') as f:
                docs_config = json.load(f)
                
            for redirect in docs_config.get('redirects', []):
                source = redirect['source']
                destination = redirect['destination']
                redirects[source] = destination
                
        except Exception as e:
            print(f"⚠️  Warning: Could not load redirects from docs.json: {e}")
            
        return redirects
    
    def _resolve_redirect(self, path):
        """Resolve a path through redirects, handling wildcards"""
        # First try exact match
        if path in self.redirects:
            return self.redirects[path]
        
        # Try wildcard redirects (e.g., /experiments-plus/:slug* -> /experiments/:slug*)
        for source, destination in self.redirects.items():
            if ':slug*' in source:
                # Convert wildcard pattern to regex
                pattern = source.replace(':slug*', '(.+)')
                pattern = f"^{pattern}$"
                match = re.match(pattern, path)
                
                if match:
                    # Replace :slug* in destination with captured group
                    captured = match.group(1)
                    resolved = destination.replace(':slug*', captured)
                    return resolved
        
        return None
    
    def _build_path_map(self):
        """Create a mapping of URL paths to actual file paths"""
        path_map = {}
        
        # Add .mdx files
        for mdx_file in self.docs_root.rglob('*.mdx'):
            rel_path = mdx_file.relative_to(self.docs_root)
            # Convert to Mintlify URL format (remove .mdx, add leading /)
            url_path = '/' + str(rel_path.with_suffix('')).replace('\\', '/')
            path_map[url_path] = mdx_file
        
        # Add static files (images, etc.)
        static_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4', '.pdf', '.json', '.csv']
        for ext in static_extensions:
            for static_file in self.docs_root.rglob(f'*{ext}'):
                rel_path = static_file.relative_to(self.docs_root)
                # Keep the extension for static files
                url_path = '/' + str(rel_path).replace('\\', '/')
                path_map[url_path] = static_file
            
        return path_map
    
    def _extract_internal_links(self, content):
        """Extract all internal links (those starting with /)"""
        # Match [text](/path) or [text](/path#anchor)
        pattern = r'\[([^\]]+)\]\((/[^)]+)\)'
        matches = re.findall(pattern, content)
        
        links = []
        for text, url in matches:
            # Skip external URLs that happen to start with /
            if url.startswith('//'):
                continue
            links.append((text, url))
            
        return links
    
    def _normalize_path(self, path):
        """Normalize a path by removing trailing slashes"""
        # Remove trailing slash (but keep root /)
        if path != '/' and path.endswith('/'):
            path = path.rstrip('/')
        return path
    
    def check_file(self, file_path):
        """Check all links in a single file"""
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            self.errors[file_path].append(f"Error reading file: {e}")
            return
        
        links = self._extract_internal_links(content)
        
        for text, url in links:
            # Skip console-api URLs
            if 'console-api' in url:
                continue
            
            # Split anchor from path
            if '#' in url:
                path, anchor = url.split('#', 1)
            else:
                path = url
                anchor = None
            
            # Normalize path (remove trailing slashes)
            path = self._normalize_path(path)
            
            # Check if path exists
            if path and path not in self.valid_paths:
                # Try to resolve through redirects
                redirected_path = self._resolve_redirect(path)
                
                if redirected_path:
                    # Normalize redirected path too
                    redirected_path = self._normalize_path(redirected_path)
                    # Check if redirected destination exists
                    if redirected_path not in self.valid_paths:
                        self.errors[file_path].append({
                            'text': text,
                            'url': url,
                            'issue': f'Redirect destination not found: {path} -> {redirected_path}',
                            'type': 'broken_redirect'
                        })
                else:
                    # No redirect found, path doesn't exist
                    self.errors[file_path].append({
                        'text': text,
                        'url': url,
                        'issue': f'Path not found: {path}',
                        'type': 'broken_link'
                    })
    
    def check_all(self):
        """Check all .mdx files in the docs"""
        mdx_files = list(self.docs_root.rglob('*.mdx'))
        
        # Count static files
        static_count = sum(1 for p in self.valid_paths.keys() 
                          if not any(self.valid_paths[p].suffix == '.mdx' for _ in [None]))
        mdx_count = len([p for p in self.valid_paths.keys() 
                        if self.valid_paths[p].suffix == '.mdx'])
        
        print(f"🔍 Checking {len(mdx_files)} .mdx files...")
        print(f"📝 Found {mdx_count} valid document paths")
        print(f"🖼️  Found {len(self.valid_paths) - mdx_count} static files (images, etc.)")
        print(f"🔀 Loaded {len(self.redirects)} redirects\n")
        
        for mdx_file in mdx_files:
            self.check_file(mdx_file)
        
        return self.report()
    
    def report(self):
        """Generate a report of all errors"""
        if not self.errors:
            print("✅ No broken links found!")
            return True
        
        print(f"❌ Found broken links in {len(self.errors)} file(s):\n")
        
        for file_path, errors in sorted(self.errors.items()):
            rel_path = file_path.relative_to(self.docs_root)
            print(f"📄 {rel_path}")
            
            for error in errors:
                if isinstance(error, dict):
                    print(f"   ❌ [{error['text']}]({error['url']})")
                    print(f"      {error['issue']}")
                else:
                    print(f"   ❌ {error}")
            print()
        
        return False

def main():
    docs_root = Path(__file__).parent
    checker = MintlifyLinkChecker(docs_root)
    success = checker.check_all()
    
    exit(0 if success else 1)

if __name__ == '__main__':
    main()