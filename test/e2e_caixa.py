"""Compras da Carteira (notificações) e lançamento por voz, ponta a ponta no simulador."""
import asyncio, json, pathlib, subprocess, sys, time, urllib.request, urllib.parse
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'test' / 'shots'; SHOTS.mkdir(exist_ok=True)
GAS, KEY = 'http://localhost:8787/exec', 'chave-de-teste-1234567890'
errors, checks = [], []
def ok(c, m):
    checks.append(('OK ' if c else 'FALHOU ') + m)
    if not c: errors.append(m)
def notificar(nk, titulo, texto):
    q = urllib.parse.urlencode({'nk': nk, 'app': 'carteira', 'titulo': titulo, 'texto': texto})
    return json.loads(urllib.request.urlopen(GAS + '?' + q).read())
# reconhecimento de voz falso: devolve a frase combinada (o Chrome real usa o serviço do Google)
FALA = """window.__fala = 'açougue oitenta e sete e cinquenta no pix ontem';
class FakeSR { start() { setTimeout(() => { const res = [[{ transcript: window.__fala }]]; res[0].isFinal = true; this.onresult && this.onresult({ results: res }); this.onend && this.onend(); }, 150); } stop() { this.onend && this.onend(); } }
window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = FakeSR;"""
async def main():
    gas = subprocess.Popen(['node', str(ROOT / 'test/gas-sim.js'), '8787'], stdout=subprocess.DEVNULL)
    web = subprocess.Popen([sys.executable, '-m', 'http.server', '8090', '--bind', '127.0.0.1'], cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx = await b.new_context(viewport={'width': 412, 'height': 915}, locale='pt-BR', timezone_id='America/Sao_Paulo', device_scale_factor=2)
            await ctx.add_init_script(FALA)
            await ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin='http://127.0.0.1:8090')
            pg = await ctx.new_page(); logs = []
            pg.on('pageerror', lambda e: logs.append(str(e)))
            await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
            await pg.clock.set_fixed_time(time.time())  # mesmo relógio do simulador, que carimba a hora em que o aviso chega
            await pg.goto('http://127.0.0.1:8090/index.html'); await pg.wait_for_timeout(300)
            await pg.fill('#cUrl', GAS); await pg.fill('#cKey', KEY); await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(900)
            # voz
            await pg.click('[data-act=voz]'); await pg.wait_for_timeout(600)
            prev = await pg.inner_text('.preview')
            ok('R$ 87,50' in prev and 'Açougue' in prev and 'Pix' in prev, 'voz: "oitenta e sete e cinquenta no pix ontem" vira R$ 87,50 no Pix, ontem')
            ok(await pg.input_value('#quickIn') == 'açougue 87,50 no pix ontem', 'voz: a frase entendida aparece no campo')
            await pg.click('[data-act=quick-save]'); await pg.wait_for_timeout(800)
            # chave das notificações
            await pg.evaluate("window.__todo.setTab('ajustes')"); await pg.click('[data-act=sub][data-sub=notif]'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=notif-gerar]'); await pg.wait_for_timeout(900)
            nk = await pg.evaluate("window.__todo.S.ui.chaveNotif")
            ok(bool(nk) and len(nk) == 40, 'gera a chave das notificações e mostra para copiar')
            await pg.screenshot(path=str(SHOTS / 'notif-config.png'), full_page=True)
            ok(not notificar('chave-errada', 'X', 'R$ 1,00')['ok'], 'chave errada não entra')
            ok(notificar(nk, 'Brasil Variedades', 'R$ 128,73 com Banco Inter Black Mastercard ••4298')['ok'], 'notificação da Carteira entra na caixa')
            notificar(nk, 'Supernosso', 'R$ 87,50 com Banco Inter Black Mastercard ••4298')
            notificar(nk, 'Posto Shell', 'R$ 200,00 com C6 Mastercard ••1111')
            await pg.evaluate("window.__todo.sync()"); await pg.wait_for_timeout(900)
            await pg.evaluate("window.__todo.setTab('inicio')"); await pg.wait_for_timeout(200)
            body = await pg.inner_text('main')
            ok('3 compras vieram da Carteira' in body, 'início avisa: 3 compras vieram da Carteira')
            await pg.screenshot(path=str(SHOTS / 'caixa-inicio.png'))
            await pg.click('[data-act=sub][data-sub=caixa]'); await pg.wait_for_timeout(300)
            t = await pg.inner_text('main')
            ok('O cartão final 4298 é qual?' in t, 'pergunta qual cartão é o final desconhecido')
            ok('Talvez já lançado' in t, 'avisa que o Supernosso de R$ 87,50 pode ser repetido do lançamento por voz')
            await pg.screenshot(path=str(SHOTS / 'caixa-revisar.png'), full_page=True)
            await pg.click('[data-act=cx-final][data-final="4298"]'); await pg.wait_for_timeout(500)
            meios = await pg.evaluate("window.__todo.S.cfg.meios.filter(m => (m.finais||[]).includes('4298')).map(m => m.id)")
            ok(len(meios) == 1, 'final 4298 fica associado ao cartão')
            # Posto Shell (C6 desconhecido) via formulário; Brasil Variedades pronto? (sem categoria conhecida)
            await pg.click('[data-act=cx-final][data-final="1111"] >> nth=-1'); await pg.wait_for_timeout(500)
            t = await pg.inner_text('main')
            # descartar o repetido
            sup = await pg.evaluate("window.__todo.S.server.caixa.find(n => n.titulo === 'Supernosso').id")
            await pg.click(f'[data-act=cx-descartar][data-id="{sup}"]'); await pg.wait_for_timeout(600)
            # lançar o Posto Shell pelo formulário (combustível reconhecido)
            shell = await pg.evaluate("window.__todo.S.server.caixa.find(n => n.titulo === 'Posto Shell').id")
            await pg.click(f'[data-act=cx-lancar][data-id="{shell}"]'); await pg.wait_for_timeout(400)
            ok('200,00' in await pg.input_value('#fValor') and await pg.input_value('#fDesc') == 'Posto Shell', 'formulário abre com valor e estabelecimento da notificação')
            await pg.click('[data-act=l-save]:not([data-more])'); await pg.wait_for_timeout(900)
            # o que sobra: Brasil Variedades, sem categoria -> completar
            bv = await pg.evaluate("window.__todo.S.server.caixa.find(n => n.titulo === 'Brasil Variedades').id")
            await pg.click(f'[data-act=cx-lancar][data-id="{bv}"]'); await pg.wait_for_timeout(400)
            await pg.click('[data-act=l-cat]'); await pg.wait_for_timeout(300)
            await pg.fill('#catQ', 'casa'); await pg.wait_for_timeout(200)
            await pg.click('[data-act=cat-pick][data-cat=casa][data-sub=utilidades]'); await pg.wait_for_timeout(300)
            await pg.click('[data-act=l-save]:not([data-more])'); await pg.wait_for_timeout(1200)
            await pg.evaluate("window.__todo.sync()"); await pg.wait_for_timeout(900)
            st = json.loads(urllib.request.urlopen('http://localhost:8787/__estado').read())
            cx = st['Caixa de entrada']; h = cx[0]
            status = {r[h.index('titulo')]: r[h.index('status')] for r in cx[1:]}
            ok(status == {'Brasil Variedades': 'lancado', 'Supernosso': 'descartado', 'Posto Shell': 'lancado'}, f'planilha marca cada aviso como lançado ou descartado {status}')
            lanc = st['Lançamentos']; hl = lanc[0]
            descs = [r[hl.index('descricao')] for r in lanc[1:]]
            ok('Posto Shell' in descs and 'Brasil Variedades' in descs and descs.count('Supernosso') == 0, 'lançamentos criados só para o que foi confirmado')
            # aprende: próxima compra no mesmo lugar já vem pronta
            notificar(nk, 'Brasil Variedades', 'R$ 50,00 com Banco Inter Black Mastercard ••4298')
            await pg.evaluate("window.__todo.sync()"); await pg.wait_for_timeout(900)
            await pg.evaluate("window.__todo.setTab('inicio')"); await pg.click('[data-act=sub][data-sub=caixa]'); await pg.wait_for_timeout(300)
            ok(await pg.query_selector('[data-act=cx-todos]') is not None, 'na segunda vez o mesmo lugar já vem pronto para lançar com um toque')
            await pg.click('[data-act=cx-todos]'); await pg.wait_for_timeout(1200)
            ok(len(await pg.evaluate("window.__todo.S.server.caixa.filter(n => !window.__todo.S.outbox.some(o => o.t === 'caixa' && o.id === n.id))")) == 0, 'caixa fica vazia depois de lançar')
            w = await pg.evaluate('document.documentElement.scrollWidth'); ok(w <= 412, 'sem rolagem lateral')
            for l in logs: errors.append('pageerror ' + l)
            await b.close()
    finally:
        gas.terminate(); web.terminate()
asyncio.run(main())
print('\n'.join(checks)); print('\nFALHAS:' if errors else '\nTUDO CERTO', *errors, sep='\n')
sys.exit(1 if errors else 0)
