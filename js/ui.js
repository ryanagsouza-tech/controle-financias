// Janelas, avisos e atalhos de DOM usados pelas ações.
import { esc, ev } from './util.js';
import { S } from './estado.js';
import { migrar } from './dados.js';
import { salvar } from './armazenamento.js';

export const val = id => (document.getElementById(id) || {}).value || '';

export const marcado = id => !!(document.getElementById(id) || {}).checked;

// Escolha por botões (radios escondidos): lê e define o valor marcado de um grupo
export function valorRadio(nome) {
    const el = document.querySelector(`input[name="${nome}"]:checked`);
    return el ? el.value : '';
}
export function marcarRadio(nome, valor) {
    const el = document.querySelector(`input[name="${nome}"][value="${valor}"]`);
    if (el) el.checked = true;
    return !!el;
}

// Erro de preenchimento mostrado ao lado do campo, sem janela que interrompe
export function mostrarErro(id, msg) {
    const e = document.getElementById(id);
    if (!e) { avisar(msg); return; }
    e.textContent = msg;
    e.classList.remove('hidden');
}
export function limparErro(id) {
    const e = document.getElementById(id);
    if (e) { e.textContent = ''; e.classList.add('hidden'); }
}

export function focarCampo(id) {
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el && el.focus) el.focus();
    }, 0);
}

// Ao abrir uma janela o foco vai para o primeiro campo, e ao fechar volta para quem abriu
export function abrir(id) {
    const m = document.getElementById(id);
    S.pilhaFoco.push(document.activeElement || null);
    m.classList.remove('hidden'); m.classList.add('flex');
    const f = m.querySelector && m.querySelector('input:not([type=hidden]), select, button');
    if (f && f.focus) setTimeout(() => f.focus(), 30);
}

export function fechar(id) {
    const m = document.getElementById(id);
    m.classList.add('hidden'); m.classList.remove('flex');
    const volta = S.pilhaFoco.pop();
    if (volta && volta.focus) volta.focus();
}

const JANELAS = ['modalConfirma', 'modalRapido', 'modalLanc', 'modalMes'];
export const janelaAberta = () => JANELAS.find(i => { const m = document.getElementById(i); return m && !m.classList.contains('hidden'); }) || null;

// Mantém o Tab dentro da janela aberta
export function prenderFoco(e) {
    const id = janelaAberta();
    if (!id) return false;
    const m = document.getElementById(id);
    const foc = [...m.querySelectorAll('input:not([type=hidden]):not([disabled]), select:not([disabled]), button:not([disabled]), textarea:not([disabled])')]
        .filter(el => !el.closest('.hidden'));
    if (!foc.length) return false;
    const primeiro = foc[0], ultimo = foc[foc.length - 1];
    if (!m.contains(document.activeElement)) { e.preventDefault(); primeiro.focus(); }
    else if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    return true;
}

// Janelas próprias no lugar do confirm/alert do navegador, que mostram o endereço do site
export function dialogo(texto, o = {}) {
    return new Promise(res => {
        S.dialogoResolve = res;
        document.getElementById('confirmaTexto').textContent = texto;
        const ok = document.getElementById('confirmaOk'), cancelar = document.getElementById('confirmaCancelar');
        ok.textContent = o.ok || 'OK';
        ok.className = 'btn ' + (o.perigo ? 'btn-perigo' : 'btn-primario');
        cancelar.textContent = o.cancelar || 'Cancelar';
        cancelar.classList.toggle('hidden', !!o.apenasOk);
        abrir('modalConfirma');
    });
}
export const confirmar = (texto, o) => dialogo(texto, o);
export const avisar = texto => dialogo(texto, { apenasOk: true });
export function fecharDialogo(v) {
    fechar('modalConfirma');
    const r = S.dialogoResolve; S.dialogoResolve = null;
    if (r) r(v);
}

// Aviso rápido, com opção de desfazer a última exclusão
export function mostrarToast(msg, snap) {
    S.desfazerSnap = snap || null;
    const el = document.getElementById('toast');
    el.innerHTML = `<span>${esc(msg)}</span>${snap ? `<button ${ev('click', 'desfazer')} class="btn btn-sm btn-texto text-sky-300 hover:text-sky-200">Desfazer</button>` : ''}`;
    el.classList.remove('hidden');
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => el.classList.add('hidden'), 8000);
}
export function desfazer() {
    if (!S.desfazerSnap) return;
    S.estado = migrar(JSON.parse(S.desfazerSnap));
    S.desfazerSnap = null;
    document.getElementById('toast').classList.add('hidden');
    salvar();
}

// Larguras e cores dinâmicas vêm em atributos data-: o JS as aplica pelo CSSOM, o que a política de
// segurança permite, ao contrário de style="..." escrito dentro do HTML.
const COR = /^#[0-9a-f]{3,8}$/i;
export function aplicarEstilos(raiz = document) {
    raiz.querySelectorAll('[data-larg]').forEach(el => {
        const n = Number(el.dataset.larg);
        el.style.width = (Number.isFinite(n) ? Math.max(0, Math.min(n, 100)) : 0) + '%';
    });
    raiz.querySelectorAll('[data-bg]').forEach(el => { if (COR.test(el.dataset.bg)) el.style.backgroundColor = el.dataset.bg; });
    raiz.querySelectorAll('[data-cor]').forEach(el => { if (COR.test(el.dataset.cor)) el.style.color = el.dataset.cor; });
}
