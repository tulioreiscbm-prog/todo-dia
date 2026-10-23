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
  if (antiga) for (const s of amb.sheets.values()) if (s.data[0]) s.data[0] = s.data[0].filter((h) => !['espolio', 'parcela_inicial'].includes(h));
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
  assert.deepEqual(head.slice(-2), ['espolio', 'parcela_inicial']);
  const lido = r.dados.lancamentos.find((i) => i.id === 'IMP-teste');
  assert.equal(lido.espolio, true); assert.equal(lido.parcelaIni, 3); assert.equal(lido.parcelas, 2);
  assert.equal(r.dados.fixos.find((f) => f.id === 'fx').espolio, true);
  assert.deepEqual(r.dados.recursos, ['espolio', 'parcela_inicial']);
});

test('lançamento comum não ganha espólio nem parcela inicial', () => {
  const amb = ambiente(false);
  const r = amb.post([{ t: 'lanc', item: { ...item, id: 'Lcomum', espolio: false, parcelaIni: undefined, parcelas: 1 } }]);
  const lido = r.dados.lancamentos.find((i) => i.id === 'Lcomum');
  assert.equal(lido.espolio, undefined); assert.equal(lido.parcelaIni, undefined);
});
