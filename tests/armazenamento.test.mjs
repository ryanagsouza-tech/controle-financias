// Testes de armazenamento: IndexedDB simulado, pontos de restauração e carga de dados antigos.
import { armazenamentoLocal } from './auxiliar.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { S } = await import('../js/estado.js');
const arm = await import('../js/armazenamento.js');
const { migrar } = await import('../js/dados.js');
const { hojeISO } = await import('../js/util.js');

const base = () => migrar({ versao: 6, saldoInicial: 0, categorias: [{ id: 'Lazer', nome: 'Lazer', cor: '#10b981', tipo: 'gasto', orcamento: 0 }], contasFixas: [], meses: [{ id: 'm1', ano: 2026, mes: 11, receitas: [{ id: 'r', descricao: 'Salário', valor: 100000 }], lancamentos: [] }] });

test('grava e lê o estado no IndexedDB', async () => {
    S.estado = base();
    await arm.persistir();
    const lido = await arm.lerDB('estado');
    assert.equal(lido.versao, 6);
    assert.equal(lido.meses[0].receitas[0].valor, 100000);
    assert.equal(S.storageOk, true);
});

test('carregar lê o que foi gravado', async () => {
    const e = await arm.carregar();
    assert.equal(e.meses[0].receitas[0].valor, 100000);
});

test('ponto diário: um por dia, no máximo 7', async () => {
    await arm.gravarDB('snapshots', []);
    await arm.salvarSnapshot('{}', 'diario');
    await arm.salvarSnapshot('{}', 'diario');
    assert.equal((await arm.lerSnapshots()).length, 1, 'não duplica no mesmo dia');
    const lista = [];
    for (let i = 0; i < 10; i++) lista.push({ id: 'd' + i, dia: '2026-01-' + String(i + 1).padStart(2, '0'), quando: new Date(2026, 0, i + 1).toISOString(), motivo: 'diario', json: '{}' });
    await arm.gravarDB('snapshots', lista);
    await arm.salvarSnapshot('{}', 'atualizacao');
    const depois = await arm.lerSnapshots();
    assert.equal(depois.filter(x => x.motivo === 'diario').length, 7);
    assert.equal(depois.filter(x => x.motivo === 'atualizacao').length, 1);
});

test('pontos de atualização: guarda só os 3 mais recentes', async () => {
    await arm.gravarDB('snapshots', []);
    for (let i = 0; i < 5; i++) { await arm.salvarSnapshot('{"n":' + i + '}', 'atualizacao'); }
    const l = (await arm.lerSnapshots()).filter(x => x.motivo === 'atualizacao');
    assert.equal(l.length, 3);
    assert.deepEqual(l.map(x => JSON.parse(x.json).n), [2, 3, 4]);
});

test('dados antigos: guarda uma cópia do formato antigo antes de migrar', async () => {
    await arm.gravarDB('estado', { versao: 3, saldoInicial: 100000, categorias: [], meses: [] });
    await arm.gravarDB('snapshots', []);
    const e = await arm.carregar();
    assert.equal(e.versao, 6);
    const l = await arm.lerSnapshots();
    assert.equal(l.length, 1);
    assert.equal(JSON.parse(l[0].json).versao, 3, 'o ponto guarda o formato antigo');
});

test('dados já na versão atual não geram ponto de atualização', async () => {
    S.estado = base();
    await arm.persistir();
    await arm.gravarDB('snapshots', []);
    await arm.carregar();
    assert.equal((await arm.lerSnapshots()).length, 0);
});

test('primeira abertura aproveita o localStorage das versões antigas', async () => {
    await arm.gravarDB('estado', undefined).catch(() => {});
    const { db, DB_STORE } = { db: arm.db, DB_STORE: 'kv' };
    const d = await db();
    await new Promise((res, rej) => { const t = d.transaction(DB_STORE, 'readwrite'); t.objectStore(DB_STORE).delete('estado'); t.oncomplete = res; t.onerror = rej; });
    armazenamentoLocal.controle_financeiro_v2 = JSON.stringify({ versao: 2, saldoInicial: 10.5, categorias: [], meses: [{ id: 'nov_2026', ano: 2026, mes: 11, receitas: [{ id: 'r', descricao: 'Salário', valor: 5000.1 }], lancamentos: [] }] });
    const e = await arm.carregar();
    assert.equal(e.saldoInicial, 1050);
    assert.equal(e.meses[0].receitas[0].valor, 500010);
    assert.ok(hojeISO());
});
