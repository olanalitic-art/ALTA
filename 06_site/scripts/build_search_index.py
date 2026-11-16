"""Собирает поисковый индекс витрины: assets/search-index.js.

Запуск из корня репозитория:  python3 06_site/scripts/build_search_index.py
Источники: страницы components/*/preview.html, разделы главной страницы
(IDE, CFC, Code Editor) и ручной список синонимов search-synonyms.json.
"""
import hashlib, html, json, os, re, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(SITE)
LIBS = {'components': 'IDE', 'cfc': 'CFC', 'code': 'Code Editor'}


def text(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


def library_by_slug():
    page = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'<section class="catalog-section[^"]*" id="(\w+)"(.*?)</section>', page, re.S):
        lib = LIBS.get(m.group(1))
        if lib:
            for slug in re.findall(r'href="components/([^/"]+)/preview\.html"', m.group(2)):
                out.setdefault(slug, lib)
    return out


def main_part(page):
    """Содержимое страницы без левого меню (в нём ссылки на все компоненты)."""
    i = page.find('<div class="breadcrumb">')
    return page[i:] if i >= 0 else page


def component(slug, lib, synonyms):
    page = main_part(open(os.path.join(SITE, 'components', slug, 'preview.html'), encoding='utf-8').read())
    title = text(re.search(r'<h1>(.*?)</h1>', page, re.S).group(1))
    intro = re.search(r'<p class="intro">(.*?)</p>', page, re.S)
    code = re.search(r'class="source-link" href="https://github\.com/[^"]*/02_components/[^/]+/([^/"]+)"', page)
    figma = re.search(r'class="source-link" href="https://www\.figma\.com/design/([^/]+)/[^"]*node-id=([0-9]+)-([0-9]+)', page)
    parts = set(re.findall(r'data-part="([^"]+)"', page))
    figma_names = []
    if code:
        for lib_dir in ('ide', 'cfc', 'code-editor'):
            readme = os.path.join(REPO, '02_components', lib_dir, code.group(1), 'README.md')
            if os.path.exists(readme):
                src = re.search(r'Источник:\s*\[([^\],]+)', open(readme, encoding='utf-8').read())
                if src:
                    figma_names = [src.group(1).strip()]
    icons = sorted({p.split('/Icons/', 1)[1] for p in parts if '/Icons/' in p})
    tokens = sorted({t for t in re.findall(r'<code>([^<]+)</code>', page) if '/' in t and ' ' not in t.strip('/')})
    colors = sorted({c.lower() for c in re.findall(r'title="(#[0-9a-fA-F]{6})"', page)})
    return {
        'slug': slug,
        'url': 'components/%s/preview.html' % slug,
        'title': title,
        'intro': text(intro.group(1)) if intro else '',
        'lib': lib,
        'code': code.group(1) if code else '',
        'figma': figma_names,
        'node': '%s:%s' % (figma.group(2), figma.group(3)) if figma else '',
        'file': figma.group(1) if figma else '',
        'synonyms': synonyms.get(slug, []),
        'icons': icons,
        'tokens': tokens,
        'colors': colors,
    }


def md5(path):
    return hashlib.md5(open(path, 'rb').read()).hexdigest()


def icons(components):
    """Иконки со страницы «Иконки» и компоненты, в которых они встречаются.
    Связь ищется двумя способами: по имени части в разметке (AltaIDE/Icons/...)
    и по совпадающему SVG-файлу."""
    page = open(os.path.join(SITE, 'foundations', 'icons', 'index.html'), encoding='utf-8').read()
    tiles = re.findall(r'<div class="icon-tile" data-name="[^"]*" title="AltaIDE/Icons/([^"]+)">(.*?)<div class="nm">([^<]+)</div>', page, re.S)
    svg_owner = {}
    for path, body, name in tiles:
        src = re.search(r'src="\.\./\.\./([^"]+\.svg)"', body)
        if src and os.path.exists(os.path.join(SITE, src.group(1))):
            svg_owner.setdefault(md5(os.path.join(SITE, src.group(1))), path)
    by_svg = {}
    for c in components:
        folder = os.path.join(SITE, 'components', c['slug'])
        page_c = open(os.path.join(folder, 'preview.html'), encoding='utf-8').read()
        for src in set(re.findall(r'src="([^"]+\.svg)"', page_c)):
            f = os.path.normpath(os.path.join(folder, src))
            if os.path.exists(f) and md5(f) in svg_owner:
                by_svg.setdefault(svg_owner[md5(f)], set()).add(c['slug'])
    out = []
    for path, body, name in tiles:
        key = path.split(' · ')[0].lower()
        used = {c['slug'] for c in components if any(i.lower() == key or key.endswith('/' + i.lower()) for i in c['icons'])}
        used |= by_svg.get(path, set())
        out.append({'name': html.unescape(name).strip(), 'path': html.unescape(path), 'used': sorted(used)})
    for c in components:
        c['icons'] = sorted(set(c['icons']) | {i['name'] for i in out if c['slug'] in i['used']})
    return out


def main():
    libs = library_by_slug()
    syn_path = os.path.join(SITE, 'search-synonyms.json')
    synonyms = json.load(open(syn_path, encoding='utf-8')) if os.path.exists(syn_path) else {}
    items = []
    for slug in sorted(os.listdir(os.path.join(SITE, 'components'))):
        if os.path.exists(os.path.join(SITE, 'components', slug, 'preview.html')):
            items.append(component(slug, libs.get(slug, 'IDE'), synonyms))
    icon_list = icons(items)
    missing = [i['slug'] for i in items if not i['synonyms']]
    out = os.path.join(SITE, 'assets', 'search-index.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* Сгенерировано scripts/build_search_index.py. Вручную не править. */\n')
        f.write('window.ALTA_SEARCH_INDEX=')
        json.dump({'components': items, 'icons': icon_list}, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print('компонентов: %d, без синонимов: %d, размер: %d КБ' % (len(items), len(missing), os.path.getsize(out) // 1024))
    if '--list' in sys.argv:
        for i in items:
            print('%s|%s|%s|%s' % (i['slug'], i['title'], i['lib'], i['intro'][:70]))


main()
