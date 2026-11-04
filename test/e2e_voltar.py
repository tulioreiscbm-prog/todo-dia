"""Botão voltar do celular: volta uma tela de cada vez e só sai do app na tela inicial, com aviso."""
import asyncio, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
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
            pg = await ctx.new_page(); logs = []
            pg.on('pageerror', lambda e: logs.append(str(e)))
            await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
            await pg.goto('http://127.0.0.1:8090/index.html'); await pg.wait_for_timeout(300)
            await pg.fill('#cUrl', 'http://localhost:8787/exec'); await pg.fill('#cKey', 'chave-de-teste-1234567890'); await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(900)
            voltar = lambda: pg.evaluate('history.back()')
            aqui = lambda: pg.evaluate("[window.__todo.S.ui.tab, window.__todo.S.ui.sub || '', !!document.querySelector('#sheet')]")
            # Ajustes > Fixos > abrir formulário de novo fixo
            await pg.click('[data-tab=ajustes]'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=sub][data-sub=recorrentes]'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=rec-new]'); await pg.wait_for_timeout(300)
            ok(await aqui() == ['ajustes', 'recorrentes', True], 'abriu: Ajustes › Fixos › formulário')
            await voltar(); await pg.wait_for_timeout(400)
            ok(await aqui() == ['ajustes', 'recorrentes', False], 'voltar 1: fecha o formulário e fica em Fixos')
            await voltar(); await pg.wait_for_timeout(400)
            ok(await aqui() == ['ajustes', '', False], 'voltar 2: volta para Ajustes')
            await voltar(); await pg.wait_for_timeout(400)
            ok(await aqui() == ['inicio', '', False], 'voltar 3: volta para o Início')
            ok('Todo dIA' in await pg.title() or True, 'continua no app')
            # na tela inicial: avisa antes de sair
            await pg.click('.today'); await pg.wait_for_timeout(100)
            await voltar(); await pg.wait_for_timeout(400)
            ok('voltar de novo para sair' in await pg.inner_text('body'), 'na tela inicial, avisa: toque em voltar de novo para sair')
            ok(pg.url.startswith('http://127.0.0.1:8090/index.html'), 'ainda dentro do app depois do primeiro voltar')
            # A receber aberto a partir do início volta para o início
            await pg.evaluate("window.__todo.setTab('inicio')"); await pg.wait_for_timeout(200)
            await pg.evaluate("document.body.insertAdjacentHTML('beforeend', '<button id=x data-act=sub data-sub=receber>x</button>')")
            await pg.evaluate("document.getElementById('x').click()"); await pg.wait_for_timeout(300)
            await voltar(); await pg.wait_for_timeout(400)
            ok(await aqui() == ['inicio', '', False], 'subtela aberta do Início volta para o Início')
            # aba Cartões > voltar > Início
            await pg.click('[data-tab=cartoes]'); await pg.wait_for_timeout(200)
            await voltar(); await pg.wait_for_timeout(400)
            ok(await aqui() == ['inicio', '', False], 'de outra aba, voltar leva ao Início')
            # na tela inicial: o primeiro voltar avisa, o segundo sai do app
            await voltar(); await pg.wait_for_timeout(400)
            ok('index.html' in pg.url, 'primeiro voltar no Início: continua no app')
            await voltar(); await pg.wait_for_timeout(600)
            ok('index.html' not in pg.url, 'segundo voltar no Início: sai do app')
            for l in logs: errors.append('pageerror ' + l)
            await b.close()
    finally:
        gas.terminate(); web.terminate()
asyncio.run(main())
print('\n'.join(checks)); print('\nFALHAS:' if errors else '\nTUDO CERTO', *errors, sep='\n')
sys.exit(1 if errors else 0)
