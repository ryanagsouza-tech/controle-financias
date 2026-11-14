// Testes das ações do usuário, com a tela simulada.
import { els, elemento, cats, janela } from './auxiliar.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { mesDoCalendario, achaMes } = await import('../js/calculos.js');
const ui = await import('../js/ui.js');
const a = await import('../js/acoes.js');

const hoje = new Date();
const A = hoje.getFullYear(), M = hoje.getMonth() + 1;
const p2 = n => String(n).padStart(2, '0');
const dia = d => `${A}-${p2(M)}-${p2(d)}`;

S.renderizar = () => {};

function campo(id, valor) { els[id] = els[id] || elemento(); els[id].value = valor; }

beforeEach(() => {
    S.estado = migrar({ versao: 6, saldoInicial: 0, categorias: cats, contasFixas: [], meses: [] });
    mesDoCalendario(A, M);
    janela.respostas = []; janela.avisos = []; janela.textos = [];
    S.desfazerSnap = null;
});

const mes = () => achaMes(`m_${A}_${p2(M)}`);

async function lancar(desc, valor, extra = {}) {
    const id = mes().id;
    campo('novaData_' + id, extra.data || dia(10)); campo('novoCat_' + id, extra.cat || 'Lazer');
    campo('novoDesc_' + id, desc); campo('novoValor_' + id, valor);
    campo('novaPag_' + id, extra.pag || ''); campo('novaParc_' + id, extra.parc || '1');
    a.adicionarLanc(id);
}

test('adicionar lançamento grava em centavos', async () => {
    await lancar('Cinema', '45,90');
    assert.equal(mes().lancamentos[0].valor, 4590);
});

test('valor zero é recusado e estorno (negativo) é aceito', async () => {
    await lancar('Nada', '0');
    assert.equal(mes().lancamentos.length, 0);
    await lancar('Estorno', '-20');
    assert.equal(mes().lancamentos[0].valor, -2000);
});

test('estorno não pode ser parcelado', async () => {
    await lancar('Estorno', '-100', { pag: 'credito', parc: '3' });
    assert.equal(mes().lancamentos.length, 0);
});

test('data fora do mês é recusada', async () => {
    await lancar('Fora', '10', { data: `${A + 1}-01-05` });
    assert.equal(mes().lancamentos.length, 0);
});

test('forma de pagamento sem parcelas ignora o campo de parcelas', async () => {
    await lancar('Lanche', '25,90', { pag: 'pix', parc: '5' });
    assert.equal(mes().lancamentos.length, 1);
});

test('compra no crédito em 3x cria as parcelas nos meses seguintes', async () => {
    await lancar('TV', '1000', { pag: 'credito', parc: '3', data: dia(1) });
    const todas = S.estado.meses.flatMap(m => m.lancamentos).filter(l => l.descricao.startsWith('TV'));
    assert.equal(todas.length, 3);
    assert.equal(todas.reduce((s, l) => s + l.valor, 0), 100000);
});

test('excluir lançamento não pede confirmação e dá para desfazer', async () => {
    await lancar('Cinema', '45,90');
    const id = mes().lancamentos[0].id;
    await a.removerLanc(mes().id, id);
    assert.equal(mes().lancamentos.length, 0);
    assert.ok(S.desfazerSnap, 'guardou o ponto para desfazer');
    ui.desfazer();
    assert.equal(mes().lancamentos.length, 1);
});

test('categoria em uso não pode ser excluída', async () => {
    await lancar('Cinema', '10');
    await a.removerCategoria('Lazer');
    assert.ok(S.estado.categorias.some(c => c.id === 'Lazer'));
});

test('receita: valor zero é recusado e receita válida é gravada em centavos', () => {
    const id = mes().id;
    campo('recDesc_' + id, 'Salário'); campo('recVal_' + id, '0');
    a.adicionarReceita(id);
    assert.equal(mes().receitas.length, 0);
    campo('recVal_' + id, '4000,50');
    a.adicionarReceita(id);
    assert.equal(mes().receitas[0].valor, 400050);
});

