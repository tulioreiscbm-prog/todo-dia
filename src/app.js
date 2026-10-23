/* Todo dIA — aplicativo (interface, dados e gráficos) */
(() => {
  'use strict';
  const E = Engine, T = Taxonomy;
  const VERSION = '2.2.0';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let uidN = 0;
  const uid = (p = 'L') => p + Date.now().toString(36) + (uidN++ % 1296).toString(36).padStart(2, '0') + Math.random().toString(36).slice(2, 6);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const TIPOS_MEIO = { credito: 'Cartão de crédito', debito: 'Débito', pix: 'Pix', boleto: 'Boleto', dinheiro: 'Dinheiro' };
  const CORES = ['#ff7a00', '#6b7280', '#8a05be', '#cc092f', '#0b5ea8', '#12866B', '#e6a700', '#7a7f87'];
  const hoje = () => E.todayISO();
  const ymHoje = () => E.ymOf(hoje());
  const mesNome = (ym) => { const { m, y } = { m: +ym.slice(5), y: ym.slice(0, 4) }; return `${MESES[m - 1]} ${y}`; };
  const mesCurto = (ym) => `${MES3[+ym.slice(5) - 1]}/${ym.slice(2, 4)}`;
  const dataCurta = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const dataLonga = (iso) => { const p = E.parseISO(iso); return `${SEMANA[E.weekday(iso)]}, ${p.d} de ${MESES[p.m - 1]}`; };
  const brl = (c) => E.fmtBRL(c);
  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const brlParts = (c) => { const s = E.fmtBRL(c); const i = s.lastIndexOf(','); return [s.slice(0, i), s.slice(i)]; };

  // ---------- Ícones ----------
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    cloud: '<path d="M17.5 19H7a5 5 0 1 1 1.6-9.7A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8z"/><path d="M12 12v6M9.5 14.5 12 12l2.5 2.5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', alert: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>',
    brain: '<path d="M12 3v18M8 7a3 3 0 0 0-3 3 3 3 0 0 0 1 5 3 3 0 0 0 6 1M16 7a3 3 0 0 1 3 3 3 3 0 0 1-1 5 3 3 0 0 1-6 1M8 7a3 3 0 0 1 4-3M16 7a3 3 0 0 0-4-3"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.6" r="1.3"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  };
  const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c.8 4.9 2.1 6.2 7 7-4.9.8-6.2 2.1-7 7-.8-4.9-2.1-6.2-7-7 4.9-.8 6.2-2.1 7-7zM19 14c.4 2.4 1 3 3.4 3.4-2.4.4-3 1-3.4 3.4-.4-2.4-1-3-3.4-3.4 2.4-.4 3-1 3.4-3.4z"/></svg>';
  const LOGO = (k = '') => `<svg class="${k}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="var(--accent)"/><rect x="13" y="17" width="8.4" height="31" rx="3" fill="var(--on-accent)"/><path d="M28.6 47.2 L38.6 18.4 L48.6 47.2" fill="none" stroke="var(--on-accent)" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38.6" cy="38.6" r="5.3" fill="#F2B632"/><path d="M52 8.5C52.7 12.4 53.6 13.3 57.5 14 53.6 14.7 52.7 15.6 52 19.5 51.3 15.6 50.4 14.7 46.5 14 50.4 13.3 51.3 12.4 52 8.5Z" fill="#F2B632"/></svg>`;
  const WORD = '<span class="word">Todo d<b>IA</b></span>';

  // ---------- Estado ----------
  const S = {
    conn: null, // { url, key } — endereço do programa da planilha e chave secreta (só neste aparelho)
    server: { lancamentos: [], fixos: [], config: {}, planilhaUrl: '' }, // última cópia vinda da planilha
    outbox: [], // alterações ainda não confirmadas pela planilha
    net: 'idle', lastSync: 0, syncErr: '', sending: false, retryTimer: null, retryN: 0, installPrompt: null,
    cfg: { meios: null, categorias: null, regras: {}, prefs: {} }, recorrentes: [],
    ui: {
      tab: 'inicio', sub: null, mes: ymHoje(), filtro: 'tudo', busca: '', lancCat: null, quickText: '',
      cardId: null, faturaRef: null, relPer: 'mes', relMes: ymHoje(), relCat: '', open: {}, quick: null,
    },
    version: 0, memo: null, today: hoje(), charts: {}, toastTimer: null,
  };
  const meios = () => (S.cfg.meios && S.cfg.meios.length ? S.cfg.meios : T.meios).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const meiosAtivos = () => meios().filter((m) => m.ativo !== false);
  const meioPadrao = () => { const p = S.cfg.prefs.meioPadrao; return p && meioById(p) ? p : (meiosAtivos()[0] || {}).id; };
  const categorias = () => (S.cfg.categorias && S.cfg.categorias.length ? S.cfg.categorias : T.categorias);
  const meioById = (id) => meios().find((m) => m.id === id);
  const catNome = (catId, subId) => {
    const c = E.findCat(categorias(), catId); if (!c) return 'Sem categoria';
    const s = E.findSub(categorias(), catId, subId);
    return s ? `${c.nome} › ${s.nome}` : c.nome;
  };
  const catSo = (catId) => (E.findCat(categorias(), catId) || { nome: 'Sem categoria' }).nome;
  const subSo = (catId, subId) => (E.findSub(categorias(), catId, subId) || { nome: '' }).nome;
  const iniciais = (s) => { const w = String(s || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '').slice(1, 2))).toUpperCase(); };

  // ---------- Armazenamento no aparelho (abre instantâneo, funciona sem sinal) ----------
  const LS = { data: 'tododia.data.v2', outbox: 'tododia.outbox.v2', conn: 'tododia.conn.v2', ui: 'tododia.ui.v2', lock: 'tododia.lock.v1' };
  const lsGet = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch { /* ok */ } };
  const saveOutbox = () => lsSet(LS.outbox, S.outbox);

  // Junta a cópia da planilha com o que ainda está na fila e monta o que o app mostra
  function applyView() {
    const cfg = Object.assign({}, S.server.config || {});
    const fixos = new Map((S.server.fixos || []).map((f) => [f.id, f]));
    for (const o of S.outbox) {
      if (o.t === 'config') cfg[o.nome] = o.valor;
      else if (o.t === 'fixo') fixos.set(o.rec.id, o.rec);
    }
    S.cfg = { meios: cfg.meios || null, categorias: cfg.categorias || null, regras: cfg.regras || {}, prefs: cfg.prefs || {} };
    S.recorrentes = [...fixos.values()].filter((r) => r && !r.excluido);
    bump();
  }

  // ---------- Dados derivados ----------
  function itens() {
    const map = new Map();
    for (const it of S.server.lancamentos || []) if (it && it.id) map.set(it.id, it);
    for (const o of S.outbox) { if (o.t === 'lanc') map.set(o.item.id, o.item); else if (o.t === 'apagar') map.delete(o.id); }
    return [...map.values()];
  }
  function D() {
    const t = hoje();
    if (S.memo && S.memo.v === S.version && S.memo.t === t) return S.memo;
    const its = itens();
    const ativos = its.filter((i) => !i.excluido);
    let minYM = E.addMonthsYM(E.ymOf(t), -24);
    for (const i of ativos) if (i.data && E.ymOf(i.data) < minYM) minYM = E.ymOf(i.data);
    const maxYM = E.addMonthsYM(E.ymOf(t), 24);
    const state = { itens: its, recorrentes: S.recorrentes, meios: meios() };
    const occ = E.expandir(state, minYM, maxYM, t);
    const porMes = {}; // quanto você gastou de fato (sua parte, já descontados os ressarcimentos) por mês
    for (const o of occ) { const v = E.liquido(o); if (v) porMes[o.comp] = (porMes[o.comp] || 0) + v; }
    const inicioUso = S.cfg.prefs.inicioUso || (ativos.length ? ativos.reduce((m, i) => (i.data < m ? i.data : m), t) : null);
    const completos = E.mesesCompletos(inicioUso, t);
    S.memo = { v: S.version, t, its, state, occ, porMes, completos, media: E.media(porMes, completos), inicioUso, minYM, maxYM };
    return S.memo;
  }
  const bump = () => { S.version++; S.memo = null; };
  const occDoMes = (ym) => D().occ.filter((o) => o.comp === ym);
  function mediaCat(catId) {
    const d = D(); if (d.completos.length < 2) return null;
    const pm = {}; for (const o of d.occ) if (o.tipo === 'despesa' && o.catId === catId) pm[o.comp] = (pm[o.comp] || 0) + o.minha;
    return E.media(pm, d.completos);
  }
  function primeiroMesMedia() {
    const d = D(); if (!d.inicioUso) return null;
    const first = E.parseISO(d.inicioUso).d <= 3 ? E.ymOf(d.inicioUso) : E.addMonthsYM(E.ymOf(d.inicioUso), 1);
    return E.addMonthsYM(first, 2); // média aparece quando dois meses inteiros fecharam
  }

  // ---------- Conversa com a planilha (Google Apps Script) ----------
  async function chamar(ops) {
    if (!S.conn) throw { codigo: 'sem_conexao', erro: 'Conecte o app à sua planilha.' };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 45000);
    let res;
    try {
      res = await fetch(S.conn.url, { method: 'POST', body: JSON.stringify({ key: S.conn.key, ops }), signal: ctl.signal, redirect: 'follow' });
    } catch (e) { throw { codigo: 'rede', erro: navigator.onLine === false ? 'Sem internet.' : 'Não consegui falar com a planilha.' }; }
    finally { clearTimeout(timer); }
    let j = null;
    try { j = await res.json(); } catch { throw { codigo: 'resposta', erro: 'A planilha respondeu algo inesperado. Confira se o endereço é o do App da Web (termina em /exec).' }; }
    if (!j || !j.ok) throw { codigo: (j && j.codigo) || 'erro', erro: (j && j.erro) || 'Erro na planilha.' };
    return j;
  }
  function receber(dados) {
    if (!dados) return;
    S.server = { lancamentos: dados.lancamentos || [], fixos: dados.fixos || [], config: dados.config || {}, planilhaUrl: dados.planilhaUrl || '' };
    S.lastSync = Date.now();
    lsSet(LS.data, { server: S.server, at: S.lastSync });
  }
  // Envia a fila (ou só busca as novidades, se a fila estiver vazia)
  async function sync() {
    if (!S.conn || S.sending) return;
    S.sending = true; clearTimeout(S.retryTimer);
    const lote = S.outbox.slice(0, 400);
    S.net = 'sync'; renderSoft();
    try {
      const j = await chamar(lote);
      S.outbox = S.outbox.filter((o) => !lote.includes(o)); saveOutbox();
      receber(j.dados);
      S.net = 'ok'; S.syncErr = ''; S.retryN = 0;
    } catch (e) {
      console.warn('sync', e);
      S.net = e.codigo === 'rede' ? 'offline' : 'erro'; S.syncErr = e.erro || '';
      if (e.codigo === 'chave') S.syncErr = 'A chave deste aparelho não vale mais. Cole a chave nova em Ajustes › Conexão.';
      if (e.codigo === 'rede') { const wait = Math.min(300000, 5000 * Math.pow(2, S.retryN++)); S.retryTimer = setTimeout(sync, wait); }
    } finally {
      S.sending = false; applyView(); render();
      if (S.net === 'ok' && S.outbox.length) setTimeout(sync, 200); // chegou mais coisa enquanto enviava
    }
  }
  // Coloca uma alteração na fila (substitui alteração anterior do mesmo item que ainda não saiu)
  function enqueue(op) {
    const key = op.t === 'lanc' ? 'l:' + op.item.id : op.t === 'fixo' ? 'f:' + op.rec.id : op.t === 'config' ? 'c:' + op.nome : 'a:' + op.id;
    op._k = key;
    if (!S.sending) S.outbox = S.outbox.filter((o) => o._k !== key);
    S.outbox.push(op); saveOutbox(); applyView(); render();
    clearTimeout(enqueue.t); enqueue.t = setTimeout(sync, 250);
  }
  function saveItem(item) {
    item.atualizadoEm = Date.now(); if (!item.criadoEm) item.criadoEm = item.atualizadoEm;
    enqueue({ t: 'lanc', item: clone(item) });
    if (!S.cfg.prefs.inicioUso) savePrefs({ inicioUso: hoje() });
    return true;
  }
  function saveRec(rec) { const r = clone(rec); r.atualizadoEm = Date.now(); enqueue({ t: 'fixo', rec: r }); return true; }
  function saveConfig(nome, valor) { enqueue({ t: 'config', nome, valor: clone(valor), em: Date.now() }); }
  function savePrefs(patch) { saveConfig('prefs', Object.assign({}, S.cfg.prefs, patch)); }
  function saveMeios(lista) { saveConfig('meios', lista); }
  function saveCategorias(lista) { saveConfig('categorias', lista); }
  function learn(desc, catId, subId, meioId) {
    const key = E.ruleKey(desc); if (!key || key.length < 2) return;
    const prev = S.cfg.regras[key];
    if (prev && prev.catId === catId && prev.subId === subId && prev.meioId === meioId) return;
    let map = Object.assign({}, S.cfg.regras, { [key]: { catId, subId, meioId: meioId || null, n: ((prev && prev.n) || 0) + 1, at: Date.now() } });
    const ks = Object.keys(map);
    if (ks.length > 400) map = Object.fromEntries(Object.entries(map).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 400));
    saveConfig('regras', map);
  }

  // ---------- Classificação (local: o que você ensinou + dicionário) ----------
  function classifyLocal(desc, tipo) {
    const r = E.classify(desc, { categorias: categorias(), dicionario: T.dicionario, regras: S.cfg.regras });
    if (!r) return null;
    const c = E.findCat(categorias(), r.catId);
    if (tipo && (c.tipo || 'despesa') !== tipo) return null;
    return r;
  }

  // ---------- Toast ----------
  function toast(msg, action) {
    clearTimeout(S.toastTimer);
    let el = $('#toast'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" id="toastAct">${esc(action.label)}</button>` : ''}`;
    document.body.appendChild(el);
    if (action) $('#toastAct').onclick = () => { el.remove(); action.fn(); };
    S.toastTimer = setTimeout(() => el.remove(), action ? 6000 : 3800);
  }
  const vibrate = () => { try { navigator.vibrate && navigator.vibrate(12); } catch { /* sem vibração */ } };

  // ---------- Componentes ----------
  const monthNav = (act, ym, max) => `<div class="monthnav"><button class="icon-btn" data-act="${act}" data-d="-1" aria-label="Mês anterior">${ic('left')}</button>
    <strong>${esc(cap(mesNome(ym)))}</strong><button class="icon-btn" data-act="${act}" data-d="1" aria-label="Próximo mês" ${max && ym >= max ? 'disabled style="opacity:.3"' : ''}>${ic('right')}</button></div>`;
  function occRow(o, opts = {}) {
    const meio = meioById(o.meioId);
    const tags = [];
    if (o.fixo) tags.push('fixo');
    if (o.parcela) tags.push(`${o.parcela[0]}/${o.parcela[1]}`);
    if (o.div > 1) tags.push(`÷${o.div}`);
    const sub = [subSo(o.catId, o.subId) || catSo(o.catId), meio ? meio.nome : '', ...tags].filter(Boolean).join(' · ');
    const isRess = o.tipo === 'ressarcimento';
    const isIn = o.tipo === 'receita' || isRess;
    const val = isRess ? '−' + brl(o.valor) : isIn ? '+' + brl(o.valor) : brl(o.tipo === 'ajuste' ? o.valor : o.minha);
    const small = o.div > 1 ? `<small>de ${brl(o.valor)}</small>` : isRess ? '<small>abate dos gastos</small>' : o.previsto ? '<small>previsto</small>' : o.tipo === 'ajuste' ? '<small>ajuste</small>' : '';
    return `<button class="li ${o.previsto && !opts.noDim ? 'dim' : ''}" data-act="open-occ" data-key="${esc(o.key)}">
      <span class="mono ${o.fixo ? 'rec' : ''} ${isIn ? 'in' : ''}">${o.fixo ? ic('repeat') : esc(iniciais(o.desc))}</span>
      <span class="grow"><span class="t" style="display:block">${esc(o.desc || 'Sem descrição')}</span><span class="s" style="display:block">${esc(sub)}</span></span>
      <span class="amt ${isIn ? 'in' : ''}">${val}${small}</span></button>`;
  }
  function emptyState(title, text, btn) {
    return `<div class="empty">${LOGO()}<b>${esc(title)}</b><span class="small">${esc(text)}</span>${btn || ''}</div>`;
  }
  function banners() {
    const out = [];
    const n = S.outbox.length;
    if (S.net === 'erro' && S.syncErr) out.push(`<div class="banner">${ic('alert')}<span>${esc(S.syncErr)} <button data-act="sub" data-sub="conexao">Ver conexão</button></span></div>`);
    if (n && S.net !== 'sync') out.push(`<div class="banner">${ic('cloud')}<span>${n === 1 ? '1 alteração guardada' : n + ' alterações guardadas'} no aparelho, esperando a internet para ir para a planilha. <button data-act="flush">Enviar agora</button></span></div>`);
    return out.join('');
  }

  // ---------- Trava com a digital (chave de acesso do próprio celular) ----------
  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
  const lockCfg = () => lsGet(LS.lock);
  async function biometriaDisponivel() {
    try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch { return false; }
  }
  async function verificarDigital() {
    const cfg = lockCfg(); if (!cfg || !cfg.credId) return true;
    const cred = await navigator.credentials.get({ publicKey: {
      challenge: rand(32), rpId: location.hostname, timeout: 60000, userVerification: 'required',
      allowCredentials: [{ type: 'public-key', id: unb64u(cfg.credId), transports: ['internal', 'hybrid'] }],
    } });
    return !!cred;
  }
  async function ligarTrava() {
    if (!(await biometriaDisponivel())) { toast('Este aparelho não oferece digital para sites. Confira se há uma digital ou bloqueio de tela cadastrado.'); return; }
    try {
      const cred = await navigator.credentials.create({ publicKey: {
        challenge: rand(32), rp: { name: 'Todo dIA', id: location.hostname },
        user: { id: rand(16), name: 'Todo dIA', displayName: 'Todo dIA' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000, attestation: 'none',
      } });
      if (!cred) return;
      lsSet(LS.lock, { credId: b64u(cred.rawId), em: Date.now() });
      S.ui.lockErr = ''; render(); toast('Trava ligada. O app vai pedir a digital ao abrir.');
    } catch (e) { console.warn('trava', e); toast(e && e.name === 'NotAllowedError' ? 'Cadastro cancelado.' : 'Não consegui ligar a trava neste aparelho.'); }
  }
  async function desligarTrava() {
    try { if (!(await verificarDigital())) return; } catch (e) { toast('É preciso confirmar com a digital para desligar.'); return; }
    lsDel(LS.lock); render(); toast('Trava desligada.');
  }
  let unlocking = false;
  async function desbloquear() {
    if (unlocking) return; unlocking = true; S.ui.lockErr = ''; render();
    try {
      if (await verificarDigital()) { S.locked = false; S.ui.lockErr = ''; render(); if (S.conn) sync(); if (S.ui.abrirLancar) { S.ui.abrirLancar = false; setTimeout(() => openLanc(), 150); } }
    } catch (e) {
      console.warn('desbloquear', e);
      S.ui.lockErr = e && e.name === 'NotAllowedError' ? 'Não confirmado. Toque para tentar de novo.' : 'Não consegui usar a digital agora. Toque para tentar de novo.';
    } finally { unlocking = false; render(); }
  }
  function trancar() { if (!lockCfg()) return; S.locked = true; closeSheet(true); sheetState = null; render(); }
  function viewLock() {
    return `<div class="lock wrap"><div class="lock-in">${LOGO('lock-logo')}${WORD}
      <p class="small muted" style="margin:0">Seus gastos estão protegidos pela sua digital.</p>
      <button class="btn pri" data-act="unlock" ${unlocking ? 'disabled' : ''} style="min-width:240px">${ic('lock')}${unlocking ? 'Aguardando a digital…' : 'Desbloquear'}</button>
      ${S.ui.lockErr ? `<p class="err" role="alert" style="margin:0">${esc(S.ui.lockErr)}</p>` : ''}
      <p class="tiny muted" style="margin:0;max-width:300px">Se a digital falhar, a mesma janela aceita o PIN ou o padrão do celular.</p></div></div>`;
  }
  function viewTrava() {
    const on = !!lockCfg();
    return `<div class="stack">
      <p class="small ink2" style="margin:0">Com a trava ligada, o Todo dIA pede a sua digital (ou o PIN do celular) ao abrir e quando você volta depois de 1 minuto fora dele. É o mesmo recurso de "chave de acesso" que os bancos usam: a digital nunca sai do aparelho.</p>
      <div class="card stack" style="gap:12px"><div class="row between"><b>Trava com a digital</b><span class="pill ${on ? 'acc' : ''}">${on ? 'Ligada' : 'Desligada'}</span></div>
        ${on ? `<button class="btn danger" data-act="lock-off">Desligar a trava</button><button class="btn" data-act="lock-now">${ic('lock')}Trancar agora</button>`
          : `<button class="btn pri" data-act="lock-on">${ic('lock')}Ligar a trava</button><p class="tiny muted" style="margin:0">O Android vai perguntar se quer criar uma "chave de acesso" para este site. Confirme com a digital. Ela fica guardada no seu Gerenciador de Senhas do Google.</p>`}</div>
      <p class="tiny muted" style="margin:0">A trava protege o app contra quem pegar o celular. A planilha continua protegida pela chave secreta.</p></div>`;
  }

  // ---------- Telas ----------
  function viewInicio() {
    const d = D(), t = hoje(), ym = E.ymOf(t);
    const occ = occDoMes(ym), r = E.resumoMes(d.occ, ym);
    const [a, b] = brlParts(r.gastoReal);
    const fimMes = dataCurta(E.clampDate(ym, 31));
    const saldo = r.rendaReal - r.gastoReal;
    let mediaTxt = '';
    if (d.media != null) {
      const diff = d.media ? Math.round(((r.gastoReal + r.gastoPrev) / d.media - 1) * 100) : 0;
      mediaTxt = `<span class="pill ${diff > 5 ? 'warn' : 'acc'}">${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)}% ${diff > 0 ? 'acima' : 'abaixo'} da sua média (${brl(d.media)})</span>`;
    } else {
      const pm = primeiroMesMedia();
      mediaTxt = pm ? `<span class="small muted">Sua média mensal aparece em ${esc(mesNome(pm))}, depois de dois meses completos.</span>` : '';
    }
    const total = r.gastoReal + r.gastoPrev;
    const pace = total ? `<div class="pace" title="Realizado e previsto"><i style="width:${(r.gastoReal / total) * 100}%"></i><i class="prev" style="width:${(r.gastoPrev / total) * 100}%"></i></div>
      <div class="row between tiny muted"><span>Até hoje</span><span>Ainda por vir: ${brl(r.gastoPrev)}</span></div>` : '';
    const cards = meiosAtivos().filter((m) => m.tipo === 'credito').map((m) => {
      const f = E.fatura(m, t); const its = E.itensFatura(d.state, m.id, f.ref, t); const tot = E.sum(its, (o) => o.valor);
      const dias = E.diffDays(t, f.fecha);
      return `<button class="cc" style="--cc:${esc(m.cor || 'var(--accent)')}" data-act="go-card" data-id="${esc(m.id)}">
        <span class="nm"><i></i>${esc(m.nome)}</span><span class="v num">${brl(tot)}</span>
        <span class="d">Fecha ${dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`} · vence ${dataCurta(f.vence)}</span></button>`;
    }).join('');
    const prox = d.occ.filter((o) => o.fixo && o.data > t && o.data <= E.addDays(t, 7)).sort((x, y) => (x.data < y.data ? -1 : 1));
    const receber = d.occ.filter((o) => (o.tipo === 'despesa' || o.tipo === 'ressarcimento') && o.receber > 0 && !o.recebido && o.comp <= ym && !o.previsto);
    const totRec = E.sum(receber, (o) => o.receber);
    const cats = E.porCategoria(occ.filter((o) => !o.previsto), categorias()).slice(0, 4);
    const maxc = cats.length ? cats[0].total : 1;
    const ultimos = d.its.filter((i) => !i.excluido && i.tipo !== 'ajuste').sort((x, y) => (y.criadoEm || 0) - (x.criadoEm || 0)).slice(0, 5);
    const occByRef = new Map(d.occ.map((o) => [o.refId + '|' + o.comp, o]));
    const q = S.ui.quick;
    return `<div class="stack">
      <div><p class="today">${esc(dataLonga(t).replace(/^./, (c) => c.toUpperCase()))}<small>${esc(MESES[+ym.slice(5) - 1])} em andamento · dia ${E.parseISO(t).d} de ${E.dim(+ym.slice(0, 4), +ym.slice(5))}</small></p></div>
      <form class="quick" data-form="quick" autocomplete="off">${SPARK.replace('<svg', '<svg class="spark"')}
        <label class="sr" for="quickIn">Lançamento rápido</label>
        <input id="quickIn" name="q" placeholder="Ex.: padaria 18,50 pix" enterkeyhint="send" value="${esc(S.ui.quickText || '')}">
        <button type="submit">Lançar</button></form>
      ${q && q.parsed ? quickPreview(q) : ''}
      ${banners()}
      <section class="card hero" aria-label="Resumo do mês">
        <div class="row between"><span class="lead">Até hoje, em ${esc(MESES[+ym.slice(5) - 1])}, gastei</span><button class="small" style="color:var(--accent-ink);font-weight:650" data-act="tab" data-tab="relatorios">Relatórios</button></div>
        <div class="big num">${esc(a)}<span class="cents">${esc(b)}</span></div>
        <div class="small ink2">Previsão até ${fimMes}: <b class="num" style="color:var(--ink)">${brl(r.gastoReal + r.gastoPrev)}</b>${r.ressarcReal ? ` · já descontados ${brl(r.ressarcReal)} de ressarcimento` : ''}</div>
        ${mediaTxt ? `<div>${mediaTxt}</div>` : ''}
        ${pace}
        <div class="kpis"><div class="kpi"><span>Entradas</span><strong>${brl(r.rendaReal)}</strong></div>
          <div class="kpi"><span>Saldo</span><strong class="${saldo >= 0 ? 'pos' : 'neg'}">${brl(saldo)}</strong></div>
          <div class="kpi"><span>Lançamentos</span><strong>${r.n}</strong></div></div>
      </section>
      ${S.installPrompt ? `<button class="card row" data-act="install" style="text-align:left"><span class="mono rec">${ic('download')}</span><span class="grow"><b style="display:block">Instalar o Todo dIA</b><span class="small muted">Vira um ícone na tela inicial, abre em tela cheia</span></span>${ic('right', 'chev')}</button>` : ''}
      ${cards ? `<section class="section"><div class="sec-h"><h2>Faturas abertas</h2><button class="link" data-act="tab" data-tab="cartoes">Ver cartões</button></div><div class="cards-row">${cards}</div></section>` : ''}
      ${totRec ? `<button class="card row" data-act="sub" data-sub="receber" style="text-align:left"><span class="mono rec">${ic('users')}</span><span class="grow"><b style="display:block">A receber da família</b><span class="small muted">${receber.length} ${receber.length === 1 ? 'valor pendente' : 'valores pendentes'} (divididos e ressarcimentos)</span></span><b class="num">${brl(totRec)}</b>${ic('right', 'chev')}</button>` : ''}
      ${prox.length ? `<section class="section"><div class="sec-h"><h2>Próximos 7 dias</h2></div><div class="card list" style="padding-block:4px">${prox.map((o) => occRow(o, { noDim: true })).join('')}</div></section>` : ''}
      <section class="section"><div class="sec-h"><h2>Onde foi o dinheiro</h2>${cats.length ? '<button class="link" data-act="tab" data-tab="relatorios">Ver tudo</button>' : ''}</div>
        <div class="card">${cats.length ? cats.map((c) => `<button class="hbar" data-act="go-cat" data-cat="${esc(c.catId)}"><span class="top-l"><b>${esc(catSo(c.catId))}</b><span>${brl(c.total)}</span></span><span class="track"><span class="fill" style="width:${(c.total / maxc) * 100}%"></span></span></button>`).join('')
          : `<p class="small muted" style="margin:0">Seus gastos por categoria aparecem aqui assim que você lançar o primeiro.</p>`}</div></section>
      <section class="section"><div class="sec-h"><h2>Últimos lançamentos</h2>${ultimos.length ? '<button class="link" data-act="tab" data-tab="lancamentos">Ver todos</button>' : ''}</div>
        <div class="card list" style="padding-block:4px">${ultimos.length ? ultimos.map((i) => {
          const o = occByRef.get(i.id + '|' + E.ymOf(i.data)) || [...d.occ].find((x) => x.refId === i.id); return o ? occRow(o, { noDim: true }) : '';
        }).join('') : emptyState('Nenhum lançamento ainda', 'Escreva do seu jeito na barra acima, como "açougue 87,50 inter". O app entende o resto.')}</div></section>
    </div>`;
  }
  function quickPreview(q) {
    const p = q.parsed;
    const meio = meioById(p.meioId);
    const f = meio && meio.tipo === 'credito' && p.tipo === 'despesa' ? E.fatura(meio, p.data) : null;
    return `<div class="card preview" aria-live="polite">
      <div class="row between"><span class="eyebrow">${p.tipo === 'receita' ? 'Entrada' : 'Gasto'} entendido</span>${p.fonte === 'regra' ? '<span class="pill acc">aprendido</span>' : ''}</div>
      <div class="row between"><div class="grow"><b style="display:block;font-size:17px">${esc(p.desc || 'Sem descrição')}</b>
        <span class="small muted">${esc(p.catId ? catNome(p.catId, p.subId) : 'Sem categoria')} · ${esc(meio ? meio.nome : '')} · ${esc(p.data === hoje() ? 'hoje' : dataCurta(p.data))}${p.parcelas > 1 ? ` · ${p.parcelas}x` : ''}${p.div > 1 ? ` · ÷${p.div}` : ''}</span></div>
        <span class="val num">${p.valor ? brl(p.valor) : '—'}</span></div>
      ${f ? `<span class="tiny muted">Entra na fatura que vence em ${dataCurta(f.vence)}</span>` : ''}
      <div class="btns" style="grid-template-columns:1fr 1fr auto"><button class="btn pri" data-act="quick-save" ${!p.valor || !p.catId ? 'disabled' : ''}>${ic('check')}Salvar</button>
        <button class="btn" data-act="quick-edit">Ajustar</button><button class="btn ghost" data-act="quick-cancel" aria-label="Descartar">${ic('x')}</button></div>
    </div>`;
  }

  function viewLancamentos() {
    const ym = S.ui.mes, f = S.ui.filtro, busca = E.normKey(S.ui.busca);
    let occ = occDoMes(ym).filter((o) => o.tipo !== 'ajuste');
    const r = E.resumoMes(D().occ, ym);
    if (f === 'gastos') occ = occ.filter((o) => o.tipo === 'despesa');
    if (f === 'entradas') occ = occ.filter((o) => o.tipo === 'receita');
    if (f === 'fixos') occ = occ.filter((o) => o.fixo);
    if (f === 'divididos') occ = occ.filter((o) => o.div > 1);
    if (S.ui.lancCat) occ = occ.filter((o) => o.catId === S.ui.lancCat.catId && (!S.ui.lancCat.subId || o.subId === S.ui.lancCat.subId));
    if (busca) occ = occ.filter((o) => E.normKey(`${o.desc} ${catNome(o.catId, o.subId)} ${(meioById(o.meioId) || {}).nome || ''} ${o.obs}`).includes(busca));
    const groups = new Map();
    for (const o of occ) { if (!groups.has(o.data)) groups.set(o.data, []); groups.get(o.data).push(o); }
    const list = [...groups.entries()].map(([dt, arr]) => {
      const tot = E.sum(arr.filter((o) => o.tipo === 'despesa'), (o) => o.minha);
      return `<div class="day-h"><span>${esc(dataLonga(dt))}</span><span class="num">${tot ? brl(tot) : ''}</span></div><div class="card list" style="padding-block:2px">${arr.map((o) => occRow(o)).join('')}</div>`;
    }).join('');
    const chip = (k, l) => `<button class="chip" data-act="filtro" data-f="${k}" aria-pressed="${f === k}">${l}</button>`;
    return `<div class="stack">
      ${monthNav('mes', ym)}
      <div class="kpis"><div class="kpi"><span>Gastos</span><strong>${brl(r.gastoReal + r.gastoPrev)}</strong></div><div class="kpi"><span>Entradas</span><strong>${brl(r.rendaReal + r.rendaPrev)}</strong></div><div class="kpi"><span>Fixos</span><strong>${brl(r.fixos)}</strong></div></div>
      <label class="search">${ic('search')}<span class="sr">Buscar</span><input id="busca" type="search" placeholder="Buscar descrição, categoria ou cartão" value="${esc(S.ui.busca)}" autocomplete="off"></label>
      <div class="chips">${chip('tudo', 'Tudo')}${chip('gastos', 'Gastos')}${chip('entradas', 'Entradas')}${chip('fixos', 'Fixos')}${chip('divididos', 'Divididos')}
        ${S.ui.lancCat ? `<button class="chip" aria-pressed="true" data-act="clear-cat">${esc(S.ui.lancCat.subId ? subSo(S.ui.lancCat.catId, S.ui.lancCat.subId) : catSo(S.ui.lancCat.catId))} ${ic('x').replace('<svg', '<svg style="width:14px;height:14px"')}</button>` : ''}</div>
      ${banners()}
      ${list || `<div class="card">${emptyState('Nada por aqui', busca || f !== 'tudo' || S.ui.lancCat ? 'Nenhum lançamento com esse filtro neste mês.' : 'Nenhum lançamento neste mês ainda.', '<button class="btn pri sm" data-act="new">Lançar agora</button>')}</div>`}
    </div>`;
  }

  function viewCartoes() {
    const cards = meiosAtivos().filter((m) => m.tipo === 'credito');
    if (!cards.length) return `<div class="card">${emptyState('Nenhum cartão de crédito', 'Cadastre seus cartões em Ajustes › Formas de pagamento.', '<button class="btn pri sm" data-act="sub" data-sub="meios">Cadastrar</button>')}</div>`;
    const t = hoje();
    const m = cards.find((c) => c.id === S.ui.cardId) || cards[0];
    S.ui.cardId = m.id;
    const atual = E.fatura(m, t);
    const ref = S.ui.faturaRef || atual.ref;
    const f = E.faturaPorRef(m, ref);
    const st = E.faturaStatus(f, t);
    const its = E.itensFatura(D().state, m.id, ref, t);
    const tot = E.sum(its, (o) => o.valor);
    const comp = { compras: E.sum(its.filter((o) => !o.fixo && !o.parcela && o.tipo !== 'ajuste'), (o) => o.valor), parcelas: E.sum(its.filter((o) => o.parcela), (o) => o.valor), fixos: E.sum(its.filter((o) => o.fixo), (o) => o.valor), ajuste: E.sum(its.filter((o) => o.tipo === 'ajuste'), (o) => o.valor) };
    const stTxt = { aberta: ['acc', 'Aberta'], fechada: ['coin', 'Fechada, a pagar'], vencida: ['', 'Vencida'] }[st];
    const dias = E.diffDays(t, st === 'aberta' ? f.fecha : f.vence);
    // próximas 6 faturas
    const refs = Array.from({ length: 6 }, (_, i) => E.addMonthsYM(atual.ref, i));
    const futuras = refs.map((r) => E.sum(E.itensFatura(D().state, m.id, r, t), (o) => o.valor));
    S.charts.fut = { kind: 'col', months: refs, series: [{ name: 'Fatura', color: 'var(--accent)', values: futuras }], sel: ref, act: 'fatura-ref', labels: refs.map(mesCurto) };
    const compRow = (l, v) => v ? `<div class="row between small"><span class="ink2">${l}</span><b class="num">${brl(v)}</b></div>` : '';
    return `<div class="stack">
      <div class="chips">${cards.map((c) => `<button class="chip" style="--cc:${esc(c.cor || 'var(--accent)')}" data-act="card" data-id="${esc(c.id)}" aria-pressed="${c.id === m.id}"><i></i>${esc(c.nome)}</button>`).join('')}</div>
      <div class="monthnav"><button class="icon-btn" data-act="fatura" data-d="-1" aria-label="Fatura anterior">${ic('left')}</button>
        <strong>Fatura de ${esc(MESES[+ref.slice(5) - 1])}${ref.slice(0, 4) !== t.slice(0, 4) ? ' ' + ref.slice(0, 4) : ''}</strong>
        <button class="icon-btn" data-act="fatura" data-d="1" aria-label="Próxima fatura">${ic('right')}</button></div>
      <section class="card hero" style="--cc:${esc(m.cor || 'var(--accent)')}">
        <div class="row between"><span class="pill ${stTxt[0]}">${stTxt[1]}</span><span class="small muted">${ref === atual.ref ? 'fatura atual' : ref < atual.ref ? 'fatura anterior' : 'fatura futura'}</span></div>
        <div class="big num">${brlParts(tot)[0]}<span class="cents">${brlParts(tot)[1]}</span></div>
        <div class="row between small"><span class="ink2">Compras de ${dataCurta(f.inicio)} a ${dataCurta(E.addDays(f.fecha, -1))}</span></div>
        <div class="kpis"><div class="kpi"><span>Fecha</span><strong>${dataCurta(f.fecha)}</strong></div><div class="kpi"><span>Vence</span><strong>${dataCurta(f.vence)}</strong></div>
          <div class="kpi"><span>${st === 'aberta' ? 'Fecha em' : st === 'fechada' ? 'Vence em' : 'Venceu há'}</span><strong>${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}</strong></div></div>
        <div class="stack" style="gap:6px">${compRow('Compras do período', comp.compras)}${compRow('Parcelas', comp.parcelas)}${compRow('Gastos fixos', comp.fixos)}${compRow('Ajuste de valor anterior ao app', comp.ajuste)}</div>
        <button class="btn sm" data-act="ajuste" data-ref="${esc(ref)}">${ic('wallet')}Ajustar com o valor do banco</button>
      </section>
      <section class="section"><div class="sec-h"><h2>Próximas faturas</h2><span class="tiny muted">toque numa barra</span></div>
        <div class="card"><div class="chart" data-chart="fut" style="height:170px"></div><p class="tiny muted" style="margin:6px 0 0">Já inclui parcelas e gastos fixos programados.</p></div></section>
      <section class="section"><div class="sec-h"><h2>Itens da fatura</h2><span class="small muted">${its.length}</span></div>
        <div class="card list" style="padding-block:2px">${its.length ? its.map((o) => occRow(o, { noDim: true })).join('') : emptyState('Fatura vazia', 'Nenhum lançamento neste cartão para esta fatura.')}</div></section>
    </div>`;
  }

  function relPeriodo() {
    const end = S.ui.relMes, p = S.ui.relPer;
    const n = p === 'mes' ? 1 : p === '3m' ? 3 : p === '6m' ? 6 : 12;
    return { de: E.addMonthsYM(end, -(n - 1)), ate: end, n };
  }
  function viewRelatorios() {
    const d = D(), { de, ate, n } = relPeriodo();
    const occ = d.occ.filter((o) => o.comp >= de && o.comp <= ate);
    const gastos = occ.filter((o) => o.tipo === 'despesa');
    const totRess = E.sum(occ.filter((o) => o.tipo === 'ressarcimento'), (o) => o.valor);
    const totBruto = E.sum(gastos, (o) => o.minha);
    const totG = totBruto - totRess, totR = E.sum(occ.filter((o) => o.tipo === 'receita'), (o) => o.valor);
    const cats = E.porCategoria(gastos, categorias());
    const maxc = Math.max(1, ...cats.map((c) => Math.max(c.total, (mediaCat(c.catId) || 0) * n)));
    const seg = (k, l) => `<button data-act="relper" data-p="${k}" aria-pressed="${S.ui.relPer === k}">${l}</button>`;
    const perTxt = n === 1 ? mesNome(ate) : `${mesCurto(de)} a ${mesCurto(ate)}`;
    const catRows = cats.map((c) => {
      const med = mediaCat(c.catId);
      const open = S.ui.open['cat:' + c.catId];
      const medP = med != null ? med * n : null;
      const vs = medP ? Math.round((c.total / medP - 1) * 100) : null;
      const subs = open ? `<div class="subwrap">${c.subs.map((s) => `<button class="hbar sub" data-act="go-cat" data-cat="${esc(c.catId)}" data-sub="${esc(s.subId)}"><span class="top-l"><b>${esc(subSo(c.catId, s.subId) || 'Sem subcategoria')}</b><span>${brl(s.total)}</span></span><span class="track"><span class="fill" style="width:${(s.total / c.total) * 100}%"></span></span></button>`).join('')}
        <div style="padding:4px 0 0 14px"><button class="small" style="color:var(--accent-ink);font-weight:650" data-act="go-cat" data-cat="${esc(c.catId)}">Ver lançamentos de ${esc(catSo(c.catId))} ›</button></div></div>` : '';
      return `<button class="hbar" data-act="toggle" data-k="cat:${esc(c.catId)}" aria-expanded="${!!open}">
        <span class="top-l"><b>${esc(catSo(c.catId))}</b><span>${brl(c.total)}</span></span>
        <span class="track"><span class="fill" style="width:${(c.total / maxc) * 100}%"></span>${medP ? `<span class="avg" style="left:${Math.min(99.5, (medP / maxc) * 100)}%" title="Média"></span>` : ''}</span>
        <span class="meta"><span>${totG ? Math.round((c.total / totG) * 100) : 0}% do total · ${c.n} ${c.n === 1 ? 'lançamento' : 'lançamentos'}</span>${vs != null ? `<span>${vs > 0 ? '▲' : '▼'} ${Math.abs(vs)}% vs média</span>` : ''}</span></button>${subs}`;
    }).join('');
    // Evolução (12 meses até relMes)
    // a evolução começa no primeiro mês com dados (no máximo 12 meses)
    const primeiro = d.its.filter((i) => !i.excluido).reduce((m, i) => (E.ymOf(i.data) < m ? E.ymOf(i.data) : m), d.inicioUso ? E.ymOf(d.inicioUso) : ate);
    const ini = E.addMonthsYM(ate, -11) > primeiro ? E.addMonthsYM(ate, -11) : primeiro;
    const meses12 = E.monthsBetween(ini > ate ? ate : ini, ate);
    const catSel = S.ui.relCat;
    const t = hoje();
    // sem filtro de categoria: quanto você gastou de fato (já descontados ressarcimentos); com filtro: a categoria
    const val = (o) => (catSel ? (o.tipo === 'despesa' && o.catId === catSel ? o.minha : 0) : E.liquido(o));
    const gReal = meses12.map((ym) => Math.max(0, E.sum(d.occ.filter((o) => o.comp === ym && !o.previsto), val)));
    const gPrev = meses12.map((ym) => Math.max(0, E.sum(d.occ.filter((o) => o.comp === ym && o.previsto), val)));
    const avg = catSel ? mediaCat(catSel) : d.media;
    S.charts.evo = { kind: 'col', months: meses12, series: [{ name: 'Gastos', color: 'var(--accent)', values: gReal, prev: gPrev }], avg, sel: ate, act: 'rel-mes', labels: meses12.map((m) => MES3[+m.slice(5) - 1]) };
    const rendaM = meses12.map((ym) => E.sum(d.occ.filter((o) => o.comp === ym && o.tipo === 'receita'), (o) => o.valor));
    const gastoM = meses12.map((ym, i) => gReal[i] + gPrev[i]);
    const gastoAll = meses12.map((ym) => Math.max(0, E.sum(d.occ.filter((o) => o.comp === ym), E.liquido)));
    S.charts.rxg = { kind: 'group', months: meses12, series: [{ name: 'Entradas', color: 'var(--s2)', values: rendaM }, { name: 'Gastos', color: 'var(--accent)', values: gastoAll }], sel: ate, act: 'rel-mes', labels: meses12.map((m) => MES3[+m.slice(5) - 1]) };
    const fixM = meses12.map((ym) => E.sum(d.occ.filter((o) => o.comp === ym && o.tipo === 'despesa' && o.fixo), (o) => o.minha));
    const varM = meses12.map((ym) => E.sum(d.occ.filter((o) => o.comp === ym && o.tipo === 'despesa' && !o.fixo), (o) => o.minha));
    S.charts.fxv = { kind: 'stack', months: meses12, series: [{ name: 'Fixos', color: 'var(--accent)', values: fixM }, { name: 'Variáveis', color: 'var(--s2)', values: varM }], sel: ate, act: 'rel-mes', labels: meses12.map((m) => MES3[+m.slice(5) - 1]) };
    // Forma de pagamento
    const porMeio = new Map(); for (const o of gastos) porMeio.set(o.meioId, (porMeio.get(o.meioId) || 0) + o.minha);
    const meioRows = [...porMeio.entries()].sort((a, b) => b[1] - a[1]);
    const maxm = meioRows.length ? meioRows[0][1] : 1;
    // Maiores gastos
    const top = gastos.filter((o) => !o.fixo).sort((a, b) => b.minha - a.minha).slice(0, 6);
    // Gastos divididos
    const div = gastos.filter((o) => o.div > 1);
    const pago = E.sum(div, (o) => o.valor), minha = E.sum(div, (o) => o.minha), recP = E.sum(div.filter((o) => !o.recebido), (o) => o.receber);
    const tableEvo = `<details class="tbl"><summary>Ver números</summary><div class="table-wrap"><table class="t"><thead><tr><th>Mês</th><th>Gastos</th><th>Entradas</th><th>Fixos</th><th>Saldo</th></tr></thead><tbody>${meses12.map((ym, i) => `<tr><td>${mesCurto(ym)}</td><td>${brl(gastoAll[i])}</td><td>${brl(rendaM[i])}</td><td>${brl(fixM[i])}</td><td>${brl(rendaM[i] - gastoAll[i])}</td></tr>`).join('')}</tbody></table></div></details>`;
    const catOpts = `<select class="inp" id="relCat" style="padding:8px 34px 8px 12px;font-size:14px;width:auto;max-width:100%"><option value="">Todas as categorias</option>${categorias().filter((c) => (c.tipo || 'despesa') === 'despesa').map((c) => `<option value="${esc(c.id)}" ${catSel === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`;
    const pm = primeiroMesMedia();
    return `<div class="stack">
      <button class="card row" data-act="rp-open" style="text-align:left"><span class="mono rec">${ic('download')}</span><span class="grow"><b style="display:block">Relatório completo em PDF</b><span class="small muted">Cronologia, categorias, dias da semana, fixos, parcelas e Airbnb</span></span>${ic('right', 'chev')}</button>
      <div class="seg" role="group" aria-label="Período">${seg('mes', 'Mês')}${seg('3m', '3 meses')}${seg('6m', '6 meses')}${seg('12m', '12 meses')}</div>
      ${monthNav('relmes', ate)}
      ${totRess ? `<p class="tiny muted" style="margin:0">Gastos já descontam ${brl(totRess)} de ressarcimentos (o gráfico de categorias mostra os valores cheios da sua parte: ${brl(totBruto)}).</p>` : ''}
      <div class="kpis"><div class="kpi"><span>Gastos</span><strong>${brl(totG)}</strong></div><div class="kpi"><span>Entradas</span><strong>${brl(totR)}</strong></div>
        <div class="kpi"><span>${n > 1 ? 'Média/mês' : 'Saldo'}</span><strong class="${n > 1 ? '' : totR - totG >= 0 ? 'pos' : 'neg'}">${n > 1 ? brl(Math.round(totG / n)) : brl(totR - totG)}</strong></div></div>
      <section class="section"><div class="sec-h"><h2>Gastos por categoria</h2><span class="tiny muted">${esc(perTxt)}</span></div>
        <div class="card">${cats.length ? catRows : '<p class="small muted" style="margin:0">Nenhum gasto neste período.</p>'}
        ${cats.length ? `<p class="tiny muted" style="margin:10px 0 0">${d.completos.length >= 2 ? 'O traço escuro em cada barra marca a sua média. ' : ''}Toque numa categoria para ver as subcategorias.</p>` : ''}</div></section>
      <section class="section"><div class="sec-h"><h2>Evolução dos gastos</h2></div>
        <div class="card stack" style="gap:10px">${catOpts}<div class="chart" data-chart="evo" style="height:210px"></div>
        <div class="legend"><span><i style="background:var(--accent)"></i>Realizado</span><span><i style="background:color-mix(in srgb,var(--accent) 35%,transparent)"></i>Previsto</span>${avg != null ? '<span><i style="background:var(--ink);height:2px;width:14px"></i>Sua média</span>' : ''}</div>
        ${avg == null ? `<p class="tiny muted" style="margin:0">A linha de média aparece depois de dois meses completos lançados${pm ? ` (a partir de ${esc(mesNome(pm))})` : ''}.</p>` : ''}
        ${tableEvo}</div></section>
      <section class="section"><div class="sec-h"><h2>Entradas × gastos</h2></div>
        <div class="card stack" style="gap:10px"><div class="chart" data-chart="rxg" style="height:200px"></div>
        <div class="legend"><span><i style="background:var(--s2)"></i>Entradas</span><span><i style="background:var(--accent)"></i>Gastos</span></div></div></section>
      <section class="section"><div class="sec-h"><h2>Fixos × variáveis</h2></div>
        <div class="card stack" style="gap:10px"><div class="chart" data-chart="fxv" style="height:200px"></div>
        <div class="legend"><span><i style="background:var(--accent)"></i>Fixos</span><span><i style="background:var(--s2)"></i>Variáveis</span></div></div></section>
      ${div.length ? `<section class="section"><div class="sec-h"><h2>Gastos divididos</h2></div>
        <div class="card stack" style="gap:8px"><div class="row between small"><span class="ink2">Você pagou</span><b class="num">${brl(pago)}</b></div>
        <div class="row between small"><span class="ink2">Sua parte (entra nos relatórios)</span><b class="num">${brl(minha)}</b></div>
        <div class="row between small"><span class="ink2">Ainda a receber</span><b class="num">${brl(recP)}</b></div>
        <button class="btn sm" data-act="sub" data-sub="receber">${ic('users')}Ver o que falta receber</button></div></section>` : ''}
      <section class="section"><div class="sec-h"><h2>Por forma de pagamento</h2></div>
        <div class="card">${meioRows.length ? meioRows.map(([id, v]) => `<div class="hbar"><span class="top-l"><b>${esc((meioById(id) || { nome: 'Outro' }).nome)}</b><span>${brl(v)}</span></span><span class="track"><span class="fill" style="width:${(v / maxm) * 100}%;background:var(--s2)"></span></span></div>`).join('') : '<p class="small muted" style="margin:0">Sem gastos no período.</p>'}</div></section>
      <section class="section"><div class="sec-h"><h2>Maiores gastos avulsos</h2></div>
        <div class="card list" style="padding-block:2px">${top.length ? top.map((o) => occRow(o, { noDim: true })).join('') : '<p class="small muted">Sem gastos avulsos no período.</p>'}</div></section>
    </div>`;
  }

  function viewReceber() {
    const d = D(), ym = ymHoje();
    const rx = (o) => (o.tipo === 'despesa' || o.tipo === 'ressarcimento') && o.receber > 0;
    const pend = d.occ.filter((o) => rx(o) && !o.recebido && o.comp <= ym && !o.previsto);
    const ok = d.occ.filter((o) => rx(o) && o.recebido).slice(0, 30);
    const row = (o, done) => `<div class="li"><span class="mono ${o.fixo ? 'rec' : ''}">${o.fixo ? ic('repeat') : esc(iniciais(o.desc))}</span>
      <span class="grow"><span class="t" style="display:block">${esc(o.desc)}</span><span class="s" style="display:block">${esc(mesCurto(o.comp))} · ${o.tipo === 'ressarcimento' ? 'ressarcimento combinado' : `pagou ${brl(o.valor)} ÷ ${o.div} · sua parte ${brl(o.minha)}`}</span></span>
      <span class="amt">${brl(o.receber)}<small><button class="small" style="color:var(--accent-ink);font-weight:750" data-act="recebido" data-key="${esc(o.key)}" data-v="${done ? 0 : 1}">${done ? 'desfazer' : 'recebi'}</button></small></span></div>`;
    return `<div class="stack">
      <p class="small ink2" style="margin:0">Gastos que você pagou inteiros e divide com a família, mais os ressarcimentos combinados. Nos relatórios entra só a sua parte. Marque "recebi" quando o dinheiro chegar.</p>
      <div class="card hero"><span class="eyebrow">Total a receber</span><div class="big num">${brlParts(E.sum(pend, (o) => o.receber)).join('')}</div></div>
      <div class="card list" style="padding-block:2px">${pend.length ? pend.map((o) => row(o, false)).join('') : emptyState('Tudo recebido', 'Nenhuma parte pendente.')}</div>
      ${ok.length ? `<details class="tbl"><summary>Já recebidos (${ok.length})</summary><div class="card list" style="padding-block:2px;margin-top:8px">${ok.map((o) => row(o, true)).join('')}</div></details>` : ''}
    </div>`;
  }

  // ---------- Ajustes ----------
  function viewAjustes() {
    const sub = S.ui.sub;
    if (sub === 'recorrentes') return viewRecorrentes();
    if (sub === 'meios') return viewMeios();
    if (sub === 'categorias') return viewCategorias();
    if (sub === 'regras') return viewRegras();
    if (sub === 'backup' || sub === 'conexao') return viewConexao();
    if (sub === 'lixeira') return viewLixeira();
    if (sub === 'sobre') return viewSobre();
    if (sub === 'trava') return viewTrava();
    if (sub === 'importar') return viewImportar();
    if (sub === 'receber') return viewReceber();
    const totFix = E.sum(S.recorrentes.filter((r) => r.tipo !== 'receita'), (r) => E.valorRecorrente(r, ymHoje()) || E.valorRecorrente(r, E.addMonthsYM(ymHoje(), 1)) || 0);
    const item = (k, icn, t, s) => `<button class="li" data-act="sub" data-sub="${k}"><span class="mono">${ic(icn)}</span><span class="grow"><span class="t" style="display:block">${t}</span><span class="s" style="display:block">${s}</span></span>${ic('right', 'chev')}</button>`;
    const lix = itens().filter((i) => i.excluido).length;
    return `<div class="stack settings">
      <div class="card list" style="padding-block:2px">
        ${item('recorrentes', 'repeat', 'Gastos fixos e entradas fixas', `${S.recorrentes.length} cadastrados · ${brl(totFix)} por mês em gastos`)}
        ${item('meios', 'card', 'Cartões e formas de pagamento', `${meiosAtivos().length} ativos · fechamento e vencimento`)}
        ${item('categorias', 'tag', 'Categorias', `${categorias().length} categorias com subcategorias`)}
        ${item('regras', 'brain', 'O que o app aprendeu', `${Object.keys(S.cfg.regras || {}).length} descrições memorizadas`)}
      </div>
      <div class="card list" style="padding-block:2px">
        ${item('receber', 'users', 'A receber da família', 'Divididos e ressarcimentos')}
        ${item('conexao', 'cloud', 'Sua planilha e conexão', S.lastSync ? 'Sincronizado ' + new Date(S.lastSync).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Ainda não sincronizado')}
        ${item('importar', 'download', 'Importar lançamentos', 'Cole um bloco preparado pelo Claude')}
        ${item('lixeira', 'trash', 'Lixeira', lix ? `${lix} ${lix === 1 ? 'item' : 'itens'}` : 'Vazia')}
        ${item('trava', 'lock', 'Trava com a digital', lockCfg() ? 'Ligada' : 'Desligada')}
        ${item('sobre', 'info', 'Sobre o Todo dIA', 'Como funciona · versão ' + VERSION)}
      </div></div>`;
  }
  function viewRecorrentes() {
    const ym = ymHoje();
    const row = (r) => {
      const v = E.valorRecorrente(r, ym) ?? E.valorRecorrente(r, r.inicio > ym ? r.inicio : ym);
      const meio = meioById(r.meioId);
      const enc = r.fim && r.fim < ym;
      const s = [catNome(r.catId, r.subId), meio ? meio.nome : '', `dia ${r.dia}`, r.div > 1 ? `÷${r.div}` : '', r.fim ? (enc ? `encerrado em ${mesCurto(r.fim)}` : `até ${mesCurto(r.fim)}`) : '', r.inicio > ym ? `começa em ${mesCurto(r.inicio)}` : ''].filter(Boolean).join(' · ');
      return `<button class="li ${enc ? 'dim' : ''}" data-act="rec-edit" data-id="${esc(r.id)}"><span class="mono ${r.tipo !== 'despesa' ? 'in' : 'rec'}">${ic('repeat')}</span><span class="grow"><span class="t" style="display:block">${esc(r.desc)}</span><span class="s" style="display:block">${esc(s)}</span></span><span class="amt ${r.tipo !== 'despesa' ? 'in' : ''}">${v ? (r.tipo === 'ressarcimento' ? '−' : '') + brl(v) : '—'}${r.div > 1 && v ? `<small>sua parte ${brl(Math.round(v / r.div))}</small>` : ''}</span></button>`;
    };
    const ativos = S.recorrentes.filter((r) => !r.fim || r.fim >= ym).sort((a, b) => (a.tipo === b.tipo ? (a.desc < b.desc ? -1 : 1) : a.tipo === 'receita' ? 1 : -1));
    const enc = S.recorrentes.filter((r) => r.fim && r.fim < ym);
    return `<div class="stack">
      <p class="small ink2" style="margin:0">Valores que se repetem todo mês. Eles entram sozinhos nas faturas, nos relatórios e na previsão. Mudou o valor? Edite e escolha a partir de quando vale.</p>
      <button class="btn pri" data-act="rec-new">${ic('plus')}Novo gasto ou entrada fixa</button>
      <div class="card list" style="padding-block:2px">${ativos.length ? ativos.map(row).join('') : emptyState('Nenhum fixo cadastrado', 'Cadastre assinaturas, seguros, repasses e salário.')}</div>
      ${enc.length ? `<details class="tbl"><summary>Encerrados (${enc.length})</summary><div class="card list" style="padding-block:2px;margin-top:8px">${enc.map(row).join('')}</div></details>` : ''}
    </div>`;
  }
  function viewMeios() {
    return `<div class="stack">
      <p class="small ink2" style="margin:0">O dia de fechamento define em qual fatura cada compra cai. Confira com o app do banco.</p>
      <div class="card list" style="padding-block:2px">${meios().map((m) => `<button class="li ${m.ativo === false ? 'dim' : ''}" data-act="meio-edit" data-id="${esc(m.id)}"><span class="mono" style="background:${esc(m.cor || 'var(--surface-2)')};color:#fff">${esc(iniciais(m.banco || m.nome))}</span>
        <span class="grow"><span class="t" style="display:block">${esc(m.nome)}</span><span class="s" style="display:block">${esc(TIPOS_MEIO[m.tipo] || m.tipo)}${m.tipo === 'credito' ? ` · fecha dia ${m.fechamento} · vence dia ${m.vencimento}` : ''}${m.ativo === false ? ' · inativo' : ''}</span></span>${ic('right', 'chev')}</button>`).join('')}</div>
      <button class="btn" data-act="meio-new">${ic('plus')}Nova forma de pagamento</button></div>`;
  }
  function viewCategorias() {
    return `<div class="stack">
      <p class="small ink2" style="margin:0">Toque numa subcategoria para renomear ou definir uma divisão padrão (ex.: dividir por 5).</p>
      ${categorias().map((c) => `<div class="card" style="padding:12px 14px"><div class="row between"><b>${esc(c.nome)}</b><span class="row"><span class="pill">${c.tipo === 'receita' ? 'entrada' : 'gasto'}</span><button class="icon-btn" data-act="cat-edit" data-cat="${esc(c.id)}" aria-label="Renomear ${esc(c.nome)}">${ic('tag')}</button></span></div>
        <div class="wrapflex" style="margin-top:8px">${(c.subs || []).map((s) => `<button class="chip" data-act="sub-edit" data-cat="${esc(c.id)}" data-sub="${esc(s.id)}">${esc(s.nome)}${s.div > 1 ? ` <span class="pill acc">÷${s.div}</span>` : ''}</button>`).join('')}
        <button class="chip" data-act="sub-new" data-cat="${esc(c.id)}" style="border-style:dashed">${ic('plus').replace('<svg', '<svg style="width:14px;height:14px"')} Nova</button></div></div>`).join('')}
      <button class="btn" data-act="cat-new">${ic('plus')}Nova categoria</button></div>`;
  }
  function viewRegras() {
    const ent = Object.entries(S.cfg.regras || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
    return `<div class="stack">
      <p class="small ink2" style="margin:0">Sempre que você salva um lançamento, o Todo dIA memoriza a categoria e a forma de pagamento daquela descrição. Na próxima vez, ele acerta sozinho. Antes disso, ele usa um dicionário de lojas e serviços comuns em BH. Tudo roda no próprio celular, sem depender de ninguém.</p>
      <div class="card list" style="padding-block:2px">${ent.length ? ent.map(([k, r]) => `<div class="li"><span class="mono">${ic('brain')}</span><span class="grow"><span class="t" style="display:block">${esc(k.replace(/_/g, ' '))}</span><span class="s" style="display:block">${esc(catNome(r.catId, r.subId))}${r.meioId && meioById(r.meioId) ? ' · ' + esc(meioById(r.meioId).nome) : ''}</span></span><button class="icon-btn" data-act="regra-del" data-k="${esc(k)}" aria-label="Esquecer">${ic('x')}</button></div>`).join('') : emptyState('Nada memorizado ainda', 'A cada lançamento salvo, a IA aprende a sua forma de escrever.')}</div></div>`;
  }
  function viewConexao() {
    const url = S.conn ? S.conn.url : '';
    const curto = url ? url.replace(/^https:\/\/script\.google\.com\/macros\/s\//, '…/').slice(0, 26) + '…' : '';
    const st = { ok: ['acc', 'Sincronizado'], sync: ['acc', 'Sincronizando…'], offline: ['coin', 'Sem internet'], erro: ['warn', 'Com problema'], idle: ['', 'Aguardando'] }[S.net] || ['', ''];
    return `<div class="stack">
      <p class="small ink2" style="margin:0">Seus dados ficam numa planilha Google na sua conta, na pasta "Todo dIA". Este aparelho guarda uma cópia para abrir rápido e funcionar sem internet. Toda alteração vai para a planilha assim que houver conexão.</p>
      <div class="card stack" style="gap:10px">
        <div class="row between"><b>Situação</b><span class="pill ${st[0]}">${st[1]}</span></div>
        <div class="row between small"><span class="ink2">Última sincronização</span><b>${S.lastSync ? new Date(S.lastSync).toLocaleString('pt-BR') : '—'}</b></div>
        <div class="row between small"><span class="ink2">Alterações na fila</span><b>${S.outbox.length}</b></div>
        <div class="row between small"><span class="ink2">Programa da planilha</span><b class="num" style="font-size:12px">${esc(curto)}</b></div>
        ${S.syncErr ? `<p class="err" style="margin:0">${esc(S.syncErr)}</p>` : ''}
        <button class="btn pri" data-act="flush">${ic('repeat')}Sincronizar agora</button>
        ${S.server.planilhaUrl ? `<a class="btn" href="${esc(S.server.planilhaUrl)}" target="_blank" rel="noopener">${ic('list')}Abrir minha planilha</a>` : ''}
        <button class="btn" data-act="backup-xlsx">${ic('download')}Baixar cópia (.xlsx)</button>
        <p class="tiny muted" style="margin:0" id="backupMsg">A planilha também faz uma cópia automática todo domingo na pasta "Backups".</p>
      </div>
      <div class="card stack" style="gap:10px"><b>Trocar chave ou endereço</b>
        <p class="small muted" style="margin:0">Use se você trocou a chave na planilha (menu Todo dIA › Trocar chave) ou reimplantou o programa.</p>
        <button class="btn" data-act="reconnect">Conectar de novo</button>
        <button class="btn danger" data-act="disconnect">Desconectar este aparelho</button></div>
    </div>`;
  }
  function viewSetup() {
    const e = S.ui.setupErr || '';
    return `<div class="wrap" style="padding-block:28px 40px"><div class="stack" style="max-width:520px;margin:0 auto">
      <div class="logo-xl">${LOGO()}${WORD}<span class="small muted">seu dinheiro, um dia de cada vez</span></div>
      <div class="card stack">
        <b style="font-family:var(--f-display);font-size:19px">Conectar à sua planilha</b>
        <p class="small ink2" style="margin:0">Só na primeira vez. Os dois dados abaixo estão na sua planilha "Todo dIA": o endereço aparece quando você implanta o programa, e a chave fica na aba "Leia-me".</p>
        <form class="stack" data-form="setup" autocomplete="off" style="gap:12px">
          <div class="field"><label for="cUrl">Endereço do App da Web</label><input class="inp" id="cUrl" name="url" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(S.ui.setupUrl || '')}" autocomplete="off" spellcheck="false"></div>
          <div class="field"><label for="cKey">Chave</label><input class="inp" id="cKey" name="key" placeholder="Cole a chave aqui" value="${esc(S.ui.setupKey || '')}" autocomplete="off" spellcheck="false"></div>
          ${e ? `<p class="err" role="alert" style="margin:0">${esc(e)}</p>` : ''}
          <button class="btn pri" type="submit" ${S.ui.setupBusy ? 'disabled' : ''}>${S.ui.setupBusy ? 'Conectando…' : 'Conectar'}</button>
          ${S.ui.prevConn ? '<button class="btn ghost" type="button" data-act="setup-cancel">Cancelar</button>' : ''}
        </form>
        <p class="tiny muted" style="margin:0">Quem abrir este endereço sem a sua chave vê só esta tela. Seus números nunca ficam no site.</p>
      </div></div></div>`;
  }
  function viewLixeira() {
    const ex = itens().filter((i) => i.excluido).sort((a, b) => (b.excluidoEm || 0) - (a.excluidoEm || 0));
    return `<div class="stack"><p class="small ink2" style="margin:0">Lançamentos apagados ficam aqui até você restaurar ou apagar de vez.</p>
      <div class="card list" style="padding-block:2px">${ex.length ? ex.map((i) => `<div class="li"><span class="mono">${esc(iniciais(i.desc))}</span><span class="grow"><span class="t" style="display:block">${esc(i.desc)}</span><span class="s" style="display:block">${dataCurta(i.data)}/${i.data.slice(2, 4)} · ${esc(catNome(i.catId, i.subId))}</span></span>
        <span class="amt">${brl(i.valor)}<small><button class="small" style="color:var(--accent-ink);font-weight:750" data-act="restore" data-id="${esc(i.id)}">restaurar</button> · <button class="small" style="color:var(--danger);font-weight:750" data-act="purge" data-id="${esc(i.id)}">apagar</button></small></span></div>`).join('') : emptyState('Lixeira vazia', 'Nada apagado.')}</div></div>`;
  }
  function viewSobre() {
    return `<div class="stack"><div class="logo-xl">${LOGO()}${WORD}<span class="small muted">seu dinheiro, um dia de cada vez · versão ${VERSION}</span></div>
      <div class="card stack small ink2" style="gap:10px">
        <p style="margin:0"><b style="color:var(--ink)">Lançar.</b> Escreva do seu jeito: "supernosso 312,40", "gasolina 200 pix ontem", "capacete 900 c6 3x", "conta de luz 230 dividido por 5". O app entende valor, data, cartão, parcelas e divisão.</p>
        <p style="margin:0"><b style="color:var(--ink)">Categorias.</b> Primeiro ele procura no que já aprendeu com você, depois num dicionário de lojas e serviços. Quando você corrige, ele memoriza.</p>
        <p style="margin:0"><b style="color:var(--ink)">Faturas.</b> Compras feitas antes do dia de fechamento entram na fatura do mês; a partir do dia de fechamento, na seguinte. Parcelas caem uma em cada fatura.</p>
        <p style="margin:0"><b style="color:var(--ink)">Fixos.</b> Entram sozinhos no dia 1º de cada mês. Ressarcimentos fixos abatem do quanto você gastou.</p>
        <p style="margin:0"><b style="color:var(--ink)">Divididos.</b> Você lança o valor cheio que pagou. Nos relatórios entra só a sua parte, e o resto vai para "A receber".</p>
        <p style="margin:0"><b style="color:var(--ink)">Média.</b> A linha de média aparece depois de dois meses completos lançados e usa até os últimos 12 meses.</p>
        <p style="margin:0"><b style="color:var(--ink)">Seus dados.</b> Ficam numa planilha Google sua. O site só tem o programa; sem a sua chave, ninguém vê nada.</p>
      </div></div>`;
  }

  // ---------- Relatório completo (para salvar em PDF) ----------
  const DIAS_SEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function reportData(per) {
    const d = D(), t = hoje(), ymT = E.ymOf(t);
    const ativos = d.its.filter((i) => !i.excluido);
    let primeiro = d.inicioUso ? E.ymOf(d.inicioUso) : ymT;
    for (const i of ativos) if (E.ymOf(i.data) < primeiro) primeiro = E.ymOf(i.data);
    const n = { '3m': 3, '6m': 6, '12m': 12 }[per];
    let de = n ? E.addMonthsYM(ymT, -(n - 1)) : primeiro;
    if (de < primeiro) de = primeiro;
    const ate = ymT;
    const meses = E.monthsBetween(de, ate);
    const occ = d.occ.filter((o) => o.comp >= de && o.comp <= ate && !o.previsto);
    const g = occ.filter((o) => o.tipo === 'despesa');
    const avulsos = g.filter((o) => !o.fixo && !o.parcela);
    const rendas = occ.filter((o) => o.tipo === 'receita');
    const ress = occ.filter((o) => o.tipo === 'ressarcimento');
    const bruto = E.sum(g, (o) => o.minha), totRess = E.sum(ress, (o) => o.valor), liquido = bruto - totRess;
    const renda = E.sum(rendas, (o) => o.valor);
    const porMes = meses.map((ym) => {
      const m = occ.filter((o) => o.comp === ym);
      return { ym, gasto: Math.max(0, E.sum(m, E.liquido)), renda: E.sum(m.filter((o) => o.tipo === 'receita'), (o) => o.valor),
        fixos: E.sum(m.filter((o) => o.tipo === 'despesa' && o.fixo), (o) => o.minha), parcelas: E.sum(m.filter((o) => o.tipo === 'despesa' && o.parcela), (o) => o.minha),
        avulsos: E.sum(m.filter((o) => o.tipo === 'despesa' && !o.fixo && !o.parcela), (o) => o.minha), n: m.filter((o) => o.origem === 'lanc').length };
    });
    const cats = E.porCategoria(g, categorias());
    const semana = Array.from({ length: 7 }, (_, i) => ({ dia: i, total: 0, n: 0 }));
    for (const o of avulsos) { const w = E.weekday(o.data); semana[w].total += o.minha; semana[w].n++; }
    const faixas = [{ nome: 'Dias 1 a 10', total: 0 }, { nome: 'Dias 11 a 20', total: 0 }, { nome: 'Dias 21 ao fim', total: 0 }];
    for (const o of avulsos) { const dd = E.parseISO(o.data).d; faixas[dd <= 10 ? 0 : dd <= 20 ? 1 : 2].total += o.minha; }
    const porDia = new Map(); for (const o of avulsos) porDia.set(o.data, (porDia.get(o.data) || 0) + o.minha);
    const datas = occ.filter((o) => o.origem === 'lanc').map((o) => o.data).sort();
    let inicioDias = datas[0] || t; if (inicioDias < de + '-01') inicioDias = de + '-01';
    const totalDias = Math.max(1, E.diffDays(inicioDias, t) + 1);
    const diasComGasto = porDia.size;
    const topDia = [...porDia.entries()].sort((a, b) => b[1] - a[1])[0] || null;
    const lojas = new Map();
    for (const o of avulsos) { const k = E.normKey(o.desc); if (!k) continue; const x = lojas.get(k) || { nome: o.desc, n: 0, total: 0 }; x.n++; x.total += o.minha; lojas.set(k, x); }
    const freq = [...lojas.values()].sort((a, b) => b.n - a.n || b.total - a.total).slice(0, 8);
    const top = avulsos.slice().sort((a, b) => b.minha - a.minha).slice(0, 10);
    const meiosT = new Map(); for (const o of g) meiosT.set(o.meioId, (meiosT.get(o.meioId) || 0) + o.valor);
    // fixos e parcelados (olhando para frente)
    const fixosAtivos = S.recorrentes.filter((r) => (!r.fim || r.fim >= ymT)).map((r) => ({ r, v: E.valorRecorrente(r, ymT) ?? E.valorRecorrente(r, E.addMonthsYM(ymT, 1)) ?? 0 })).filter((x) => x.v);
    const fixDesp = fixosAtivos.filter((x) => (x.r.tipo || 'despesa') === 'despesa');
    const fixoMes = E.sum(fixDesp, (x) => Math.round(x.v / (x.r.div || 1)));
    const futuras = d.occ.filter((o) => o.tipo === 'despesa' && o.parcela && o.comp > ymT);
    const parcAtivas = new Map();
    for (const o of d.occ.filter((o) => o.tipo === 'despesa' && o.parcela && o.comp >= ymT)) {
      const x = parcAtivas.get(o.refId) || { desc: o.desc, meioId: o.meioId, valor: o.valor, total: o.parcela[1], restantes: 0, fim: o.comp, falta: 0 };
      x.restantes++; x.falta += o.valor; if (o.comp > x.fim) x.fim = o.comp; parcAtivas.set(o.refId, x);
    }
    const comprometido = E.monthsBetween(E.addMonthsYM(ymT, 1), E.addMonthsYM(ymT, 6)).map((ym) => ({ ym,
      parcelas: E.sum(futuras.filter((o) => o.comp === ym), (o) => o.minha),
      fixos: E.sum(d.occ.filter((o) => o.comp === ym && o.tipo === 'despesa' && o.fixo), (o) => o.minha) }));
    // divididos
    const div = g.filter((o) => o.div > 1);
    const recPend = E.sum(occ.filter((o) => (o.tipo === 'despesa' || o.tipo === 'ressarcimento') && o.receber > 0 && !o.recebido), (o) => o.receber);
    // entradas e Airbnb
    const fontes = new Map(); for (const o of rendas) { const k = o.subId || 'outras'; fontes.set(k, (fontes.get(k) || 0) + o.valor); }
    const isAir = (o) => o.tipo === 'receita' && (o.subId === 'airbnb' || /airbnb/i.test(o.desc));
    const air = rendas.filter(isAir);
    const airMes = meses.map((ym) => ({ ym, v: E.sum(air.filter((o) => o.comp === ym), (o) => o.valor), n: air.filter((o) => o.comp === ym).length }));
    const airCustos = E.sum(g.filter((o) => o.catId === 'imoveis' && o.subId === 'airbnb'), (o) => o.minha);
    const airTotal = E.sum(air, (o) => o.valor);
    const airMelhor = airMes.slice().sort((a, b) => b.v - a.v)[0];
    const mesesCompletosPer = meses.filter((ym) => d.completos.includes(ym));
    return { de, ate, meses, occ, g, avulsos, bruto, totRess, liquido, renda, porMes, cats, semana, faixas, porDia, totalDias, diasComGasto, topDia,
      freq, top, meiosT, fixosAtivos, fixoMes, parcAtivas: [...parcAtivas.values()].sort((a, b) => (a.fim < b.fim ? 1 : -1)), comprometido, div, recPend,
      fontes, air, airMes, airCustos, airTotal, airMelhor, mesesCompletosPer, media: d.media, t };
  }
  function insights(R) {
    const out = [];
    const nm = R.meses.length;
    if (!R.g.length && !R.renda) return ['Ainda não há lançamentos no período. Lance seus gastos por alguns dias e gere o relatório de novo: as conclusões aparecem sozinhas.'];
    if (R.cats[0]) out.push(`<b>${esc(catSo(R.cats[0].catId))}</b> é onde mais vai o seu dinheiro: ${pct(R.cats[0].total, R.bruto)}% dos gastos (${brl(R.cats[0].total)}).${R.cats[1] ? ` Em seguida vem ${esc(catSo(R.cats[1].catId))}, com ${pct(R.cats[1].total, R.bruto)}%.` : ''}`);
    const fixosP = E.sum(R.g.filter((o) => o.fixo), (o) => o.minha), parcP = E.sum(R.g.filter((o) => o.parcela), (o) => o.minha);
    if (R.bruto) out.push(`${pct(fixosP + parcP, R.bruto)}% dos seus gastos já estavam "contratados" antes do mês começar (fixos ${brl(fixosP)} e parcelas ${brl(parcP)}). Os outros ${pct(R.bruto - fixosP - parcP, R.bruto)}% são escolhas do dia a dia.`);
    const sem = R.semana.slice().sort((a, b) => b.total - a.total);
    if (sem[0] && sem[0].total) out.push(`Nos gastos do dia a dia, <b>${DIAS_SEM[sem[0].dia].toLowerCase()}${sem[0].dia === 0 || sem[0].dia === 6 ? '' : '-feira'}</b> é o dia que mais pesa: ${pct(sem[0].total, E.sum(R.semana, (x) => x.total))}% do total, em ${sem[0].n} ${sem[0].n === 1 ? 'compra' : 'compras'}.`);
    const fx = R.faixas.slice().sort((a, b) => b.total - a.total)[0];
    if (fx && fx.total) out.push(`Você gasta mais nos <b>${fx.nome.toLowerCase()}</b> de cada mês (${pct(fx.total, E.sum(R.faixas, (x) => x.total))}% dos gastos avulsos).`);
    if (R.avulsos.length) out.push(`Foram ${R.avulsos.length} compras avulsas, com ticket médio de ${brl(Math.round(E.sum(R.avulsos, (o) => o.minha) / R.avulsos.length))}. Você teve gasto em ${R.diasComGasto} de ${R.totalDias} dias${R.totalDias - R.diasComGasto > 0 ? ` (${R.totalDias - R.diasComGasto} dias sem gastar nada)` : ''}.`);
    if (R.freq[0] && R.freq[0].n > 1) out.push(`O lugar onde você mais volta é <b>${esc(R.freq[0].nome)}</b>: ${R.freq[0].n} vezes, somando ${brl(R.freq[0].total)}.`);
    if (R.top[0]) out.push(`O maior gasto avulso foi <b>${esc(R.top[0].desc)}</b>, ${brl(R.top[0].minha)} em ${dataCurta(R.top[0].data)}.`);
    if (R.fixoMes) out.push(`Seus fixos somam ${brl(R.fixoMes)} por mês (sua parte), o equivalente a ${brl(R.fixoMes * 12)} por ano.${R.renda && nm ? ` Isso compromete ${pct(R.fixoMes * nm, R.renda)}% das suas entradas.` : ''}`);
    if (R.parcAtivas.length) { const falta = E.sum(R.parcAtivas, (x) => x.falta); const fim = R.parcAtivas.reduce((m, x) => (x.fim > m ? x.fim : m), ''); out.push(`Você tem ${R.parcAtivas.length} ${R.parcAtivas.length === 1 ? 'compra parcelada ativa' : 'compras parceladas ativas'}, com ${brl(falta)} ainda a pagar. A última parcela cai em ${mesNome(fim)}.`); }
    if (R.renda) out.push(`Entradas de ${brl(R.renda)} contra ${brl(R.liquido)} gastos: ${R.renda >= R.liquido ? `sobraram ${brl(R.renda - R.liquido)} (${pct(R.renda - R.liquido, R.renda)}% do que entrou)` : `faltaram ${brl(R.liquido - R.renda)}`}.`);
    if (R.airTotal) out.push(`O Airbnb trouxe <b>${brl(R.airTotal)}</b> (${pct(R.airTotal, R.renda)}% das entradas)${R.airCustos ? `, com ${brl(R.airCustos)} de custos lançados: resultado de ${brl(R.airTotal - R.airCustos)}` : ''}.`);
    if (R.recPend) out.push(`Há ${brl(R.recPend)} a receber da família (divididos e ressarcimentos ainda não marcados como recebidos).`);
    if (R.media != null) { const ult = R.porMes[R.porMes.length - 2]; if (ult) { const dif = pct(ult.gasto - R.media, R.media); out.push(`Em ${mesNome(ult.ym)} você gastou ${brl(ult.gasto)}, ${Math.abs(dif)}% ${dif >= 0 ? 'acima' : 'abaixo'} da sua média (${brl(R.media)}).`); } }
    return out;
  }
  const hb = (rows, opts = {}) => {
    const max = Math.max(1, ...rows.map((r) => r.v));
    return rows.map((r) => `<div class="rp-hb"><div class="rp-hb-t"><span>${r.l}</span><b>${opts.fmt ? opts.fmt(r.v) : brl(r.v)}${r.extra ? ` <small>${r.extra}</small>` : ''}</b></div><div class="rp-hb-tr"><i style="width:${Math.max(1, (r.v / max) * 100)}%;${opts.cor ? `background:${opts.cor}` : ''}"></i></div></div>`).join('');
  };
  function viewReport() {
    const per = S.ui.report.per || 'tudo';
    const R = reportData(per);
    S.charts.rp1 = { W: 680, H: 250, kind: 'group', months: R.meses, series: [{ name: 'Entradas', color: 'var(--s2)', values: R.porMes.map((x) => x.renda) }, { name: 'Gastos', color: 'var(--accent)', values: R.porMes.map((x) => x.gasto) }], sel: null, labels: R.meses.map(mesCurto) };
    S.charts.rp2 = { W: 680, H: 250, kind: 'stack', months: R.meses, series: [{ name: 'Fixos', color: 'var(--accent)', values: R.porMes.map((x) => x.fixos) }, { name: 'Parcelas', color: 'var(--coin)', values: R.porMes.map((x) => x.parcelas) }, { name: 'Dia a dia', color: 'var(--s2)', values: R.porMes.map((x) => x.avulsos) }], sel: null, labels: R.meses.map(mesCurto) };
    S.charts.rp3 = { W: 680, H: 200, kind: 'col', months: R.meses, series: [{ name: 'Airbnb', color: 'var(--s2)', values: R.airMes.map((x) => x.v) }], sel: null, labels: R.meses.map(mesCurto) };
    const seg = (k, l) => `<button data-act="rp-per" data-p="${k}" aria-pressed="${per === k}">${l}</button>`;
    const geradoEm = new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const perTxt = R.de === R.ate ? cap(mesNome(R.de)) : `${cap(mesNome(R.de))} a ${mesNome(R.ate)}`;
    const ins = insights(R);
    const semTot = E.sum(R.semana, (x) => x.total);
    const tabelaMes = `<table class="t rp-t"><thead><tr><th>Mês</th><th>Gastos</th><th>Fixos</th><th>Parcelas</th><th>Dia a dia</th><th>Entradas</th><th>Saldo</th></tr></thead><tbody>${R.porMes.map((x) => `<tr><td>${mesCurto(x.ym)}</td><td>${brl(x.gasto)}</td><td>${brl(x.fixos)}</td><td>${brl(x.parcelas)}</td><td>${brl(x.avulsos)}</td><td>${brl(x.renda)}</td><td>${brl(x.renda - x.gasto)}</td></tr>`).join('')}</tbody></table>`;
    const catsHtml = R.cats.map((c) => `<div class="rp-cat">${hb([{ l: `<b>${esc(catSo(c.catId))}</b>`, v: c.total, extra: `${pct(c.total, R.bruto)}%` }])}
      <div class="rp-subs">${c.subs.slice(0, 6).map((s) => `<span>${esc(subSo(c.catId, s.subId) || 'Outros')} <b>${brl(s.total)}</b></span>`).join('')}</div></div>`).join('');
    const fontesNomes = { salario: 'Salário', aluguel: 'Aluguel', airbnb: 'Airbnb', outras: 'Outras' };
    return `<div class="report">
      <div class="rp-bar noprint wrap"><button class="icon-btn" data-act="rp-close" aria-label="Voltar">${ic('left')}</button><b class="grow">Relatório completo</b><button class="btn pri sm" data-act="rp-print">${ic('download')}Salvar PDF</button></div>
      <div class="rp-per noprint wrap"><div class="seg" role="group" aria-label="Período do relatório">${seg('tudo', 'Desde o início')}${seg('3m', '3 meses')}${seg('6m', '6 meses')}${seg('12m', '12 meses')}</div>
        <p class="tiny muted" style="margin:6px 0 0">No Android: "Salvar PDF" abre a tela de impressão. Escolha <b>Salvar como PDF</b> como impressora.</p></div>
      <article class="rp-doc">
        <header class="rp-capa"><div class="row">${LOGO('rp-logo')}<div><div class="word">Todo d<b>IA</b></div><div class="small muted">Relatório do seu perfil de gastos</div></div></div>
          <h1>${esc(perTxt)}</h1><p class="small muted">Gerado em ${esc(geradoEm)} · valores da sua parte, já descontados os ressarcimentos</p></header>
        <section class="rp-sec"><h2>Resumo</h2><div class="rp-kpis">
          <div><span>Gastos (sua parte)</span><b>${brl(R.liquido)}</b></div><div><span>Entradas</span><b>${brl(R.renda)}</b></div>
          <div><span>Saldo do período</span><b class="${R.renda - R.liquido >= 0 ? 'pos' : 'neg'}">${brl(R.renda - R.liquido)}</b></div>
          <div><span>Média por mês</span><b>${brl(Math.round(R.liquido / Math.max(1, R.meses.length)))}</b></div>
          <div><span>Lançamentos</span><b>${R.porMes.reduce((s, x) => s + x.n, 0)}</b></div><div><span>Gasto médio por dia</span><b>${brl(Math.round(E.sum(R.avulsos, (o) => o.minha) / R.totalDias))}</b></div></div></section>
        <section class="rp-sec"><h2>O que os números dizem</h2><ul class="rp-ins">${ins.map((x) => `<li>${x}</li>`).join('')}</ul></section>
        <section class="rp-sec"><h2>Cronologia: entradas e gastos por mês</h2><div class="chart" data-chart="rp1" style="height:210px"></div>
          <div class="legend"><span><i style="background:var(--s2)"></i>Entradas</span><span><i style="background:var(--accent)"></i>Gastos</span></div>
          <h3>De onde vem cada gasto do mês</h3><div class="chart" data-chart="rp2" style="height:210px"></div>
          <div class="legend"><span><i style="background:var(--accent)"></i>Fixos</span><span><i style="background:var(--coin)"></i>Parcelas</span><span><i style="background:var(--s2)"></i>Dia a dia</span></div>
          <div class="table-wrap">${tabelaMes}</div></section>
        <section class="rp-sec"><h2>Categorias</h2>${catsHtml || '<p class="small muted">Sem gastos no período.</p>'}</section>
        <section class="rp-sec rp-2col"><div><h2>Dia da semana</h2><p class="tiny muted">Só gastos do dia a dia (fixos e parcelas ficam de fora).</p>${hb(R.semana.map((x) => ({ l: DIAS_SEM[x.dia], v: x.total, extra: `${pct(x.total, semTot)}%` })))}</div>
          <div><h2>Momento do mês</h2><p class="tiny muted">Em que parte do mês você mais gasta no dia a dia.</p>${hb(R.faixas.map((x) => ({ l: x.nome, v: x.total })), { cor: 'var(--coin)' })}
          ${R.topDia ? `<p class="small" style="margin-top:12px">Dia mais caro: <b>${esc(dataLonga(R.topDia[0]))}</b>, ${brl(R.topDia[1])}.</p>` : ''}</div></section>
        <section class="rp-sec rp-2col"><div><h2>Onde você mais volta</h2>${R.freq.length ? `<table class="t rp-t"><thead><tr><th>Lugar</th><th>Vezes</th><th>Total</th></tr></thead><tbody>${R.freq.map((x) => `<tr><td>${esc(x.nome)}</td><td>${x.n}</td><td>${brl(x.total)}</td></tr>`).join('')}</tbody></table>` : '<p class="small muted">Sem dados.</p>'}</div>
          <div><h2>Maiores gastos do dia a dia</h2>${R.top.length ? `<table class="t rp-t"><thead><tr><th>Gasto</th><th>Data</th><th>Valor</th></tr></thead><tbody>${R.top.map((o) => `<tr><td>${esc(o.desc)}</td><td>${dataCurta(o.data)}</td><td>${brl(o.minha)}</td></tr>`).join('')}</tbody></table>` : '<p class="small muted">Sem dados.</p>'}</div></section>
        <section class="rp-sec"><h2>Gastos fixos</h2><p class="small ink2">${R.fixosAtivos.length} fixos ativos. Sua parte: <b>${brl(R.fixoMes)}</b> por mês, <b>${brl(R.fixoMes * 12)}</b> por ano.</p>
          <table class="t rp-t"><thead><tr><th>Fixo</th><th>Forma</th><th>Mensal</th><th>Sua parte</th><th>Até</th></tr></thead><tbody>${R.fixosAtivos.map(({ r, v }) => `<tr><td>${esc(r.desc)}${r.tipo === 'ressarcimento' ? ' <small>(ressarcimento)</small>' : r.tipo === 'receita' ? ' <small>(entrada)</small>' : ''}</td><td>${esc((meioById(r.meioId) || {}).nome || '')}</td><td>${brl(v)}</td><td>${r.tipo === 'despesa' ? brl(Math.round(v / (r.div || 1))) : '—'}</td><td>${r.fim ? mesCurto(r.fim) : 'sem fim'}</td></tr>`).join('')}</tbody></table></section>
        <section class="rp-sec"><h2>Compras parceladas e compromisso futuro</h2>
          ${R.parcAtivas.length ? `<table class="t rp-t"><thead><tr><th>Compra</th><th>Cartão</th><th>Parcela</th><th>Faltam</th><th>A pagar</th><th>Última</th></tr></thead><tbody>${R.parcAtivas.map((x) => `<tr><td>${esc(x.desc)}</td><td>${esc((meioById(x.meioId) || {}).nome || '')}</td><td>${brl(x.valor)}</td><td>${x.restantes}</td><td>${brl(x.falta)}</td><td>${mesCurto(x.fim)}</td></tr>`).join('')}</tbody></table>` : '<p class="small muted">Nenhuma compra parcelada ativa.</p>'}
          <h3>Próximos 6 meses já comprometidos (sua parte)</h3>${hb(R.comprometido.map((x) => ({ l: cap(mesNome(x.ym)), v: x.fixos + x.parcelas, extra: x.parcelas ? `parcelas ${brl(x.parcelas)}` : '' })))}</section>
        <section class="rp-sec rp-2col"><div><h2>Formas de pagamento</h2>${hb([...R.meiosT.entries()].sort((a, b) => b[1] - a[1]).map(([id, v]) => ({ l: esc((meioById(id) || { nome: 'Outro' }).nome), v, extra: `${pct(v, E.sum([...R.meiosT.values()]))}%` })), { cor: 'var(--s2)' })}</div>
          <div><h2>Família e divididos</h2><p class="small ink2">Você pagou ${brl(E.sum(R.div, (o) => o.valor))} em gastos divididos; a sua parte foi ${brl(E.sum(R.div, (o) => o.minha))}.</p>
          <p class="small ink2">Ressarcimentos no período: ${brl(R.totRess)}.</p><p class="small ink2">Ainda a receber: <b>${brl(R.recPend)}</b>.</p></div></section>
        <section class="rp-sec"><h2>Entradas</h2>${R.renda ? hb([...R.fontes.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ l: fontesNomes[k] || esc(subSo('renda', k) || k), v, extra: `${pct(v, R.renda)}%` })), { cor: 'var(--s2)' }) : '<p class="small muted">Nenhuma entrada lançada no período.</p>'}</section>
        <section class="rp-sec rp-air"><h2>Airbnb: a sua outra fonte de renda</h2>
          ${R.airTotal ? `<div class="rp-kpis"><div><span>Recebido</span><b>${brl(R.airTotal)}</b></div><div><span>Recebimentos</span><b>${R.air.length}</b></div>
            <div><span>Média por recebimento</span><b>${brl(Math.round(R.airTotal / R.air.length))}</b></div><div><span>Média por mês</span><b>${brl(Math.round(R.airTotal / Math.max(1, R.meses.length)))}</b></div>
            <div><span>Custos lançados</span><b>${brl(R.airCustos)}</b></div><div><span>Resultado</span><b class="${R.airTotal - R.airCustos >= 0 ? 'pos' : 'neg'}">${brl(R.airTotal - R.airCustos)}</b></div></div>
            <div class="chart" data-chart="rp3" style="height:180px"></div>
            <p class="small ink2">${R.airMelhor && R.airMelhor.v ? `Melhor mês: <b>${cap(mesNome(R.airMelhor.ym))}</b>, com ${brl(R.airMelhor.v)}. ` : ''}O Airbnb representou ${pct(R.airTotal, R.renda)}% de tudo o que entrou${R.liquido ? ` e cobriria ${pct(R.airTotal, R.liquido)}% dos seus gastos do período` : ''}.</p>
            <p class="tiny muted">Para o resultado ficar fiel, lance os custos do imóvel (faxina, enxoval, taxas) em Imóveis de renda › Custos do Airbnb.</p>`
          : '<p class="small muted">Nenhum recebimento do Airbnb lançado no período. Lance como entrada (ex.: "recebi airbnb 850") e ele aparece aqui com médias e melhor mês.</p>'}</section>
        <footer class="rp-foot">Todo dIA · versão ${VERSION} · ${esc(geradoEm)}</footer>
      </article></div>`;
  }

  // ---------- Importar lançamentos (bloco preparado pelo Claude) ----------
  function lerImportacao(txt) {
    const m = String(txt || '').replace(/\s+/g, '').match(/TODODIA1:([A-Za-z0-9_-]+)/);
    if (!m) throw new Error('Não encontrei o bloco. Ele começa com TODODIA1:');
    let obj;
    try { const bytes = unb64u(m[1]); obj = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('O bloco está incompleto. Copie de novo, do começo ao fim.'); }
    const itens = (obj.itens || []).map((x, i) => {
      const it = { id: String(x.id || uid('I')), tipo: x.tipo || 'despesa', desc: String(x.desc || '').slice(0, 120), valor: Math.round(Number(x.valor)), data: String(x.data || ''),
        meioId: String(x.meioId || ''), catId: x.catId || 'outros', subId: x.subId || 'indefinido', parcelas: Math.max(1, Math.min(48, Math.round(Number(x.parcelas) || 1))), div: Math.max(1, Math.round(Number(x.div) || 1)), obs: String(x.obs || ''), fonteCat: 'importado' };
      if (!/^[A-Za-z0-9_-]{4,60}$/.test(it.id)) throw new Error(`Item ${i + 1}: identificador inválido.`);
      if (!(it.valor > 0)) throw new Error(`Item ${i + 1} (${it.desc}): valor inválido.`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(it.data)) throw new Error(`Item ${i + 1} (${it.desc}): data inválida.`);
      if (!meioById(it.meioId)) throw new Error(`Item ${i + 1} (${it.desc}): forma de pagamento "${it.meioId}" não existe no seu app.`);
      if (!E.findSub(categorias(), it.catId, it.subId)) { it.catId = 'outros'; it.subId = 'indefinido'; }
      return it;
    });
    const fixos = (obj.fixos || []).map((f) => {
      const r = S.recorrentes.find((x) => x.id === f.id);
      if (!r) throw new Error(`Fixo "${f.id}" não existe no seu app.`);
      return { r, set: f.set || {}, excluir: !!f.excluir };
    });
    return { itens, fixos, titulo: obj.titulo || 'Importação' };
  }
  function viewImportar() {
    const p = S.ui.imp;
    let prev = '';
    if (p && p.ok) {
      const tot = E.sum(p.ok.itens, (i) => i.valor);
      prev = `<div class="card stack" style="gap:8px"><b>${esc(p.ok.titulo)}</b>
        ${p.ok.itens.length ? `<div class="list">${p.ok.itens.map((i) => `<div class="li"><span class="mono">${esc(iniciais(i.desc))}</span><span class="grow"><span class="t" style="display:block">${esc(i.desc)}</span><span class="s" style="display:block">${esc(catNome(i.catId, i.subId))} · ${esc((meioById(i.meioId) || {}).nome || '')}${i.parcelas > 1 ? ` · ${i.parcelas}x de ${brl(E.splitParcelas(i.valor, i.parcelas)[0])}` : ''}</span></span><span class="amt">${brl(i.valor)}</span></div>`).join('')}</div>` : ''}
        ${p.ok.fixos.map((f) => `<div class="hint">${ic('repeat')}<span>${esc(f.r.desc)}: ${f.excluir ? 'será removido' : Object.entries(f.set).map(([k, v]) => k === 'fim' ? `termina em ${mesNome(v)}` : `${esc(k)} = ${esc(v)}`).join(', ')}</span></div>`).join('')}
        <div class="row between small"><span class="ink2">${p.ok.itens.length} lançamentos</span><b>${brl(tot)}</b></div>
        <button class="btn pri" data-act="imp-ok">${ic('check')}Importar</button></div>`;
    }
    return `<div class="stack"><p class="small ink2" style="margin:0">Cole aqui o bloco que o Claude preparou para você (começa com <b>TODODIA1:</b>). O app mostra tudo antes de gravar. Importar o mesmo bloco duas vezes não duplica nada.</p>
      <textarea class="inp" id="impTxt" rows="5" placeholder="TODODIA1:..." spellcheck="false" style="font-family:ui-monospace,monospace;font-size:13px">${esc((p && p.txt) || '')}</textarea>
      ${p && p.err ? `<p class="err" role="alert" style="margin:0">${esc(p.err)}</p>` : ''}
      <button class="btn" data-act="imp-ler">Ler o bloco</button>${prev}</div>`;
  }

  // ---------- Folhas (formulários) ----------
  let sheetState = null;
  function openSheet(html, onMount) {
    closeSheet(true);
    const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.id = 'scrim'; scrim.dataset.act = 'close-sheet';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
    sh.innerHTML = `<div class="sheet-in wrap">${html}</div>`;
    document.body.append(scrim, sh);
    document.body.style.overflow = 'hidden';
    if (onMount) onMount(sh);
  }
  function closeSheet(silent) {
    const a = $('#sheet'), b = $('#scrim'); if (a) a.remove(); if (b) b.remove();
    document.body.style.overflow = ''; if (!silent) sheetState = null;
    if (!silent && pendingRender) { pendingRender = false; render(); }
  }
  const sheetHead = (t, extra = '') => `<div class="grab"></div><div class="sheet-h"><h3>${esc(t)}</h3>${extra}<button class="icon-btn" data-act="close-sheet" aria-label="Fechar">${ic('x')}</button></div>`;
  const centsFromDigits = (s) => { const d = String(s || '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 11); return d ? Number(d) : 0; };
  const fmtInput = (c) => (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Lançamento (novo / editar)
  function openLanc(pre = {}, edit = null) {
    const t = hoje();
    const base = edit ? clone(edit) : {
      id: uid(), tipo: pre.tipo || 'despesa', desc: pre.desc || '', valor: pre.valor || 0, data: pre.data || t,
      meioId: pre.meioId || meioPadrao(), catId: pre.catId || null, subId: pre.subId || null,
      parcelas: pre.parcelas || 1, div: pre.div || 1, obs: '', fonteCat: pre.fonte || null,
    };
    sheetState = { kind: 'lanc', it: base, prevYm: edit ? E.ymOf(edit.data) : null, isEdit: !!edit, catManual: !!(edit || pre.catId), divManual: !!(edit || pre.div > 1), err: '' };
    if (!base.catId && base.desc) autoCat(true);
    renderLanc();
    setTimeout(() => { const el = $(edit || pre.valor ? '#fDesc' : '#fValor'); if (el && !edit) el.focus(); }, 60);
  }
  function renderLanc() {
    const st = sheetState; if (!st || st.kind !== 'lanc') return;
    const it = st.it, t = hoje();
    const isIn = it.tipo === 'receita';
    const meiosOk = meiosAtivos().filter((m) => !isIn || m.tipo !== 'credito');
    if (!meiosOk.some((m) => m.id === it.meioId)) it.meioId = (meiosOk[0] || {}).id;
    const meio = meioById(it.meioId);
    const credit = meio && meio.tipo === 'credito' && !isIn;
    if (!credit) it.parcelas = 1;
    const f = credit ? E.fatura(meio, it.data) : null;
    const fLast = credit && it.parcelas > 1 ? E.fatura(meio, it.data, it.parcelas - 1) : null;
    const sub = it.catId ? E.findSub(categorias(), it.catId, it.subId) : null;
    const parc = it.parcelas > 1 && it.valor ? E.splitParcelas(it.valor, it.parcelas)[0] : 0;
    const minha = it.div > 1 ? Math.round(it.valor / it.div) : it.valor;
    const ontem = E.addDays(t, -1);
    const html = `${sheetHead(st.isEdit ? 'Editar lançamento' : 'Novo lançamento')}
      <div class="seg" role="group" aria-label="Tipo"><button data-act="l-tipo" data-v="despesa" aria-pressed="${!isIn}">Gasto</button><button data-act="l-tipo" data-v="receita" aria-pressed="${isIn}">Entrada</button></div>
      <label class="money ${isIn ? 'in' : ''}" for="fValor"><span>R$</span><input id="fValor" inputmode="numeric" autocomplete="off" value="${it.valor ? fmtInput(it.valor) : ''}" placeholder="0,00" aria-label="Valor"></label>
      <div class="field"><label for="fDesc">Descrição</label><input class="inp" id="fDesc" list="descList" autocomplete="off" value="${esc(it.desc)}" placeholder="${isIn ? 'Ex.: Salário, Airbnb, aluguel' : 'Ex.: Supernosso, gasolina, padaria'}" enterkeyhint="done">
        <datalist id="descList">${[...new Set(D().its.filter((i) => !i.excluido && i.tipo === it.tipo).map((i) => i.desc))].slice(0, 200).map((d) => `<option value="${esc(d)}"></option>`).join('')}</datalist></div>
      <div class="field"><span class="lbl">Categoria</span>
        <button class="catbtn" data-act="l-cat"><span class="mono">${it.catId ? esc(iniciais(catSo(it.catId))) : ic('tag')}</span><span class="grow"><b>${sub ? esc(sub.nome) : 'Escolher categoria'}</b><span>${it.catId ? esc(catSo(it.catId)) : 'Escreva a descrição que eu sugiro'}</span></span>
        ${it.fonteCat === 'regra' ? '<span class="pill acc">aprendido</span>' : ''}${ic('right', 'chev')}</button></div>
      <div class="field"><span class="lbl">${isIn ? 'Entrou em' : 'Pago com'}</span><div class="chips">${meiosOk.map((m) => `<button class="chip" style="--cc:${esc(m.cor || 'var(--muted)')}" data-act="l-meio" data-id="${esc(m.id)}" aria-pressed="${m.id === it.meioId}"><i></i>${esc(m.nome)}</button>`).join('')}</div>
        ${f ? `<div class="hint">${ic('card')}<span>${it.parcelas > 1 ? `${it.parcelas}x de ${brl(parc)}: primeira na fatura que vence ${dataCurta(f.vence)}, última em ${dataCurta(fLast.vence)}/${fLast.vence.slice(2, 4)}.` : `Cai na fatura que vence em ${dataCurta(f.vence)} (fecha ${dataCurta(f.fecha)}).`}</span></div>` : ''}</div>
      <div class="field"><span class="lbl">${credit ? 'Data da compra' : 'Data'}</span><div class="row" style="flex-wrap:wrap">
        <button class="chip" data-act="l-data" data-v="${t}" aria-pressed="${it.data === t}">Hoje</button><button class="chip" data-act="l-data" data-v="${ontem}" aria-pressed="${it.data === ontem}">Ontem</button>
        <input class="inp" type="date" id="fData" value="${esc(it.data)}" style="width:auto;flex:1;min-width:150px;padding:9px 12px" aria-label="Data"></div>
        <span class="tiny muted">${esc(dataLonga(it.data))}${it.data > t ? ' · data futura, entra como previsto' : ''}</span></div>
      <details class="more" ${it.parcelas > 1 || it.div > 1 || it.obs ? 'open' : ''}><summary>Parcelas, divisão e observação ${ic('down')}</summary><div class="more-in">
        ${credit ? `<div class="toggle"><span><b>Parcelas</b><br><span class="small muted">${it.parcelas > 1 ? `${it.parcelas}x de ${brl(parc)}` : 'À vista'}</span></span><span class="stepper"><button data-act="l-parc" data-d="-1" aria-label="Menos parcelas">−</button><output>${it.parcelas}x</output><button data-act="l-parc" data-d="1" aria-label="Mais parcelas">+</button></span></div>` : ''}
        ${!isIn ? `<div class="toggle"><span><b>Dividido</b><br><span class="small muted">${it.div > 1 ? `Sua parte ${brl(minha)} · a receber ${brl(it.valor - minha)}` : 'Você paga e outras pessoas te devolvem'}</span></span><button class="switch" role="switch" aria-checked="${it.div > 1}" data-act="l-div" aria-label="Dividido"></button></div>
        ${it.div > 1 ? `<div class="toggle"><span class="small ink2">Por quantas pessoas (contando você)</span><span class="stepper"><button data-act="l-divn" data-d="-1" aria-label="Menos pessoas">−</button><output>${it.div}</output><button data-act="l-divn" data-d="1" aria-label="Mais pessoas">+</button></span></div>` : ''}` : ''}
        <div class="field"><label for="fObs">Observação</label><input class="inp" id="fObs" value="${esc(it.obs || '')}" placeholder="Opcional" autocomplete="off"></div>
      </div></details>
      ${st.err ? `<p class="err" role="alert">${esc(st.err)}</p>` : ''}
      <div class="btns" style="${st.isEdit ? 'grid-template-columns:auto 1fr' : ''}">${st.isEdit ? `<button class="btn danger" data-act="l-del" aria-label="Apagar">${ic('trash')}</button><button class="btn pri" data-act="l-save">${ic('check')}Salvar alterações</button>` : `<button class="btn pri" data-act="l-save">${ic('check')}Salvar</button><button class="btn" data-act="l-save" data-more="1">Salvar + outro</button>`}</div>`;
    const sh = $('#sheet');
    const focusId = document.activeElement && document.activeElement.id;
    const selStart = document.activeElement && document.activeElement.selectionStart;
    if (sh) { const sc = sh.scrollTop; $('.sheet-in', sh).innerHTML = html; sh.scrollTop = sc; } else openSheet(html);
    bindLanc();
    if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); try { if (selStart != null && el.type !== 'date') el.setSelectionRange(el.value.length, el.value.length); } catch { /* ok */ } } }
  }
  function bindLanc() {
    const v = $('#fValor'), d = $('#fDesc'), dt = $('#fData'), ob = $('#fObs');
    if (v) v.oninput = () => { const c = centsFromDigits(v.value); sheetState.it.valor = c; v.value = c ? fmtInput(c) : ''; updateLancHints(); };
    if (d) {
      d.oninput = () => { sheetState.it.desc = d.value; if (!sheetState.catManual) autoCat(false); };
      d.onchange = () => { sheetState.it.desc = d.value.trim(); if (!sheetState.catManual) autoCat(true); };
      d.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); d.blur(); } };
    }
    if (dt) dt.onchange = () => { if (/^\d{4}-\d{2}-\d{2}$/.test(dt.value)) { sheetState.it.data = dt.value; renderLanc(); } };
    if (ob) ob.oninput = () => { sheetState.it.obs = ob.value; };
  }
  function updateLancHints() { // re-render leve só quando necessário
    clearTimeout(updateLancHints.t); updateLancHints.t = setTimeout(() => { if (sheetState && sheetState.kind === 'lanc' && (sheetState.it.parcelas > 1 || sheetState.it.div > 1)) renderLanc(); }, 450);
  }
  function autoCat(now) {
    const st = sheetState; if (!st || st.kind !== 'lanc') return;
    const desc = st.it.desc;
    const r = classifyLocal(desc, st.it.tipo);
    const apply = (res) => {
      if (!sheetState || sheetState !== st || st.catManual) return;
      if (res) {
        const changed = st.it.catId !== res.catId || st.it.subId !== res.subId || (res.meioId && res.meioId !== st.it.meioId);
        st.it.catId = res.catId; st.it.subId = res.subId; st.it.fonteCat = res.fonte;
        const sd = E.findSub(categorias(), res.catId, res.subId);
        if (!st.divManual) st.it.div = sd && sd.div > 1 ? sd.div : 1;
        if (res.meioId && !st.meioManual && meioById(res.meioId) && meioById(res.meioId).ativo !== false) st.it.meioId = res.meioId;
        if (changed) renderLanc();
      }
    };
    if (r) { apply(r); return; }
    if (st.it.fonteCat !== 'manual' && st.it.catId && !st.isEdit) { st.it.catId = null; st.it.subId = null; st.it.fonteCat = null; renderLanc(); }
  }
  async function saveLanc(more) {
    const st = sheetState, it = st.it;
    it.desc = String(it.desc || '').trim();
    if (!it.valor || it.valor <= 0) { st.err = 'Informe o valor.'; renderLanc(); $('#fValor') && $('#fValor').focus(); return; }
    if (!it.desc) { st.err = 'Escreva uma descrição.'; renderLanc(); return; }
    if (!it.catId || !E.findSub(categorias(), it.catId, it.subId)) { st.err = 'Escolha a categoria.'; renderLanc(); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(it.data)) { st.err = 'Data inválida.'; renderLanc(); return; }
    if (!meioById(it.meioId)) { st.err = 'Escolha como pagou.'; renderLanc(); return; }
    if (it.tipo === 'receita') { it.div = 1; it.parcelas = 1; }
    const item = clone(it); const prevYm = st.prevYm; const wasEdit = st.isEdit;
    const meio = meioById(item.meioId);
    learn(item.desc, item.catId, item.subId, item.meioId);
    vibrate();
    if (more) { openLanc({ meioId: item.meioId, data: item.data, tipo: item.tipo }); } else closeSheet();
    const ok = await saveItem(item, prevYm, { silent: false });
    const f = meio && meio.tipo === 'credito' && item.tipo === 'despesa' ? E.fatura(meio, item.data) : null;
    if (ok) toast(wasEdit ? 'Lançamento atualizado.' : f ? `Lançado. Entrou na fatura de ${MES3[+f.ref.slice(5) - 1]}.` : 'Lançado.', wasEdit ? null : { label: 'Desfazer', fn: () => softDelete(item, true) });
  }
  async function softDelete(item, quiet) {
    const it = clone(item); it.excluido = true; it.excluidoEm = Date.now();
    await saveItem(it, null);
    if (!quiet) toast('Lançamento apagado.', { label: 'Desfazer', fn: () => { const r = clone(it); delete r.excluido; delete r.excluidoEm; saveItem(r, null); } });
    else toast('Lançamento desfeito.');
  }

  // Seletor de categoria
  function openCatPicker(tipo, onPick, current) {
    const back = sheetState;
    const cats = categorias().filter((c) => (c.tipo || 'despesa') === tipo);
    const html = `${sheetHead('Categoria')}<label class="search">${ic('search')}<span class="sr">Buscar categoria</span><input id="catQ" placeholder="Buscar" autocomplete="off"></label>
      <div class="stack" id="catList" style="gap:8px">${cats.map((c) => `<div class="catgrp" data-name="${esc(E.normKey(c.nome + ' ' + c.subs.map((s) => s.nome).join(' ')))}"><button data-act="cat-open" aria-expanded="${current && current.catId === c.id}"><span class="mono">${esc(iniciais(c.nome))}</span><span class="grow">${esc(c.nome)}</span>${ic('down', 'chev')}</button>
        <div class="subs" ${current && current.catId === c.id ? '' : 'hidden'}>${c.subs.map((s) => `<button class="chip" data-act="cat-pick" data-cat="${esc(c.id)}" data-sub="${esc(s.id)}" aria-pressed="${current && current.catId === c.id && current.subId === s.id}">${esc(s.nome)}${s.div > 1 ? ` <span class="pill acc">÷${s.div}</span>` : ''}</button>`).join('')}</div></div>`).join('')}</div>`;
    sheetState = { kind: 'cat', back, onPick };
    openSheet(html, (sh) => {
      const q = $('#catQ', sh);
      q.oninput = () => {
        const v = E.normKey(q.value);
        sh.querySelectorAll('.catgrp').forEach((g) => { const hit = !v || g.dataset.name.includes(v); g.hidden = !hit; const subs = g.querySelector('.subs'); subs.hidden = !(v && hit) && g.querySelector('[aria-expanded]').getAttribute('aria-expanded') !== 'true'; });
      };
    });
  }

  // Ocorrência de gasto fixo (um mês)
  function openRecOcc(o) {
    const rec = S.recorrentes.find((r) => r.id === o.refId); if (!rec) return;
    const ym = o.comp;
    const exc = (rec.excecoes || {})[ym] || {};
    sheetState = { kind: 'recocc', rec: clone(rec), ym, valor: o.valor };
    const html = `${sheetHead(rec.desc)}
      <div class="card stack" style="gap:6px"><div class="row between"><span class="eyebrow">${esc(mesNome(ym))}</span><span class="pill acc">${ic('repeat')}fixo</span></div>
        <div class="big num" style="font-family:var(--f-display);font-size:34px;font-weight:700">${brl(o.valor)}</div>
        <span class="small muted">${esc(catNome(rec.catId, rec.subId))} · ${esc((meioById(rec.meioId) || {}).nome || '')} · dia ${rec.dia}${o.fatura ? ` · fatura de ${MES3[+o.fatura.slice(5) - 1]}` : ''}</span>
        ${o.div > 1 ? `<span class="small ink2">Dividido por ${o.div}: sua parte ${brl(o.minha)}, a receber ${brl(o.receber)}${o.recebido ? ' (recebido)' : ''}.</span>` : ''}</div>
      <div class="field"><label for="ocVal">Valor só em ${esc(MESES[+ym.slice(5) - 1])}</label><label class="money" for="ocVal"><span>R$</span><input id="ocVal" inputmode="numeric" value="${fmtInput(o.valor)}" autocomplete="off"></label>
        <span class="tiny muted">Use para um mês diferente (reajuste pontual, desconto). Para mudar de vez, edite o gasto fixo.</span></div>
      <div class="stack" style="gap:8px">
        <button class="btn pri" data-act="oc-save">${ic('check')}Salvar valor deste mês</button>
        ${o.div > 1 ? `<button class="btn" data-act="oc-recebido" data-v="${o.recebido ? 0 : 1}">${ic('users')}${o.recebido ? 'Desmarcar recebido' : 'Marcar a parte da família como recebida'}</button>` : ''}
        <button class="btn" data-act="oc-pular">${exc.pular ? 'Voltar a cobrar este mês' : 'Não houve cobrança este mês'}</button>
        <button class="btn ghost" data-act="rec-edit" data-id="${esc(rec.id)}">Editar o gasto fixo</button></div>`;
    openSheet(html, (sh) => { const v = $('#ocVal', sh); v.oninput = () => { const c = centsFromDigits(v.value); sheetState.valor = c; v.value = c ? fmtInput(c) : ''; }; });
  }

  // Gasto fixo (cadastro)
  function openRec(rec) {
    const ym = ymHoje();
    const r = rec ? clone(rec) : { id: 'R' + Date.now().toString(36), tipo: 'despesa', desc: '', catId: null, subId: null, meioId: meioPadrao(), dia: 1, inicio: ym, fim: null, div: 1, valores: [], excecoes: {}, recebidos: {} };
    const vAtual = rec ? (E.valorRecorrente(r, ym) ?? E.valorRecorrente(r, r.inicio > ym ? r.inicio : ym) ?? (r.valores.slice(-1)[0] || {}).valor ?? 0) : 0;
    sheetState = { kind: 'rec', r, isEdit: !!rec, valor: vAtual, valorOrig: vAtual, desde: rec ? (r.inicio > ym ? r.inicio : ym) : ym, err: '' };
    renderRec();
  }
  function renderRec() {
    const st = sheetState, r = st.r, ym = ymHoje();
    const isIn = r.tipo === 'receita' || r.tipo === 'ressarcimento';
    const isRess = r.tipo === 'ressarcimento';
    const meiosOk = meiosAtivos().filter((m) => !isIn || m.tipo !== 'credito');
    const sub = r.catId ? E.findSub(categorias(), r.catId, r.subId) : null;
    const mudou = st.isEdit && st.valor !== st.valorOrig;
    const html = `${sheetHead(st.isEdit ? 'Editar fixo' : 'Novo fixo')}
      <div class="seg" role="group" aria-label="Tipo"><button data-act="r-tipo" data-v="despesa" aria-pressed="${r.tipo === 'despesa'}">Gasto</button><button data-act="r-tipo" data-v="receita" aria-pressed="${r.tipo === 'receita'}">Entrada</button><button data-act="r-tipo" data-v="ressarcimento" aria-pressed="${isRess}">Ressarcimento</button></div>
      ${isRess ? `<div class="hint">${ic('info')}<span>Valor que alguém te devolve todo mês por um gasto seu. Abate do quanto você gastou e fica em "A receber" até você marcar que recebeu.</span></div>` : ''}
      <div class="field"><label for="rDesc">Descrição</label><input class="inp" id="rDesc" value="${esc(r.desc)}" placeholder="${isRess ? 'Ex.: Ressarcimento do clube' : isIn ? 'Ex.: Salário' : 'Ex.: Netflix, Seguro da moto'}" autocomplete="off"></div>
      <div class="field"><label for="rValor">Valor mensal</label><label class="money ${isIn ? 'in' : ''}" for="rValor"><span>R$</span><input id="rValor" inputmode="numeric" value="${st.valor ? fmtInput(st.valor) : ''}" placeholder="0,00" autocomplete="off"></label></div>
      ${mudou ? `<div class="field"><label for="rDesde">O novo valor vale a partir de</label><input class="inp" type="month" id="rDesde" value="${esc(st.desde)}"><span class="tiny muted">Os meses anteriores continuam com o valor antigo.</span></div>` : ''}
      <div class="field"><span class="lbl">Categoria</span><button class="catbtn" data-act="r-cat"><span class="mono">${r.catId ? esc(iniciais(catSo(r.catId))) : ic('tag')}</span><span class="grow"><b>${sub ? esc(sub.nome) : 'Escolher categoria'}</b><span>${r.catId ? esc(catSo(r.catId)) : ''}</span></span>${ic('right', 'chev')}</button></div>
      <div class="field"><span class="lbl">${isIn ? 'Entra em' : 'Cobrado em'}</span><div class="chips">${meiosOk.map((m) => `<button class="chip" style="--cc:${esc(m.cor || 'var(--muted)')}" data-act="r-meio" data-id="${esc(m.id)}" aria-pressed="${m.id === r.meioId}"><i></i>${esc(m.nome)}</button>`).join('')}</div></div>
      <div class="toggle"><span><b>Dia do mês</b><br><span class="small muted">Para cartão, define a fatura</span></span><span class="stepper"><button data-act="r-dia" data-d="-1" aria-label="Dia anterior">−</button><output>${r.dia}</output><button data-act="r-dia" data-d="1" aria-label="Próximo dia">+</button></span></div>
      ${!isIn ? `<div class="toggle"><span><b>Dividido</b><br><span class="small muted">${r.div > 1 ? `Sua parte ${brl(Math.round(st.valor / r.div))}` : 'Você paga e a família devolve'}</span></span><button class="switch" role="switch" aria-checked="${r.div > 1}" data-act="r-div" aria-label="Dividido"></button></div>
        ${r.div > 1 ? `<div class="toggle"><span class="small ink2">Por quantas pessoas</span><span class="stepper"><button data-act="r-divn" data-d="-1" aria-label="Menos">−</button><output>${r.div}</output><button data-act="r-divn" data-d="1" aria-label="Mais">+</button></span></div>` : ''}` : ''}
      <div class="row" style="gap:10px"><div class="field grow"><label for="rIni">Começa em</label><input class="inp" type="month" id="rIni" value="${esc(r.inicio)}"></div>
        <div class="field grow"><label for="rFim">Termina em (opcional)</label><input class="inp" type="month" id="rFim" value="${esc(r.fim || '')}"></div></div>
      ${st.err ? `<p class="err" role="alert">${esc(st.err)}</p>` : ''}
      <button class="btn pri" data-act="r-save">${ic('check')}Salvar</button>
      ${st.isEdit ? `<button class="btn danger" data-act="r-end">${r.inicio > ym ? 'Excluir este fixo' : `Encerrar (último mês: ${esc(mesCurto(E.addMonthsYM(ym, -1) < r.inicio ? r.inicio : E.addMonthsYM(ym, -1)))})`}</button>` : ''}`;
    const sh = $('#sheet');
    if (sh) { const sc = sh.scrollTop; $('.sheet-in', sh).innerHTML = html; sh.scrollTop = sc; } else openSheet(html);
    const d = $('#rDesc'), v = $('#rValor'), ini = $('#rIni'), fim = $('#rFim'), desde = $('#rDesde');
    d.oninput = () => { r.desc = d.value; };
    d.onchange = () => { if (!r.catId) { const c = classifyLocal(d.value, r.tipo); if (c) { r.catId = c.catId; r.subId = c.subId; renderRec(); } } };
    v.oninput = () => { const c = centsFromDigits(v.value); const before = st.valor !== st.valorOrig; st.valor = c; v.value = c ? fmtInput(c) : ''; if (st.isEdit && before !== (st.valor !== st.valorOrig)) renderRec(); };
    ini.onchange = () => { if (/^\d{4}-\d{2}$/.test(ini.value)) r.inicio = ini.value; };
    fim.onchange = () => { r.fim = /^\d{4}-\d{2}$/.test(fim.value) ? fim.value : null; };
    if (desde) desde.onchange = () => { if (/^\d{4}-\d{2}$/.test(desde.value)) st.desde = desde.value; };
  }
  async function saveRecForm() {
    const st = sheetState, r = st.r;
    r.desc = r.desc.trim();
    if (!r.desc) { st.err = 'Escreva uma descrição.'; return renderRec(); }
    if (!st.valor) { st.err = 'Informe o valor.'; return renderRec(); }
    if (!r.catId) { st.err = 'Escolha a categoria.'; return renderRec(); }
    if (r.fim && r.fim < r.inicio) { st.err = 'O mês final precisa ser depois do inicial.'; return renderRec(); }
    if (r.tipo === 'receita') r.div = 1;
    if (!st.isEdit) r.valores = [{ desde: r.inicio, valor: st.valor }];
    else if (st.valor !== st.valorOrig) {
      const desde = st.desde < r.inicio ? r.inicio : st.desde;
      r.valores = (r.valores || []).filter((x) => x.desde < desde).concat([{ desde, valor: st.valor }]);
    } else if (!r.valores.length || r.valores[0].desde > r.inicio) {
      r.valores = [{ desde: r.inicio, valor: st.valor }, ...(r.valores || []).filter((x) => x.desde > r.inicio)];
    }
    if (r.valores.length && r.valores[0].desde > r.inicio) r.valores[0].desde = r.inicio;
    closeSheet();
    if (await saveRec(r)) toast(st.isEdit ? 'Gasto fixo atualizado.' : 'Fixo cadastrado. Já entra na previsão.');
  }

  // Forma de pagamento
  function openMeio(m) {
    const x = m ? clone(m) : { id: 'M' + Date.now().toString(36), nome: '', banco: '', tipo: 'credito', fechamento: 1, vencimento: 10, cor: CORES[4], ativo: true, ordem: meios().length + 1 };
    sheetState = { kind: 'meio', m: x, isEdit: !!m, err: '' };
    renderMeio();
  }
  function renderMeio() {
    const st = sheetState, m = st.m;
    const cr = m.tipo === 'credito';
    const html = `${sheetHead(st.isEdit ? 'Editar forma de pagamento' : 'Nova forma de pagamento')}
      <div class="field"><label for="mNome">Nome</label><input class="inp" id="mNome" value="${esc(m.nome)}" placeholder="Ex.: Nubank Crédito" autocomplete="off"></div>
      <div class="field"><label for="mBanco">Banco</label><input class="inp" id="mBanco" value="${esc(m.banco)}" placeholder="Ex.: Nubank" autocomplete="off"><span class="tiny muted">É pelo nome do banco que o app entende frases como "padaria 20 nubank".</span></div>
      <div class="field"><label for="mTipo">Tipo</label><select class="inp" id="mTipo">${Object.entries(TIPOS_MEIO).map(([k, l]) => `<option value="${k}" ${m.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${cr ? `<div class="row" style="gap:10px"><div class="field grow"><label for="mFec">Dia de fechamento</label><input class="inp" id="mFec" type="number" inputmode="numeric" min="1" max="31" value="${m.fechamento}"></div>
        <div class="field grow"><label for="mVen">Dia de vencimento</label><input class="inp" id="mVen" type="number" inputmode="numeric" min="1" max="31" value="${m.vencimento}"></div></div>
        <div class="hint">${ic('info')}<span id="mHint">${meioHint(m)}</span></div>` : ''}
      <div class="field"><span class="lbl">Cor</span><div class="wrapflex">${CORES.map((c) => `<button class="chip" data-act="m-cor" data-c="${c}" aria-pressed="${m.cor === c}" aria-label="Cor ${c}" style="--cc:${c};padding:8px"><i style="width:18px;height:18px;border-radius:6px"></i></button>`).join('')}</div></div>
      <div class="toggle"><span><b>Ativo</b><br><span class="small muted">Inativos somem das opções, mas o histórico fica</span></span><button class="switch" role="switch" aria-checked="${m.ativo !== false}" data-act="m-ativo" aria-label="Ativo"></button></div>
      <div class="toggle"><span><b>Padrão</b><br><span class="small muted">Usado quando a frase não diz como pagou</span></span><button class="switch" role="switch" aria-checked="${meioPadrao() === m.id}" data-act="m-padrao" aria-label="Padrão"></button></div>
      ${st.err ? `<p class="err" role="alert">${esc(st.err)}</p>` : ''}
      <button class="btn pri" data-act="m-save">${ic('check')}Salvar</button>`;
    const sh = $('#sheet');
    if (sh) { $('.sheet-in', sh).innerHTML = html; } else openSheet(html);
    const g = (id) => $('#' + id);
    g('mNome').oninput = () => { m.nome = g('mNome').value; };
    g('mBanco').oninput = () => { m.banco = g('mBanco').value; };
    g('mTipo').onchange = () => { m.tipo = g('mTipo').value; renderMeio(); };
    if (g('mFec')) {
      const up = () => { m.fechamento = Math.min(31, Math.max(1, +g('mFec').value || 1)); m.vencimento = Math.min(31, Math.max(1, +g('mVen').value || 1)); g('mHint').textContent = meioHint(m); };
      g('mFec').oninput = up; g('mVen').oninput = up;
    }
  }
  function meioHint(m) {
    const f = E.fatura(m, hoje());
    const ultimo = m.fechamento - 1;
    return `Compras até o dia ${ultimo >= 1 ? ultimo : 'último do mês anterior'} entram na fatura que fecha no dia ${m.fechamento}. Hoje, uma compra cai na fatura que vence em ${dataCurta(f.vence)}.`;
  }

  // Confirmação embutida (o visualizador não mostra confirm())
  function confirmSheet(title, text, label, fn, danger = true) {
    const back = sheetState;
    sheetState = { kind: 'confirm', fn, back };
    openSheet(`${sheetHead(title)}<p class="ink2" style="margin:0">${esc(text)}</p><div class="btns" style="grid-template-columns:1fr 1fr"><button class="btn" data-act="close-sheet">Cancelar</button><button class="btn ${danger ? 'danger' : 'pri'}" data-act="confirm-yes">${esc(label)}</button></div>`);
  }
  function promptSheet(title, label, value, fn, extra = '') {
    sheetState = { kind: 'prompt', fn };
    openSheet(`${sheetHead(title)}<div class="field"><label for="pIn">${esc(label)}</label><input class="inp" id="pIn" value="${esc(value || '')}" autocomplete="off"></div>${extra}<button class="btn pri" data-act="prompt-ok">${ic('check')}Salvar</button>`, (sh) => setTimeout(() => $('#pIn', sh).focus(), 50));
  }

  // Ajuste de fatura
  function openAjuste(ref) {
    const m = meioById(S.ui.cardId); if (!m) return;
    const f = E.faturaPorRef(m, ref);
    const its = E.itensFatura(D().state, m.id, ref, hoje());
    const ajuste = its.find((o) => o.tipo === 'ajuste');
    const semAjuste = E.sum(its.filter((o) => o.tipo !== 'ajuste'), (o) => o.valor);
    sheetState = { kind: 'ajuste', m, ref, f, ajuste, semAjuste, total: semAjuste + (ajuste ? ajuste.valor : 0) };
    openSheet(`${sheetHead('Ajustar fatura')}
      <p class="small ink2" style="margin:0">Digite o valor que o app do ${esc(m.banco || m.nome)} mostra para a fatura de ${esc(MESES[+ref.slice(5) - 1])}. A diferença entra como "valor anterior ao app" e não aparece nos gráficos de categoria.</p>
      <label class="money" for="ajVal"><span>R$</span><input id="ajVal" inputmode="numeric" value="${fmtInput(sheetState.total)}" autocomplete="off"></label>
      <p class="tiny muted" style="margin:0">Lançado no Todo dIA: ${brl(semAjuste)}</p>
      <button class="btn pri" data-act="aj-save">${ic('check')}Salvar ajuste</button>`, (sh) => {
      const v = $('#ajVal', sh); v.oninput = () => { const c = centsFromDigits(v.value); sheetState.total = c; v.value = c ? fmtInput(c) : ''; };
    });
  }
  async function saveAjuste() {
    const st = sheetState; const diff = st.total - st.semAjuste;
    closeSheet();
    const its = itens();
    const old = st.ajuste ? its.find((i) => i.id === st.ajuste.refId) : null;
    if (diff <= 0) { if (old) await softDelete(old, true); toast(diff < 0 ? 'O lançado já passa do valor do banco. Confira se há compras repetidas.' : 'Ajuste removido.'); return; }
    const item = old ? clone(old) : { id: uid('A'), tipo: 'ajuste', desc: 'Valor anterior ao app', meioId: st.m.id, data: st.f.inicio, catId: null, subId: null, parcelas: 1, div: 1 };
    item.valor = diff; delete item.excluido;
    await saveItem(item, old ? E.ymOf(old.data) : null);
    toast('Fatura ajustada.');
  }

  // ---------- Backup ----------
  let xlsxLoading = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLoading) return xlsxLoading;
    xlsxLoading = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = () => (window.XLSX ? res(window.XLSX) : rej(new Error('xlsx'))); s.onerror = () => { xlsxLoading = null; rej(new Error('Não consegui carregar o gerador de planilhas.')); };
      document.head.appendChild(s);
    });
    return xlsxLoading;
  }
  async function buildWorkbook() {
    const X = await loadXlsx();
    const d = D(); const R = (c) => Math.round(c) / 100;
    const wb = X.utils.book_new();
    const lanc = d.its.filter((i) => !i.excluido).sort((a, b) => (a.data < b.data ? -1 : 1)).map((i) => ({
      ID: i.id, Tipo: i.tipo, Data: i.data, Descrição: i.desc, Categoria: catSo(i.catId), Subcategoria: subSo(i.catId, i.subId),
      'Forma de pagamento': (meioById(i.meioId) || {}).nome || i.meioId, 'Valor total (R$)': R(i.valor), Parcelas: i.parcelas || 1,
      'Dividido por': i.div || 1, 'Sua parte (R$)': R(Math.round(i.valor / (i.div || 1))), Observação: i.obs || '',
    }));
    const ocs = d.occ.filter((o) => o.comp <= E.addMonthsYM(ymHoje(), 12)).slice().sort((a, b) => (a.data < b.data ? -1 : 1)).map((o) => ({
      Competência: o.comp, Data: o.data, Tipo: o.tipo, Descrição: o.desc, Categoria: catSo(o.catId), Subcategoria: subSo(o.catId, o.subId),
      'Forma de pagamento': (meioById(o.meioId) || {}).nome || '', Fatura: o.fatura || '', 'Valor (R$)': R(o.valor), 'Sua parte (R$)': R(o.minha),
      'A receber (R$)': R(o.receber), Recebido: o.receber ? (o.recebido ? 'sim' : 'não') : '', Fixo: o.fixo ? 'sim' : '', Parcela: o.parcela ? o.parcela.join('/') : '', Previsto: o.previsto ? 'sim' : '',
    }));
    const fixos = S.recorrentes.map((r) => ({ ID: r.id, Tipo: r.tipo, Descrição: r.desc, Categoria: catSo(r.catId), Subcategoria: subSo(r.catId, r.subId), 'Forma de pagamento': (meioById(r.meioId) || {}).nome || '', Dia: r.dia, Início: r.inicio, Fim: r.fim || '', 'Dividido por': r.div || 1, 'Valores (desde: R$)': (r.valores || []).map((v) => `${v.desde}: ${R(v.valor)}`).join(' | ') }));
    const ms = meios().map((m) => ({ ID: m.id, Nome: m.nome, Banco: m.banco, Tipo: TIPOS_MEIO[m.tipo] || m.tipo, Fechamento: m.fechamento || '', Vencimento: m.vencimento || '', Ativo: m.ativo === false ? 'não' : 'sim' }));
    const cs = categorias().flatMap((c) => c.subs.map((s) => ({ Categoria: c.nome, Subcategoria: s.nome, Tipo: c.tipo, 'Divisão padrão': s.div || '' })));
    const add = (rows, name) => X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows.length ? rows : [{ '': 'sem dados' }]), name);
    add(lanc, 'Lançamentos'); add(ocs, 'Mês a mês'); add(fixos, 'Fixos'); add(ms, 'Cartões e contas'); add(cs, 'Categorias');
    return X.write(wb, { type: 'array', bookType: 'xlsx' });
  }
  async function backupXlsx() {
    const msg = $('#backupMsg');
    try {
      if (msg) msg.textContent = 'Gerando a planilha…';
      const buf = await buildWorkbook();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `todo-dia-${hoje()}.xlsx`;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      if (msg) msg.textContent = 'Planilha baixada.';
    } catch (e) { console.warn(e); if (msg) msg.textContent = 'Não consegui gerar o arquivo agora. Confira a internet.'; }
  }

  // ---------- Gráficos (SVG desenhado na largura real) ----------
  function niceMax(v) {
    if (v <= 0) return 10000;
    const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e;
    const n = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
    return n * e;
  }
  const topRound = (x, y, w, h, r) => {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  };
  function drawChart(el) {
    const spec = S.charts[el.dataset.chart]; if (!spec) return;
    const W = spec.W || Math.max(240, el.clientWidth), H = spec.H || el.clientHeight || 200;
    const padL = 42, padR = 6, padT = 16, padB = 22;
    const iw = W - padL - padR, ih = H - padT - padB;
    const n = spec.months.length, band = iw / n;
    const totals = spec.months.map((_, i) => spec.kind === 'stack' ? spec.series.reduce((s, x) => s + (x.values[i] || 0), 0)
      : Math.max(...spec.series.map((x) => (x.values[i] || 0) + ((x.prev && x.prev[i]) || 0))));
    const max = niceMax(Math.max(...totals, spec.avg || 0, 1));
    const y = (v) => padT + ih - (v / max) * ih;
    const ticks = [0, max / 2, max];
    let g = '';
    for (const t of ticks) g += `<line x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}" stroke="var(--grid)" stroke-width="1"/><text x="${padL - 6}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${E.fmtCompact(t)}</text>`;
    const tips = [];
    let bars = '';
    spec.months.forEach((ym, i) => {
      const x0 = padL + i * band; const cx = x0 + band / 2;
      const sel = ym === spec.sel;
      if (spec.kind === 'col') {
        const s = spec.series[0]; const bw = Math.min(24, band * 0.62);
        const v = s.values[i] || 0, p = (s.prev && s.prev[i]) || 0;
        const hv = (v / max) * ih, hp = (p / max) * ih;
        if (p) bars += `<path d="${topRound(cx - bw / 2, y(v + p), bw, Math.max(0, hp - (v ? 2 : 0)), 4)}" fill="${s.color}" fill-opacity=".32"/>`;
        if (v) bars += `<path d="${p ? `M${cx - bw / 2},${y(0)}V${y(v)}H${cx + bw / 2}V${y(0)}Z` : topRound(cx - bw / 2, y(v), bw, hv, 4)}" fill="${s.color}"/>`;
        tips.push({ x: cx, y: y(v + p), html: `<b>${esc(mesNome(ym))}</b><br>${esc(s.name)}: ${brl(v + p)}${p ? `<br>${brl(v)} realizado · ${brl(p)} previsto` : ''}${spec.avg ? `<br>Média: ${brl(spec.avg)}` : ''}` });
      } else if (spec.kind === 'group') {
        const k = spec.series.length; const bw = Math.min(12, (band * 0.7 - 2 * (k - 1)) / k);
        const tw = bw * k + 2 * (k - 1);
        spec.series.forEach((s, j) => { const v = s.values[i] || 0; if (v) bars += `<path d="${topRound(cx - tw / 2 + j * (bw + 2), y(v), bw, (v / max) * ih, 3)}" fill="${s.color}"/>`; });
        const a = spec.series[0].values[i] || 0, b = spec.series[1].values[i] || 0;
        tips.push({ x: cx, y: y(Math.max(a, b)), html: `<b>${esc(mesNome(ym))}</b><br>${spec.series.map((s) => `${esc(s.name)}: ${brl(s.values[i] || 0)}`).join('<br>')}<br>Saldo: ${brl(a - b)}` });
      } else {
        const bw = Math.min(24, band * 0.62); let acc = 0; const parts = [];
        spec.series.forEach((s) => { const v = s.values[i] || 0; if (v > 0) parts.push({ s, v, from: acc }); acc += Math.max(0, v); });
        parts.forEach((p, j) => {
          const top = j === parts.length - 1;
          const y1 = y(p.from + p.v), y0 = y(p.from) - (j > 0 ? 2 : 0);
          const h = Math.max(0, y0 - y1);
          bars += top ? `<path d="${topRound(cx - bw / 2, y1, bw, h, 4)}" fill="${p.s.color}"/>` : `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${h}" fill="${p.s.color}"/>`;
        });
        tips.push({ x: cx, y: y(acc), html: `<b>${esc(mesNome(ym))}</b><br>${spec.series.map((s) => `${esc(s.name)}: ${brl(s.values[i] || 0)}`).join('<br>')}<br>Total: ${brl(acc)}` });
      }
      const lab = spec.labels[i];
      g += `<text x="${cx}" y="${H - 5}" text-anchor="middle" font-size="11" fill="${sel ? 'var(--ink)' : 'var(--muted)'}" font-weight="${sel ? 800 : 500}">${esc(lab)}</text>`;
      if (sel) g += `<rect x="${x0 + 2}" y="${padT - 6}" width="${band - 4}" height="${ih + 6}" rx="8" fill="var(--surface-2)"/>`;
    });
    let avg = '';
    if (spec.avg) {
      const ya = y(spec.avg);
      avg = `<line x1="${padL}" x2="${W - padR}" y1="${ya}" y2="${ya}" stroke="var(--ink)" stroke-width="1.5" stroke-opacity=".75"/>
        <rect x="${W - padR - 92}" y="${ya - 17}" width="92" height="15" rx="4" fill="var(--surface)"/><text x="${W - padR - 2}" y="${ya - 6}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--ink-2)">média ${E.fmtCompact(spec.avg)}</text>`;
    }
    const hits = spec.months.map((ym, i) => `<rect x="${padL + i * band}" y="${padT}" width="${band}" height="${ih + padB}" fill="transparent" data-hit="${i}" ${spec.act ? `data-act="${spec.act}" data-ym="${ym}"` : ''} style="cursor:pointer"/>`).join('');
    spec.tips = tips;
    el.innerHTML = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="height:auto" role="img" aria-label="Gráfico de barras por mês">${g}<line x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}" stroke="var(--axis)"/>${bars}${avg}${hits}</svg><div class="tip" hidden></div>`;
  }
  function drawCharts() { document.querySelectorAll('[data-chart]').forEach((el) => { try { drawChart(el); } catch (e) { console.warn('chart', e); } }); }
  function showTip(rect) {
    const el = rect.closest('[data-chart]'); const spec = S.charts[el.dataset.chart]; if (!spec || !spec.tips) return;
    const t = spec.tips[+rect.dataset.hit]; const tip = $('.tip', el); if (!t || !tip) return;
    tip.innerHTML = t.html; tip.hidden = false;
    const w = el.clientWidth; const tw = tip.offsetWidth;
    const left = Math.min(Math.max(t.x, tw / 2 + 2), w - tw / 2 - 2);
    tip.style.left = left + 'px'; tip.style.top = Math.max(t.y, tip.offsetHeight + 12) + 'px';
  }

  // ---------- Render ----------
  let pendingRender = false;
  const TABS = { inicio: 'Início', lancamentos: 'Lançamentos', cartoes: 'Cartões', relatorios: 'Relatórios', ajustes: 'Ajustes' };
  const SUBS = { importar: 'Importar lançamentos', trava: 'Trava com a digital', recorrentes: 'Fixos', meios: 'Formas de pagamento', categorias: 'Categorias', regras: 'O que o app aprendeu', backup: 'Sua planilha', conexao: 'Sua planilha', lixeira: 'Lixeira', sobre: 'Sobre', receber: 'A receber' };
  function syncHtml() {
    const n = S.outbox.length;
    if (S.net === 'sync') return '<span class="sync"><i></i>sincronizando</span>';
    if (S.net === 'offline') return `<span class="sync off"><i></i>${n ? n + ' na fila' : navigator.onLine === false ? 'sem internet' : 'reconectando…'}</span>`;
    if (S.net === 'erro') return '<span class="sync off"><i></i>verificar conexão</span>';
    if (n) return `<span class="sync off"><i></i>${n} na fila</span>`;
    return '';
  }
  function renderSoft() { const el = $('#syncInd'); if (el) el.innerHTML = syncHtml(); }
  function render() {
    const root = $('#app'); if (!root) return;
    if (S.conn && S.locked) { root.innerHTML = viewLock(); return; }
    if (S.conn && S.ui.report) { try { root.innerHTML = viewReport(); drawCharts(); } catch (e) { console.error(e); S.ui.report = null; toast('Não consegui montar o relatório.'); render(); } return; }
    if (!S.conn) {
      const active = document.activeElement; const keepId = active && root.contains(active) ? active.id : null;
      root.innerHTML = viewSetup();
      if (keepId) { const el = document.getElementById(keepId); if (el) el.focus(); }
      return;
    }
    // se um formulário está aberto, atualiza só o fundo (o formulário mantém o que você está digitando)
    try {
      const tab = S.ui.tab;
      let body;
      if (tab === 'inicio') body = viewInicio();
      else if (tab === 'lancamentos') body = viewLancamentos();
      else if (tab === 'cartoes') body = viewCartoes();
      else if (tab === 'relatorios') body = viewRelatorios();
      else body = viewAjustes();
      const sub = tab === 'ajustes' && S.ui.sub;
      const sync = `<button id="syncInd" data-act="go-conexao" aria-label="Situação da conexão com a planilha">${syncHtml()}</button>`;
      const header = tab === 'inicio'
        ? `<div class="brand">${LOGO()}${WORD}</div>${sync}<button class="icon-btn" data-act="tab" data-tab="ajustes" aria-label="Ajustes">${ic('gear')}</button>`
        : sub ? `<button class="icon-btn" data-act="sub" data-sub="" aria-label="Voltar">${ic('left')}</button><span class="top-title">${esc(SUBS[sub] || '')}</span>${sync}`
          : `<span class="top-title">${esc(TABS[tab])}</span>${sync}${tab !== 'ajustes' ? `<button class="icon-btn" data-act="tab" data-tab="ajustes" aria-label="Ajustes">${ic('gear')}</button>` : ''}`;
      const nav = (k, icn, l) => `<a href="#${k}" data-act="tab" data-tab="${k}" ${tab === k ? 'aria-current="page"' : ''}>${ic(icn)}<span>${l}</span></a>`;
      const active = document.activeElement;
      const keepId = active && root.contains(active) ? active.id : null;
      const pos = keepId && active.selectionStart != null ? active.selectionStart : null;
      root.innerHTML = `<header class="top"><div class="top-in wrap">${header}</div></header>
        <main class="wrap" style="padding-block:6px 0">${body}</main>
        <nav class="nav" aria-label="Navegação"><div class="nav-in">${nav('inicio', 'home', 'Início')}${nav('lancamentos', 'list', 'Lançamentos')}
          <button class="fab-wrap" data-act="new" aria-label="Novo lançamento"><span class="fab">${ic('plus')}</span></button>
          ${nav('cartoes', 'card', 'Cartões')}${nav('relatorios', 'chart', 'Relatórios')}</div></nav>`;
      if (keepId) { const el = document.getElementById(keepId); if (el) { el.focus(); try { if (pos != null) el.setSelectionRange(pos, pos); } catch { /* ok */ } } }
      bindView();
      drawCharts();
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="wrap" style="padding-block:40px"><div class="card stack">${LOGO()}<b>Algo deu errado ao montar esta tela.</b><span class="small muted">${esc(e && e.message)}</span><button class="btn pri" data-act="tab" data-tab="inicio">Voltar ao início</button></div></div>`;
    }
  }
  function bindView() {
    const b = $('#busca'); if (b) b.oninput = () => { S.ui.busca = b.value; clearTimeout(bindView.t); bindView.t = setTimeout(render, 180); };
    const rc = $('#relCat'); if (rc) rc.onchange = () => { S.ui.relCat = rc.value; render(); };
    const qi = $('#quickIn'); if (qi) qi.oninput = () => { S.ui.quickText = qi.value; if (S.ui.quick && S.ui.quick.parsed) { S.ui.quick = null; render(); } };
  }
  function setTab(tab, sub = null) {
    S.ui.tab = TABS[tab] ? tab : 'inicio'; S.ui.sub = sub;
    lsSet(LS.ui, { tab: S.ui.tab });
    try { if (location.hash !== '#' + S.ui.tab) history.replaceState(null, '', '#' + S.ui.tab); } catch { /* ok */ }
    render(); window.scrollTo(0, 0);
  }

  // ---------- Lançamento rápido ----------
  async function quickSubmit(text) {
    text = String(text || '').trim(); S.ui.quickText = text; if (!text) { openLanc(); return; }
    const t = hoje();
    const p = E.parse(text, { hoje: t, meios: meiosAtivos(), meioPadrao: meioPadrao() });
    let tipo = p.tipoHint || 'despesa';
    let cls = classifyLocal(p.desc, null);
    if (cls) { const c = E.findCat(categorias(), cls.catId); if (c && (c.tipo || 'despesa') !== tipo && !p.tipoHint) tipo = c.tipo || 'despesa'; if (c && (c.tipo || 'despesa') !== tipo) cls = null; }
    const regra = S.cfg.regras[E.ruleKey(p.desc)];
    const parsed = { ...p, tipo, data: p.data || t, catId: cls ? cls.catId : null, subId: cls ? cls.subId : null, fonte: cls ? cls.fonte : null };
    if (!p.meioId) parsed.meioId = (regra && regra.meioId && meioById(regra.meioId) ? regra.meioId : null) || meioPadrao();
    if (tipo === 'receita' && meioById(parsed.meioId) && meioById(parsed.meioId).tipo === 'credito') parsed.meioId = (meiosAtivos().find((m) => m.tipo === 'pix') || meiosAtivos().find((m) => m.tipo !== 'credito') || {}).id;
    if (parsed.catId && parsed.div === 1) { const sd = E.findSub(categorias(), parsed.catId, parsed.subId); if (sd && sd.div > 1) parsed.div = sd.div; }
    if (parsed.parcelas > 1 && !(meioById(parsed.meioId) && meioById(parsed.meioId).tipo === 'credito')) parsed.parcelas = 1;
    S.ui.quick = { text, parsed };
    render();
    if (!parsed.valor || !parsed.catId) { const pre = { ...parsed }; S.ui.quick = null; S.ui.quickText = ''; render(); openLanc({ ...pre, fonte: pre.fonte }); }
  }
  async function quickSave() {
    const q = S.ui.quick; if (!q) return;
    const p = q.parsed;
    const item = { id: uid(), tipo: p.tipo, desc: p.desc || 'Sem descrição', valor: p.valor, data: p.data, meioId: p.meioId, catId: p.catId, subId: p.subId, parcelas: p.parcelas || 1, div: p.tipo === 'despesa' ? p.div || 1 : 1, obs: '', fonteCat: p.fonte };
    S.ui.quick = null; S.ui.quickText = ''; render();
    learn(item.desc, item.catId, item.subId, item.meioId);
    vibrate();
    if (!(await saveItem(item, null))) return;
    const m = meioById(item.meioId); const f = m && m.tipo === 'credito' && item.tipo === 'despesa' ? E.fatura(m, item.data) : null;
    toast(f ? `Lançado. Entrou na fatura de ${MES3[+f.ref.slice(5) - 1]}.` : 'Lançado.', { label: 'Desfazer', fn: () => softDelete(item, true) });
  }

  // ---------- Ações ----------
  function findOcc(key) { return D().occ.find((o) => o.key === key); }
  async function act(a, el, ev) {
    const st = sheetState;
    switch (a) {
      case 'tab': ev.preventDefault(); setTab(el.dataset.tab); break;
      case 'sub': if (S.ui.tab !== 'ajustes') S.ui.tab = 'ajustes'; S.ui.sub = el.dataset.sub || null; render(); window.scrollTo(0, 0); break;
      case 'new': S.ui.quick = null; openLanc(); break;
      case 'close-sheet': if (st && st.kind === 'cat' && st.back) { const b = st.back; sheetState = b; closeSheet(true); if (b.kind === 'lanc') renderLanc(); else if (b.kind === 'rec') renderRec(); } else closeSheet(); break;
      case 'flush': S.retryN = 0; sync(); break;
      case 'unlock': desbloquear(); break;
      case 'rp-open': S.ui.report = { per: 'tudo' }; render(); window.scrollTo(0, 0); break;
      case 'rp-per': S.ui.report.per = el.dataset.p; render(); break;
      case 'rp-close': S.ui.report = null; render(); window.scrollTo(0, 0); break;
      case 'rp-print': { const old = document.title; document.title = `Todo dIA - relatório ${hoje()}`; try { window.print(); } catch { toast('Não consegui abrir a impressão. Abra o app pelo Chrome e tente de novo.'); } setTimeout(() => { document.title = old; }, 1500); break; }
      case 'imp-ler': { const txt = ($('#impTxt') || {}).value || ''; S.ui.imp = { txt }; try { S.ui.imp.ok = lerImportacao(txt); } catch (e) { S.ui.imp.err = e.message; } render(); break; }
      case 'imp-ok': {
        const p = S.ui.imp && S.ui.imp.ok; if (!p) break;
        for (const it of p.itens) saveItem(clone(it));
        for (const f of p.fixos) { const r = clone(f.r); if (f.excluir) r.excluido = true; Object.assign(r, f.set); saveRec(r); }
        S.ui.imp = null; toast(`Importado: ${p.itens.length} lançamentos${p.fixos.length ? ` e ${p.fixos.length} ${p.fixos.length === 1 ? 'fixo ajustado' : 'fixos ajustados'}` : ''}.`);
        setTab('cartoes'); break;
      }
      case 'lock-on': ligarTrava(); break;
      case 'lock-off': desligarTrava(); break;
      case 'lock-now': trancar(); break;
      case 'go-conexao': S.ui.tab = 'ajustes'; S.ui.sub = 'conexao'; render(); window.scrollTo(0, 0); break;
      case 'install': if (S.installPrompt) { const p = S.installPrompt; S.installPrompt = null; try { p.prompt(); await p.userChoice; } catch { /* ok */ } render(); } break;
      case 'reconnect': S.ui.prevConn = S.conn; S.ui.setupUrl = S.conn ? S.conn.url : ''; S.ui.setupKey = ''; S.ui.setupErr = ''; S.conn = null; render(); break;
      case 'setup-cancel': if (S.ui.prevConn) { S.conn = S.ui.prevConn; S.ui.prevConn = null; render(); } break;
      case 'disconnect': confirmSheet('Desconectar este aparelho', S.outbox.length ? `Há ${S.outbox.length} alterações que ainda não foram para a planilha e serão perdidas. Sua planilha continua intacta.` : 'O app apaga a cópia deste aparelho. Sua planilha continua intacta e você pode conectar de novo quando quiser.', 'Desconectar', () => {
        [LS.conn, LS.data, LS.outbox].forEach(lsDel); S.conn = null; S.outbox = []; S.server = { lancamentos: [], fixos: [], config: {}, planilhaUrl: '' }; S.lastSync = 0; applyView(); setTab('inicio');
      }); break;
      case 'mes': S.ui.mes = E.addMonthsYM(S.ui.mes, +el.dataset.d); render(); break;
      case 'relmes': S.ui.relMes = E.addMonthsYM(S.ui.relMes, +el.dataset.d); render(); break;
      case 'rel-mes': if (el.dataset.ym) { const id = el.closest('[data-chart]').dataset.chart, i = el.dataset.hit; S.ui.relMes = el.dataset.ym; render(); const r = document.querySelector(`[data-chart="${id}"] [data-hit="${i}"]`); if (r) showTip(r); } break;
      case 'relper': S.ui.relPer = el.dataset.p; render(); break;
      case 'filtro': S.ui.filtro = el.dataset.f; render(); break;
      case 'clear-cat': S.ui.lancCat = null; render(); break;
      case 'toggle': S.ui.open[el.dataset.k] = !S.ui.open[el.dataset.k]; render(); break;
      case 'go-cat': S.ui.lancCat = { catId: el.dataset.cat, subId: el.dataset.sub || null }; S.ui.mes = S.ui.tab === 'relatorios' ? S.ui.relMes : ymHoje(); S.ui.filtro = 'tudo'; setTab('lancamentos'); break;
      case 'go-card': S.ui.cardId = el.dataset.id; S.ui.faturaRef = null; setTab('cartoes'); break;
      case 'card': S.ui.cardId = el.dataset.id; S.ui.faturaRef = null; render(); break;
      case 'fatura': { const m = meioById(S.ui.cardId); const cur = S.ui.faturaRef || E.fatura(m, hoje()).ref; S.ui.faturaRef = E.addMonthsYM(cur, +el.dataset.d); render(); break; }
      case 'fatura-ref': { const i = el.dataset.hit; S.ui.faturaRef = el.dataset.ym; render(); const r = document.querySelector(`[data-chart="fut"] [data-hit="${i}"]`); if (r) showTip(r); break; }
      case 'ajuste': openAjuste(el.dataset.ref); break;
      case 'aj-save': saveAjuste(); break;
      case 'open-occ': {
        const o = findOcc(el.dataset.key); if (!o) break;
        if (o.origem === 'rec') openRecOcc(o);
        else { const it = itens().find((i) => i.id === o.refId); if (it && it.tipo === 'ajuste') { S.ui.cardId = it.meioId; openAjuste(o.fatura); } else if (it) openLanc({}, it); }
        break;
      }
      // lançamento
      case 'l-tipo': st.it.tipo = el.dataset.v; st.it.catId = null; st.it.subId = null; st.catManual = false; st.it.fonteCat = null; if (st.it.tipo === 'receita') st.it.div = 1; autoCat(true); renderLanc(); break;
      case 'l-meio': st.it.meioId = el.dataset.id; st.meioManual = true; renderLanc(); break;
      case 'l-data': st.it.data = el.dataset.v; renderLanc(); break;
      case 'l-parc': st.it.parcelas = Math.min(48, Math.max(1, (st.it.parcelas || 1) + +el.dataset.d)); renderLanc(); break;
      case 'l-div': st.divManual = true; st.it.div = st.it.div > 1 ? 1 : ((E.findSub(categorias(), st.it.catId, st.it.subId) || {}).div || 2); renderLanc(); break;
      case 'l-divn': st.divManual = true; st.it.div = Math.min(20, Math.max(2, st.it.div + +el.dataset.d)); renderLanc(); break;
      case 'l-cat': { const it = st.it; openCatPicker(it.tipo, (catId, subId) => { it.catId = catId; it.subId = subId; it.fonteCat = 'manual'; st.catManual = true; const sd = E.findSub(categorias(), catId, subId); if (!st.divManual) it.div = sd && sd.div > 1 ? sd.div : 1; }, { catId: it.catId, subId: it.subId }); break; }
      case 'l-save': { const d = $('#fDesc'); if (d) st.it.desc = d.value; saveLanc(!!el.dataset.more); break; }
      case 'l-del': { const it = itens().find((i) => i.id === st.it.id); closeSheet(); if (it) softDelete(it); break; }
      case 'cat-open': { const g = el.closest('.catgrp'); const s = $('.subs', g); const open = el.getAttribute('aria-expanded') !== 'true'; el.setAttribute('aria-expanded', open); s.hidden = !open; break; }
      case 'cat-pick': { const cs = st; cs.onPick(el.dataset.cat, el.dataset.sub); sheetState = cs.back; closeSheet(true); if (cs.back && cs.back.kind === 'lanc') renderLanc(); else if (cs.back && cs.back.kind === 'rec') renderRec(); else if (cs.back) sheetState = cs.back; break; }
      // ocorrência de fixo
      case 'oc-save': { const r = st.rec; r.excecoes = r.excecoes || {}; if (st.valor && st.valor !== E.valorRecorrente({ ...r, excecoes: {} }, st.ym)) r.excecoes[st.ym] = { valor: st.valor }; else delete r.excecoes[st.ym]; closeSheet(); if (await saveRec(r)) toast('Valor do mês atualizado.'); break; }
      case 'oc-pular': { const r = st.rec; r.excecoes = r.excecoes || {}; if (r.excecoes[st.ym] && r.excecoes[st.ym].pular) delete r.excecoes[st.ym]; else r.excecoes[st.ym] = { pular: true }; closeSheet(); if (await saveRec(r)) toast('Atualizado.'); break; }
      case 'oc-recebido': { const r = st.rec; r.recebidos = r.recebidos || {}; if (el.dataset.v === '1') r.recebidos[st.ym] = true; else delete r.recebidos[st.ym]; closeSheet(); if (await saveRec(r)) toast(el.dataset.v === '1' ? 'Marcado como recebido.' : 'Desmarcado.'); break; }
      case 'recebido': {
        const o = findOcc(el.dataset.key); if (!o) break; const v = el.dataset.v === '1';
        if (o.origem === 'rec') { const r = clone(S.recorrentes.find((x) => x.id === o.refId)); r.recebidos = r.recebidos || {}; if (v) r.recebidos[o.comp] = true; else delete r.recebidos[o.comp]; await saveRec(r); }
        else { const it = clone(itens().find((i) => i.id === o.refId)); if (o.parcela) { it.recebidos = it.recebidos || {}; if (v) it.recebidos[o.parcela[0]] = true; else delete it.recebidos[o.parcela[0]]; } else it.recebido = v; await saveItem(it, null); }
        toast(v ? 'Marcado como recebido.' : 'Desmarcado.'); break;
      }
      // fixos
      case 'rec-new': openRec(null); break;
      case 'rec-edit': { const r = S.recorrentes.find((x) => x.id === el.dataset.id); closeSheet(true); if (r) openRec(r); break; }
      case 'r-tipo': st.r.tipo = el.dataset.v; st.r.catId = null; st.r.subId = null; if (st.r.tipo === 'receita') st.r.div = 1; renderRec(); break;
      case 'r-meio': st.r.meioId = el.dataset.id; renderRec(); break;
      case 'r-dia': st.r.dia = ((st.r.dia - 1 + +el.dataset.d + 31) % 31) + 1; renderRec(); break;
      case 'r-div': st.r.div = st.r.div > 1 ? 1 : ((E.findSub(categorias(), st.r.catId, st.r.subId) || {}).div || 2); renderRec(); break;
      case 'r-divn': st.r.div = Math.min(20, Math.max(2, st.r.div + +el.dataset.d)); renderRec(); break;
      case 'r-cat': { const r = st.r; openCatPicker(r.tipo, (c, s) => { r.catId = c; r.subId = s; const sd = E.findSub(categorias(), c, s); if (sd && sd.div > 1 && r.div === 1) r.div = sd.div; }, { catId: r.catId, subId: r.subId }); break; }
      case 'r-save': saveRecForm(); break;
      case 'r-end': {
        const r = st.r, ym = ymHoje();
        if (r.inicio > ym) { closeSheet(); r.excluido = true; if (await saveRec(r)) { S.recorrentes = S.recorrentes.filter((x) => x.id !== r.id); bump(); render(); toast('Fixo excluído.'); } }
        else { const fim = E.addMonthsYM(ym, -1) < r.inicio ? r.inicio : E.addMonthsYM(ym, -1); confirmSheet('Encerrar fixo', `"${r.desc}" deixa de entrar a partir de ${mesNome(E.addMonthsYM(fim, 1))}. O histórico fica.`, 'Encerrar', async () => { r.fim = fim; if (await saveRec(r)) toast('Fixo encerrado.'); }); }
        break;
      }
      // meios
      case 'meio-new': openMeio(null); break;
      case 'meio-edit': openMeio(meios().find((m) => m.id === el.dataset.id)); break;
      case 'm-cor': st.m.cor = el.dataset.c; renderMeio(); break;
      case 'm-ativo': st.m.ativo = st.m.ativo === false; renderMeio(); break;
      case 'm-padrao': st.padrao = !(st.padrao ?? meioPadrao() === st.m.id); el.setAttribute('aria-checked', st.padrao); break;
      case 'm-save': {
        const m = st.m; m.nome = m.nome.trim(); m.banco = m.banco.trim();
        if (!m.nome) { st.err = 'Dê um nome.'; renderMeio(); break; }
        if (m.tipo === 'credito' && !(m.fechamento >= 1 && m.vencimento >= 1)) { st.err = 'Informe fechamento e vencimento.'; renderMeio(); break; }
        if (m.tipo !== 'credito') { delete m.fechamento; delete m.vencimento; }
        const lista = clone(meios()); const i = lista.findIndex((x) => x.id === m.id); if (i >= 0) lista[i] = m; else lista.push(m);
        closeSheet();
        try { await saveMeios(lista); if (st.padrao === true) await savePrefs({ meioPadrao: m.id }); toast('Forma de pagamento salva.'); } catch { toast('Não consegui salvar agora.'); }
        break;
      }
      // categorias
      case 'sub-new': { const catId = el.dataset.cat; promptSheet('Nova subcategoria', 'Nome', '', async (nome) => { const l = clone(categorias()); const c = l.find((x) => x.id === catId); const id = E.normKey(nome).replace(/ /g, '-').slice(0, 40) || uid('s'); if (c.subs.some((s) => s.id === id)) { toast('Já existe uma com esse nome.'); return; } c.subs.push({ id, nome }); await saveCategorias(l); toast('Subcategoria criada.'); }); break; }
      case 'sub-edit': {
        const catId = el.dataset.cat, subId = el.dataset.sub; const s = E.findSub(categorias(), catId, subId);
        const usado = D().its.some((i) => !i.excluido && i.catId === catId && i.subId === subId) || S.recorrentes.some((r) => r.catId === catId && r.subId === subId);
        promptSheet('Subcategoria', 'Nome', s.nome, async (nome) => {
          const l = clone(categorias()); const x = l.find((c) => c.id === catId).subs.find((y) => y.id === subId); x.nome = nome;
          const dv = +($('#pDiv') || {}).value || 1; if (dv > 1) x.div = dv; else delete x.div;
          await saveCategorias(l); toast('Subcategoria salva.');
        }, `<div class="field"><label for="pDiv">Divisão padrão</label><select class="inp" id="pDiv">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${(s.div || 1) === n ? 'selected' : ''}>${n === 1 ? 'Não dividir' : `Dividir por ${n}`}</option>`).join('')}</select><span class="tiny muted">Ao escolher esta subcategoria, o lançamento já vem marcado como dividido.</span></div>
          ${usado ? '' : `<button class="btn danger" data-act="sub-del" data-cat="${esc(catId)}" data-sub="${esc(subId)}">${ic('trash')}Remover subcategoria</button>`}`);
        break;
      }
      case 'sub-del': { const { cat, sub } = el.dataset; closeSheet(); const l = clone(categorias()); const c = l.find((x) => x.id === cat); c.subs = c.subs.filter((s) => s.id !== sub); if (!c.subs.length) { toast('A categoria precisa de ao menos uma subcategoria.'); break; } await saveCategorias(l); toast('Removida.'); break; }
      case 'cat-edit': { const catId = el.dataset.cat; const c = E.findCat(categorias(), catId); promptSheet('Categoria', 'Nome', c.nome, async (nome) => { const l = clone(categorias()); l.find((x) => x.id === catId).nome = nome; await saveCategorias(l); toast('Categoria renomeada.'); }); break; }
      case 'cat-new': promptSheet('Nova categoria', 'Nome', '', async (nome) => { const l = clone(categorias()); const id = E.normKey(nome).replace(/ /g, '-').slice(0, 40); if (!id || l.some((c) => c.id === id)) { toast('Escolha outro nome.'); return; } const tipo = ($('#pTipo') || {}).value || 'despesa'; l.push({ id, nome, tipo, subs: [{ id: 'geral', nome: 'Geral' }] }); await saveCategorias(l); toast('Categoria criada.'); }, `<div class="field"><label for="pTipo">Tipo</label><select class="inp" id="pTipo"><option value="despesa">Gasto</option><option value="receita">Entrada</option></select></div>`); break;
      case 'prompt-ok': { const v = ($('#pIn') || {}).value; if (!v || !v.trim()) break; const fn = st.fn; try { await fn(v.trim()); } finally { closeSheet(); } break; }
      case 'confirm-yes': { const fn = st.fn; closeSheet(); await fn(); break; }
      case 'regra-del': { const k = el.dataset.k; const map = clone(S.cfg.regras || {}); delete map[k]; S.cfg.regras = map; render(); saveConfig('regras', map); toast('Esquecido.'); break; }
      case 'backup-xlsx': backupXlsx(); break;
      case 'restore': { const it = clone(itens().find((i) => i.id === el.dataset.id)); delete it.excluido; delete it.excluidoEm; await saveItem(it, null); toast('Restaurado.'); break; }
      case 'purge': {
        const it = itens().find((i) => i.id === el.dataset.id);
        confirmSheet('Apagar de vez', `"${it.desc}" será removido para sempre.`, 'Apagar', async () => {
          enqueue({ t: 'apagar', id: it.id }); toast('Apagado.');
        });
        break;
      }
      case 'quick-save': quickSave(); break;
      case 'quick-edit': { const p = S.ui.quick.parsed; S.ui.quick = null; S.ui.quickText = ''; render(); openLanc({ ...p }); if (sheetState && p.catId) { sheetState.catManual = true; sheetState.divManual = p.div > 1; } break; }
      case 'quick-cancel': S.ui.quick = null; S.ui.quickText = ''; render(); break;
      default: break;
    }
  }

  // ---------- Conexão inicial ----------
  async function conectar(url, key) {
    url = String(url || '').trim(); key = String(key || '').trim();
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
    if (!local && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
      S.ui.setupErr = /\/dev$/.test(url) ? 'Esse é o endereço de teste (termina em /dev). Use o da implantação, que termina em /exec.' : 'Endereço não reconhecido. Ele começa com https://script.google.com/macros/s/ e termina em /exec.';
      return render();
    }
    if (key.length < 20) { S.ui.setupErr = 'A chave parece incompleta. Copie de novo da aba "Leia-me" da planilha.'; return render(); }
    S.ui.setupBusy = true; S.ui.setupErr = ''; S.ui.setupUrl = url; S.ui.setupKey = key; render();
    const prev = S.conn;
    try {
      S.conn = { url, key };
      const j = await chamar([]);
      receber(j.dados); lsSet(LS.conn, S.conn);
      S.net = 'ok'; S.ui.prevConn = null; S.ui.setupKey = '';
      applyView();
      if (!S.cfg.prefs.inicioUso) savePrefs({ inicioUso: hoje() });
      if (S.outbox.length) sync();
      toast('Conectado à sua planilha.');
    } catch (e) {
      S.conn = prev && S.ui.prevConn ? null : prev;
      S.ui.setupErr = e.codigo === 'chave' ? 'A chave não confere. Copie de novo da aba "Leia-me" da planilha.'
        : e.codigo === 'sem_instalacao' ? 'A planilha ainda não foi instalada. No Apps Script, rode a função "instalar".'
          : e.codigo === 'resposta' ? e.erro : 'Não consegui falar com a planilha. Confira o endereço e a internet.';
    } finally { S.ui.setupBusy = false; render(); }
  }

  // ---------- Inicialização ----------
  function boot() {
    S.conn = lsGet(LS.conn);
    const cache = lsGet(LS.data);
    if (cache && cache.server) { S.server = cache.server; S.lastSync = cache.at || 0; }
    S.outbox = (lsGet(LS.outbox) || []).filter((o) => o && o.t);
    S.locked = !!(S.conn && lockCfg());
    applyView();
    const h = (location.hash || '').replace('#', '');
    if (h === 'lancar') { S.ui.tab = 'inicio'; if (S.conn) S.ui.abrirLancar = true; }
    else if (TABS[h]) S.ui.tab = h;
    render();
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-act]'); if (!el) { document.querySelectorAll('.tip').forEach((t) => (t.hidden = true)); return; }
      if (el.disabled) return;
      const a = el.dataset.act;
      if (a === 'close-sheet' && el.id === 'scrim' && ev.target !== el) return;
      act(a, el, ev).catch((e) => { console.error(e); toast('Algo deu errado. Tente de novo.'); });
    });
    document.addEventListener('pointerover', (ev) => { const r = ev.target.closest && ev.target.closest('[data-hit]'); if (r && ev.pointerType === 'mouse') showTip(r); });
    document.addEventListener('pointerdown', (ev) => { const r = ev.target.closest && ev.target.closest('[data-hit]'); if (r) showTip(r); });
    document.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (ev.target.dataset.form === 'quick') quickSubmit(ev.target.q.value);
      if (ev.target.dataset.form === 'setup') conectar(ev.target.url.value, ev.target.key.value);
    });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && $('#sheet')) act('close-sheet', $('#sheet'), ev); });
    window.addEventListener('online', () => { S.retryN = 0; sync(); });
    window.addEventListener('offline', () => { S.net = 'offline'; renderSoft(); });
    window.addEventListener('hashchange', () => { const k = location.hash.replace('#', ''); if (k === 'lancar') openLanc(); else if (TABS[k] && k !== S.ui.tab) setTab(k); });
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; if (!$('#sheet')) render(); });
    window.addEventListener('appinstalled', () => { S.installPrompt = null; toast('Todo dIA instalado na tela inicial.'); });
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawCharts, 150); });
    // virada do dia: o app sempre sabe que dia é hoje
    const novoDia = () => { const t = hoje(); if (t !== S.today) { S.today = t; S.ui.mes = E.ymOf(t); S.ui.relMes = E.ymOf(t); S.memo = null; return true; } return false; };
    setInterval(() => { if (novoDia() && !$('#sheet')) render(); }, 30000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { S.hiddenAt = Date.now(); return; }
      if (lockCfg() && !S.locked && S.hiddenAt && Date.now() - S.hiddenAt > 60000) { trancar(); desbloquear(); }
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !S.locked) { if (novoDia()) render(); if (Date.now() - S.lastSync > 60000 || S.outbox.length) sync(); } });
    setInterval(() => { if (!document.hidden && (S.outbox.length || Date.now() - S.lastSync > 300000)) sync(); }, 60000);
    window.addEventListener('error', (e) => console.error('erro', e.message));
    window.addEventListener('unhandledrejection', (e) => console.warn('promessa', e.reason));
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch((e) => console.warn('sw', e));
    if (S.conn) sync();
    if (S.locked) setTimeout(desbloquear, 350);
    else if (S.ui.abrirLancar) { S.ui.abrirLancar = false; setTimeout(() => openLanc(), 300); }
  }
  // Exposto só para testes automatizados
  window.__todo = { S, E, D, render, quickSubmit, openLanc, setTab, itens, sync, trancar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
