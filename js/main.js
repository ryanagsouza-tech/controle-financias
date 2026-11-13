// Ponto de entrada: liga os eventos, carrega os dados e desenha a primeira tela.
import { S } from './estado.js';
import { migrar } from './dados.js';
import { aplicarFixasTodos, garantirMesAtual } from './calculos.js';
import { carregar, lerDB, obterCanal, persistir, salvarSnapshot } from './armazenamento.js';
import { aplicarTema } from './tema.js';
import { fechar, fecharDialogo, janelaAberta, mostrarToast, prenderFoco } from './ui.js';
import { aplicarLayout, renderizar, toggleMobileSidebar } from './render.js';
import { abrirRapido } from './acoes.js';
import { instalar } from './eventos.js';
import { ACOES } from './mapa.js';

function registrarServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const tinhaControlador = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (tinhaControlador) mostrarToast('Nova versão instalada. Feche e abra o app para usá-la.');
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Gestos no celular: arrastar da borda esquerda abre o menu, arrastar para a esquerda fecha
function configurarGestos() {
    document.addEventListener('touchstart', e => { const t = e.touches[0]; S.toqueX = t.clientX; S.toqueY = t.clientY; }, { passive: true });
    document.addEventListener('touchend', e => {
        if (S.toqueX === null || window.innerWidth >= 768) return;
        const t = e.changedTouches[0], dx = t.clientX - S.toqueX, dy = Math.abs(t.clientY - S.toqueY);
        const fechado = document.getElementById('sidebar').classList.contains('-translate-x-full');
        if (dy < 60) {
            if (fechado && S.toqueX < 24 && dx > 60) toggleMobileSidebar();
            else if (!fechado && dx < -60) toggleMobileSidebar();
        }
        S.toqueX = null;
    }, { passive: true });
}

// Esc fecha a janela aberta e o Tab fica preso dentro dela
function configurarTeclado() {
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

async function iniciar() {
    S.renderizar = renderizar;
    aplicarLayout();
    instalar(document, ACOES);
    configurarTeclado();
    configurarGestos();
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

iniciar();
