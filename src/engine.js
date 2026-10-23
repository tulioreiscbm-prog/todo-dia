/* Todo dIA — motor (lógica pura, sem DOM). Valores sempre em centavos (inteiros). */
const Engine = (() => {
  'use strict';

  // ---------- Datas (sempre locais, nunca UTC) ----------
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
  const dim = (y, m) => new Date(y, m, 0).getDate();
  const todayISO = (now = new Date()) => iso(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const ymOf = (s) => s.slice(0, 7);
  const ymParts = (ym) => { const [y, m] = ym.split('-').map(Number); return { y, m }; };
  const addMonthsYM = (ym, n) => {
    const { y, m } = ymParts(ym);
    const t = y * 12 + (m - 1) + n;
    return `${Math.floor(t / 12)}-${pad((t % 12 + 12) % 12 + 1)}`;
  };
  const clampDate = (ym, day) => { const { y, m } = ymParts(ym); return iso(y, m, Math.min(day, dim(y, m))); };
  const addDays = (s, n) => {
    const { y, m, d } = parseISO(s);
    const dt = new Date(y, m - 1, d + n);
    return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  };
  const weekday = (s) => { const { y, m, d } = parseISO(s); return new Date(y, m - 1, d).getDay(); };
  const diffDays = (a, b) => {
    const A = parseISO(a), B = parseISO(b);
    return Math.round((new Date(B.y, B.m - 1, B.d) - new Date(A.y, A.m - 1, A.d)) / 86400000);
  };
  const monthsBetween = (a, b) => { // inclusive list a..b
    const out = []; let c = a; let guard = 0;
    while (c <= b && guard++ < 600) { out.push(c); c = addMonthsYM(c, 1); }
    return out;
  };

  // ---------- Fatura de cartão ----------
  // Regra: compra ANTES do dia de fechamento entra na fatura que fecha naquele mês;
  // no dia do fechamento ou depois, vai para a fatura seguinte.
  // A fatura é identificada pelo mês do VENCIMENTO (ex.: "2026-11" = vence 07/11).
  function fatura(meio, dataISO, offset = 0) {
    if (!meio || meio.tipo !== 'credito') return null;
    const F = Number(meio.fechamento), V = Number(meio.vencimento);
    if (!(F >= 1 && F <= 31 && V >= 1 && V <= 31)) return null;
    const ym = ymOf(dataISO);
    let closeYM = dataISO < clampDate(ym, F) ? ym : addMonthsYM(ym, 1);
    closeYM = addMonthsYM(closeYM, offset);
    const fecha = clampDate(closeYM, F);
    const closeDay = parseISO(fecha).d;
    const venceYM = V > closeDay ? closeYM : addMonthsYM(closeYM, 1);
    const vence = clampDate(venceYM, V);
    return { ref: venceYM, fecha, vence };
  }
  // fatura identificada pelo mês de vencimento -> datas
  function faturaPorRef(meio, ref) {
    const F = Number(meio.fechamento), V = Number(meio.vencimento);
    // o fechamento é no mesmo mês do vencimento se V > F, senão no mês anterior
    const closeYM = V > F ? ref : addMonthsYM(ref, -1);
    const fecha = clampDate(closeYM, F);
    const vence = clampDate(ref, V);
    const inicio = addDays(clampDate(addMonthsYM(closeYM, -1), F), 0); // primeira compra incluída
    return { ref, fecha, vence, inicio };
  }
  function faturaStatus(f, hoje) {
    if (hoje < f.fecha) return 'aberta';
    if (hoje <= f.vence) return 'fechada';
    return 'vencida';
  }

  // ---------- Dinheiro ----------
  const splitParcelas = (total, n) => {
    n = Math.max(1, Math.floor(n));
    const base = Math.floor(total / n);
    const out = Array(n).fill(base);
    out[n - 1] += total - base * n;
    return out;
  };
  function parseValor(str) {
    if (str == null) return null;
    let s = String(str).trim().toLowerCase().replace(/r\$\s*/g, '').replace(/\s/g, '');
    if (!s) return null;
    let mult = 1;
    if (/mil$/.test(s)) { mult = 1000; s = s.replace(/mil$/, ''); }
    if (!/^\d[\d.,]*$/.test(s)) return null;
    let n;
    if (s.includes(',')) n = Number(s.replace(/\./g, '').replace(',', '.'));
    else if (s.includes('.')) {
      const parts = s.split('.');
      const last = parts[parts.length - 1];
      n = (parts.length > 2 || last.length === 3) ? Number(parts.join('')) : Number(s);
    } else n = Number(s);
    if (!isFinite(n)) return null;
    const c = Math.round(n * mult * 100);
    return c > 0 && c < 1e11 ? c : null;
  }
  const fmtBRL = (c, opts = {}) => {
    const v = Math.abs(c || 0) / 100;
    const s = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (c < 0 ? '−' : opts.sign && c > 0 ? '+' : '') + 'R$ ' + s;
  };
  const fmtCompact = (c) => {
    const v = Math.abs(c) / 100;
    if (v >= 1e6) return (c < 0 ? '-' : '') + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
    if (v >= 1e4) return (c < 0 ? '-' : '') + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    return (c < 0 ? '-' : '') + v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };

  // ---------- Texto ----------
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9$\/÷,.+x]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normKey = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const ruleKey = (s) => normKey(s).replace(/ /g, '_').slice(0, 120);

  const WEEKDAYS = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  const BANKS = { inter: 'inter', c6: 'c6', nubank: 'nubank', nu: 'nubank', bradesco: 'bradesco', bb: 'banco do brasil',
    itau: 'itau', caixa: 'caixa', santander: 'santander', picpay: 'picpay', sicoob: 'sicoob', btg: 'btg', xp: 'xp' };
  const TYPES = { credito: 'credito', cartao: 'credito', cc: 'credito', debito: 'debito', pix: 'pix',
    dinheiro: 'dinheiro', especie: 'dinheiro', cash: 'dinheiro' };
  const STOP = new Set(['no', 'na', 'nos', 'nas', 'em', 'de', 'do', 'da', 'dos', 'das', 'com', 'pra', 'para', 'pelo', 'pela',
    'via', 'o', 'a', 'os', 'as', 'um', 'uma', 'gastei', 'paguei', 'comprei', 'gasto', 'compra', 'e', 'r$', 'reais', 'real']);
  const MONEY_RE = /^(r\$)?(\d{1,3}(\.\d{3})+(,\d{1,2})?|\d+([.,]\d{1,2})?)$/;

  // Interpreta uma frase livre: "açougue 87,50 inter crédito ontem 3x"
  function parse(text, ctx) {
    const hoje = ctx.hoje;
    const raw = String(text || '').trim().split(/\s+/).filter(Boolean);
    const tok = raw.map((t) => normKey(t.replace(/^r\$/i, 'r$ ')).replace(/\s/g, '') || t.toLowerCase());
    const rawN = raw.map((t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
    const used = new Array(raw.length).fill(false);
    const out = { valor: null, desc: '', data: null, dataTexto: null, meioId: null, parcelas: 1, div: 1, tipoHint: null };

    // tipo
    tok.forEach((t, i) => { if (['recebi', 'recebido', 'recebimento', 'entrada', 'receita'].includes(t)) { out.tipoHint = 'receita'; used[i] = true; } });

    // data
    for (let i = 0; i < raw.length && !out.data; i++) {
      if (used[i]) continue;
      const t = tok[i];
      if (t === 'hoje') { out.data = hoje; used[i] = true; }
      else if (t === 'ontem') { out.data = addDays(hoje, -1); used[i] = true; }
      else if (t === 'anteontem') { out.data = addDays(hoje, -2); used[i] = true; }
      else if (t in WEEKDAYS) {
        const wd = WEEKDAYS[t]; const cur = weekday(hoje);
        let back = (cur - wd + 7) % 7;
        used[i] = true;
        if (tok[i + 1] === 'feira') used[i + 1] = true;
        if (['passada', 'passado'].includes(tok[i + 1] === 'feira' ? tok[i + 2] : tok[i + 1])) {
          if (back === 0) back = 7;
          used[tok[i + 1] === 'feira' ? i + 2 : i + 1] = true;
        }
        out.data = addDays(hoje, -back);
      } else if (t === 'dia' && /^\d{1,2}$/.test(tok[i + 1] || '')) {
        const d = Number(tok[i + 1]);
        if (d >= 1 && d <= 31) {
          const h = parseISO(hoje);
          let ym = ymOf(hoje);
          if (d > h.d) ym = addMonthsYM(ym, -1);
          out.data = clampDate(ym, d); used[i] = used[i + 1] = true;
        }
      } else {
        const m = rawN[i].match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
        if (m) {
          const d = +m[1], mo = +m[2];
          if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
            const h = parseISO(hoje);
            let y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : h.y;
            let cand = iso(y, mo, Math.min(d, dim(y, mo)));
            if (!m[3] && diffDays(hoje, cand) > 62) cand = iso(y - 1, mo, Math.min(d, dim(y - 1, mo)));
            out.data = cand; used[i] = true;
          }
        }
      }
    }

    // parcelas
    for (let i = 0; i < raw.length; i++) {
      if (used[i]) continue;
      let m = rawN[i].match(/^(\d{1,2})x$/);
      if (m && +m[1] >= 1) { out.parcelas = Math.min(48, +m[1]); used[i] = true; break; }
      if (tok[i] === 'em' && /^\d{1,2}$/.test(tok[i + 1] || '') && /^(vezes|parcelas|x)$/.test(tok[i + 2] || '')) {
        out.parcelas = Math.min(48, +tok[i + 1]); used[i] = used[i + 1] = used[i + 2] = true; break;
      }
      if (/^(\d{1,2})$/.test(tok[i]) && /^(vezes|parcelas)$/.test(tok[i + 1] || '')) {
        out.parcelas = Math.min(48, +tok[i]); used[i] = used[i + 1] = true; break;
      }
    }

    // divisão
    for (let i = 0; i < raw.length; i++) {
      if (used[i]) continue;
      let m = rawN[i].match(/^[÷\/](\d{1,2})$/);
      if (m && +m[1] >= 2) { out.div = +m[1]; used[i] = true; break; }
      if (/^(dividido|dividida|div|rachado|rachada|dividir)$/.test(tok[i])) {
        let j = i + 1;
        if (/^(por|entre|em|com|p)$/.test(tok[j] || '')) j++;
        if (/^\d{1,2}$/.test(tok[j] || '') && +tok[j] >= 2) {
          out.div = +tok[j];
          for (let k = i; k <= j; k++) used[k] = true;
          if (/^(pessoas|partes|irmaos)$/.test(tok[j + 1] || '')) used[j + 1] = true;
          break;
        }
      }
    }

    // forma de pagamento
    let bank = null, type = null;
    for (let i = 0; i < raw.length; i++) {
      if (used[i]) continue;
      const t = tok[i];
      if (!bank && t in BANKS && !(t === 'nu' && !tok.some((x) => x in TYPES))) { bank = BANKS[t]; used[i] = true; }
      else if (!type && t in TYPES) { type = TYPES[t]; used[i] = true; }
    }
    if (bank || type) out.meioId = resolveMeio(ctx.meios || [], bank, type, ctx.meioPadrao);

    // valor
    const money = [];
    for (let i = 0; i < raw.length; i++) {
      if (used[i]) continue;
      let r = rawN[i];
      if (r === 'r$' && raw[i + 1] && MONEY_RE.test(rawN[i + 1])) { money.push({ i: i + 1, pre: i, score: 3 }); continue; }
      if (MONEY_RE.test(r)) {
        const explicit = r.startsWith('r$');
        const dec = /,\d{1,2}$/.test(r) || /\.\d{1,2}$/.test(r);
        money.push({ i, score: explicit ? 3 : dec ? 2 : 1, mil: tok[i + 1] === 'mil' });
      }
    }
    if (money.length) {
      const best = money.reduce((a, b) => (b.score > a.score || (b.score === a.score && b.i > a.i) ? b : a));
      let v = parseValor(rawN[best.i]);
      if (best.mil && v) { v *= 1000; used[best.i + 1] = true; }
      out.valor = v; used[best.i] = true;
      if (best.pre != null) used[best.pre] = true;
    }

    // descrição = o que sobrou, sem conectores nas pontas
    let rest = raw.filter((_, i) => !used[i]);
    const restN = rest.map((t) => normKey(t));
    let a = 0, b = rest.length;
    while (a < b && STOP.has(restN[a])) a++;
    while (b > a && STOP.has(restN[b - 1])) b--;
    rest = rest.slice(a, b);
    let desc = rest.join(' ').replace(/\s+/g, ' ').trim();
    if (desc) desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    out.desc = desc;
    if (out.data) out.dataTexto = out.data;
    return out;
  }

  function resolveMeio(meios, bank, type, padrao) {
    const ativos = meios.filter((m) => m.ativo !== false);
    let c = ativos.filter((m) => (!bank || normKey(m.banco) === bank) && (!type || m.tipo === type));
    if (!c.length) return null;
    if (bank && !type) {
      for (const t of ['credito', 'pix', 'debito', 'dinheiro']) { const f = c.find((m) => m.tipo === t); if (f) return f.id; }
    }
    if (type && !bank) { const p = c.find((m) => m.id === padrao); if (p) return p.id; }
    return c[0].id;
  }

  // ---------- Classificação ----------
  function matchRegra(descN, regras) {
    if (!regras) return null;
    const key = descN.replace(/ /g, '_');
    if (regras[key]) return { ...regras[key], fonte: 'regra' };
    const toks = new Set(descN.split(' '));
    let best = null, bestLen = 0;
    for (const [k, r] of Object.entries(regras)) {
      const kt = k.split('_').filter(Boolean);
      if (!kt.length) continue;
      if (kt.every((t) => toks.has(t)) && k.length > bestLen) { best = r; bestLen = k.length; }
    }
    return best ? { ...best, fonte: 'regra' } : null;
  }
  function matchDicionario(descN, dic) {
    const padded = ' ' + descN + ' ';
    const toks = descN.split(' ');
    let best = null, bestLen = 0;
    for (const e of dic) {
      for (const kw of e.k) {
        let hit = false;
        if (kw.endsWith('*')) { const p = kw.slice(0, -1); hit = toks.some((t) => t.startsWith(p)); }
        else hit = padded.includes(' ' + kw + ' ');
        if (hit && kw.length > bestLen) { best = e; bestLen = kw.length; }
      }
    }
    return best ? { catId: best.c, subId: best.s, fonte: 'dicionario' } : null;
  }
  function classify(desc, ctx) {
    const d = normKey(desc);
    if (!d) return null;
    const valid = (r) => r && findSub(ctx.categorias, r.catId, r.subId) ? r : null;
    return valid(matchRegra(d, ctx.regras)) || valid(matchDicionario(d, ctx.dicionario || [])) || null;
  }
  function findCat(cats, catId) { return (cats || []).find((c) => c.id === catId) || null; }
  function findSub(cats, catId, subId) {
    const c = findCat(cats, catId); if (!c) return null;
    return (c.subs || []).find((s) => s.id === subId) || null;
  }

  // ---------- Recorrentes ----------
  function valorRecorrente(rec, ym) {
    if (!rec || ym < rec.inicio || (rec.fim && ym > rec.fim)) return null;
    const exc = rec.excecoes && rec.excecoes[ym];
    if (exc && exc.pular) return null;
    if (exc && Number.isInteger(exc.valor) && exc.valor > 0) return exc.valor;
    const hist = (rec.valores || []).filter((v) => v.desde <= ym).sort((a, b) => (a.desde < b.desde ? -1 : 1));
    return hist.length ? hist[hist.length - 1].valor : null;
  }

  // ---------- Expansão em ocorrências ----------
  // state: { itens: [lanc], recorrentes: [rec], meios: [meio] }
  // retorna ocorrências com competência (comp) no intervalo [de, ate]
  function expandir(state, de, ate, hoje) {
    const meios = new Map((state.meios || []).map((m) => [m.id, m]));
    const out = [];
    for (const it of state.itens || []) {
      if (!it || it.excluido) continue;
      if (!Number.isInteger(it.valor) || it.valor <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(it.data || '')) continue;
      const meio = meios.get(it.meioId);
      const n = it.tipo === 'despesa' && meio && meio.tipo === 'credito' ? Math.max(1, it.parcelas || 1) : 1;
      const partes = splitParcelas(it.valor, n);
      const baseComp = ymOf(it.data);
      for (let k = 0; k < n; k++) {
        const f = meio && meio.tipo === 'credito' && (it.tipo === 'despesa' || it.tipo === 'ajuste') ? fatura(meio, it.data, k) : null;
        // compra parcelada no cartão: cada parcela conta no mês em que é cobrada (vencimento da fatura).
        // à vista: conta no dia da compra. Parcelas restantes importadas das faturas (id "IMP-") seguem a regra
        // das parcelas mesmo quando sobra uma só.
        const parcelado = f && it.tipo === 'despesa' && (n > 1 || /^IMP-/.test(it.id));
        const comp = parcelado ? f.ref : addMonthsYM(baseComp, k);
        if (comp < de || comp > ate) continue;
        const valor = partes[k];
        const div = it.tipo === 'despesa' && it.div >= 2 ? it.div : 1;
        const minha = Math.round(valor / div);
        const dataOc = parcelado ? f.vence : k === 0 ? it.data : clampDate(comp, parseISO(it.data).d);
        out.push({
          key: n > 1 ? `${it.id}#${k + 1}` : it.id, origem: 'lanc', refId: it.id, tipo: it.tipo,
          desc: it.desc, catId: it.catId, subId: it.subId, meioId: it.meioId, data: dataOc, dataCompra: it.data,
          comp, valor, div, minha, receber: it.tipo === 'ressarcimento' ? valor : valor - minha,
          recebido: !!(it.recebidos ? it.recebidos[k + 1] : it.recebido),
          fixo: false, parcela: n > 1 ? [k + 1, n] : null, fatura: f ? f.ref : null,
          previsto: dataOc > hoje, obs: it.obs || '',
        });
      }
    }
    for (const rec of state.recorrentes || []) {
      if (!rec || rec.excluido) continue;
      const meio = meios.get(rec.meioId);
      for (const ym of monthsBetween(de < rec.inicio ? rec.inicio : de, ate)) {
        const valor = valorRecorrente(rec, ym);
        if (!valor) continue;
        const data = clampDate(ym, rec.dia || 1);
        const div = rec.tipo === 'despesa' && rec.div >= 2 ? rec.div : 1;
        const minha = Math.round(valor / div);
        const f = meio && meio.tipo === 'credito' && (rec.tipo || 'despesa') === 'despesa' ? fatura(meio, data, 0) : null;
        out.push({
          key: `rec:${rec.id}:${ym}`, origem: 'rec', refId: rec.id, tipo: rec.tipo || 'despesa',
          desc: rec.desc, catId: rec.catId, subId: rec.subId, meioId: rec.meioId, data, dataCompra: data,
          comp: ym, valor, div, minha, receber: rec.tipo === 'ressarcimento' ? valor : valor - minha,
          recebido: !!(rec.recebidos && rec.recebidos[ym]), fixo: true, parcela: null,
          fatura: f ? f.ref : null, previsto: data > hoje, obs: '',
        });
      }
    }
    out.sort((a, b) => (a.data === b.data ? (a.key < b.key ? -1 : 1) : a.data < b.data ? 1 : -1));
    return out;
  }

  // Itens de uma fatura específica (precisa olhar compras de até 48 meses antes)
  function itensFatura(state, meioId, ref, hoje) {
    const occ = expandir(state, addMonthsYM(ref, -49), addMonthsYM(ref, 1), hoje);
    return occ.filter((o) => o.meioId === meioId && o.fatura === ref);
  }

  // ---------- Agregações ----------
  const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);
  const isGasto = (o) => o.tipo === 'despesa';
  const isRenda = (o) => o.tipo === 'receita';
  const isRessarc = (o) => o.tipo === 'ressarcimento';
  // efeito de uma ocorrência no "quanto eu gastei": gasto soma a sua parte, ressarcimento abate
  const liquido = (o) => (isGasto(o) ? o.minha : isRessarc(o) ? -o.valor : 0);

  function resumoMes(occ, ym) {
    const m = occ.filter((o) => o.comp === ym);
    const g = m.filter(isGasto), r = m.filter(isRenda), rs = m.filter(isRessarc);
    const ressarcReal = sum(rs.filter((o) => !o.previsto), (o) => o.valor);
    const ressarcPrev = sum(rs.filter((o) => o.previsto), (o) => o.valor);
    const brutoReal = sum(g.filter((o) => !o.previsto), (o) => o.minha);
    const brutoPrev = sum(g.filter((o) => o.previsto), (o) => o.minha);
    return {
      gastoReal: brutoReal - ressarcReal,
      gastoPrev: brutoPrev - ressarcPrev,
      brutoReal, brutoPrev, ressarcReal, ressarcPrev,
      rendaReal: sum(r.filter((o) => !o.previsto), (o) => o.valor),
      rendaPrev: sum(r.filter((o) => o.previsto), (o) => o.valor),
      receber: sum(m.filter((o) => o.receber > 0 && !o.recebido && (isGasto(o) || isRessarc(o))), (o) => o.receber),
      fixos: sum(g.filter((o) => o.fixo), (o) => o.minha),
      variaveis: sum(g.filter((o) => !o.fixo), (o) => o.minha),
      n: m.filter((o) => o.origem === 'lanc').length,
    };
  }
  function porCategoria(occ, cats) {
    const map = new Map();
    for (const o of occ) {
      if (!isGasto(o)) continue;
      const k = o.catId || 'outros';
      if (!map.has(k)) map.set(k, { catId: k, total: 0, n: 0, subs: new Map() });
      const c = map.get(k);
      c.total += o.minha; c.n++;
      const sk = o.subId || '_';
      c.subs.set(sk, (c.subs.get(sk) || 0) + o.minha);
    }
    return [...map.values()].map((c) => ({
      catId: c.catId, total: c.total, n: c.n,
      subs: [...c.subs.entries()].map(([subId, total]) => ({ subId, total })).sort((a, b) => b.total - a.total),
    })).sort((a, b) => b.total - a.total);
  }

  // Meses "completos" que entram na média: do 1º mês inteiro de uso até o mês passado.
  function mesesCompletos(inicioUso, hoje) {
    if (!inicioUso) return [];
    const d = parseISO(inicioUso).d;
    const first = d <= 3 ? ymOf(inicioUso) : addMonthsYM(ymOf(inicioUso), 1);
    const last = addMonthsYM(ymOf(hoje), -1);
    if (first > last) return [];
    return monthsBetween(first, last);
  }
  // Média só existe com 2+ meses consecutivos completos; usa até os últimos 12.
  function media(valoresPorMes, completos) {
    if (!completos || completos.length < 2) return null;
    const ult = completos.slice(-12);
    return Math.round(sum(ult, (ym) => valoresPorMes[ym] || 0) / ult.length);
  }

  return {
    pad, iso, parseISO, dim, todayISO, ymOf, addMonthsYM, clampDate, addDays, weekday, diffDays, monthsBetween,
    fatura, faturaPorRef, faturaStatus, splitParcelas, parseValor, fmtBRL, fmtCompact,
    norm, normKey, ruleKey, parse, resolveMeio, classify, findCat, findSub, matchDicionario, matchRegra,
    valorRecorrente, expandir, itensFatura, resumoMes, porCategoria, mesesCompletos, media, sum, liquido,
  };
})();
if (typeof module !== 'undefined') module.exports = Engine;
