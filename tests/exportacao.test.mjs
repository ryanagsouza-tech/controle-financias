// Testes de exportação (backup e CSV), importação e sugestões de categoria.
import { els, elemento, cats, janela, radios } from './auxiliar.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { mesDoCalendario, acharSugestao } = await import('../js/calculos.js');
const a = await import('../js/acoes.js');
const { hojeISO } = await import('../js/util.js');

const A = new Date().getFullYear(), M = new Date().getMonth() + 1;
const p2 = n => String(n).padStart(2, '0');
// Espera o trabalho assíncrono da importação terminar (sem depender de temporizador)
const aguardar = async (condicao = () => false, voltas = 60) => { for (let i = 0; i < voltas && !condicao(); i++) await new Promise(r => setImmediate(r)); };
let baixado = null;
globalThis.Blob = class { constructor(p, o) { this.conteudo = p[0]; this.tipo = o && o.type; } };
globalThis.URL = Object.assign(URL, { createObjectURL: b => { baixado = b; return 'blob:x'; }, revokeObjectURL() {} });
const lanc = (id, cat, valor, extra = {}) => ({ id, data: `${A}-${p2(M)}-05`, categoriaId: cat, descricao: 'x', valor, pagamento: '', grupo: null, parcela: '', fixaId: '', compra: '', ...extra });

beforeEach(() => {
    S.renderizar = () => {};
    S.estado = migrar({ versao: 7, saldoInicial: 100000, categorias: cats, contasFixas: [], meses: [] });
    baixado = null; janela.respostas = []; janela.avisos = []; janela.textos = [];
});

test('backup: baixa um JSON da versão atual e registra a data do backup', () => {
    mesDoCalendario(A, M).receitas.push({ id: 'r', descricao: 'Salário', valor: 500000, fixaId: '' });
    a.exportarDados();
    assert.equal(baixado.tipo, 'application/json');
    const dados = JSON.parse(baixado.conteudo);
    assert.equal(dados.versao, 7);
    assert.equal(dados.saldoInicial, 100000);
    assert.equal(dados.ultimoBackup, hojeISO());
    assert.equal(S.estado.ultimoBackup, hojeISO());
});

test('o backup baixado volta idêntico quando importado', async () => {
    const mes = mesDoCalendario(A, M);
    mes.lancamentos.push(lanc('l', 'Lazer', 4590, { descricao: 'Cinema', pagamento: 'pix' }));
    a.exportarDados();
    const conteudo = baixado.conteudo;
    S.estado = migrar({ versao: 7, categorias: cats, meses: [] });
    globalThis.FileReader = class { readAsText() { this.onload({ target: { result: conteudo } }); } };
    await a.importarDados('', { files: [{ size: conteudo.length }], value: 'x' });
    await aguardar(() => S.estado.meses.some(m => m.lancamentos.length));
    const l = S.estado.meses.flatMap(m => m.lancamentos)[0];
    assert.equal(l.valor, 4590);
    assert.equal(l.descricao, 'Cinema');
    assert.equal(S.estado.saldoInicial, 100000);
});

test('importar um backup do formato antigo (lista de meses) converte para centavos', async () => {
    const antigo = JSON.stringify([{ id: 'nov_2026', nome: 'Novembro / 2026', salario: 100.5, lancamentos: [{ data: '2026-11-02', categoria: 'Lazer', descricao: 'x', valor: 10.25 }] }]);
    globalThis.FileReader = class { readAsText() { this.onload({ target: { result: antigo } }); } };
    await a.importarDados('', { files: [{ size: antigo.length }], value: 'x' });
    await aguardar(() => S.estado.meses.some(m => m.receitas.length));
    assert.equal(S.estado.meses[0].receitas[0].valor, 10050);
    assert.equal(S.estado.meses[0].lancamentos[0].valor, 1025);
});

