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
    dinheiro: 'dinheiro', especie: 'dinheiro', cash: 'dinheiro', automatico: 'automatico', boleto: 'boleto' };
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
    const out = { valor: null, desc: '', data: null, dataTexto: null, meioId: null, parcelas: 1, div: 1, tipoHint: null, espolio: false };

    // marcação de espólio ("espolio", "espólio", "#espolio")
    tok.forEach((t, i) => { if (/^#?espolio$/.test(t)) { out.espolio = true; used[i] = true; } });

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
      else if (!type && t in TYPES) {
        type = TYPES[t]; used[i] = true;
        // "débito automático" é uma forma só
        if (t === 'debito' && tok[i + 1] === 'automatico') { type = 'automatico'; used[i + 1] = true; }
      }
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

  // ---------- Fala → texto do lançamento ----------
  // O reconhecimento de voz às vezes escreve números por extenso ("oitenta e sete e cinquenta").
  // Converte para dígitos e junta reais e centavos: "87,50".
  const NUM = { zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
    onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
    vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100,
    duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500,
    seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900 };
  const ordem = (v) => (v >= 100 ? 3 : v >= 20 ? 2 : v >= 10 ? 1.5 : 1);
  function falaParaTexto(fala) {
    const raw = String(fala || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const k = raw.map((t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,!?]+$/, ''));
    const out = [];
    let i = 0;
    while (i < raw.length) {
      // sequência de números por extenso: "mil e duzentos e trinta e quatro", "oitenta e sete"
      if (!(k[i] in NUM) && k[i] !== 'mil') { out.push(raw[i]); i++; continue; }
      const ini = i; let total = 0, cur = 0, slot = 4, palavras = 0;
      while (i < raw.length) {
        const w = k[i];
        if (w === 'mil') { total += (cur || 1) * 1000; cur = 0; slot = 4; i++; palavras++; continue; }
        if (w === 'e' && i + 1 < raw.length && k[i + 1] in NUM && ordem(NUM[k[i + 1]]) < slot && cur + total > 0) { i++; continue; }
        if (!(w in NUM)) break;
        const v = NUM[w], o = ordem(v);
        if (palavras && o >= slot) break; // não cabe: é outro número (ex.: centavos)
        cur += v; slot = o === 2 ? 1.5 : o === 1.5 ? 1 : o === 1 ? 0 : o; palavras++; i++;
        if (v === 100 && w === 'cem') slot = 0;
      }
      const n = total + cur;
      // "um"/"uma" soltos são artigo ("comprei um tênis"), não número
      if (palavras === 1 && (k[ini] === 'um' || k[ini] === 'uma') && !(k[i] in { reais: 1, real: 1, vezes: 1, x: 1 })) { out.push(raw[ini]); i = ini + 1; continue; }
      out.push(String(n));
    }
    let t = out.join(' ');
    t = t.replace(/\b(\d+) (?:reais|real) e (\d{1,2}) centavos?\b/gi, (m, a, b) => `${a},${b.padStart(2, '0')}`)
      .replace(/\b(\d+) (?:reais|real) e (\d{1,2})\b/gi, (m, a, b) => `${a},${b.padStart(2, '0')}`)
      .replace(/\b(\d+) (?:reais|real)\b/gi, '$1')
      .replace(/\b(\d+) centavos?\b/gi, (m, b) => `0,${b.padStart(2, '0')}`)
      .replace(/(^|\s)(\d{1,5}) e (\d{1,2})(?=\s|$)/g, (m, sp, a, b) => `${sp}${a},${b.padStart(2, '0')}`)
      .replace(/\b(\d+) (?:vez|vezes)\b/gi, '$1x')
      .replace(/\bem (\d+)x\b/gi, '$1x')
      .replace(/\bpor cento\b/gi, '%');
    return t;
  }

  // ---------- Notificações de compra (Carteira do Google e bancos) ----------
  // Ex.: título "Brasil Variedades", texto "R$ 128,73 com Banco Inter Black Mastercard ••4298"
  const GENERICOS = /^(compra|pagamento|transa[cç][aã]o|carteira|google wallet|cart[aã]o|aviso|nova compra)/i;
  function parseNotificacao(n, meios) {
    const titulo = String((n && n.titulo) || '').trim(), texto = String((n && n.texto) || '').trim();
    const tudo = `${titulo} ${texto}`;
    const mv = tudo.match(/R\$\s*(-?[\d.]+,\d{2})/);
    const valor = mv ? parseValor(mv[1]) : null;
    const mf = tudo.match(/(?:[•·*]{1,4}\s?|final\s+|terminad[oa]\s+em\s+)(\d{4})\b/i);
    const final = mf ? mf[1] : null;
    let desc = titulo;
    if (!desc || GENERICOS.test(desc)) {
      const me = texto.match(/\bem\s+([^,.;]+?)(?=\s+(?:no|na|com|de|via|usando)\s|\s*R\$|[,.;]|$)/i);
      desc = me ? me[1].trim() : titulo;
    }
    desc = desc.replace(/\s+/g, ' ').replace(/\b([A-ZÀ-Ú]{2,})\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase()).slice(0, 80);
    const meio = final ? (meios || []).find((m) => (m.finais || []).map(String).includes(final)) : null;
    const d = n && n.em ? new Date(Number(n.em)) : null;
    const data = d && !isNaN(d) ? iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) : null;
    const estorno = /estorn|reembols|cancelad|devolu/i.test(tudo);
    return { desc, valor, final, meioId: meio ? meio.id : null, data, estorno, ok: !!(valor && valor > 0 && desc && !estorno) };
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

  // Cartão/forma de pagamento de um fixo num mês: exceção do mês > histórico de valores (meioId) > atual
  function meioRecorrente(rec, ym) {
    const exc = rec.excecoes && rec.excecoes[ym];
    if (exc && exc.meioId) return exc.meioId;
    const hist = (rec.valores || []).filter((v) => v.desde <= ym).sort((a, b) => (a.desde < b.desde ? -1 : 1));
    const h = hist[hist.length - 1];
    return (h && h.meioId) || rec.meioId;
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
      // parcelaIni > 1: compra antiga cujas primeiras parcelas já foram pagas (o lançamento guarda só as restantes)
      const ini = it.tipo === 'despesa' && it.parcelaIni > 1 ? Math.round(it.parcelaIni) : 1;
      const total = ini - 1 + n;
      for (let k = 0; k < n; k++) {
        const f = meio && meio.tipo === 'credito' && (it.tipo === 'despesa' || it.tipo === 'ajuste') ? fatura(meio, it.data, k) : null;
        // Compra parcelada no cartão: cada parcela é gasto do mês da fatura que a cobra e já conta desde o dia 1º
        // desse mês (é um valor certo). Compra à vista conta no dia da compra.
        const parcelado = !!f && it.tipo === 'despesa' && total > 1;
        const comp = parcelado ? f.ref : addMonthsYM(baseComp, k);
        if (comp < de || comp > ate) continue;
        const valor = partes[k];
        const div = it.tipo === 'despesa' && it.div >= 2 ? it.div : 1;
        const minha = Math.round(valor / div);
        const dataOc = parcelado ? clampDate(comp, 1) : k === 0 ? it.data : clampDate(comp, parseISO(it.data).d);
        out.push({
          key: n > 1 ? `${it.id}#${k + 1}` : it.id, origem: 'lanc', refId: it.id, tipo: it.tipo,
          desc: it.desc, catId: it.catId, subId: it.subId, meioId: it.meioId, data: dataOc, dataCompra: it.data,
          comp, valor, div, minha, receber: it.tipo === 'ressarcimento' ? valor : valor - minha,
          recebido: !!(it.recebidos ? it.recebidos[k + 1] : it.recebido),
          fixo: false, parcela: parcelado ? [ini + k, total] : null, parcelaAntiga: ini > 1, fatura: f ? f.ref : null,
          previsto: dataOc > hoje, obs: it.obs || '', espolio: !!it.espolio,
        });
      }
    }
    for (const rec of state.recorrentes || []) {
      if (!rec || rec.excluido) continue;
      for (const ym of monthsBetween(de < rec.inicio ? rec.inicio : de, ate)) {
        const valor = valorRecorrente(rec, ym);
        if (!valor) continue;
        const meioId = meioRecorrente(rec, ym);
        const meio = meios.get(meioId);
        const data = clampDate(ym, rec.dia || 1);
        const div = rec.tipo === 'despesa' && rec.div >= 2 ? rec.div : 1;
        const minha = Math.round(valor / div);
        const f = meio && meio.tipo === 'credito' && (rec.tipo || 'despesa') === 'despesa' ? fatura(meio, data, 0) : null;
        // gasto recorrente é certo: conta desde o dia 1º do mês, mesmo que a cobrança seja depois
        const desde = (rec.tipo || 'despesa') === 'despesa' ? clampDate(ym, 1) : data;
        out.push({
          key: `rec:${rec.id}:${ym}`, origem: 'rec', refId: rec.id, tipo: rec.tipo || 'despesa',
          desc: rec.desc, catId: rec.catId, subId: rec.subId, meioId, data, dataCompra: data,
          comp: ym, valor, div, minha, receber: rec.tipo === 'ressarcimento' ? valor : valor - minha,
          recebido: !!(rec.recebidos && rec.recebidos[ym]), fixo: true, parcela: null,
          fatura: f ? f.ref : null, previsto: desde > hoje, obs: '', espolio: !!rec.espolio,
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
      parcelas: sum(g.filter((o) => o.parcela), (o) => o.minha),
      espolio: sum(g.filter((o) => o.espolio), (o) => o.minha),
      variaveis: sum(g.filter((o) => !o.fixo && !o.parcela), (o) => o.minha),
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
    falaParaTexto, parseNotificacao, valorRecorrente, meioRecorrente, expandir, itensFatura, resumoMes, porCategoria, mesesCompletos, media, sum, liquido,
  };
})();
if (typeof module !== 'undefined') module.exports = Engine;
