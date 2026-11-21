// Testes do tema claro, escuro e automático.
import { armazenamentoLocal } from './auxiliar.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const tema = await import('../js/tema.js');
const raiz = globalThis.document.documentElement;
const meta = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
globalThis.document.querySelector = s => (s === 'meta[name="theme-color"]' ? meta : { setAttribute() {} });
const sistemaEscuro = v => { globalThis.window.matchMedia = () => ({ matches: v, addEventListener() {} }); };

test('sem escolha o tema é "auto" e segue o aparelho', () => {
    delete armazenamentoLocal.tema;
    assert.equal(tema.lerTema(), 'auto');
    sistemaEscuro(true); tema.aplicarTema();
    assert.equal(raiz.attrs['data-tema'], 'escuro');
    assert.equal(meta.attrs.content, '#0b1220');
    sistemaEscuro(false); tema.aplicarTema();
    assert.equal(raiz.attrs['data-tema'], 'claro');
    assert.equal(meta.attrs.content, '#0284c7');
});

test('escolha manual vale mais que o aparelho e fica guardada', () => {
    sistemaEscuro(false);
    tema.definirTema('escuro');
    assert.equal(armazenamentoLocal.tema, 'escuro');
    assert.equal(raiz.attrs['data-tema'], 'escuro');
    sistemaEscuro(true);
    tema.definirTema('claro');
    assert.equal(raiz.attrs['data-tema'], 'claro');
});

test('armazenamento indisponível não derruba o tema', () => {
    const original = globalThis.localStorage;
    globalThis.localStorage = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
    assert.equal(tema.lerTema(), 'auto');
    assert.doesNotThrow(() => tema.definirTema('escuro'));
    globalThis.localStorage = original;
});
