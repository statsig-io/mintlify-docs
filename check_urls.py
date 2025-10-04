import csv
import requests
import re

rows = list(csv.DictReader(open('old_docs_urls.csv')))
for row in rows:
    path = row['cleaned_url'].replace('docs.statsig.com', '')
    if not path.startswith('/'):
        path = '/' + path
    try:
        r = requests.get(f'https://statsig-4b2ff144.mintlify.app/{path}', timeout=2)

        # Extract title and check if it's a 404 page
        title_match = re.search(r'<title>(.*?)</title>', r.text, re.IGNORECASE)
        title = title_match.group(1).lower() if title_match else ''
        row['exists in mint docs'] = 'page not found' not in title
    except:
        row['exists in mint docs'] = False

with open('old_docs_urls.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, ['f0_', 'cleaned_url', 'exists in mint docs'])
    w.writeheader()
    w.writerows(rows)
