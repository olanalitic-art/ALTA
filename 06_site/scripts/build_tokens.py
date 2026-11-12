"""Generate CSS from the local canonical token registry. No dependencies."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'tokens/tokens.json').read_text())
for theme, values in data['themes'].items():
    merged = {**data['constants'], **values, **data['aliases']}
    def resolve(key, trail=()):
        if key in trail:
            raise ValueError(f'Circular token: {trail + (key,)}')
        if key not in merged:
            raise ValueError(f'Missing token: {key}')
        for ref in re.findall(r'var\((--[\w-]+)\)', merged[key]):
            resolve(ref, trail + (key,))
    for key in merged:
        resolve(key)

def block(selector, values):
    return selector + ' {\n' + ''.join(f'  {k}: {v};\n' for k, v in values.items()) + '}\n'

css = '/* Generated from tokens/tokens.json. Edit JSON, then run scripts/build_tokens.py. */\n'
css += block(':root', {**data['constants'], **data['aliases']})
css += block(':root, :root[data-theme="light"]', data['themes']['light'])
css += block(':root[data-theme="dark"]', data['themes']['dark'])
(ROOT / 'assets/tokens.css').write_text(css)
print('Token references: OK; generated assets/tokens.css; version', data['version'])
