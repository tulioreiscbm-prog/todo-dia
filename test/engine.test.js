const assert = require('node:assert/strict');
const test = require('node:test');
const E = require('../src/engine.js');
const T0 = require('../src/taxonomy.js');
// cenário de teste (fictício, mas com as mesmas regras de cartão do uso real)
const T = {
  categorias: [...T0.categorias, { id: 'espolio', nome: 'Espólio', tipo: 'despesa', subs: [{ id: 'energia', nome: 'Energia do imóvel', div: 5 }, { id: 'seguro', nome: 'Seguro', div: 5 }, { id: 'repasse', nome: 'Repasse' }] }],
  dicionario: T0.dicionario,
  meios: [
    { id: 'inter-credito', nome: 'Inter Crédito', banco: 'Inter', tipo: 'credito', fechamento: 30, vencimento: 7 },
    { id: 'c6-credito', nome: 'C6 Crédito', banco: 'C6', tipo: 'credito', fechamento: 3, vencimento: 13 },
    { id: 'inter-pix', nome: 'Pix Inter', banco: 'Inter', tipo: 'pix' },
    { id: 'inter-debito', nome: 'Débito Inter', banco: 'Inter', tipo: 'debito' },
    { id: 'boleto', nome: 'Boleto', banco: 'Inter', tipo: 'boleto' },
    { id: 'dinheiro', nome: 'Dinheiro', banco: 'Carteira', tipo: 'dinheiro' },
  ],
};
const F = (id, desc, valor, catId, subId, meioId, extra = {}) => ({ id, desc, tipo: 'despesa', catId, subId, meioId, dia: 1, inicio: '2026-11', fim: null, div: 1, valores: [{ desde: '2026-11', valor }], excecoes: {}, recebidos: {}, ...extra });
T.recorrentes = [
  F('acad', 'Academia', 9170, 'bemestar', 'academia', 'c6-credito'),
  F('net', 'Netflix', 4490, 'assinaturas', 'streaming', 'inter-credito'),
  F('seg', 'Seguro', 53675, 'espolio', 'seguro', 'inter-credito', { div: 5 }),
  F('rep', 'Repasse', 40000, 'espolio', 'repasse', 'inter-pix', { fim: '2027-01' }),
  F('ress', 'Ressarcimento', 30000, 'ressarcimentos', 'familia', 'inter-pix', { tipo: 'ressarcimento' }),
];

const inter = T.meios.find((m) => m.id === 'inter-credito');
const c6 = T.meios.find((m) => m.id === 'c6-credito');
const ctx = (hoje) => ({ hoje, meios: T.meios, meioPadrao: 'inter-credito' });

