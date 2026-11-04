"""Gasto dividido: com a família ou com outra pessoa."""
import asyncio, json, pathlib, subprocess, sys, time, urllib.request
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'test' / 'shots'; SHOTS.mkdir(exist_ok=True)
errors, checks = [], []
def ok(c, m):
    checks.append(('OK ' if c else 'FALHOU ') + m)
    if not c: errors.append(m)
async def main():
    gas = subprocess.Popen(['node', str(ROOT / 'test/gas-sim.js'), '8787'], stdout=subprocess.DEVNULL)
    web = subprocess.Popen([sys.executable, '-m', 'http.server', '8090', '--bind', '127.0.0.1'], cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx = await b.new_context(viewport={'width': 412, 'height': 915}, locale='pt-BR', timezone_id='America/Sao_Paulo', device_scale_factor=2)
            pg = await ctx.new_page(); logs = []
            pg.on('pageerror', lambda e: logs.append(str(e)))
            await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
            await pg.clock.set_fixed_time('2026-11-05T12:00:00-03:00')
            await pg.goto('http://127.0.0.1:8090/index.html'); await pg.wait_for_timeout(300)
            await pg.fill('#cUrl', 'http://localhost:8787/exec'); await pg.fill('#cKey', 'chave-de-teste-1234567890'); await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(900)
            # 1) jantar dividido por 2 com outra pessoa (Ana)
            await pg.fill('#quickIn', 'restaurante 200 pix dividido por 2'); await pg.click('.quick button[type=submit]'); await pg.wait_for_timeout(300)
            await pg.click('[data-act=quick-edit]'); await pg.wait_for_timeout(300)
            sh = await pg.inner_text('#sheet')
            ok('Dividido com' in sh, 'formulário pergunta com quem foi dividido')
            ok(await pg.get_attribute('[data-act=l-divcom][data-v=outros]', 'aria-pressed') == 'true', 'sem espólio, o padrão é "outra pessoa"')
            await pg.fill('#fDivNome', 'Ana'); await pg.dispatch_event('#fDivNome', 'input')
            await pg.screenshot(path=str(SHOTS / 'dividido-form.png'))
            await pg.click('[data-act=l-save]:not([data-more])'); await pg.wait_for_timeout(900)
            # 2) presente dividido por 3 com a família
            await pg.fill('#quickIn', 'presente 300 pix dividido por 3'); await pg.click('.quick button[type=submit]'); await pg.wait_for_timeout(300)
            await pg.click('[data-act=quick-edit]'); await pg.wait_for_timeout(300)
            await pg.click('[data-act=l-divcom][data-v=familia]'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=l-save]:not([data-more])'); await pg.wait_for_timeout(1200)
            body = await pg.inner_text('main')
            ok('família R$ 200,00' in body and 'outras pessoas R$ 100,00' in body, 'início separa: família R$ 200,00 · outras pessoas R$ 100,00')
            await pg.click('[data-act=sub][data-sub=receber]'); await pg.wait_for_timeout(300)
            t = await pg.inner_text('main')
            ok('Da família' in t and 'De outras pessoas' in t and 'Ana' in t, 'A receber separa família e outras pessoas, com o nome')
            await pg.screenshot(path=str(SHOTS / 'dividido-receber.png'), full_page=True)
            st = json.loads(urllib.request.urlopen('http://localhost:8787/__estado').read())
            h = st['Lançamentos'][0]; ex = [r[h.index('extras')] for r in st['Lançamentos'][1:]]
            ok(any('"divNome":"Ana"' in str(e) for e in ex) and any('"divCom":"familia"' in str(e) for e in ex), 'planilha guarda com quem foi dividido')
            await pg.reload(); await pg.wait_for_timeout(1200)
            await pg.click('[data-tab=lancamentos]'); await pg.wait_for_timeout(300)
            t = await pg.inner_text('main')
            ok('÷2 Ana' in t and '÷3 família' in t, 'lista mostra ÷2 Ana e ÷3 família depois de recarregar')
            for l in logs: errors.append('pageerror ' + l)
            await b.close()
    finally:
        gas.terminate(); web.terminate()
asyncio.run(main())
print('\n'.join(checks)); print('\nFALHAS:' if errors else '\nTUDO CERTO', *errors, sep='\n')
sys.exit(1 if errors else 0)
