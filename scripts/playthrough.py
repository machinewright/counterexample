# Wins all levels (with the smallest answers) at 1100 and 360px and checks for console errors.
# Needs the local server: python3 -m http.server 8781 --bind 127.0.0.1 (from the repo root).
import sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8781/'
def meetings(pg, ms):
    for s, e in ms:
        pg.select_option('#as', str(s)); pg.select_option('#ae', str(e)); pg.click('#add button[type=submit]')
def typed(pg, v): pg.fill('#seq', v); pg.dispatch_event('#seq', 'input')
def num(pg, sel, v): pg.fill(sel, str(v)); pg.dispatch_event(sel, 'input')
def clicks(pg, order):
    for v in order: pg.locator('svg.graph .v').nth(v).click()
def weights(pg, label, k):
    for _ in range(k): pg.click(f'button[aria-label="Lower {label}"]')
STEPS = [
    lambda pg: num(pg, '#amt', 6),
    lambda pg: clicks(pg, [0, 3, 1, 2]),
    lambda pg: meetings(pg, [(0, 4), (4, 8), (3, 5)]),
    lambda pg: (num(pg, '#nc', 4), num(pg, '#amt', 8)),
    lambda pg: meetings(pg, [(1, 4), (0, 5), (3, 5), (4, 6)]),
    lambda pg: typed(pg, 'abacda'),
    lambda pg: weights(pg, 'B→A', 4),
    lambda pg: clicks(pg, [0, 4, 1, 5, 2, 6, 3, 7]),
    lambda pg: weights(pg, 'A→B', 4),
    lambda pg: [pg.locator('svg.tour .pt').nth(y * 6 + x).click() for x, y in [(3, 4), (0, 0), (3, 2), (1, 4), (5, 4)]],
    lambda pg: [num(pg, k, v) for k, v in [('#vACB', 6), ('#vBCA', 6), ('#vCAB', 3), ('#vCBA', 2), ('#mBCA', 2)]],
    lambda pg: typed(pg, 'abcdabeabcde'),
    lambda pg: meetings(pg, [[0, 2], [1, 2], [0, 3], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7], [5, 8]]),
]
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (1100, 360):
        errs = []
        pg = b.new_page(viewport={'width': w, 'height': 900})
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
        for i, step in enumerate(STEPS):
            pg.locator('#levels button').nth(i).click(); step(pg)
            v = pg.inner_text('#verdict')
            ok = 'Claim broken' in v
            if not ok: bad += 1
            print(w, i + 1, 'OK' if ok else 'NOT BROKEN', '★★' if '★★' in v else '')
        pg.locator('#levels button').nth(10).click(); [num(pg, k, v) for k, v in [('#vACB', 6), ('#vBCA', 6), ('#vCAB', 3), ('#vCBA', 2), ('#mBCA', 2)]]; pg.screenshot(path=f'/home/claude/work/tmp/ce-runoff-{w}.png', full_page=True)
        print(w, 'errors', errs); bad += len(errs)
sys.exit(1 if bad else 0)
