"""Teste ponta a ponta do Todo dIA: app (index.html) + programa da planilha (Codigo.gs) rodando no simulador.
Uso: python3 test/e2e.py"""
import asyncio, json, pathlib, sys, subprocess, time, urllib.request
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'test' / 'shots'; SHOTS.mkdir(exist_ok=True)
SEMENTE = sys.argv[1] if len(sys.argv) > 1 else None
FONTS_CSS = pathlib.Path('/tmp/claude-0/-home-claude/5f940100-4588-5945-9230-668c827d02b3/scratchpad/fonts.css')
XLSX = pathlib.Path('/tmp/claude-0/-home-claude/5f940100-4588-5945-9230-668c827d02b3/scratchpad/fonts/node_modules/xlsx/dist/xlsx.full.min.js')
GAS = 'http://localhost:8787/exec'
KEY = 'chave-de-teste-1234567890'
errors, checks = [], []
def ok(cond, msg):
    checks.append(('OK ' if cond else 'FALHOU ') + msg)
    if not cond: errors.append(msg)
def estado():
    return json.loads(urllib.request.urlopen('http://localhost:8787/__estado').read())
def falhar(v):
    urllib.request.urlopen('http://localhost:8787/__falhar?v=' + ('1' if v else '0')).read()

FONT_FILES = {}
if FONTS_CSS.exists():
    import re as _re
    _css = FONTS_CSS.read_text()
    for i, path in enumerate(_re.findall(r'url\("file://([^"]+)"\)', _css)):
        FONT_FILES[f'f{i}.woff2'] = path
        _css = _css.replace('file://' + path, f'https://fonts.gstatic.com/teste/f{i}.woff2')
    FONTS_CSS_TXT = _css
