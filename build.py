#!/usr/bin/env python3
"""
EcoBIM Site Builder
Reads content/site.json and updates index.html in place.

Usage:
    python build.py
"""

import json
import re
import html
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).parent
SITE_JSON = ROOT / 'content' / 'site.json'
INDEX = ROOT / 'index.html'


def load_content():
    with open(SITE_JSON, encoding='utf-8') as f:
        return json.load(f)


def url_encode_path(path):
    return '/'.join(quote(p) for p in path.replace('\\', '/').split('/'))


def esc(text):
    return html.escape(text, quote=True)


# ── Section generators ──────────────────────────────────────

def gen_services(items):
    lines = []
    for i, name in enumerate(items):
        num = f'{i + 1:02d}'
        lines.append(
            f'    <a href="#contact" class="solutions__item">\n'
            f'      <span class="solutions__num">{num}</span>\n'
            f'      <span class="solutions__name">{esc(name)}</span>\n'
            f'      <span class="solutions__arrow">↗</span>\n'
            f'    </a>'
        )
    return '\n'.join(lines)


def gen_process(steps, total):
    lines = []
    for i, step in enumerate(steps):
        num = f'{i + 1:02d} / {total:02d}'
        lines.append(
            f'    <div class="process__step">\n'
            f'      <span class="process__num">{num}</span>\n'
            f'      <h3 class="process__title">{esc(step["title"])}</h3>\n'
            f'      <p class="process__desc">{esc(step["description"])}</p>\n'
            f'    </div>'
        )
    return '\n'.join(lines)


def gen_stats(items):
    lines = []
    for i, stat in enumerate(items):
        delay = f' style="transition-delay:.{i}s"' if i > 0 else ''
        if stat.get('auto'):
            auto_type = stat['auto']
            lines.append(
                f'      <div class="stat__item"{delay}>\n'
                f'        <span class="stat__val" data-auto="{esc(auto_type)}">—</span>\n'
                f'        <span class="stat__label">{esc(stat["label"])}</span>\n'
                f'      </div>'
            )
        else:
            display = stat.get('display', stat['value'] + stat.get('suffix', ''))
            prefix = stat.get('prefix', '')
            prefix_attr = f' data-prefix="{esc(prefix)}"' if prefix else ''
            lines.append(
                f'      <div class="stat__item"{delay}>\n'
                f'        <span class="stat__val" data-count="{esc(stat["value"])}"{prefix_attr} data-suffix="{esc(stat["suffix"])}">{esc(display)}</span>\n'
                f'        <span class="stat__label">{esc(stat["label"])}</span>\n'
                f'      </div>'
            )
    return '\n'.join(lines)


def gen_projects(items):
    lines = []
    for i, proj in enumerate(items):
        delay = f' data-delay="{i}"' if i > 0 else ''
        enc_img = url_encode_path(proj['image'])
        lines.append(
            f'    <div class="project__item cross-image reveal"{delay} data-project="{esc(proj["name"])}" data-tag="{esc(proj["tag"])}">\n'
            f'      <img src="{enc_img}" alt="{esc(proj["alt"])}" loading="lazy"/>\n'
            f'      <img src="{enc_img}" alt="" class="cross-image__img" aria-hidden="true" loading="lazy"/>\n'
            f'      <div class="cross-image__lines">\n'
            f'        <div class="cross-image__v"></div>\n'
            f'        <div class="cross-image__h"></div>\n'
            f'      </div>\n'
            f'      <span class="cross-image__label"></span>\n'
            f'      <div class="project__info">\n'
            f'        <div class="project__meta">\n'
            f'          <span class="project__name">{esc(proj["name"])}</span>\n'
            f'          <span class="project__tag">{esc(proj["tag"])}</span>\n'
            f'        </div>\n'
            f'      </div>\n'
            f'    </div>'
        )
    return '\n'.join(lines)


