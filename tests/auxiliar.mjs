// Navegador simulado para os testes: o suficiente para importar e exercitar os módulos sem abrir uma página.
import 'fake-indexeddb/auto';

// O aviso entre abas do Node seguraria o teste aberto depois do fim
globalThis.BroadcastChannel = undefined;

const store = {};
globalThis.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
};
export const armazenamentoLocal = store;

export function elemento() {
    const classes = new Set(['hidden']);
    return {
        innerHTML: '', textContent: '', value: '', className: '', style: {}, dataset: {}, files: null,
        classList: {
            add: c => classes.add(c), remove: c => classes.delete(c),
            toggle: (c, f) => ((f === undefined ? !classes.has(c) : f) ? classes.add(c) : classes.delete(c)),
            contains: c => classes.has(c)
        },
        attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute() {},
        querySelector: () => null, querySelectorAll: () => [], focus() {}, contains: () => false, closest: () => null
    };
}

export const els = {};
globalThis.document = {
    getElementById: id => els[id] || (els[id] = elemento()),
    querySelector: () => elemento(), querySelectorAll: () => [],
    documentElement: elemento(), createElement: () => ({ click() {}, remove() {} }),
    body: { appendChild() {} }, addEventListener() {}, activeElement: null
};
globalThis.window = { innerWidth: 1200, matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, scrollTo() {} };
Object.defineProperty(globalThis, 'navigator', { value: { storage: { persisted: async () => false, persist: async () => false } }, configurable: true, writable: true });
globalThis.location = { protocol: 'https:', hash: '' };
// Temporizadores reais, mas que não seguram o teste aberto
const setTimeoutReal = globalThis.setTimeout;
globalThis.setTimeout = (f, ms, ...resto) => { const id = setTimeoutReal(f, ms, ...resto); if (id && id.unref) id.unref(); return id; };

// Janelas de confirmação: o teste define as respostas em janela.respostas (true confirma, false cancela).
// Avisos (janela com um só botão) ficam registrados em janela.avisos.
export const janela = { respostas: [], avisos: [], textos: [] };
const { S } = await import('../js/estado.js');
const modal = elemento();
const removerClasse = modal.classList.remove;
modal.classList.remove = c => {
    removerClasse(c);
    if (c !== 'hidden') return;
    Promise.resolve().then(() => {
        const texto = els.confirmaTexto.textContent;
        const soAviso = els.confirmaCancelar.classList.contains('hidden');
        let resposta = true;
        if (soAviso) janela.avisos.push(texto);
        else { janela.textos.push(texto); if (janela.respostas.length) resposta = janela.respostas.shift(); }
        const r = S.dialogoResolve; S.dialogoResolve = null;
        if (r) r(resposta);
    });
};
els.modalConfirma = modal;

export const cats = [
    { id: 'Alimentacao', nome: 'Alimentação (Mercado)', cor: '#f59e0b', tipo: 'gasto', orcamento: 0 },
    { id: 'Lazer', nome: 'Lazer', cor: '#10b981', tipo: 'gasto', orcamento: 0 },
    { id: 'Investimentos', nome: 'Investimentos', cor: '#06b6d4', tipo: 'investimento', orcamento: 0 }
];

// Lê um trecho de HTML como um navegador leria: devolve cada tag com os nomes dos seus atributos.
// Assim texto escapado dentro do valor de um atributo não é confundido com um atributo de verdade.
export function tagsEAtributos(html) {
    const tags = [];
    for (const m of html.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>"'/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*)\s*\/?>/g)) {
        const semValores = m[2].replace(/"[^"]*"|'[^']*'/g, '""');
        const attrs = [...semValores.matchAll(/\s+([^\s=>"'/]+)/g)].map(a => a[1].toLowerCase());
        tags.push({ tag: m[1].toLowerCase(), attrs });
    }
    return tags;
}