test('datas: meses e dias', () => {
  assert.equal(E.addMonthsYM('2026-12', 1), '2027-01');
  assert.equal(E.addMonthsYM('2026-01', -1), '2025-12');
  assert.equal(E.addMonthsYM('2026-10', -14), '2025-08');
  assert.equal(E.clampDate('2027-02', 30), '2027-02-28');
  assert.equal(E.clampDate('2028-02', 30), '2028-02-29');
  assert.equal(E.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(E.weekday('2026-10-22'), 4); // quinta
  assert.deepEqual(E.monthsBetween('2026-11', '2027-02'), ['2026-11', '2026-12', '2027-01', '2027-02']);
});

test('fatura Inter: fecha dia 30, vence dia 7', () => {
  assert.deepEqual(E.fatura(inter, '2026-10-22'), { ref: '2026-11', fecha: '2026-10-30', vence: '2026-11-07' });
  assert.deepEqual(E.fatura(inter, '2026-10-29'), { ref: '2026-11', fecha: '2026-10-30', vence: '2026-11-07' });
  assert.deepEqual(E.fatura(inter, '2026-10-30'), { ref: '2026-12', fecha: '2026-11-30', vence: '2026-12-07' });
  assert.deepEqual(E.fatura(inter, '2026-10-31'), { ref: '2026-12', fecha: '2026-11-30', vence: '2026-12-07' });
  // fevereiro: fechamento ajustado para o último dia
  assert.deepEqual(E.fatura(inter, '2027-02-27'), { ref: '2027-03', fecha: '2027-02-28', vence: '2027-03-07' });
  assert.deepEqual(E.fatura(inter, '2027-02-28'), { ref: '2027-04', fecha: '2027-03-30', vence: '2027-04-07' });
  // parcelas deslocam a fatura
  assert.equal(E.fatura(inter, '2026-10-22', 2).ref, '2027-01');
});

test('fatura C6: compras até dia 2 entram na fatura que vence dia 13 do mesmo mês', () => {
  assert.deepEqual(E.fatura(c6, '2026-10-02'), { ref: '2026-10', fecha: '2026-10-03', vence: '2026-10-13' });
  assert.deepEqual(E.fatura(c6, '2026-10-03'), { ref: '2026-11', fecha: '2026-11-03', vence: '2026-11-13' });
  assert.deepEqual(E.fatura(c6, '2026-10-22'), { ref: '2026-11', fecha: '2026-11-03', vence: '2026-11-13' });
  assert.deepEqual(E.fatura(c6, '2026-12-15'), { ref: '2027-01', fecha: '2027-01-03', vence: '2027-01-13' });
});

test('faturaPorRef bate com fatura()', () => {
  for (const m of [inter, c6]) {
    let d = '2026-01-01';
    for (let i = 0; i < 800; i++) {
      const f = E.fatura(m, d);
      const g = E.faturaPorRef(m, f.ref);
      assert.equal(g.fecha, f.fecha, `${m.id} ${d}`);
      assert.equal(g.vence, f.vence, `${m.id} ${d}`);
      assert.ok(d >= g.inicio && d < g.fecha, `${m.id} ${d} dentro de [${g.inicio}, ${g.fecha})`);
      d = E.addDays(d, 1);
    }
  }
});

test('status da fatura', () => {
  const f = E.faturaPorRef(inter, '2026-11');
  assert.equal(E.faturaStatus(f, '2026-10-22'), 'aberta');
  assert.equal(E.faturaStatus(f, '2026-10-30'), 'fechada');
  assert.equal(E.faturaStatus(f, '2026-11-07'), 'fechada');
  assert.equal(E.faturaStatus(f, '2026-11-08'), 'vencida');
});

test('valores em reais', () => {
  assert.equal(E.parseValor('87,50'), 8750);
  assert.equal(E.parseValor('87.50'), 8750);
  assert.equal(E.parseValor('87,5'), 8750);
  assert.equal(E.parseValor('1.250'), 125000);
  assert.equal(E.parseValor('1.250,90'), 125090);
  assert.equal(E.parseValor('R$ 23'), 2300);
  assert.equal(E.parseValor('2mil'), 200000);
  assert.equal(E.parseValor('0'), null);
  assert.equal(E.parseValor('abc'), null);
  assert.deepEqual(E.splitParcelas(10000, 3), [3333, 3333, 3334]);
  assert.equal(E.fmtBRL(123456), 'R$ 1.234,56');
  assert.equal(E.fmtBRL(-135657), '−R$ 1.356,57');
});

test('frases livres', () => {
  const h = '2026-10-22'; // quinta
  let p = E.parse('açougue 87,50 inter crédito ontem', ctx(h));
  assert.equal(p.valor, 8750); assert.equal(p.desc, 'Açougue'); assert.equal(p.data, '2026-10-21'); assert.equal(p.meioId, 'inter-credito');
  p = E.parse('Supernosso 312,40', ctx(h));
  assert.equal(p.valor, 31240); assert.equal(p.desc, 'Supernosso'); assert.equal(p.data, null); assert.equal(p.meioId, null);
  p = E.parse('gasolina 200 no pix', ctx(h));
  assert.equal(p.valor, 20000); assert.equal(p.desc, 'Gasolina'); assert.equal(p.meioId, 'inter-pix');
  p = E.parse('moto acessório 1.250 c6 10x', ctx(h));
  assert.equal(p.valor, 125000); assert.equal(p.desc, 'Moto acessório'); assert.equal(p.meioId, 'c6-credito'); assert.equal(p.parcelas, 10);
  p = E.parse('padaria R$ 18,90 sexta', ctx(h));
  assert.equal(p.valor, 1890); assert.equal(p.desc, 'Padaria'); assert.equal(p.data, '2026-10-16');
  p = E.parse('conta de luz 230 dividido por 5', ctx(h));
  assert.equal(p.valor, 23000); assert.equal(p.div, 5); assert.equal(p.desc, 'Conta de luz');
  p = E.parse('clube 180 ÷2 dia 5', ctx(h));
  assert.equal(p.div, 2); assert.equal(p.data, '2026-10-05'); assert.equal(p.desc, 'Clube');
  p = E.parse('uber 99 23,50', ctx(h));
  assert.equal(p.valor, 2350); assert.equal(p.desc, 'Uber 99');
  p = E.parse('farmácia 45 dia 25', ctx(h)); // dia 25 ainda não chegou -> mês passado
  assert.equal(p.data, '2026-09-25');
  p = E.parse('presente 150 15/10', ctx(h));
  assert.equal(p.data, '2026-10-15'); assert.equal(p.valor, 15000);
  p = E.parse('recebi airbnb 850', ctx(h));
  assert.equal(p.tipoHint, 'receita'); assert.equal(p.desc, 'Airbnb'); assert.equal(p.valor, 85000);
  p = E.parse('quinta passada lanche 32', ctx(h));
  assert.equal(p.data, '2026-10-15'); assert.equal(p.desc, 'Lanche');
  p = E.parse('quinta lanche 32', ctx(h));
  assert.equal(p.data, '2026-10-22');
  p = E.parse('tv 3 mil em 12 vezes inter', ctx(h));
  assert.equal(p.valor, 300000); assert.equal(p.parcelas, 12); assert.equal(p.meioId, 'inter-credito');
  p = E.parse('', ctx(h));
  assert.equal(p.valor, null); assert.equal(p.desc, '');
});

test('classificação: dicionário e regras aprendidas', () => {
  const c = (d, regras = {}) => E.classify(d, { categorias: T.categorias, dicionario: T.dicionario, regras });
  const casos = [
    ['Açougue', 'alimentacao', 'acougue'], ['Supernosso', 'alimentacao', 'supermercado'], ['Moto acessório', 'transporte', 'pecas'],
    ['Gasolina', 'transporte', 'combustivel'], ['Padaria', 'alimentacao', 'padaria'], ['Clube', 'bemestar', 'clube'],
    ['Posto Ipiranga', 'transporte', 'combustivel'], ['Drogaria Araujo', 'saude', 'farmacia'], ['Ifood', 'alimentacao', 'delivery'],
    ['Energia', 'casa', 'energia'], ['Pão de açúcar', 'alimentacao', 'supermercado'],
    ['Abasteci', 'transporte', 'combustivel'], ['Presente pai', 'compras', 'presentes'], ['Netflix', 'assinaturas', 'streaming'], ['Boleto Cemig', 'casa', 'energia'],
    ['Airbnb', 'renda', 'airbnb'], ['Uber 99', 'transporte', 'apps'],
  ];
  for (const [d, cat, sub] of casos) {
    const r = c(d);
    assert.ok(r, `sem classificação: ${d}`);
    assert.equal(`${r.catId}/${r.subId}`, `${cat}/${sub}`, d);
  }
  assert.equal(c('xyzabc'), null);
  // regra aprendida vence o dicionário
  const regras = { supernosso: { catId: 'casa', subId: 'limpeza' } };
  assert.equal(c('Supernosso', regras).subId, 'limpeza');
  assert.equal(c('Supernosso Gutierrez', regras).subId, 'limpeza');
  // regra para categoria inexistente é ignorada
  assert.equal(c('Supernosso', { supernosso: { catId: 'x', subId: 'y' } }).subId, 'supermercado');
});

test('recorrentes: vigência, histórico de valor e exceções', () => {
  const r = { inicio: '2026-11', fim: '2027-01', valores: [{ desde: '2026-11', valor: 1000 }, { desde: '2027-01', valor: 1200 }],
    excecoes: { '2026-12': { pular: true } } };
  assert.equal(E.valorRecorrente(r, '2026-10'), null);
  assert.equal(E.valorRecorrente(r, '2026-11'), 1000);
  assert.equal(E.valorRecorrente(r, '2026-12'), null);
  assert.equal(E.valorRecorrente(r, '2027-01'), 1200);
  assert.equal(E.valorRecorrente(r, '2027-02'), null);
  r.excecoes['2026-11'] = { valor: 1500 };
  assert.equal(E.valorRecorrente(r, '2026-11'), 1500);
});

test('expansão: parcelas, divisão, faturas e previsto', () => {
  const state = {
    meios: T.meios,
    itens: [
      { id: 'a', tipo: 'despesa', desc: 'TV', valor: 300000, data: '2026-10-22', meioId: 'inter-credito', parcelas: 3, catId: 'compras', subId: 'eletronicos' },
      { id: 'b', tipo: 'despesa', desc: 'Energia do imóvel', valor: 23000, data: '2026-10-20', meioId: 'inter-pix', div: 5, catId: 'espolio', subId: 'energia' },
      { id: 'c', tipo: 'receita', desc: 'Airbnb', valor: 85000, data: '2026-10-21', meioId: 'inter-pix', catId: 'renda', subId: 'airbnb' },
      { id: 'd', tipo: 'despesa', desc: 'apagado', valor: 100, data: '2026-10-21', meioId: 'inter-pix', excluido: true },
      { id: 'e', tipo: 'despesa', desc: 'inválido', valor: -5, data: '2026-10-21', meioId: 'inter-pix' },
      { id: 'f', tipo: 'despesa', desc: 'Conta', valor: 5000, data: '2026-10-21', meioId: 'boleto', catId: 'casa', subId: 'agua' },
    ],
    recorrentes: T.recorrentes,
  };
  const hoje = '2026-10-22';
  const out = E.expandir(state, '2026-10', '2027-02', hoje);
  const tv = out.filter((o) => o.refId === 'a');
  // parcelado no cartão: cada parcela conta no mês em que a fatura vence
  // parcelado no cartão: cada parcela é gasto do mês da fatura e conta desde o dia 1º desse mês
  assert.deepEqual(tv.map((o) => [o.comp, o.valor, o.fatura, o.data, o.parcela.join('/')]).sort(), [['2026-11', 100000, '2026-11', '2026-11-01', '1/3'], ['2026-12', 100000, '2026-12', '2026-12-01', '2/3'], ['2027-01', 100000, '2027-01', '2027-01-01', '3/3']]);
  assert.ok(tv.every((o) => o.dataCompra === '2026-10-22' && o.previsto));
  // em 1º/11 a parcela de novembro já é gasto certo
  assert.equal(E.expandir(state, '2026-11', '2026-11', '2026-11-01').find((o) => o.refId === 'a').previsto, false);
  // compra antiga: lançamento guarda só as parcelas restantes e mostra a numeração original
  const imp = E.expandir({ meios: T.meios, itens: [
    { id: 'IMP-x', tipo: 'despesa', desc: 'Loja', valor: 10808, parcelas: 1, parcelaIni: 3, data: '2026-10-24', meioId: 'inter-credito', catId: 'casa', subId: 'reparos' },
    { id: 'IMP-y', tipo: 'despesa', desc: 'Seguro', valor: 429400, parcelas: 8, parcelaIni: 5, div: 5, espolio: true, data: '2026-10-10', meioId: 'inter-credito', catId: 'transporte', subId: 'seguro-carro' },
  ], recorrentes: [] }, '2026-10', '2027-12', hoje);
  assert.deepEqual(imp.filter((o) => o.refId === 'IMP-x').map((o) => [o.comp, o.fatura, o.data, o.parcela.join('/')]), [['2026-11', '2026-11', '2026-11-01', '3/3']]);
  const sg = imp.filter((o) => o.refId === 'IMP-y');
  assert.equal(sg.length, 8); assert.ok(sg.every((o) => o.minha === 10735 && o.receber === 42940 && o.espolio && o.parcelaAntiga));
  assert.deepEqual([sg[sg.length - 1].parcela, sg[0].parcela, sg[0].fatura], [[5, 12], [12, 12], '2027-06']);
  assert.equal(E.resumoMes(imp, '2026-11').espolio, 10735);
  const en = out.find((o) => o.refId === 'b');
  assert.equal(en.minha, 4600); assert.equal(en.receber, 18400);
  assert.ok(!out.some((o) => o.refId === 'd' || o.refId === 'e'));
  assert.equal(out.find((o) => o.refId === 'f').fatura, null); // boleto não tem fatura
  const outubro = E.resumoMes(out, '2026-10');
  assert.equal(outubro.gastoReal, 4600 + 5000); // a TV em 3x só começa a contar em novembro
  assert.equal(outubro.rendaReal, 85000);
  assert.equal(outubro.receber, 18400);
  // fixos começam em 1º de novembro; repasse termina em janeiro
  const nov = out.filter((o) => o.comp === '2026-11' && o.fixo);
  assert.equal(nov.length, 5);
  assert.ok(nov.every((o) => o.data === '2026-11-01' && o.previsto));
  // gasto fixo cobrado depois do dia 1º já conta como certo desde o 1º
  const tarde = E.expandir({ meios: T.meios, itens: [], recorrentes: [{ id: 'x', desc: 'Internet', tipo: 'despesa', catId: 'casa', subId: 'internet', meioId: 'boleto', dia: 20, inicio: '2026-11', valores: [{ desde: '2026-11', valor: 1000 }] }] }, '2026-11', '2026-11', '2026-11-02');
  assert.deepEqual([tarde[0].data, tarde[0].previsto], ['2026-11-20', false]);
  assert.equal(out.filter((o) => o.refId === 'rep').length, 3);
  const seg = out.find((o) => o.refId === 'seg' && o.comp === '2026-11');
  assert.equal(seg.minha, 10735); assert.equal(seg.receber, 42940);
  // C6 no dia 1º cai na fatura que vence 13 do mesmo mês; Inter no dia 1º, na que vence 7 do mês seguinte
  assert.equal(out.find((o) => o.refId === 'acad' && o.comp === '2026-11').fatura, '2026-11');
  assert.equal(out.find((o) => o.refId === 'net' && o.comp === '2026-11').fatura, '2026-12');
  // ressarcimento: abate dos gastos, fica a receber, não entra em fatura nem em categoria
  const ress = out.find((o) => o.refId === 'ress' && o.comp === '2026-11');
  assert.equal(ress.receber, 30000); assert.equal(ress.fatura, null);
  const novR = E.resumoMes(out, '2026-12');
  assert.equal(novR.brutoPrev, 100000 + 9170 + 4490 + 10735 + 40000); // 2ª parcela da TV (fatura de dezembro) + fixos
  assert.equal(novR.gastoPrev, novR.brutoPrev - 30000);
  assert.ok(!E.porCategoria(out.filter((o) => o.comp === '2026-11'), T.categorias).some((c) => c.catId === 'ressarcimentos'));
  // fatura Inter de dezembro: 2ª parcela da TV + fixos de novembro no Inter crédito
  const fDez = E.itensFatura(state, 'inter-credito', '2026-12', hoje);
  assert.equal(E.sum(fDez, (o) => o.valor), 100000 + 4490 + 53675);
});

test('média só com 2 meses completos consecutivos', () => {
  assert.deepEqual(E.mesesCompletos('2026-10-22', '2026-11-15'), []);
  assert.deepEqual(E.mesesCompletos('2026-10-22', '2026-12-05'), ['2026-11']);
  assert.deepEqual(E.mesesCompletos('2026-10-22', '2027-01-02'), ['2026-11', '2026-12']);
  assert.deepEqual(E.mesesCompletos('2026-10-02', '2026-12-05'), ['2026-10', '2026-11']);
  assert.equal(E.media({ '2026-11': 1000 }, ['2026-11']), null);
  assert.equal(E.media({ '2026-11': 1000, '2026-12': 2000 }, ['2026-11', '2026-12']), 1500);
});

test('categorias: ids únicos e dicionário válido', () => {
  const ids = new Set();
  for (const c of T.categorias) {
    assert.ok(!ids.has(c.id), c.id); ids.add(c.id);
    const s = new Set(c.subs.map((x) => x.id)); assert.equal(s.size, c.subs.length, c.id);
  }
  for (const e of T.dicionario) assert.ok(E.findSub(T.categorias, e.c, e.s), `${e.c}/${e.s}`);
  for (const r of T.recorrentes) {
    assert.ok(E.findSub(T.categorias, r.catId, r.subId), r.id);
    assert.ok(T.meios.some((m) => m.id === r.meioId), r.id);
  }
});

test('itens com campos nulos (vindos de edição) continuam válidos', () => {
  const st = { meios: T.meios, recorrentes: [], itens: [
    { id: 'z', tipo: 'despesa', desc: 'X', valor: 1000, data: '2026-10-20', meioId: 'inter-pix', catId: 'outros', subId: 'indefinido', excluido: null, recebidos: null, obs: null, div: null, parcelas: null },
  ] };
  const o = E.expandir(st, '2026-10', '2026-10', '2026-10-22');
  assert.equal(o.length, 1); assert.equal(o[0].minha, 1000); assert.equal(o[0].recebido, false); assert.equal(o[0].obs, '');
});

test('fixo que trocou de cartão: outubro no C6, dali em diante no Inter', () => {
  const rec = { id: 'net', desc: 'Netflix', tipo: 'despesa', catId: 'assinaturas', subId: 'streaming', meioId: 'inter-credito', dia: 10, inicio: '2026-10',
    valores: [{ desde: '2026-10', valor: 4490, meioId: 'c6-credito' }, { desde: '2026-11', valor: 4490 }] };
  const occ = E.expandir({ meios: T.meios, itens: [], recorrentes: [rec] }, '2026-10', '2026-12', '2026-10-23');
  const oct = occ.find((o) => o.comp === '2026-10'), nov = occ.find((o) => o.comp === '2026-11');
  assert.deepEqual([oct.meioId, oct.fatura, oct.data], ['c6-credito', '2026-11', '2026-10-10']);
  assert.deepEqual([nov.meioId, nov.fatura], ['inter-credito', '2026-12']);
  assert.equal(E.meioRecorrente({ ...rec, excecoes: { '2026-12': { meioId: 'boleto' } } }, '2026-12'), 'boleto');
});
