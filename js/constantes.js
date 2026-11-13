// Constantes do app: versões, categorias padrão, formas de pagamento e ícones.
export const VERSAO_APP = '4.0.0';
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // tamanho máximo de um arquivo de backup

export const VERSAO_DADOS = 6; // 1 = lista de meses, 2 = valores em reais, 3 = valores em centavos, 4 = categorias novas e forma de pagamento, 5 = contas fixas, 6 = categorias enxutas, receita fixa e data do último backup

export const CHAVE_V3 = 'controle_financeiro_v3'; // só usada se o IndexedDB não estiver disponível

export const CHAVES_ANTIGAS = ['controle_financeiro_v2', 'controle_financeiro_dados', 'controle_financas_saas_dados', 'controle_financas_dados'];

export const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const ABREV_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const PALETA = ['#3b82f6', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4', '#84cc16', '#f97316'];

// As 6 categorias que já vêm no app. Qualquer uma pode ser renomeada, recolorida ou excluída.
export const CATEGORIAS_PADRAO = [
    { id: 'CustosFixos', nome: 'Moradia e Contas (Aluguel, Condomínio, Luz, Água, Internet)', cor: '#3b82f6', tipo: 'gasto', orcamento: 0 },
    { id: 'Alimentacao', nome: 'Alimentação (Mercado, Feira, Refeição)', cor: '#f59e0b', tipo: 'gasto', orcamento: 0 },
    { id: 'Transporte', nome: 'Transporte (Combustível, Condução, Carro)', cor: '#ef4444', tipo: 'gasto', orcamento: 0 },
    { id: 'Saude', nome: 'Saúde (Consultas, Medicamentos)', cor: '#14b8a6', tipo: 'gasto', orcamento: 0 },
    { id: 'Lazer', nome: 'Lazer & Passeios', cor: '#10b981', tipo: 'gasto', orcamento: 0 },
    { id: 'Investimentos', nome: 'Investimentos & Poupança', cor: '#06b6d4', tipo: 'investimento', orcamento: 0 }
];

// Categorias que o usuário pode adicionar com um toque, em Categorias, no menu "+ Sugeridas"
export const CATEGORIAS_SUGERIDAS = [
    { id: 'Educacao', nome: 'Educação (Faculdade, Cursos, Livros)', cor: '#8b5cf6', tipo: 'gasto', orcamento: 0 },
    { id: 'Vestuario', nome: 'Vestuário (Roupas, Calçados)', cor: '#ec4899', tipo: 'gasto', orcamento: 0 },
    { id: 'Assinaturas', nome: 'Assinaturas e Serviços (Streaming, Celular, Aplicativos)', cor: '#6366f1', tipo: 'gasto', orcamento: 0 },
    { id: 'CuidadosPessoais', nome: 'Cuidados Pessoais (Beleza, Higiene, Academia)', cor: '#d946ef', tipo: 'gasto', orcamento: 0 },
    { id: 'Familia', nome: 'Família e Pets (Filhos, Animais, Ajuda a familiares)', cor: '#f97316', tipo: 'gasto', orcamento: 0 },
    { id: 'Presentes', nome: 'Presentes e Doações', cor: '#eab308', tipo: 'gasto', orcamento: 0 },
    { id: 'Impostos', nome: 'Impostos e Taxas (IPVA, IPTU, Tarifas bancárias)', cor: '#78716c', tipo: 'gasto', orcamento: 0 },
    { id: 'Dividas', nome: 'Dívidas e Financiamentos (Empréstimos, Juros)', cor: '#b91c1c', tipo: 'gasto', orcamento: 0 },
    { id: 'Outros', nome: 'Outros e Imprevistos', cor: '#64748b', tipo: 'gasto', orcamento: 0 },
    { id: 'Reserva', nome: 'Reserva de Emergência', cor: '#84cc16', tipo: 'investimento', orcamento: 0 }
];

export const CATEGORIAS_TODAS = [...CATEGORIAS_PADRAO, ...CATEGORIAS_SUGERIDAS];

export const FORMAS_PAGAMENTO = [
    { id: 'debito', nome: 'Débito' }, { id: 'credito', nome: 'Crédito' }, { id: 'pix', nome: 'Pix' },
    { id: 'dinheiro', nome: 'Dinheiro' }, { id: 'boleto', nome: 'Boleto' }
];

// Formas de pagamento que podem ser divididas em parcelas (cartão de crédito e boleto parcelado/carnê)
export const FORMAS_COM_PARCELA = ['credito', 'boleto'];

export const nomePag = id => (FORMAS_PAGAMENTO.find(f => f.id === id) || {}).nome || '';

export const LIXEIRA = '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
