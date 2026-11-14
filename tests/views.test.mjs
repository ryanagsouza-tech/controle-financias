// Testes das telas: o que aparece para o usuário em cada situação.
import './auxiliar.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { achaMes, mesDoCalendario } = await import('../js/calculos.js');
const views = await import('../js/views.js');
const { cats } = await import('./auxiliar.mjs');

const agora = new Date();
const A = agora.getFullYear(), M = agora.getMonth() + 1;
const p2 = n => String(n).padStart(2, '0');
const idMes = (a, m) => `m_${a}_${p2(m)}`;
const lanc = (id, cat, valor, extra = {}) => ({ id, data: `${A}-${p2(M)}-05`, categoriaId: cat, descricao: 'x', valor, pagamento: '', grupo: null, parcela: '', fixaId: '', ...extra });

beforeEach(() => {
    S.estado = migrar({ versao: 6, saldoInicial: 0, categorias: cats, contasFixas: [], meses: [] });
    S.filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
});

test('mês compara cada categoria com o mês anterior', () => {
    const ant = mesDoCalendario(M === 1 ? A - 1 : A, M === 1 ? 12 : M - 1);
    ant.lancamentos.push(lanc('a', 'Alimentacao', 20000, { data: `${ant.ano}-${p2(ant.mes)}-05` }));
    const atual = mesDoCalendario(A, M);
    atual.lancamentos.push(lanc('b', 'Alimentacao', 30000));
    const html = views.viewMes(atual);
    assert.match(html, /▲ 50% vs mês anterior/);
});

test('categoria sem gasto no mês anterior mostra que é novo', () => {
    mesDoCalendario(M === 1 ? A - 1 : A, M === 1 ? 12 : M - 1);
    const atual = mesDoCalendario(A, M);
    atual.lancamentos.push(lanc('b', 'Lazer', 1000));
    assert.match(views.viewMes(atual), /Sem gasto no mês anterior/);
});

test('mês sem anterior não mostra comparação', () => {
    const atual = mesDoCalendario(A, M);
    atual.lancamentos.push(lanc('b', 'Lazer', 1000));
    assert.ok(!views.viewMes(atual).includes('vs mês anterior'));
});

test('resumo por forma de pagamento soma o crédito do mês', () => {
    const m = mesDoCalendario(A, M);
    m.lancamentos.push(lanc('a', 'Lazer', 10000, { pagamento: 'credito' }), lanc('b', 'Lazer', 5000, { pagamento: 'credito' }), lanc('c', 'Lazer', 2000, { pagamento: 'pix' }), lanc('d', 'Lazer', 700));
    const html = views.resumoPagamento(m);
    assert.match(html, /Crédito/);
    assert.match(html, /R\$\u00a0150,00/);
    assert.match(html, /Pix/);
    assert.match(html, /Não informado/);
});

test('sem lançamentos não há resumo por pagamento', () => {
    assert.equal(views.resumoPagamento(mesDoCalendario(A, M)), '');
});

test('orçamento: avisa quando a categoria estoura o limite', () => {
    S.estado.categorias.find(c => c.id === 'Lazer').orcamento = 10000;
    const m = mesDoCalendario(A, M);
    m.lancamentos.push(lanc('a', 'Lazer', 15000));
    const html = views.viewMes(m);
    assert.match(html, /Estourou R\$\u00a050,00/);
    assert.match(html, /1 categoria passou do limite/);
});

test('lista: filtros por texto, categoria e forma de pagamento', () => {
    const m = mesDoCalendario(A, M);
    m.lancamentos.push(lanc('a', 'Lazer', 1000, { descricao: 'Cinema', pagamento: 'credito' }), lanc('b', 'Alimentacao', 2000, { descricao: 'Mercado', pagamento: 'pix' }));
    S.filtros.texto = 'cine';
    assert.ok(views.renderLista(m).includes('Cinema') && !views.renderLista(m).includes('Mercado'));
    S.filtros = { texto: '', cat: 'Alimentacao', pag: '', ordem: 'recentes' };
    assert.ok(views.renderLista(m).includes('Mercado') && !views.renderLista(m).includes('Cinema'));
    S.filtros = { texto: '', cat: '', pag: 'credito', ordem: 'recentes' };
    assert.ok(views.renderLista(m).includes('Cinema') && !views.renderLista(m).includes('Mercado'));
});

test('lista: estorno aparece em verde e série mostra as parcelas', () => {
    const m = mesDoCalendario(A, M);
    m.lancamentos.push(lanc('a', 'Lazer', -2000, { descricao: 'Estorno' }));
    assert.match(views.renderLista(m), /text-emerald-600">-?R\$/);
});

test('aviso de backup: discreto e adiável', () => {
    const m = mesDoCalendario(A, M);
    for (let i = 0; i < 12; i++) m.lancamentos.push(lanc('x' + i, 'Lazer', 100));
    S.estado.ultimoBackup = ''; S.estado.backupAdiadoAte = '';
    assert.match(views.avisoBackup(), /ainda não guardou/);
    S.estado.backupAdiadoAte = `${A + 1}-01-01`;
    assert.equal(views.avisoBackup(), '');
    S.estado.backupAdiadoAte = '';
    const antigo = new Date(Date.now() - 100 * 86400000);
    S.estado.ultimoBackup = `${antigo.getFullYear()}-${p2(antigo.getMonth() + 1)}-${p2(antigo.getDate())}`;
    assert.match(views.avisoBackup(), /dias/);
    const recente = new Date(Date.now() - 20 * 86400000);
    S.estado.ultimoBackup = `${recente.getFullYear()}-${p2(recente.getMonth() + 1)}-${p2(recente.getDate())}`;
    assert.equal(views.avisoBackup(), '');
});

test('poucos registros não geram aviso de backup', () => {
    mesDoCalendario(A, M).lancamentos.push(lanc('a', 'Lazer', 100));
    assert.equal(views.avisoBackup(), '');
});

test('visão geral: saldo só conta até o mês atual', () => {
    const atual = mesDoCalendario(A, M);
    atual.receitas.push({ id: 'r', descricao: 'Salário', valor: 500000, fixaId: '' });
    const futuro = mesDoCalendario(A + 1, 6);
    futuro.lancamentos.push(lanc('f', 'Lazer', 400000, { data: `${A + 1}-06-05` }));
    const html = views.viewGeral();
    assert.match(html, /R\$\u00a05\.000,00/, 'o gasto de um mês futuro não pode reduzir o saldo de hoje');
});

test('boas-vindas só aparecem com o app vazio', () => {
    mesDoCalendario(A, M);
    assert.match(views.viewGeral(), /Bem-vindo/);
    achaMes(idMes(A, M)).receitas.push({ id: 'r', descricao: 'Salário', valor: 100, fixaId: '' });
    assert.ok(!views.viewGeral().includes('Bem-vindo'));
});

test('contas fixas: totais separados de gasto e receita', () => {
    S.estado.contasFixas.push({ id: 'f1', descricao: 'Aluguel', valor: 120000, categoriaId: 'Lazer', tipo: 'gasto', dia: 5, inicio: '2026-01', fim: '', pagamento: '' });
    S.estado.contasFixas.push({ id: 'f2', descricao: 'Salário', valor: 400000, categoriaId: 'Lazer', tipo: 'receita', dia: 5, inicio: '2026-01', fim: '', pagamento: '' });
    const html = views.viewFixas();
    assert.match(html, /Gastos fixos por mês: R\$\u00a01\.200,00/);
    assert.match(html, /Receitas fixas por mês: R\$\u00a04\.000,00/);
});