test('conta fixa de gasto: entra no mês, propaga a mudança e some ao excluir', async () => {
    ['fixaTipo', 'fixaDesc', 'fixaValor', 'fixaDia', 'fixaCat', 'fixaPag', 'fixaInicio', 'fixaFim'].forEach(i => campo(i, ''));
    campo('fixaTipo', 'gasto'); campo('fixaDesc', 'Aluguel'); campo('fixaValor', '1200'); campo('fixaDia', '5');
    campo('fixaCat', 'Lazer'); campo('fixaInicio', `${A}-${p2(M)}`);
    a.adicionarFixa();
    assert.equal(mes().lancamentos.filter(l => l.fixaId).length, 1);
    const f = S.estado.contasFixas[0];
    a.editarFixa(f.id, 'valor', '1300');
    assert.equal(mes().lancamentos.find(l => l.fixaId).valor, 130000);
    janela.respostas = [true, true];
    await a.removerFixa(f.id);
    assert.equal(S.estado.contasFixas.length, 0);
    assert.equal(mes().lancamentos.filter(l => l.fixaId).length, 0);
});

test('receita fixa entra em receitas, não em lançamentos', () => {
    ['fixaTipo', 'fixaDesc', 'fixaValor', 'fixaDia', 'fixaCat', 'fixaPag', 'fixaInicio', 'fixaFim'].forEach(i => campo(i, ''));
    campo('fixaTipo', 'receita'); campo('fixaDesc', 'Salário'); campo('fixaValor', '4000'); campo('fixaDia', '5'); campo('fixaInicio', `${A}-${p2(M)}`);
    a.adicionarFixa();
    assert.equal(mes().receitas.filter(r => r.fixaId).length, 1);
    assert.equal(mes().lancamentos.length, 0);
});

test('lançamento rápido cria o mês se ele não existir', () => {
    ['rapCat', 'rapPag', 'rapValor', 'rapDesc', 'rapData', 'rapParc', 'rapErro'].forEach(i => campo(i, ''));
    campo('rapValor', '10'); campo('rapDesc', 'Café'); campo('rapCat', 'Lazer'); campo('rapPag', 'pix'); campo('rapParc', '1');
    campo('rapData', `${A + 1}-03-02`);
    a.salvarRapido();
    const m = achaMes(`m_${A + 1}_03`);
    assert.ok(m);
    assert.equal(m.lancamentos[0].valor, 1000);
});

test('lançamento rápido valida valor e descrição', () => {
    ['rapCat', 'rapPag', 'rapValor', 'rapDesc', 'rapData', 'rapParc', 'rapErro'].forEach(i => campo(i, ''));
    campo('rapValor', ''); campo('rapDesc', ''); campo('rapData', dia(2));
    const antes = S.estado.meses.length;
    a.salvarRapido();
    assert.equal(S.estado.meses.length, antes);
    assert.ok(els.rapErro.textContent.length > 0);
});

test('adicionar categoria sugerida só uma vez', () => {
    a.adicionarSugerida('Educacao');
    a.adicionarSugerida('Educacao');
    assert.equal(S.estado.categorias.filter(c => c.id === 'Educacao').length, 1);
});

test('definir saldo inicial grava em centavos', () => {
    a.definirSaldoInicial('1000,50');
    assert.equal(S.estado.saldoInicial, 100050);
});

test('importar backup inválido não mexe nos dados', async () => {
    const antes = JSON.stringify(S.estado);
    globalThis.FileReader = class { readAsText() { this.onload({ target: { result: '{"nada": 1}' } }); } };
    await a.importarDados('', { files: [{ size: 10 }], value: 'x' });
    await new Promise(r => globalThis.setTimeout(r, 0));
    assert.equal(JSON.stringify(S.estado), antes);
});

test('importar arquivo grande demais é recusado', async () => {
    const antes = JSON.stringify(S.estado);
    await a.importarDados('', { files: [{ size: 6 * 1024 * 1024 }], value: 'x' });
    assert.equal(JSON.stringify(S.estado), antes);
});

test('exportar CSV protege contra fórmula de planilha', async () => {
    await lancar('=HYPERLINK("http://x")', '10');
    let conteudo = '';
    globalThis.Blob = class { constructor(p) { conteudo = p[0]; } };
    globalThis.URL = Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL() {} });
    a.exportarCSV();
    assert.ok(conteudo.includes('"\'=HYPERLINK'), 'a fórmula deve começar com apóstrofo');
});
