"""Teste da trava com a digital (WebAuthn) usando um leitor biométrico virtual do Chromium."""
import asyncio, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAS, KEY = 'http://localhost:8787/exec', 'chave-de-teste-1234567890'
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
            ctx = await b.new_context(viewport={'width': 412, 'height': 915}, locale='pt-BR', timezone_id='America/Sao_Paulo')
            pg = await ctx.new_page()
            logs = []
            pg.on('pageerror', lambda e: logs.append(str(e)))
            await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send('WebAuthn.enable')
            auth = await cdp.send('WebAuthn.addVirtualAuthenticator', {'options': {
                'protocol': 'ctap2', 'transport': 'internal', 'hasResidentKey': True, 'hasUserVerification': True,
                'isUserVerified': True, 'automaticPresenceSimulation': True}})
            aid = auth['authenticatorId']
            # localhost é contexto seguro: WebAuthn funciona
            await pg.goto('http://localhost:8090/index.html'); await pg.wait_for_timeout(400)
            await pg.fill('#cUrl', GAS); await pg.fill('#cKey', KEY); await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(900)
            await pg.evaluate("window.__todo.setTab('ajustes')"); await pg.click('[data-act=sub][data-sub=trava]'); await pg.wait_for_timeout(200)
            ok('Desligada' in await pg.inner_text('main'), 'trava começa desligada')
            await pg.click('[data-act=lock-on]'); await pg.wait_for_timeout(800)
            ok('Ligada' in await pg.inner_text('main'), 'ligar a trava cria a chave de acesso no aparelho')
            creds = await cdp.send('WebAuthn.getCredentials', {'authenticatorId': aid})
            ok(len(creds['credentials']) == 1, 'uma chave de acesso registrada')
            await pg.screenshot(path=str(ROOT / 'test/shots/trava-ajustes.png'))
            # reabrir: começa trancado e desbloqueia com a digital
            await pg.goto('about:blank'); await pg.goto('http://localhost:8090/index.html#inicio'); await pg.wait_for_timeout(150)
            ok('Desbloquear' in await pg.inner_text('body') or 'Aguardando' in await pg.inner_text('body'), 'ao abrir, o app aparece trancado')
            await pg.screenshot(path=str(ROOT / 'test/shots/trava-tela.png'))
            await pg.wait_for_timeout(1200)
            _b = await pg.inner_text('body')
            ok('Até hoje' in _b, 'digital confirmada: app desbloqueia sozinho')
            # digital recusada
            await cdp.send('WebAuthn.setUserVerified', {'authenticatorId': aid, 'isUserVerified': False})
            await pg.evaluate('window.__todo.trancar()'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=unlock]'); await pg.wait_for_timeout(1500)
            body = await pg.inner_text('body')
            ok('Até hoje' not in body and 'Desbloquear' in body, 'digital errada: continua trancado')
            # sem a digital não dá para ver nada nem desligar
            ok(await pg.query_selector('[data-act=lock-off]') is None, 'trancado, a tela de ajustes fica inacessível')
            await cdp.send('WebAuthn.setUserVerified', {'authenticatorId': aid, 'isUserVerified': True})
            await pg.click('[data-act=unlock]'); await pg.wait_for_timeout(1200)
            ok('Desbloquear' not in await pg.inner_text('body'), 'digital certa depois: desbloqueia')
            # desligar exige a digital
            await pg.evaluate("window.__todo.setTab('ajustes')"); await pg.click('[data-act=sub][data-sub=trava]'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=lock-off]'); await pg.wait_for_timeout(1000)
            ok('Desligada' in await pg.inner_text('main'), 'desligar a trava (com digital)')
            await pg.goto('about:blank'); await pg.goto('http://localhost:8090/index.html#inicio'); await pg.wait_for_timeout(800)
            ok('Até hoje' in await pg.inner_text('body'), 'trava desligada: abre direto')
            for l in logs: errors.append('pageerror ' + l)
            await b.close()
    finally:
        gas.terminate(); web.terminate()

asyncio.run(main())
print('\n'.join(checks)); print('\nFALHAS:' if errors else '\nTUDO CERTO', *errors, sep='\n')
sys.exit(1 if errors else 0)
