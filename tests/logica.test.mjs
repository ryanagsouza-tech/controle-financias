// Testes de regressão da lógica de contas. Rodam sem navegador, com um IndexedDB simulado.
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Simulação mínima do navegador antes de importar os módulos
const store = {};
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.document = { getElementById: () => ({ classList: { add() {}, remove() {}, contains() { return false; } }, style: {}, dataset: {}, innerHTML: '', textContent: '', value: '', querySelector: () => null, setAttribute() {} }), querySelector: () => null, querySelectorAll: () => [], documentElement: { setAttribute() {} }, createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} }, addEventListener() {} };
globalThis.window = { innerWidth: 1200, matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {} };
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });
globalThis.location = { protocol: 'https:', hash: '' };

const { S } = await import('../js/estado.js');
const { migrar, validarBackup } = await import('../js/dados.js');
const { totais, acumulados, hojeChave, aplicarFixasTodos } = await import('../js/calculos.js');
const { centavos, reais, brl } = await import('../js/util.js');
const { gerarSerie, mesDoCalendario } = await import('../js/calculos.js');

const reset = () => { S.estado = migrar({ versao: 6, saldoInicial: 0, categorias: [{ id: 'Lazer', nome: 'Lazer', cor: '#10b981', tipo: 'gasto', orcamento: 0 }, { id: 'Investimentos', nome: 'Investimentos', cor: '#06b6d4', tipo: 'investimento', orcamento: 0 }], contasFixas: [], meses: [] }); };

test('valores em centavos: 0,10 + 0,20 = 0,30 exato', () => {
    assert.equal(centavos('0,10') + centavos('0,20'), 30);
    assert.equal(reais(30), '0.30');
    assert.equal(brl(30), 'R$\u00a00,30');
});

test('parcela de R$ 100,00 em 3x fecha exatamente, com a sobra na 1ª', () => {
    reset();
    gerarSerie('2026-11-30', 'Lazer', 'Tênis', 10000, 'credito', 3);
    const v = S.estado.meses.flatMap(m => m.lancamentos).map(l => l.valor);
    assert.deepEqual(v, [3334, 3333, 3333]);
    assert.equal(v.reduce((a, b) => a + b, 0), 10000);
});

test('parcela nunca cai em mês sem data e preserva o dia ajustado', () => {
    reset();
    gerarSerie('2026-01-31', 'Lazer', 'Compra', 9000, 'credito', 2);
    const datas = S.estado.meses.flatMap(m => m.lancamentos).map(l => l.data);
    assert.deepEqual(datas, ['2026-01-31', '2026-02-28']);
});

test('estorno (valor negativo) reduz o gasto do mês', () => {
    reset();
    const m = mesDoCalendario(2026, 11);
    m.lancamentos.push({ id: 'a', data: '2026-11-02', categoriaId: 'Lazer', descricao: 'Compra', valor: 5000, pagamento: '', grupo: null, parcela: '', fixaId: '' });
    m.lancamentos.push({ id: 'b', data: '2026-11-03', categoriaId: 'Lazer', descricao: 'Estorno', valor: -2000, pagamento: '', grupo: null, parcela: '', fixaId: '' });
    assert.equal(totais(m).gastos, 3000);
});

test('investimento não conta como gasto e entra no patrimônio', () => {
    reset();
    const m = mesDoCalendario(2026, 11);
    m.receitas.push({ id: 'r', descricao: 'Salário', valor: 100000 });
    m.lancamentos.push({ id: 'i', data: '2026-11-02', categoriaId: 'Investimentos', descricao: 'Tesouro', valor: 20000, pagamento: '', grupo: null, parcela: '', fixaId: '' });
    const t = totais(m);
    assert.equal(t.gastos, 0);
    assert.equal(t.invest, 20000);
    assert.equal(t.sobra, 80000);
});

test('saldo acumulado segue a data, não a ordem da barra lateral', () => {
    reset();
    const dez = mesDoCalendario(2026, 12);
    dez.receitas.push({ id: 'd', descricao: 'Extra', valor: 10000 });
    const nov = mesDoCalendario(2026, 11);
    nov.receitas.push({ id: 'n', descricao: 'Salário', valor: 50000 });
    S.estado.meses.reverse();
    const acc = acumulados();
    assert.equal(acc[nov.id].conta, 50000);
    assert.equal(acc[dez.id].conta, 60000);
});

test('conta fixa entra em todos os meses do período e não volta se apagada', () => {
    reset();
    S.estado.contasFixas.push({ id: 'f1', descricao: 'Aluguel', valor: 120000, categoriaId: 'Lazer', tipo: 'gasto', dia: 5, inicio: '2026-11', fim: '2026-12', pagamento: '' });
    mesDoCalendario(2026, 11); mesDoCalendario(2026, 12);
    aplicarFixasTodos();
    S.estado.meses.forEach(m => assert.equal(m.lancamentos.filter(l => l.fixaId === 'f1').length, 1));
    const dez = S.estado.meses.find(m => m.id === 'm_2026_12');
    dez.lancamentos = dez.lancamentos.filter(l => !l.fixaId);
    aplicarFixasTodos();
    assert.equal(dez.lancamentos.filter(l => l.fixaId === 'f1').length, 0);
});

test('migração de formato antigo (reais) converte para centavos', () => {
    const antigo = { versao: 2, saldoInicial: 1000.5, categorias: [{ id: 'Lazer', nome: 'Lazer', cor: '#10b981', tipo: 'gasto', orcamento: 150.25 }], meses: [{ id: 'nov_2026', ano: 2026, mes: 11, nome: 'Novembro / 2026', receitas: [{ id: 'r', descricao: 'Salário', valor: 5000.1 }], lancamentos: [{ id: 'l', data: '2026-11-03', categoriaId: 'Lazer', descricao: 'x', valor: 60.3 }] }] };
    const m = migrar(antigo);
    assert.equal(m.saldoInicial, 100050);
    assert.equal(m.categorias[0].orcamento, 15025);
    assert.equal(m.meses[0].receitas[0].valor, 500010);
    assert.equal(m.meses[0].lancamentos[0].valor, 6030);
});

test('lista antiga (formato v1) migra sem perder lançamentos', () => {
    const m = migrar([{ id: 'nov_2026', nome: 'Novembro / 2026', salario: 100, lancamentos: [{ data: '2026-11-02', categoria: 'Lazer', descricao: 'x', valor: 10 }] }]);
    assert.equal(m.meses[0].receitas[0].valor, 10000);
    assert.equal(m.meses[0].lancamentos[0].valor, 1000);
});

test('validação de backup recusa arquivo que não é do app', () => {
    assert.equal(validarBackup({ nada: 1 }).ok, false);
    assert.equal(validarBackup([{ sem_id: true }]).ok, false);
    assert.equal(validarBackup({ meses: [{ id: 'x', lancamentos: 'nao-lista' }] }).ok, false);
    assert.equal(validarBackup({ meses: [{ id: 'x', lancamentos: [], receitas: [] }] }).ok, true);
});

test('nomes de meses e ids vindos de backup são limpos (sem injeção no id)', () => {
    const m = migrar({ versao: 6, meses: [{ id: '<img src=x>', nome: 'Texto', lancamentos: [] }] });
    assert.match(m.meses[0].id, /^[a-zA-Z0-9_-]+$/);
});
