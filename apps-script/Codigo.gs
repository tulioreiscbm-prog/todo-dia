/**
 * Todo dIA — programa da planilha (Google Apps Script).
 *
 * Este código fica DENTRO da sua planilha (Extensões › Apps Script). Ele é a única porta de
 * entrada para os seus dados: o app no celular só lê e grava aqui se mandar a chave secreta.
 *
 * Primeira vez: rode a função "instalar" (menu Executar) e depois implante como App da Web.
 * O passo a passo completo está no README do repositório.
 */

const VERSAO_SCRIPT = '1.0.0';
// o que este programa sabe guardar além do básico (o app confere antes de usar)
const RECURSOS = ['espolio', 'parcela_inicial'];
const ABAS = {
  lanc: {
    nome: 'Lançamentos',
    cols: ['id', 'tipo', 'data', 'descricao', 'valor', 'meio', 'categoria', 'subcategoria', 'parcelas', 'dividido_por',
      'recebido', 'obs', 'fonte', 'criado_em', 'atualizado_em', 'excluido', 'espolio', 'parcela_inicial'],
    texto: ['id', 'tipo', 'data', 'descricao', 'meio', 'categoria', 'subcategoria', 'recebido', 'obs', 'fonte'],
  },
  fixos: {
    nome: 'Fixos',
    cols: ['id', 'tipo', 'descricao', 'categoria', 'subcategoria', 'meio', 'dia', 'inicio', 'fim', 'dividido_por',
      'valores', 'excecoes', 'recebidos', 'atualizado_em', 'excluido', 'espolio'],
    texto: ['id', 'tipo', 'descricao', 'categoria', 'subcategoria', 'meio', 'inicio', 'fim', 'valores', 'excecoes', 'recebidos'],
  },
  config: { nome: 'Config', cols: ['chave', 'valor', 'atualizado_em'], texto: ['chave', 'valor'] },
};
const CONFIG_PERMITIDA = ['meios', 'categorias', 'regras', 'prefs'];

// ---------------------------------------------------------------- HTTP
function doGet(e) {
  return responder_(function () {
    const p = (e && e.parameter) || {};
    exigirChave_(p.key);
    if (p.action === 'ping') return { ok: true, versao: VERSAO_SCRIPT };
    return { ok: true, dados: tudo_() };
  });
}

function doPost(e) {
  return responder_(function () {
    let body;
    try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { throw erro_('pedido mal formado'); }
    exigirChave_(body.key);
    const ops = Array.isArray(body.ops) ? body.ops : [];
    if (ops.length > 500) throw erro_('muitas operações de uma vez');
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const ss = planilha_();
      const resultado = [];
      for (let i = 0; i < ops.length; i++) resultado.push(aplicar_(ss, ops[i]));
      SpreadsheetApp.flush();
      return { ok: true, aplicadas: resultado, dados: tudo_() };
    } finally {
      lock.releaseLock();
    }
  });
}

