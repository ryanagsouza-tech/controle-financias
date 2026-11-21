// Início do app: liga os eventos, carrega os dados e desenha a primeira tela.
import { S } from './estado.js';
import { migrar } from './dados.js';
import { aplicarFixasTodos, garantirMesAtual } from './calculos.js';
import { carregar, lerDB, obterCanal, persistir, salvarSnapshot } from './armazenamento.js';
import { aplicarTema } from './tema.js';
import { fechar, fecharDialogo, janelaAberta, mostrarToast, prenderFoco } from './ui.js';
import { renderizar } from './render.js';
import { abrirRapido } from './acoes.js';
import { instalar } from './eventos.js';
import { ACOES } from './mapa.js';

export function registrarServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const tinhaControlador = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (tinhaControlador) mostrarToast('Nova versão instalada. Feche e abra o app para usá-la.');
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Esc fecha a janela aberta e o Tab fica preso dentro dela
export function configurarTeclado() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const aberta = janelaAberta();
            if (aberta === 'modalConfirma') fecharDialogo(false);
            else if (aberta) fechar(aberta);
        } else if (e.key === 'Tab') {
            prenderFoco(e);
        }
    });
}

export async function iniciar() {
    S.renderizar = renderizar;
    instalar(document, ACOES);
    configurarTeclado();
    aplicarTema();
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicarTema);
    S.estado = await carregar();
    if (S.estado.meses.some(m => m.lancamentos.length || m.receitas.length)) await salvarSnapshot(JSON.stringify(S.estado), 'diario');
    aplicarFixasTodos();
    garantirMesAtual();
    renderizar();
    await persistir();
    const canal = obterCanal();
    if (canal) {
        canal.onmessage = async () => {
            try {
                const e = await lerDB('estado');
                if (e) { S.estado = migrar(e); renderizar(); }
            } catch (err) { /* ignora */ }
        };
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if (location.hash === '#novo') abrirRapido();
    registrarServiceWorker();
}
