#!/usr/bin/env python3
"""Monta o index.html do Todo dIA a partir de src/ (rode: python3 build.py)."""
import pathlib, re
root = pathlib.Path(__file__).parent
src = root / 'src'
css = (src / 'app.css').read_text()
js = [(src / f).read_text() for f in ('engine.js', 'taxonomy.js', 'app.js')]
for code in js:
    assert '</script' not in code.lower()
version = re.search(r"const VERSION = '([\d.]+)'", js[2]).group(1)
html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Todo dIA</title>
<meta name="description" content="Controle de gastos do dia a dia: lançamento rápido, previsão de faturas e relatórios.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#F2F5F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D1311" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Todo dIA">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:ital,wght@0,400..800;1,400..600&display=swap">
<style>
html{{-webkit-text-size-adjust:100%}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}
{css}
</style>
</head>
<body>
<div id="app" class="app"></div>
<noscript><p style="padding:24px;font-family:sans-serif">O Todo dIA precisa de JavaScript ligado.</p></noscript>
<script>
{js[0]}
</script>
<script>
{js[1]}
</script>
<script>
{js[2]}
</script>
</body>
</html>
'''
(root / 'index.html').write_text(html)
sw = (root / 'sw.js').read_text()
sw = re.sub(r"const VERSAO = '[^']*';", f"const VERSAO = 'todo-dia-{version}';", sw)
(root / 'sw.js').write_text(sw)
print('index.html', len(html.encode()) // 1024, 'KB · versão', version)
