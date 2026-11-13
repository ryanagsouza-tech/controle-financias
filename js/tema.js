// Tema claro, escuro ou automático.
export function lerTema() {
    try { return localStorage.getItem('tema') || 'auto'; } catch (e) { return 'auto'; }
}

export function aplicarTema() {
    const pref = lerTema();
    const escuro = pref === 'escuro' || (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-tema', escuro ? 'escuro' : 'claro');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', escuro ? '#0b1220' : '#0284c7');
}

export function definirTema(v) {
    try { localStorage.setItem('tema', v); } catch (e) { /* ignora */ }
    aplicarTema();
}
