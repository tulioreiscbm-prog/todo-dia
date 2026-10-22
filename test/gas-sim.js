// Simulador mínimo do Google Apps Script para testar apps-script/Codigo.gs localmente.
// Uso: node test/gas-sim.js [porta] [arquivos .gs extras...]  -> servidor HTTP que imita o App da Web.
const fs = require('fs');
const vm = require('vm');
const http = require('http');
const path = require('path');

function criarAmbiente() {
  const sheets = new Map();
  const props = new Map();
  const logs = [];
  function Sheet(nome) {
    this.nome = nome; this.data = [];
    const self = this;
    const ensure = (r, c) => { while (self.data.length < r) self.data.push([]); for (const row of self.data) while (row.length < c) row.push(''); };
    this.getName = () => nome;
    this.getMaxRows = () => Math.max(1000, self.data.length);
    this.getDataRange = () => ({ getValues: () => (self.data.length ? self.data.map((r) => r.slice()) : [[]]) });
    this.getRange = (r, c, nr = 1, nc = 1) => ({
      getValues: () => { ensure(r + nr - 1, c + nc - 1); return self.data.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)); },
      setValues: (vals) => { ensure(r + nr - 1, c + nc - 1); vals.forEach((row, i) => row.forEach((v, j) => { self.data[r - 1 + i][c - 1 + j] = v; })); return this; },
      setNumberFormat() { return this; }, setFontWeight() { return this; }, setFontSize() { return this; }, setFontFamily() { return this; }, setBackground() { return this; },
    });
    this.appendRow = (row) => { self.data.push(row.slice()); };
    this.deleteRow = (r) => { self.data.splice(r - 1, 1); };
    this.setFrozenRows = () => {}; this.clear = () => { self.data = []; }; this.setColumnWidth = () => {};
  }
  const ss = {
    getSheetByName: (n) => sheets.get(n) || null,
    insertSheet: (n) => { const s = new Sheet(n); sheets.set(n, s); return s; },
    getUrl: () => 'https://docs.google.com/spreadsheets/d/TESTE/edit', getId: () => 'TESTE',
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {}, getUi: () => { throw new Error('sem UI'); } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, String(v)) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ text: t, setMimeType() { return this; } }) },
    Utilities: { getUuid: () => require('crypto').randomUUID(), formatDate: (d) => d.toISOString().slice(0, 10) },
    Session: { getScriptTimeZone: () => 'America/Sao_Paulo' },
    Logger: { log: (m) => logs.push(String(m)) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ onWeekDay: () => ({ atHour: () => ({ create: () => {} }) }) }) }), WeekDay: { SUNDAY: 'SUNDAY' } },
    DriveApp: {}, console,
  };
  vm.createContext(ctx);
  return { ctx, sheets, props, logs };
}

function carregar(arquivos) {
  const amb = criarAmbiente();
  for (const f of arquivos) vm.runInContext(fs.readFileSync(f, 'utf8'), amb.ctx, { filename: f });
  return amb;
}

if (require.main === module) {
  const porta = Number(process.argv[2] || 8787);
  const extras = process.argv.slice(3);
  const amb = carregar([path.join(__dirname, '../apps-script/Codigo.gs'), ...extras]);
  const chave = vm.runInContext('instalar()', amb.ctx);
  amb.props.set('CHAVE', 'chave-de-teste-1234567890');
  const srv = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/__estado') { res.end(JSON.stringify(Object.fromEntries([...amb.sheets].map(([k, s]) => [k, s.data])))); return; }
      if (url.pathname === '/__falhar') { amb.falhar = url.searchParams.get('v') === '1'; res.end('ok'); return; }
      if (amb.falhar) { req.socket.destroy(); return; }
      amb.ctx.__e = req.method === 'POST' ? { postData: { contents: body } } : { parameter: Object.fromEntries(url.searchParams) };
      const out = vm.runInContext(req.method === 'POST' ? 'doPost(__e)' : 'doGet(__e)', amb.ctx);
      res.setHeader('Content-Type', 'application/json');
      setTimeout(() => res.end(out.text), 60);
    });
  });
  srv.listen(porta, () => console.log('gas-sim ouvindo em', porta, 'chave de instalação gerada:', !!chave));
}
module.exports = { carregar };
