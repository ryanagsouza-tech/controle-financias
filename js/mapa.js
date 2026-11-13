// Ações que o HTML pode chamar. Só o que está neste mapa executa, o resto é ignorado.
import { definirTema } from './tema.js';
import { desfazer, fechar, fecharDialogo } from './ui.js';
import * as acoes from './acoes.js';
import { alternarAno, renderizar, toggleMobileSidebar, trocarAba } from './render.js';

export const ACOES = Object.freeze({
    ...acoes,
    trocarAba,
    alternarAno,
    toggleMobileSidebar,
    fechar,
    fecharDialogo,
    desfazer,
    definirTema: valor => { definirTema(valor); renderizar(); }
});