test('cancelar a restauração não troca os dados', async () => {
    const antes = JSON.stringify(S.estado);
    janela.respostas = [false];
    const bom = JSON.stringify({ versao: 7, meses: [{ id: 'x', ano: 2026, mes: 1, receitas: [], lancamentos: [] }] });
    globalThis.FileReader = class { readAsText() { this.onload({ target: { result: bom } }); } };
    await a.importarDados('', { files: [{ size: bom.length }], value: 'x' });
    await aguardar(() => janela.textos.length > 0);
    await aguardar();
    assert.equal(JSON.stringify(S.estado), antes);
});

test('arquivo que não é JSON mostra erro e não troca os dados', async () => {
    const antes = JSON.stringify(S.estado);
    globalThis.FileReader = class { readAsText() { this.onload({ target: { result: 'isto não é json' } }); } };
    await a.importarDados('', { files: [{ size: 10 }], value: 'x' });
    await aguardar(() => janela.avisos.length > 0);
    assert.equal(JSON.stringify(S.estado), antes);
    assert.ok(janela.avisos.some(t => /JSON/.test(t)));
});

test('sem arquivo escolhido a importação não faz nada', async () => {
    await a.importarDados('', { files: [], value: '' });
    await a.importarDados('', null);
    assert.equal(janela.avisos.length, 0);
});

test('CSV: cabeçalho com a data da compra, valores em reais e campos entre aspas', () => {
    const mes = mesDoCalendario(A, M);
    mes.receitas.push({ id: 'r', descricao: 'Salário "bruto"', valor: 500000, fixaId: '' });
    mes.lancamentos.push(lanc('c', 'Alimentacao', 4000, { descricao: 'Pizza', pagamento: 'credito', compra: `${A}-${p2(M)}-01` }));
    a.exportarCSV();
    const linhas = baixado.conteudo.replace('\ufeff', '').split('\r\n');
    assert.equal(linhas[0], '"Mês";"Data";"Compra";"Tipo";"Categoria";"Pagamento";"Descrição";"Valor"');
    assert.ok(linhas[1].includes('"Receita"') && linhas[1].includes('"Salário ""bruto"""') && linhas[1].includes('"5000,00"'));
    assert.ok(linhas[2].includes(`"01/${p2(M)}/${A}"`) && linhas[2].includes('"Crédito"') && linhas[2].includes('"40,00"'));
    assert.ok(baixado.conteudo.startsWith('\ufeff'), 'tem BOM para o Excel abrir os acentos');
});

test('sugestão: usa a categoria e a forma de pagamento da última vez', () => {
    const m = mesDoCalendario(A, M);
    m.lancamentos.push(lanc('a', 'Lazer', 1000, { descricao: 'Padaria', pagamento: 'debito', data: `${A}-${p2(M)}-02` }));
    m.lancamentos.push(lanc('b', 'Alimentacao', 1200, { descricao: 'padaria ', pagamento: 'pix', data: `${A}-${p2(M)}-09` }));
    assert.deepEqual(acharSugestao('PADARIA'), { categoriaId: 'Alimentacao', pagamento: 'pix' });
    assert.equal(acharSugestao('algo novo'), null);
    assert.equal(acharSugestao('   '), null);
});

test('sugestão ignora o sufixo de parcela (1/3)', () => {
    mesDoCalendario(A, M).lancamentos.push(lanc('a', 'Lazer', 1000, { descricao: 'TV (2/3)', pagamento: 'credito' }));
    assert.equal(acharSugestao('TV').categoriaId, 'Lazer');
});

test('sugerirCategoria marca a categoria e o pagamento no formulário do mês', () => {
    const mes = mesDoCalendario(A, M);
    mes.lancamentos.push(lanc('a', 'Lazer', 1000, { descricao: 'Cinema', pagamento: 'pix' }));
    els['novoDesc_' + mes.id] = Object.assign(elemento(), { value: 'cinema' });
    els['boxParcelas_' + mes.id] = elemento();
    a.sugerirCategoria(mes.id);
    assert.equal(radios['novoCat_' + mes.id], 'Lazer');
    assert.equal(radios['novaPag_' + mes.id], 'pix');
});
