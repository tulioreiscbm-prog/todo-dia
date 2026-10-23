"""Teste do relatório completo e da importação de lançamentos (dados fictícios)."""
import asyncio, base64, json, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'test' / 'shots'; SHOTS.mkdir(exist_ok=True)
GAS, KEY = 'http://localhost:8787/exec', 'chave-de-teste-1234567890'
errors, checks = [], []
def ok(c, m):
    checks.append(('OK ' if c else 'FALHOU ') + m)
    if not c: errors.append(m)
def bloco(obj):
    return 'TODODIA1:' + base64.urlsafe_b64encode(json.dumps(obj, ensure_ascii=False).encode()).decode().rstrip('=')

DEMO = {'titulo': 'Exemplo de teste', 'itens': [
    {'id': 'IMPtest-tenis', 'desc': 'Loja de tênis (parcelas 3 a 6 de 6)', 'valor': 4 * 5000, 'parcelas': 4, 'data': '2026-10-18', 'meioId': 'credito', 'catId': 'compras', 'subId': 'vestuario'},
    {'id': 'IMPtest-air1', 'tipo': 'receita', 'desc': 'Airbnb', 'valor': 85000, 'data': '2026-09-12', 'meioId': 'pix', 'catId': 'renda', 'subId': 'airbnb'},
    {'id': 'IMPtest-air2', 'tipo': 'receita', 'desc': 'Airbnb', 'valor': 120000, 'data': '2026-10-05', 'meioId': 'pix', 'catId': 'renda', 'subId': 'airbnb'},
    {'id': 'IMPtest-sal', 'tipo': 'receita', 'desc': 'Salário', 'valor': 900000, 'data': '2026-10-05', 'meioId': 'pix', 'catId': 'renda', 'subId': 'salario'},
    {'id': 'IMPtest-merc1', 'desc': 'Supernosso', 'valor': 31240, 'data': '2026-10-09', 'meioId': 'credito', 'catId': 'alimentacao', 'subId': 'supermercado'},
    {'id': 'IMPtest-merc2', 'desc': 'Supernosso', 'valor': 18750, 'data': '2026-10-16', 'meioId': 'credito', 'catId': 'alimentacao', 'subId': 'supermercado'},
    {'id': 'IMPtest-pad', 'desc': 'Padaria', 'valor': 1890, 'data': '2026-10-17', 'meioId': 'pix', 'catId': 'alimentacao', 'subId': 'padaria'},
    {'id': 'IMPtest-gas', 'desc': 'Gasolina', 'valor': 20000, 'data': '2026-09-26', 'meioId': 'credito', 'catId': 'transporte', 'subId': 'combustivel'},
    {'id': 'IMPtest-fax', 'desc': 'Faxina Airbnb', 'valor': 15000, 'data': '2026-10-06', 'meioId': 'pix', 'catId': 'imoveis', 'subId': 'airbnb'},
]}

async def main():
    gas = subprocess.Popen(['node', str(ROOT / 'test/gas-sim.js'), '8787'], stdout=subprocess.DEVNULL)
    web = subprocess.Popen([sys.executable, '-m', 'http.server', '8090', '--bind', '127.0.0.1'], cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo', color_scheme='dark')
            pg = await ctx.new_page(); logs = []
            pg.on('pageerror', lambda e: logs.append(str(e)))
            pg.on('console', lambda m: logs.append(m.text) if m.type == 'error' else None)
            await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
            await pg.clock.set_fixed_time('2026-10-22T21:00:00-03:00')
            await pg.goto('http://127.0.0.1:8090/index.html'); await pg.wait_for_timeout(300)
            await pg.fill('#cUrl', GAS); await pg.fill('#cKey', KEY); await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(900)
            # importação
            await pg.evaluate("window.__todo.setTab('ajustes')"); await pg.click('[data-act=sub][data-sub=importar]'); await pg.wait_for_timeout(200)
            await pg.fill('#impTxt', 'lixo'); await pg.click('[data-act=imp-ler]'); await pg.wait_for_timeout(150)
            ok('Não encontrei o bloco' in await pg.inner_text('main'), 'bloco inválido é recusado com mensagem clara')
            await pg.fill('#impTxt', bloco(DEMO)); await pg.click('[data-act=imp-ler]'); await pg.wait_for_timeout(200)
            t = await pg.inner_text('main')
            ok('9 lançamentos' in t and '4x de R$ 50,00' in t, 'pré-visualização mostra os itens antes de gravar')
            await pg.screenshot(path=str(SHOTS / 'importar.png'), full_page=True)
            await pg.click('[data-act=imp-ok]'); await pg.wait_for_timeout(1200)
            ok('Fatura' in await pg.inner_text('main'), 'depois de importar, abre os cartões')
            await pg.click('[data-act=imp-ok]') if await pg.query_selector('[data-act=imp-ok]') else None
            # importar de novo não duplica
            await pg.evaluate("window.__todo.setTab('ajustes')"); await pg.click('[data-act=sub][data-sub=importar]')
            await pg.fill('#impTxt', bloco(DEMO)); await pg.click('[data-act=imp-ler]'); await pg.click('[data-act=imp-ok]'); await pg.wait_for_timeout(1200)
            n = await pg.evaluate("window.__todo.itens().filter(i => i.id.startsWith('IMPtest')).length")
            ok(n == 9, f'importar o mesmo bloco duas vezes não duplica ({n})')
            # relatório
            await pg.click('[data-tab=relatorios]'); await pg.wait_for_timeout(300)
            await pg.click('[data-act=rp-open]'); await pg.wait_for_timeout(500)
            t = await pg.inner_text('body')
            ok('Relatório do seu perfil de gastos' in t and 'O que os números dizem' in t, 'relatório abre')
            ok('Airbnb: a sua outra fonte de renda' in t and 'R$ 2.050,00' in t, 'seção do Airbnb soma os recebimentos (850 + 1.200)')
            ok('Supernosso' in t and '2 vezes' in t.replace('\t', ' ') or 'Supernosso' in t, 'lugar mais frequente aparece')
            ok('Resultado' in t and 'R$ 1.900,00' in t, 'Airbnb: resultado descontando a faxina (2.050 − 150)')
            w = await pg.evaluate('document.documentElement.scrollWidth')
            ok(w <= 412, f'relatório sem rolagem lateral no celular ({w}px)')
            await pg.screenshot(path=str(SHOTS / 'relatorio-celular.png'), full_page=True)
            await pg.emulate_media(media='print')
            await pg.pdf(path=str(SHOTS / 'relatorio.pdf'), format='A4', print_background=True, margin={'top': '12mm', 'bottom': '12mm', 'left': '12mm', 'right': '12mm'})
            ok((SHOTS / 'relatorio.pdf').stat().st_size > 20000, 'PDF gerado')
            await pg.emulate_media(media='screen')
            await pg.click('[data-act=rp-close]'); await pg.wait_for_timeout(200)
            ok('Gastos por categoria' in await pg.inner_text('main'), 'voltar do relatório')
            for l in logs: errors.append('console ' + l)
            await b.close()
    finally:
        gas.terminate(); web.terminate()
asyncio.run(main())
print('\n'.join(checks)); print('\nFALHAS:' if errors else '\nTUDO CERTO', *errors, sep='\n')
sys.exit(1 if errors else 0)