def gen_tools(items):
    lines = []
    for i, tool in enumerate(items):
        delay = f' data-delay="{i}"' if 0 < i < 5 else ''
        exts = ' '.join(f'<span class="tool-ext">{esc(e)}</span>' for e in tool['ext'].split())
        lines.append(
            f'        <div class="tool-row reveal"{delay}><span>{esc(tool["name"])} {exts}</span><span class="tool-cat">{esc(tool["category"])}</span></div>'
        )
    return '\n'.join(lines)


def gen_standards(items):
    lines = []
    for std in items:
        lines.append(
            f'        <div class="std__item">\n'
            f'          <span class="std__tag">{esc(std["tag"])}</span>\n'
            f'          <p class="std__desc">{esc(std["description"])}</p>\n'
            f'        </div>'
        )
    return '\n'.join(lines)


def gen_faq(items):
    lines = []
    for faq in items:
        lines.append(
            f'      <div class="toggle__item">\n'
            f'        <div class="toggle__header" role="button" tabindex="0" aria-expanded="false">\n'
            f'          <span class="toggle__header__title title">{esc(faq["question"])}</span>\n'
            f'          <span class="plus__icon" aria-hidden="true"></span>\n'
            f'        </div>\n'
            f'        <div class="toggle__content">\n'
            f'          <p class="toggle__body">{esc(faq["answer"])}</p>\n'
            f'        </div>\n'
            f'      </div>'
        )
    return '\n'.join(lines)


# ── CMS block replacer ──────────────────────────────────────

def replace_block(page_html, block_name, new_content):
    pattern = re.compile(
        rf'(<!-- CMS:{re.escape(block_name)} -->).*?(<!-- /CMS:{re.escape(block_name)} -->)',
        re.DOTALL
    )
    replacement = rf'\1\n{new_content}\n    \2'
    result, count = pattern.subn(replacement, page_html)
    if count == 0:
        print(f'  WARNING: CMS block "{block_name}" not found in index.html')
    return result


# ── Main build ──────────────────────────────────────────────

def build():
    data = load_content()

    with open(INDEX, encoding='utf-8') as f:
        page = f.read()

    # Replace CMS blocks
    page = replace_block(page, 'services',  gen_services(data['services']['items']))
    page = replace_block(page, 'process',   gen_process(data['process']['steps'], data['process']['total']))
    page = replace_block(page, 'stats',     gen_stats(data['stats_section']['items']))
    page = replace_block(page, 'projects',  gen_projects(data['projects']['items']))
    page = replace_block(page, 'tools',     gen_tools(data['tools']))
    page = replace_block(page, 'standards', gen_standards(data['standards']))
    page = replace_block(page, 'faq',       gen_faq(data['faq']))

    # Replace Google Sheet URL
    page = re.sub(
        r"var GOOGLE_SHEET_URL = '.*?';",
        f"var GOOGLE_SHEET_URL = '{data.get('google_sheet_url', '')}';",
        page
    )

    # Inject auto-calculate constants
    ac = data.get('auto_calculate', {})
    page = re.sub(r'var SQFT = \d+;', f'var SQFT = {ac.get("sqft_value", 459000)};', page)
    page = re.sub(r'var CLASHES_PER_1K = \d+;', f'var CLASHES_PER_1K = {ac.get("clashes_per_1000_sqft", 25)};', page)


    with open(INDEX, 'w', encoding='utf-8') as f:
        f.write(page)

    print('Built index.html from content/site.json')
    print(f'  Services:  {len(data["services"]["items"])} items')
    print(f'  Process:   {len(data["process"]["steps"])} steps')
    print(f'  Stats:     {len(data["stats_section"]["items"])} items')
    print(f'  Projects:  {len(data["projects"]["items"])} cards')
    print(f'  Tools:     {len(data["tools"])} items')
    print(f'  Standards: {len(data["standards"])} items')
    print(f'  FAQ:       {len(data["faq"])} items')


if __name__ == '__main__':
    build()
