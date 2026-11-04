// Programa da planilha: colunas novas em planilhas antigas e campos espólio / parcela inicial
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const vm = require('vm');
const { carregar } = require('./gas-sim.js');

function ambiente(antiga) {
  const amb = carregar([path.join(__dirname, '../apps-script/Codigo.gs')]);
  vm.runInContext('instalar()', amb.ctx);
  amb.props.set('CHAVE', 'k');
  if (antiga) for (const s of amb.sheets.values()) if (s.data[0]) s.data[0] = s.data[0].filter((h) => !['espolio', 'parcela_inicial', 'extras'].includes(h));
  amb.post = (ops) => { amb.ctx.__e = { postData: { contents: JSON.stringify({ key: 'k', ops }) } }; return JSON.parse(vm.runInContext('doPost(__e)', amb.ctx).text); };
  return amb;
}
const item = { id: 'IMP-teste', tipo: 'despesa', data: '2026-10-18', desc: 'Corato', valor: 10994, meioId: 'inter-credito', catId: 'casa', subId: 'reparos', parcelas: 2, parcelaIni: 3, espolio: true, atualizadoEm: 5 };

test('planilha antiga ganha as colunas novas no fim e guarda espólio e parcela inicial', () => {
  const amb = ambiente(true);
  const head0 = amb.sheets.get('Lançamentos').data[0].slice();
  assert.ok(!head0.includes('espolio'));
  const r = amb.post([{ t: 'lanc', item }, { t: 'fixo', rec: { id: 'fx', desc: 'Seguro', inicio: '2026-11', meioId: 'inter-credito', valores: [{ desde: '2026-11', valor: 100 }], espolio: true } }]);
  assert.equal(r.ok, true);
  const head = amb.sheets.get('Lançamentos').data[0];
  assert.deepEqual(head.slice(0, head0.length), head0);
  assert.deepEqual(head.slice(-3), ['espolio', 'parcela_inicial', 'extras']);
  const lido = r.dados.lancamentos.find((i) => i.id === 'IMP-teste');
  assert.equal(lido.espolio, true); assert.equal(lido.parcelaIni, 3); assert.equal(lido.parcelas, 2);
  assert.equal(r.dados.fixos.find((f) => f.id === 'fx').espolio, true);
  assert.deepEqual(r.dados.recursos, ['espolio', 'parcela_inicial', 'caixa', 'extras', 'diag']);
});

test('lançamento comum não ganha espólio nem parcela inicial', () => {
  const amb = ambiente(false);
  const r = amb.post([{ t: 'lanc', item: { ...item, id: 'Lcomum', espolio: false, parcelaIni: undefined, parcelas: 1 } }]);
  const lido = r.dados.lancamentos.find((i) => i.id === 'Lcomum');
  assert.equal(lido.espolio, undefined); assert.equal(lido.parcelaIni, undefined);
});

test('chave das notificações: só inclui na Caixa de entrada, não lê nada', () => {
  const amb = ambiente(false);
  const get = (parameter) => { amb.ctx.__e = { parameter }; return JSON.parse(vm.runInContext('doGet(__e)', amb.ctx).text); };
  // sem chave gerada, nada entra
  assert.equal(get({ nk: 'x', titulo: 'Loja', texto: 'R$ 1,00' }).ok, false);
  const r = amb.post([{ t: 'gerar_chave_notif' }]);
  const nk = r.aplicadas[0].chaveNotif;
  assert.ok(/^[0-9a-f]{40}$/.test(nk)); assert.equal(r.dados.temChaveNotif, true);
  const n = get({ nk, app: 'carteira', titulo: 'Brasil Variedades', texto: 'R$ 128,73 com Banco Inter Black Mastercard ••4298' });
  assert.equal(n.ok, true); assert.ok(n.id); assert.equal(n.dados, undefined);
  assert.equal(get({ nk, titulo: 'Brasil Variedades', texto: 'R$ 128,73 com Banco Inter Black Mastercard ••4298' }).repetida, true);
  // a chave das notificações não serve para ler nem gravar lançamentos
  assert.equal(get({ key: nk }).ok, false);
  amb.ctx.__e = { postData: { contents: JSON.stringify({ key: nk, ops: [] }) } };
  assert.equal(JSON.parse(vm.runInContext('doPost(__e)', amb.ctx).text).ok, false);
  // o app (chave principal) vê a pendência e marca como lançada
  const d = amb.post([]).dados;
  assert.equal(d.caixa.length, 1); assert.equal(d.caixa[0].titulo, 'Brasil Variedades');
  const d2 = amb.post([{ t: 'caixa', id: d.caixa[0].id, status: 'lancado' }]).dados;
  assert.equal(d2.caixa.length, 0);
});

test('extras: com quem foi dividido vai e volta da planilha', () => {
  const amb = ambiente(true);
  const r = amb.post([{ t: 'lanc', item: { ...item, id: 'Ldiv', div: 2, extras: { divCom: 'outros', divNome: 'Ana' } } },
    { t: 'fixo', rec: { id: 'fx2', desc: 'Internet', inicio: '2026-11', meioId: 'boleto', div: 5, valores: [{ desde: '2026-11', valor: 100 }], extras: { divCom: 'familia' } } }]);
  assert.deepEqual(r.dados.lancamentos.find((i) => i.id === 'Ldiv').extras, { divCom: 'outros', divNome: 'Ana' });
  assert.deepEqual(r.dados.fixos.find((f) => f.id === 'fx2').extras, { divCom: 'familia' });
  assert.equal(r.dados.lancamentos.find((i) => i.id === 'IMP-teste'), undefined);
});

test('diagnóstico: a planilha registra a última chamada do MacroDroid, mesmo vazia ou com chave errada', () => {
  const amb = ambiente(false);
  const get = (parameter) => { amb.ctx.__e = { parameter }; return JSON.parse(vm.runInContext('doGet(__e)', amb.ctx).text); };
  const nk = amb.post([{ t: 'gerar_chave_notif' }]).aplicadas[0].chaveNotif;
  get({ nk: 'errada', titulo: 'x', texto: 'y' });
  assert.equal(amb.post([]).dados.notifUltima.resultado, 'chave');
  const t = get({ nk, app: 'carteira', titulo: '[notification_title]', texto: '' });
  assert.equal(t.teste, true);
  const d = amb.post([]).dados;
  assert.equal(d.notifUltima.resultado, 'vazia'); assert.equal(d.caixa.length, 0);
  get({ nk, app: 'carteira', titulo: 'Loja', texto: 'R$ 1,00 com cartão ••4298' });
  assert.equal(amb.post([]).dados.notifUltima.resultado, 'ok');
});