function responder_(fn) {
  let out;
  try { out = fn(); } catch (err) { out = { ok: false, erro: (err && err.message) || String(err), codigo: (err && err.codigo) || 'erro' }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function erro_(msg, codigo) { const e = new Error(msg); e.codigo = codigo || 'erro'; return e; }
function exigirChave_(k) {
  const chave = PropertiesService.getScriptProperties().getProperty('CHAVE');
  if (!chave) throw erro_('A planilha ainda não foi instalada. Rode a função "instalar".', 'sem_instalacao');
  if (!k || String(k) !== chave) throw erro_('Chave inválida.', 'chave');
}

// ---------------------------------------------------------------- leitura
function planilha_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function aba_(ss, def) {
  const sh = ss.getSheetByName(def.nome);
  if (!sh) throw erro_('Aba "' + def.nome + '" não encontrada. Rode a função "instalar".', 'sem_instalacao');
  garantirColunas_(sh, def);
  return sh;
}
// planilhas criadas por versões antigas ganham as colunas novas no fim, sem mexer no que já existe
function garantirColunas_(sh, def) {
  const head = (sh.getDataRange().getValues()[0] || []).map(String);
  if (!head.length || head.every(function (h) { return h === ''; })) return;
  const faltam = def.cols.filter(function (c) { return head.indexOf(c) < 0; });
  if (!faltam.length) return;
  let n = head.length;
  while (n > 0 && head[n - 1] === '') n--;
  sh.getRange(1, n + 1, 1, faltam.length).setValues([faltam]);
}
function sim_(v) { return v === true || v === 1 || String(v).toUpperCase() === 'TRUE'; }
function linhas_(ss, def) {
  const sh = aba_(ss, def);
  const v = sh.getDataRange().getValues();
  const head = v[0] || def.cols;
  const out = [];
  for (let r = 1; r < v.length; r++) {
    if (v[r].every(function (c) { return c === '' || c === null; })) continue;
    const o = {};
    for (let c = 0; c < head.length; c++) o[head[c]] = v[r][c];
    o._linha = r + 1;
    out.push(o);
  }
  return out;
}
function txt_(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v);
}
function num_(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function json_(v, padrao) { if (v === '' || v === null || v === undefined) return padrao; try { return JSON.parse(String(v)); } catch (e) { return padrao; } }
function centavos_(v) { return Math.round(num_(v) * 100); }
function ym_(v) { const t = txt_(v); return /^\d{4}-\d{2}/.test(t) ? t.slice(0, 7) : ''; }

function lancDeLinha_(o) {
  const rec = json_(o.recebido, {});
  const it = {
    id: txt_(o.id), tipo: txt_(o.tipo) || 'despesa', data: txt_(o.data).slice(0, 10), desc: txt_(o.descricao),
    valor: centavos_(o.valor), meioId: txt_(o.meio), catId: txt_(o.categoria) || null, subId: txt_(o.subcategoria) || null,
    parcelas: Math.max(1, num_(o.parcelas) || 1), div: Math.max(1, num_(o.dividido_por) || 1), obs: txt_(o.obs),
    fonteCat: txt_(o.fonte) || null, criadoEm: num_(o.criado_em), atualizadoEm: num_(o.atualizado_em),
  };
  if (sim_(o.espolio)) it.espolio = true;
  if (num_(o.parcela_inicial) > 1) it.parcelaIni = Math.round(num_(o.parcela_inicial));
  if (rec && rec.recebido) it.recebido = true;
  if (rec && rec.recebidos) it.recebidos = rec.recebidos;
  if (o.excluido === true || String(o.excluido).toUpperCase() === 'TRUE' || o.excluido === 1) { it.excluido = true; it.excluidoEm = num_(o.atualizado_em); }
  return it;
}
function fixoDeLinha_(o) {
  return {
    id: txt_(o.id), tipo: txt_(o.tipo) || 'despesa', desc: txt_(o.descricao), catId: txt_(o.categoria) || null,
    subId: txt_(o.subcategoria) || null, meioId: txt_(o.meio), dia: Math.min(31, Math.max(1, num_(o.dia) || 1)),
    inicio: ym_(o.inicio), fim: ym_(o.fim) || null, div: Math.max(1, num_(o.dividido_por) || 1),
    valores: json_(o.valores, []), excecoes: json_(o.excecoes, {}), recebidos: json_(o.recebidos, {}),
    atualizadoEm: num_(o.atualizado_em), excluido: o.excluido === true || String(o.excluido).toUpperCase() === 'TRUE',
    espolio: sim_(o.espolio),
  };
}
function tudo_() {
  const ss = planilha_();
  const config = {};
  linhas_(ss, ABAS.config).forEach(function (o) { const k = txt_(o.chave); if (k) config[k] = json_(o.valor, null); });
  return {
    lancamentos: linhas_(ss, ABAS.lanc).map(lancDeLinha_).filter(function (i) { return i.id; }),
    fixos: linhas_(ss, ABAS.fixos).map(fixoDeLinha_).filter(function (f) { return f.id && !f.excluido; }),
    config: config,
    planilhaUrl: ss.getUrl(),
    agora: Date.now(),
    versao: VERSAO_SCRIPT,
    recursos: RECURSOS,
  };
}

// ---------------------------------------------------------------- gravação
function linhaDeLanc_(it) {
  const rec = {};
  if (it.recebido) rec.recebido = true;
  if (it.recebidos && Object.keys(it.recebidos).length) rec.recebidos = it.recebidos;
  return {
    id: it.id, tipo: it.tipo, data: it.data, descricao: it.desc || '', valor: (it.valor || 0) / 100, meio: it.meioId || '',
    categoria: it.catId || '', subcategoria: it.subId || '', parcelas: it.parcelas || 1, dividido_por: it.div || 1,
    recebido: Object.keys(rec).length ? JSON.stringify(rec) : '', obs: it.obs || '', fonte: it.fonteCat || '',
    criado_em: it.criadoEm || Date.now(), atualizado_em: it.atualizadoEm || Date.now(), excluido: !!it.excluido,
    espolio: !!it.espolio, parcela_inicial: it.parcelaIni > 1 ? it.parcelaIni : '',
  };
}
function linhaDeFixo_(f) {
  return {
    id: f.id, tipo: f.tipo || 'despesa', descricao: f.desc || '', categoria: f.catId || '', subcategoria: f.subId || '',
    meio: f.meioId || '', dia: f.dia || 1, inicio: f.inicio || '', fim: f.fim || '', dividido_por: f.div || 1,
    valores: JSON.stringify(f.valores || []), excecoes: JSON.stringify(f.excecoes || {}), recebidos: JSON.stringify(f.recebidos || {}),
    atualizado_em: f.atualizadoEm || Date.now(), excluido: !!f.excluido, espolio: !!f.espolio,
  };
}
function validarLanc_(it) {
  if (!it || typeof it !== 'object') throw erro_('lançamento vazio');
  if (!/^[A-Za-z0-9_-]{4,60}$/.test(String(it.id || ''))) throw erro_('id inválido');
  if (['despesa', 'receita', 'ajuste', 'ressarcimento'].indexOf(it.tipo) < 0) throw erro_('tipo inválido');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(it.data || ''))) throw erro_('data inválida');
  if (!(Number.isInteger(it.valor) && it.valor > 0 && it.valor < 1e11)) throw erro_('valor inválido');
}
function validarFixo_(f) {
  if (!f || typeof f !== 'object') throw erro_('fixo vazio');
  if (!/^[A-Za-z0-9_-]{2,60}$/.test(String(f.id || ''))) throw erro_('id inválido');
  if (!/^\d{4}-\d{2}$/.test(String(f.inicio || ''))) throw erro_('mês de início inválido');
}
function upsert_(sh, def, obj, chave) {
  const v = sh.getDataRange().getValues();
  const head = v[0];
  const iId = head.indexOf(chave);
  const iAt = head.indexOf('atualizado_em');
  const linha = head.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  for (let r = 1; r < v.length; r++) {
    if (String(v[r][iId]) === String(obj[chave])) {
      if (iAt >= 0 && num_(v[r][iAt]) > num_(obj.atualizado_em)) return 'ignorado (versão mais nova já gravada)';
      sh.getRange(r + 1, 1, 1, head.length).setValues([linha]);
      return 'atualizado';
    }
  }
  sh.appendRow(linha);
  return 'criado';
}
function aplicar_(ss, op) {
  if (!op || typeof op !== 'object') throw erro_('operação vazia');
  if (op.t === 'lanc') { validarLanc_(op.item); return upsert_(aba_(ss, ABAS.lanc), ABAS.lanc, linhaDeLanc_(op.item), 'id'); }
  if (op.t === 'fixo') { validarFixo_(op.rec); return upsert_(aba_(ss, ABAS.fixos), ABAS.fixos, linhaDeFixo_(op.rec), 'id'); }
  if (op.t === 'config') {
    if (CONFIG_PERMITIDA.indexOf(op.nome) < 0) throw erro_('configuração desconhecida');
    const s = JSON.stringify(op.valor === undefined ? null : op.valor);
    if (s.length > 45000) throw erro_('configuração grande demais');
    return upsert_(aba_(ss, ABAS.config), ABAS.config, { chave: op.nome, valor: s, atualizado_em: op.em || Date.now() }, 'chave');
  }
  if (op.t === 'apagar') {
    const sh = aba_(ss, ABAS.lanc); const v = sh.getDataRange().getValues();
    for (let r = v.length - 1; r >= 1; r--) if (String(v[r][0]) === String(op.id)) { sh.deleteRow(r + 1); return 'apagado'; }
    return 'não encontrado';
  }
  throw erro_('operação desconhecida: ' + op.t);
}

