/* Todo dIA — categorias padrão e dicionário de classificação (genéricos; dados pessoais ficam só na planilha) */
const Taxonomy = (() => {
  const S = (id, nome, extra = {}) => ({ id, nome, ...extra });
  const categorias = [
    { id: 'alimentacao', nome: 'Alimentação', tipo: 'despesa', cor: 1, subs: [
      S('supermercado', 'Supermercado'), S('acougue', 'Açougue e hortifrúti'), S('padaria', 'Padaria'),
      S('restaurante', 'Restaurante'), S('delivery', 'Delivery'), S('cafe', 'Café e lanches') ] },
    { id: 'transporte', nome: 'Transporte', tipo: 'despesa', subs: [
      S('combustivel', 'Combustível'), S('manutencao', 'Manutenção'), S('pecas', 'Peças e acessórios'),
      S('seguro-carro', 'Seguro do carro'), S('seguro-moto', 'Seguro da moto'), S('estacionamento', 'Estacionamento e pedágio'),
      S('apps', 'Uber, 99 e táxi'), S('lavagem', 'Lavagem'), S('ipva', 'IPVA e licenciamento'), S('multas', 'Multas') ] },
    { id: 'casa', nome: 'Casa', tipo: 'despesa', subs: [
      S('condominio', 'Condomínio'), S('energia', 'Energia'), S('agua', 'Água'), S('internet', 'Internet'), S('gas', 'Gás'),
      S('faxina', 'Faxina'), S('reparos', 'Manutenção e reparos'), S('utilidades', 'Utilidades e decoração'),
      S('limpeza', 'Produtos de limpeza') ] },
    { id: 'saude', nome: 'Saúde', tipo: 'despesa', subs: [
      S('farmacia', 'Farmácia'), S('consultas', 'Consultas'), S('exames', 'Exames'), S('odonto', 'Dentista'),
      S('psicologia', 'Psicologia'), S('plano', 'Plano de saúde') ] },
    { id: 'bemestar', nome: 'Bem-estar e esporte', tipo: 'despesa', subs: [
      S('academia', 'Academia'), S('natacao', 'Natação'), S('clube', 'Clube'),
      S('cuidados', 'Cuidados pessoais'), S('esporte', 'Equipamentos esportivos') ] },
    { id: 'lazer', nome: 'Lazer', tipo: 'despesa', subs: [
      S('bares', 'Bares'), S('passeios', 'Passeios, cinema e shows'), S('viagens', 'Viagens'), S('hobbies', 'Hobbies') ] },
    { id: 'assinaturas', nome: 'Assinaturas', tipo: 'despesa', subs: [
      S('streaming', 'Streaming'), S('ia', 'Inteligência artificial'), S('apps', 'Apps e nuvem'), S('telefonia', 'Celular') ] },
    { id: 'compras', nome: 'Compras', tipo: 'despesa', subs: [
      S('vestuario', 'Roupas e calçados'), S('eletronicos', 'Eletrônicos'), S('online', 'Compras online'),
      S('presentes', 'Presentes'), S('diversos', 'Diversos') ] },
    { id: 'educacao', nome: 'Educação', tipo: 'despesa', subs: [
      S('cursos', 'Cursos'), S('livros', 'Livros'), S('material', 'Material') ] },
    { id: 'familia', nome: 'Família', tipo: 'despesa', subs: [
      S('pais', 'Pais'), S('repasses', 'Repasses à família'), S('outros', 'Outros familiares') ] },
    { id: 'imoveis', nome: 'Imóveis de renda', tipo: 'despesa', subs: [
      S('manutencao', 'Manutenção'), S('airbnb', 'Custos do Airbnb'), S('taxas', 'Taxas e impostos') ] },
    { id: 'financeiro', nome: 'Taxas e impostos', tipo: 'despesa', subs: [
      S('tarifas', 'Tarifas e anuidades'), S('juros', 'Juros e IOF'), S('impostos', 'Impostos') ] },
    { id: 'pets', nome: 'Pets', tipo: 'despesa', subs: [ S('petshop', 'Pet shop'), S('veterinario', 'Veterinário') ] },
    { id: 'outros', nome: 'Outros', tipo: 'despesa', subs: [ S('indefinido', 'Indefinido'), S('doacoes', 'Doações') ] },
    { id: 'ressarcimentos', nome: 'Ressarcimentos', tipo: 'ressarcimento', subs: [ S('familia', 'Família'), S('outros', 'Outros') ] },
    { id: 'renda', nome: 'Renda', tipo: 'receita', subs: [
      S('salario', 'Salário'), S('aluguel', 'Aluguel'), S('airbnb', 'Airbnb'), S('outras', 'Outras entradas') ] },
  ];

  const E = (k, c, s) => ({ k, c, s });
  const dicionario = [
    E(['supernosso', 'super nosso', 'verdemar', 'epa', 'bh supermercados', 'supermercados bh', 'carrefour', 'assai', 'atacadao',
      'mart minas', 'apoio mineiro', 'pao de acucar', 'mercado', 'supermercado', 'super', 'mercearia', 'sams club',
      'dia supermercado', 'villefort'], 'alimentacao', 'supermercado'),
    E(['acougue', 'casa de carnes', 'casa de carne', 'frigorifico', 'sacolao', 'hortifruti', 'feira', 'verdurao', 'peixaria',
      'carne', 'carnes', 'frutas', 'verduras'], 'alimentacao', 'acougue'),
    E(['padaria', 'panificadora', 'pao', 'paes', 'confeitaria'], 'alimentacao', 'padaria'),
    E(['restaurante', 'almoco', 'jantar', 'self service', 'churrascaria', 'pizzaria', 'pizza', 'rodizio', 'marmita',
      'marmitex', 'japones', 'sushi', 'comida'], 'alimentacao', 'restaurante'),
    E(['ifood', 'rappi', 'ze delivery', 'delivery', 'aiqfome', 'entrega comida'], 'alimentacao', 'delivery'),
    E(['cafe', 'cafeteria', 'starbucks', 'lanche', 'lanchonete', 'mcdonalds', 'mc donalds', 'burger king', 'bk', 'subway',
      'sorvete', 'sorveteria', 'acai', 'doceria', 'doce', 'hamburguer', 'hamburgueria', 'salgado', 'pastel', 'coxinha',
      'cafe com pao', 'cafezinho'], 'alimentacao', 'cafe'),
    E(['gasolina', 'etanol', 'alcool', 'diesel', 'combustivel', 'posto', 'ipiranga', 'shell', 'petrobras', 'br mania',
      'abastec*', 'gnv'], 'transporte', 'combustivel'),
    E(['oficina', 'mecanico', 'revisao', 'troca de oleo', 'oleo', 'pneu', 'pneus', 'borracharia', 'alinhamento',
      'balanceamento', 'bateria', 'freio', 'embreagem', 'funilaria'], 'transporte', 'manutencao'),
    E(['moto acessorio', 'moto acessorios', 'acessorio', 'acessorios', 'capacete', 'pecas', 'autopecas', 'motopecas',
      'jaqueta moto', 'luva moto', 'bau', 'retrovisor'], 'transporte', 'pecas'),
    E(['seguro carro', 'seguro do carro'], 'transporte', 'seguro-carro'),
    E(['seguro moto', 'seguro da moto'], 'transporte', 'seguro-moto'),
    E(['estacionamento', 'pedagio', 'sem parar', 'conectcar', 'veloe', 'rotativo', 'zona azul', 'parking', 'estapar'],
      'transporte', 'estacionamento'),
    E(['uber', '99', '99pop', '99 pop', 'taxi', 'cabify', 'indriver'], 'transporte', 'apps'),
    E(['lava jato', 'lavajato', 'lavagem', 'lava rapido', 'estetica automotiva'], 'transporte', 'lavagem'),
    E(['ipva', 'licenciamento', 'detran', 'dpvat', 'emplacamento'], 'transporte', 'ipva'),
    E(['multa', 'multas', 'dnit', 'infracao'], 'transporte', 'multas'),
    E(['condominio'], 'casa', 'condominio'),
    E(['cemig', 'energia', 'luz', 'conta de luz'], 'casa', 'energia'),
    E(['copasa', 'agua', 'conta de agua'], 'casa', 'agua'),
    E(['internet', 'blink', 'blinktelecom', 'blink telecom', 'vivo fibra', 'claro net', 'oi fibra', 'net virtua'], 'casa', 'internet'),
    E(['gas', 'botijao', 'ultragaz', 'liquigas', 'supergasbras', 'copagaz'], 'casa', 'gas'),
    E(['faxina', 'diarista', 'faxineira'], 'casa', 'faxina'),
    E(['eletricista', 'encanador', 'pedreiro', 'reparo', 'conserto', 'chaveiro', 'marceneiro', 'pintor', 'dedetizacao',
      'material de construcao', 'leroy', 'leroy merlin', 'ferragista', 'ferragem'], 'casa', 'reparos'),
    E(['tok stok', 'tokstok', 'camicado', 'utensilio', 'utensilios', 'decoracao', 'cama mesa', 'havan', 'utilidades'], 'casa', 'utilidades'),
    E(['produtos de limpeza', 'limpeza', 'detergente', 'sabao'], 'casa', 'limpeza'),
    E(['farmacia', 'drogaria', 'araujo', 'drogaria araujo', 'drogasil', 'pacheco', 'raia', 'droga raia', 'droga clara',
      'pague menos', 'remedio', 'remedios', 'medicamento'], 'saude', 'farmacia'),
    E(['medico', 'medica', 'consulta', 'clinica', 'pediatra', 'dermatologista', 'ortopedista', 'oftalmologista', 'cardiologista'],
      'saude', 'consultas'),
    E(['exame', 'exames', 'laboratorio', 'hermes pardini', 'pardini', 'sabin', 'ultrassom', 'raio x', 'ressonancia'], 'saude', 'exames'),
    E(['dentista', 'odonto', 'odontologia', 'ortodontista', 'aparelho dental'], 'saude', 'odonto'),
    E(['psicologo', 'psicologa', 'psicologia', 'terapia', 'terapeuta'], 'saude', 'psicologia'),
    E(['unimed', 'hapvida', 'plano de saude', 'ipsemg', 'amil', 'bradesco saude'], 'saude', 'plano'),
    E(['academia', 'wellhub', 'gympass', 'smart fit', 'smartfit', 'bodytech', 'crossfit', 'personal'], 'bemestar', 'academia'),
    E(['natacao', 'aqualita', 'piscina'], 'bemestar', 'natacao'),
    E(['clube'], 'bemestar', 'clube'),
    E(['barbearia', 'barbeiro', 'cabelo', 'corte de cabelo', 'salao', 'manicure', 'perfume', 'perfumaria', 'boticario',
      'natura', 'cosmetico', 'cosmeticos', 'massagem'], 'bemestar', 'cuidados'),
    E(['decathlon', 'centauro', 'artigo esportivo', 'chuteira', 'bicicleta', 'bike'], 'bemestar', 'esporte'),
    E(['bar', 'boteco', 'buteco', 'cerveja', 'chopp', 'chope', 'choperia', 'drinks', 'balada'], 'lazer', 'bares'),
    E(['cinema', 'cinemark', 'ingresso', 'ingressos', 'show', 'teatro', 'sympla', 'museu', 'parque', 'passeio', 'festa'], 'lazer', 'passeios'),
    E(['hotel', 'pousada', 'booking', 'passagem', 'passagens', 'latam', 'gol linhas', 'azul linhas', 'rodoviaria',
      'viagem', 'hospedagem', 'decolar'], 'lazer', 'viagens'),
    E(['netflix', 'disney', 'disney plus', 'globoplay', 'amazon prime', 'prime video', 'amazon digital', 'spotify', 'deezer',
      'youtube premium', 'hbo', 'hbo max', 'paramount', 'apple tv', 'star plus', 'premiere', 'telecine', 'crunchyroll'],
      'assinaturas', 'streaming'),
    E(['chatgpt', 'openai', 'claude', 'anthropic', 'gemini', 'copilot', 'midjourney', 'perplexity'], 'assinaturas', 'ia'),
    E(['google one', 'icloud', 'apple', 'microsoft 365', 'office 365', 'dropbox', 'canva', 'google storage', 'app store',
      'google play'], 'assinaturas', 'apps'),
    E(['celular', 'recarga', 'claro', 'vivo', 'tim', 'plano celular'], 'assinaturas', 'telefonia'),
    E(['roupa', 'roupas', 'renner', 'riachuelo', 'c a', 'cea', 'zara', 'hering', 'tenis', 'sapato', 'calcado', 'camisa',
      'calca', 'netshoes', 'nike', 'adidas'], 'compras', 'vestuario'),
    E(['eletronico', 'eletronicos', 'fone', 'notebook', 'computador', 'kabum', 'magalu', 'magazine luiza', 'fast shop',
      'carregador', 'cabo usb', 'tv', 'tablet', 'samsung'], 'compras', 'eletronicos'),
    E(['mercado livre', 'mercadolivre', 'mercado pago', 'shopee', 'amazon', 'aliexpress', 'shein', 'temu'], 'compras', 'online'),
    E(['presente', 'presentes', 'lembrancinha', 'aniversario'], 'compras', 'presentes'),
    E(['curso', 'cursos', 'udemy', 'alura', 'faculdade', 'pos graduacao', 'mensalidade escola', 'inscricao', 'concurso'], 'educacao', 'cursos'),
    E(['livro', 'livros', 'livraria', 'kindle', 'leitura'], 'educacao', 'livros'),
    E(['papelaria', 'caderno', 'material escolar', 'impressao', 'xerox'], 'educacao', 'material'),
    E(['enxoval airbnb', 'faxina airbnb', 'limpeza airbnb', 'taxa airbnb'], 'imoveis', 'airbnb'),
    E(['iptu', 'taxa de lixo'], 'imoveis', 'taxas'),
    E(['tarifa', 'tarifas', 'anuidade', 'cesta de servicos', 'pacote de servicos'], 'financeiro', 'tarifas'),
    E(['juros', 'iof', 'multa atraso', 'encargos', 'rotativo cartao'], 'financeiro', 'juros'),
    E(['imposto de renda', 'darf', 'irpf', 'carne leao', 'imposto'], 'financeiro', 'impostos'),
    E(['petshop', 'pet shop', 'petz', 'cobasi', 'racao', 'banho e tosa'], 'pets', 'petshop'),
    E(['veterinario', 'veterinaria', 'vet'], 'pets', 'veterinario'),
    E(['doacao', 'doacoes', 'dizimo', 'oferta', 'vaquinha'], 'outros', 'doacoes'),
    E(['salario', 'vencimentos', 'contracheque', 'ferias', '13o', 'decimo terceiro'], 'renda', 'salario'),
    E(['aluguel', 'aluguel recebido', 'inquilino'], 'renda', 'aluguel'),
    E(['airbnb', 'hospede', 'reserva airbnb'], 'renda', 'airbnb'),
  ];

  // Formas de pagamento iniciais (editáveis em Ajustes)
  const meios = [
    { id: 'credito', nome: 'Cartão de crédito', banco: 'Cartão', tipo: 'credito', fechamento: 1, vencimento: 10, cor: '#12866B', ordem: 1 },
    { id: 'pix', nome: 'Pix', banco: 'Conta', tipo: 'pix', ordem: 2 },
    { id: 'debito', nome: 'Débito', banco: 'Conta', tipo: 'debito', ordem: 3 },
    { id: 'boleto', nome: 'Boleto', banco: 'Conta', tipo: 'boleto', ordem: 4 },
    { id: 'dinheiro', nome: 'Dinheiro', banco: 'Carteira', tipo: 'dinheiro', ordem: 5 },
  ];

  return { categorias, dicionario, meios };
})();
if (typeof module !== 'undefined') module.exports = Taxonomy;
