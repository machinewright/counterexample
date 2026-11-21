# Renders og.png (1200x630), itch/cover.png (630x500) and itch/shot1-3.png. Inputs shown are never a level's
# smallest answer (no spoilers). Needs the local server: python3 -m http.server 8781 --bind 127.0.0.1 (repo root).
import asyncio, base64
from playwright.async_api import async_playwright
URL = 'http://127.0.0.1:8781/'
def b64(path): return base64.b64encode(open(path, 'rb').read()).decode()
FONTS = f'''<style>
  @font-face {{ font-family: S; font-weight: 200 900; src: url(data:font/woff2;base64,{b64('fonts/source-serif-4-latin-opsz-normal.woff2')}) format("woff2"); }}
  @font-face {{ font-family: I; font-weight: 100 900; src: url(data:font/woff2;base64,{b64('fonts/inter-latin-wght-normal.woff2')}) format("woff2"); }}
  </style>'''
def idx(levels_js, lid):
    import re
    return re.findall(r"id: '([a-z]+)'", levels_js).index(lid)
async def level(pg, lid):
    await pg.locator('#levels button').nth(idx(open('src/levels.js').read(), lid)).click()
async def num(pg, sel, v): await pg.fill(sel, str(v)); await pg.dispatch_event(sel, 'input')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1100, 'height': 1000}, device_scale_factor=2)
        pg = await ctx.new_page()
        await pg.goto(URL); await pg.evaluate('localStorage.clear()'); await pg.reload()
        # Bélády trace on a list that is not a counterexample
        await level(pg, 'belady')
        await pg.fill('#seq', 'ABCDEBACE'); await pg.dispatch_event('#seq', 'input'); await pg.locator('#seq').blur(); await pg.wait_for_timeout(200)
        fifo = await pg.locator('#stage').screenshot()
        card = await b.new_page(viewport={'width': 1200, 'height': 630})
        await card.set_content(FONTS + f'''<body style="margin:0;width:1200px;height:630px;background:#fbf9f4;display:flex;align-items:center">
          <div style="width:500px;padding:0 30px 0 64px;color:#1f2430;flex:none">
            <div style="font:650 66px/1.05 S;letter-spacing:-1.5px">Counterexample</div>
            <div style="font:400 29px/1.4 S;color:#3d4452;margin-top:22px">Each level makes a claim about a famous algorithm. Build the input that proves it wrong.</div>
            <div style="font:500 20px/1.4 I;color:#646b78;margin-top:28px">A puzzle game in the browser · Machinewright</div>
          </div>
          <img src="data:image/png;base64,{base64.b64encode(fifo).decode()}" style="width:580px;margin-right:44px;border-radius:12px;box-shadow:0 12px 30px -12px rgba(20,24,33,.45)">
        </body>''')
        await card.wait_for_timeout(300); await card.screenshot(path='og.png')
        cover = await b.new_page(viewport={'width': 630, 'height': 500})
        await cover.set_content(FONTS + f'''<body style="margin:0;width:630px;height:500px;background:#fbf9f4;overflow:hidden;color:#1f2430">
          <div style="padding:40px 44px 0">
            <div style="font:650 56px/1.05 S;letter-spacing:-1.2px">Counterexample</div>
            <div style="font:400 23px/1.35 S;color:#3d4452;margin-top:14px">The claim sounds right. Build the input that proves it wrong.</div>
          </div>
          <img src="data:image/png;base64,{base64.b64encode(fifo).decode()}" style="position:absolute;left:45px;top:190px;width:540px;border-radius:12px;box-shadow:0 12px 30px -12px rgba(20,24,33,.45)">
        </body>''')
        await cover.wait_for_timeout(300); await cover.screenshot(path='itch/cover.png')
        # Screenshots: whole level panel, 1100 wide page
        await level(pg, 'seats')
        for k, v in [('#p0', 3), ('#p1', 5), ('#p2', 15), ('#h', 11)]: await num(pg, k, v)
        await pg.locator('#stage').screenshot(path='itch/shot1-seats.png')
        await level(pg, 'dijkstra')
        await pg.locator('#stage').screenshot(path='itch/shot2-dijkstra.png')
        await level(pg, 'tour')
        for x, y in [(3, 4), (0, 0), (2, 1), (1, 4), (5, 4)]: await pg.locator('svg.tour .pt').nth(y * 6 + x).click()
        await pg.locator('#stage').screenshot(path='itch/shot3-tour.png')
asyncio.run(main())