// ---------------------------------------------------------------- instalação e manutenção
function instalar() {
  const ss = planilha_();
  Object.keys(ABAS).forEach(function (k) {
    const def = ABAS[k];
    let sh = ss.getSheetByName(def.nome);
    if (!sh) sh = ss.insertSheet(def.nome);
    const atual = sh.getRange(1, 1, 1, def.cols.length).getValues()[0];
    if (atual.join('|') !== def.cols.join('|')) sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, def.cols.length).setFontWeight('bold');
    def.texto.forEach(function (c) { sh.getRange(1, def.cols.indexOf(c) + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
  });
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('CHAVE')) props.setProperty('CHAVE', novaChave_());
  escreverLeiaMe_();
  const ja = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'backupSemanal'; });
  if (!ja) ScriptApp.newTrigger('backupSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
  // dados iniciais particulares (arquivo opcional, fica só na sua planilha)
  if (typeof semear_ === 'function') semear_();
  Logger.log('Todo dIA instalado. Sua chave: ' + props.getProperty('CHAVE'));
  return props.getProperty('CHAVE');
}
function novaChave_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 40); }
function trocarChave() {
  PropertiesService.getScriptProperties().setProperty('CHAVE', novaChave_());
  escreverLeiaMe_();
  Logger.log('Nova chave: ' + PropertiesService.getScriptProperties().getProperty('CHAVE'));
}
function escreverLeiaMe_() {
  const ss = planilha_();
  let sh = ss.getSheetByName('Leia-me');
  if (!sh) { sh = ss.insertSheet('Leia-me', 0); }
  sh.clear();
  const chave = PropertiesService.getScriptProperties().getProperty('CHAVE');
  sh.getRange(1, 1, 8, 1).setValues([
    ['Todo dIA — sua planilha de gastos'],
    ['Não apague nem renomeie as abas Lançamentos, Fixos e Config. Pode olhar, filtrar e copiar à vontade.'],
    ['Chave do app (cole no celular na primeira vez; não compartilhe):'],
    [chave],
    ['Perdeu o celular? Menu Todo dIA › Trocar chave. O aparelho antigo perde o acesso na hora.'],
    ['Valores em reais. Datas no formato ano-mês-dia.'],
    ['Backup automático: todo domingo às 3h, uma cópia desta planilha vai para a pasta "Backups" ao lado dela.'],
    ['Versão do programa: ' + VERSAO_SCRIPT],
  ]);
  sh.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  sh.getRange(4, 1).setFontFamily('Roboto Mono').setFontSize(12).setBackground('#FFF2D3');
  sh.setColumnWidth(1, 640);
}
function backupSemanal() {
  const ss = planilha_();
  const arquivo = DriveApp.getFileById(ss.getId());
  const pais = arquivo.getParents();
  const pai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
  const it = pai.getFoldersByName('Backups');
  const pasta = it.hasNext() ? it.next() : pai.createFolder('Backups');
  const nome = 'Todo dIA - backup ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH-mm');
  arquivo.makeCopy(nome, pasta);
  // guarda só as 12 cópias mais recentes
  const copias = [];
  const fs = pasta.getFiles();
  while (fs.hasNext()) { const f = fs.next(); if (f.getName().indexOf('Todo dIA - backup') === 0) copias.push(f); }
  copias.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  copias.slice(12).forEach(function (f) { f.setTrashed(true); });
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Todo dIA')
    .addItem('Mostrar chave do app', 'mostrarChave')
    .addItem('Trocar chave', 'trocarChaveMenu')
    .addItem('Fazer backup agora', 'backupSemanal')
    .addToUi();
}
function mostrarChave() { SpreadsheetApp.getUi().alert('Chave do Todo dIA', PropertiesService.getScriptProperties().getProperty('CHAVE') || 'Rode "instalar" primeiro.', SpreadsheetApp.getUi().ButtonSet.OK); }
function trocarChaveMenu() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Trocar chave', 'Todos os aparelhos conectados vão perder o acesso até você colar a nova chave. Continuar?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  trocarChave();
  ui.alert('Nova chave', PropertiesService.getScriptProperties().getProperty('CHAVE'), ui.ButtonSet.OK);
}