async def preparar(ctx):
    pg = await ctx.new_page()
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    if FONTS_CSS.exists(): await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=FONTS_CSS_TXT))
    await pg.route('**/fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=pathlib.Path(FONT_FILES.get(r.request.url.split('/')[-1], '/dev/null')).read_bytes()))
    if XLSX.exists(): await pg.route('**/cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=XLSX.read_text()))
    return pg, logs

async def main():
    gas = None
    def novo_gas():
        nonlocal gas
        if gas: gas.terminate(); gas.wait()
        gas = subprocess.Popen(['node', str(ROOT / 'test/gas-sim.js'), '8787'] + ([SEMENTE] if SEMENTE else []), stdout=subprocess.PIPE)
        time.sleep(0.8)
    web = subprocess.Popen([sys.executable, '-m', 'http.server', '8090', '--bind', '127.0.0.1'], cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for scheme in ['light', 'dark']:
                novo_gas()
                ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, color_scheme=scheme,
                                          timezone_id='America/Sao_Paulo', locale='pt-BR', has_touch=True, is_mobile=True)
                pg, logs = await preparar(ctx)
                await pg.clock.set_fixed_time('2026-10-22T20:00:00-03:00')
                await pg.goto('http://127.0.0.1:8090/index.html'); await pg.wait_for_timeout(500)
                txt = await pg.inner_text('body')
                ok('Conectar à sua planilha' in txt, f'[{scheme}] sem conexão: abre a tela de configuração, sem nenhum dado')
                await pg.screenshot(path=str(SHOTS / f'{scheme}-00-setup.png'))
                # chave errada
                await pg.fill('#cUrl', GAS); await pg.fill('#cKey', 'chave-errada-000000000000000')
                await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(700)
                ok('A chave não confere' in await pg.inner_text('body'), 'chave errada é recusada')
                await pg.fill('#cKey', KEY)
                await pg.click('form[data-form=setup] button[type=submit]'); await pg.wait_for_timeout(900)
                txt = await pg.inner_text('main')
                ok('Até hoje, em outubro, gastei' in txt and 'R$ 0,00' in txt, 'conectado: "Até hoje, em outubro, gastei R$ 0,00" (começa do zero)')
                await pg.screenshot(path=str(SHOTS / f'{scheme}-01-inicio-zero.png'), full_page=True)

                async def quick(text):
                    await pg.fill('#quickIn', text); await pg.click('.quick button[type=submit]'); await pg.wait_for_timeout(250)
                async def salvar():
                    await pg.click('[data-act=quick-save]'); await pg.wait_for_timeout(900)
                await quick('açougue 87,50 inter ontem')
                prev = await pg.inner_text('.preview')
                ok('Açougue e hortifrúti' in prev and 'R$ 87,50' in prev and ('Inter Crédito' in prev or not SEMENTE), 'frase livre entendida (açougue)')
                await salvar()
                await quick('capacete 900 c6 3x')
                ok('3x' in await pg.inner_text('.preview'), 'parcelado no C6')
                await salvar()
                await quick('recebi airbnb 850')
                ok('entrada' in (await pg.inner_text('.preview')).lower(), 'entrada de Airbnb')
                await salvar()
                st = estado()
                lanc = st.get('Lançamentos', [])
                ok(len(lanc) == 4 and any('Açougue' in str(r) for r in lanc), f'lançamentos gravados na planilha ({len(lanc)-1} linhas)')
                # formulário completo
                await pg.click('.fab-wrap'); await pg.wait_for_timeout(250)
                await pg.type('#fValor', '31240')
                await pg.fill('#fDesc', 'Supernosso'); await pg.dispatch_event('#fDesc', 'change'); await pg.wait_for_timeout(200)
                sh = await pg.inner_text('#sheet')
                ok('Supermercado' in sh and '312,40' in await pg.input_value('#fValor'), 'formulário: valor e categoria automática')
                sw = await pg.evaluate("document.querySelector('#sheet').scrollWidth - document.querySelector('#sheet').clientWidth")
                ok(sw <= 0, 'formulário sem vazamento lateral')
                await pg.screenshot(path=str(SHOTS / f'{scheme}-02-form.png'))
                await pg.click('[data-act=l-save]:not([data-more])'); await pg.wait_for_timeout(900)
                # sem internet
                falhar(True)
                await quick('padaria 18,90 pix'); await salvar(); await pg.wait_for_timeout(600)
                body = await pg.inner_text('body')
                ok('esperando a internet' in body, 'sem internet: alteração fica guardada no aparelho')
                n_antes = len(estado()['Lançamentos'])
                falhar(False)
                await pg.click('[data-act=flush]'); await pg.wait_for_timeout(1200)
                ok(len(estado()['Lançamentos']) == n_antes + 1 and 'esperando a internet' not in await pg.inner_text('body'), 'internet voltou: fila enviada para a planilha')
                await pg.evaluate('window.scrollTo(0,0)')
                await pg.screenshot(path=str(SHOTS / f'{scheme}-03-inicio.png'), full_page=True)
                # recarregar: abre do aparelho e confere com a planilha
                await pg.reload(); await pg.wait_for_timeout(1000)
                await pg.click('[data-tab=lancamentos]'); await pg.wait_for_timeout(300)
                t2 = await pg.inner_text('main')
                ok(all(x in t2 for x in ['Padaria', 'Supernosso', 'Açougue', 'Capacete']), 'recarregar mantém tudo (cópia local + planilha)')
                for tab in ['lancamentos', 'cartoes', 'relatorios', 'ajustes']:
                    await pg.click(f'[data-tab={tab}]'); await pg.wait_for_timeout(300)
                    await pg.screenshot(path=str(SHOTS / f'{scheme}-04-{tab}.png'), full_page=True)
                    w = await pg.evaluate('document.documentElement.scrollWidth')
                    ok(w <= 412, f'{tab}: sem rolagem lateral')
                await pg.click('[data-tab=cartoes]'); await pg.wait_for_timeout(250)
                await pg.evaluate("window.__todo.setTab('ajustes')"); await pg.click('[data-act=sub][data-sub=conexao]'); await pg.wait_for_timeout(250)
                ok('Sincronizado' in await pg.inner_text('main'), 'tela de conexão mostra sincronizado')
                await pg.screenshot(path=str(SHOTS / f'{scheme}-07-conexao.png'), full_page=True)
                for l in logs:
                    if 'rede' not in l and 'ERR_EMPTY_RESPONSE' not in l: errors.append(f'[{scheme}] console {l}')
                checks.append(f'[{scheme}] console: {len(logs)} avisos/erros')
                await ctx.close()

            # ---- 2 de novembro: fixos entraram no dia 1º, ressarcimento abate
            await b.close()
    finally:
        if gas: gas.terminate()
        web.terminate()

asyncio.run(main())
print('\n'.join(checks))
print('\nFALHAS:' if errors else '\nTUDO CERTO', *errors, sep='\n')
sys.exit(1 if errors else 0)
