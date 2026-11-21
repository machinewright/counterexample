# Renders og.png (1200x630): title + the "More memory" trace on a list that is NOT a counterexample (no spoiler).
# Needs the local server: python3 -m http.server 8781 --bind 127.0.0.1 (from the repo root).
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1100, 'height': 1000}, device_scale_factor=2)
        pg = await ctx.new_page()
        await pg.goto('http://127.0.0.1:8781/'); await pg.evaluate('localStorage.clear()'); await pg.reload()
        await pg.locator('#levels button').nth(10).click()
        await pg.fill('#seq', 'ABCDEBACE'); await pg.dispatch_event('#seq', 'input'); await pg.locator('#seq').blur(); await pg.wait_for_timeout(200)
        png = await pg.locator('#stage').screenshot()
        card = await b.new_page(viewport={'width': 1200, 'height': 630})
        serif = base64.b64encode(open('fonts/source-serif-4-latin-opsz-normal.woff2', 'rb').read()).decode()
        sans = base64.b64encode(open('fonts/inter-latin-wght-normal.woff2', 'rb').read()).decode()
        await card.set_content(f'''<style>
          @font-face {{ font-family: S; font-weight: 200 900; src: url(data:font/woff2;base64,{serif}) format("woff2"); }}
          @font-face {{ font-family: I; font-weight: 100 900; src: url(data:font/woff2;base64,{sans}) format("woff2"); }}
          </style><body style="margin:0;width:1200px;height:630px;background:#fbf9f4;display:flex;align-items:center">
          <div style="width:500px;padding:0 30px 0 64px;color:#1f2430;flex:none">
            <div style="font:650 66px/1.05 S;letter-spacing:-1.5px">Counterexample</div>
            <div style="font:400 29px/1.4 S;color:#3d4452;margin-top:22px">Each level makes a claim about a famous algorithm. Build the input that proves it wrong.</div>
            <div style="font:500 20px/1.4 I;color:#646b78;margin-top:28px">12 levels in the browser · Machinewright</div>
          </div>
          <img src="data:image/png;base64,{base64.b64encode(png).decode()}" style="width:580px;margin-right:44px;border-radius:12px;box-shadow:0 12px 30px -12px rgba(20,24,33,.45)">
        </body>''')
        await card.wait_for_timeout(300)
        await card.screenshot(path='og.png')
asyncio.run(main())
