// Armazenamento no IndexedDB, pontos de restauração automáticos e carga inicial dos dados.
import { CATEGORIAS_PADRAO, CHAVES_ANTIGAS, CHAVE_V3, VERSAO_DADOS } from './constantes.js';
import { hojeISO, uid } from './util.js';
import { S } from './estado.js';
import { contar, mesesIniciais, migrar } from './dados.js';

// IndexedDB guarda o estado inteiro sob a chave "estado"
export const DB_NOME = 'controle_financeiro', DB_STORE = 'kv';

export function db() {
    if (!S.dbPromise) S.dbPromise = new Promise((res, rej) => {
        if (typeof indexedDB === 'undefined') return rej(new Error('IndexedDB indisponível'));
        const r = indexedDB.open(DB_NOME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    return S.dbPromise;
}

export async function lerDB(chave) {
    const d = await db();
    return new Promise((res, rej) => {
        const q = d.transaction(DB_STORE).objectStore(DB_STORE).get(chave);
        q.onsuccess = () => res(q.result);
        q.onerror = () => rej(q.error);
    });
}

export async function gravarDB(chave, valor) {
    const d = await db();
    return new Promise((res, rej) => {
        const t = d.transaction(DB_STORE, 'readwrite');
        t.objectStore(DB_STORE).put(valor, chave);
        t.oncomplete = () => res();
        t.onerror = t.onabort = () => rej(t.error);
    });
}

// Pontos de restauração automáticos, guardados no próprio navegador: um por dia (o estado no início do dia)
// e um antes de cada atualização do formato dos dados ou de uma restauração.
export const MAX_DIARIOS = 7, MAX_ATUALIZACAO = 3;

export async function lerSnapshots() {
    try { return (await lerDB('snapshots')) || []; } catch (e) { return []; }
}

export async function salvarSnapshot(json, motivo) {
    try {
        let lista = await lerSnapshots();
        const dia = hojeISO();
        if (motivo === 'diario' && lista.some(x => x.motivo === 'diario' && x.dia === dia)) return;
        lista.push({ id: uid(), dia, quando: new Date().toISOString(), motivo, json });
        const diarios = lista.filter(x => x.motivo === 'diario').slice(-MAX_DIARIOS);
        const antes = lista.filter(x => x.motivo === 'atualizacao').slice(-MAX_ATUALIZACAO);
        lista = [...diarios, ...antes].sort((a, b) => a.quando.localeCompare(b.quando));
        await gravarDB('snapshots', lista);
    } catch (e) { /* sem IndexedDB: segue sem pontos de restauração */ }
}

export async function carregar() {
    try {
        const atual = await lerDB('estado');
        if (atual) {
            if ((parseInt(atual.versao) || 2) < VERSAO_DADOS) await salvarSnapshot(JSON.stringify(atual), 'atualizacao');
            return migrar(atual);
        }
    } catch (e) { /* cai para o localStorage */ }
    try {
        const v3 = localStorage.getItem(CHAVE_V3);
        if (v3) return migrar(JSON.parse(v3));
        // Primeira abertura desta versão: aproveita o que existir das versões anteriores (localStorage)
        let melhor = null;
        CHAVES_ANTIGAS.forEach(k => {
            const bruto = localStorage.getItem(k);
            if (!bruto) return;
            try {
                const dados = JSON.parse(bruto);
                if (dados && typeof dados === 'object' && (!melhor || contar(dados) > contar(melhor))) melhor = dados;
            } catch (e) { /* chave corrompida */ }
        });
        if (melhor) {
            await salvarSnapshot(JSON.stringify(melhor), 'atualizacao');
            return migrar(melhor);
        }
    } catch (e) {
        console.error(e);
    }
    return migrar({ versao: VERSAO_DADOS, saldoInicial: 0, categorias: CATEGORIAS_PADRAO, meses: mesesIniciais() });
}

// Avisa as outras abas abertas para recarregarem os dados, evitando que uma sobrescreva a outra
let canalAvisos = null;
export function obterCanal() {
    if (!canalAvisos && typeof BroadcastChannel !== 'undefined') canalAvisos = new BroadcastChannel('controle_financeiro');
    return canalAvisos;
}

export async function persistir() {
    try {
        await gravarDB('estado', S.estado);
        S.storageOk = true;
    } catch (e) {
        try { localStorage.setItem(CHAVE_V3, JSON.stringify(S.estado)); S.storageOk = true; } catch (e2) { S.storageOk = false; }
    }
    const c = obterCanal();
    if (c) c.postMessage('atualizado');
}

export function salvar() {
    S.renderizar();
    persistir().then(() => { if (!S.storageOk) S.renderizar(); });
}
