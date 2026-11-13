// Estado do app. Os módulos leem e alteram o que está aqui, em vez de usar variáveis soltas.

export const S = {
    estado: null,                 // dados do usuário (meses, categorias, contas fixas)
    abaAtiva: 'resumo_geral',
    filtros: { texto: '', cat: '', pag: '', ordem: 'recentes' },
    anosAbertos: new Set([new Date().getFullYear()]),
    storageOk: true,
    editando: null,
    dialogoResolve: null,
    desfazerSnap: null,
    toastTimer: null,
    dbPromise: null,
    ultimaCatRapida: '',
    pilhaFoco: [],                // elementos que tinham o foco antes de abrir cada janela
    toqueX: null,
    toqueY: null,
    renderizar: () => {}          // main.js coloca aqui a função que redesenha a tela
};
