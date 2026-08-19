export const PROFILES = ['Engenharia', 'Produto', 'Qualidade', 'Estilo', 'Consulta']

export const TECHNICAL_EDIT_PROFILES = new Set(['Engenharia', 'Produto', 'Qualidade'])

export const AREAS = ['Engenharia', 'Produto', 'Qualidade', 'Estilo', 'Modelagem', 'Fornecedor']
export const PROBLEM_TYPES = ['Construção', 'Costura', 'Encolhimento', 'Estampa', 'Medidas', 'Modelagem', 'Matéria-prima', 'Tonalidade', 'Vestibilidade', 'Outro']
export const SEVERITIES = ['Baixa', 'Média', 'Alta']
export const CRITICALITIES = ['Baixa', 'Moderada', 'Alta']
export const ATTENTION_TAGS = PROBLEM_TYPES.filter(type => type !== 'Outro')

export const MODULES = [
  { id: 'dashboard', label: 'Visão geral', short: 'Dashboard' },
  { id: 'artigos', label: 'Artigos', short: 'Artigos' },
  { id: 'telao', label: 'Passagem de Coleção', short: 'Passagem' },
  { id: 'mostruario', label: 'Pós-passagem / Mostruário', short: 'Mostruário' },
  { id: 'radar', label: 'Radar Operacional', short: 'Radar' },
  { id: 'historico', label: 'Histórico da Coleção', short: 'Histórico' },
]

export const ARTICLE_FIELDS = [
  ['artigo', 'Código do artigo'],
  ['colecao', 'Coleção'],
  ['linha', 'Linha'],
  ['categoria', 'Categoria'],
  ['mp_base', 'Matéria-prima base'],
  ['tipo_peca', 'Classificação'],
  ['complexidade', 'Criticidade'],
  ['lacre', 'Lacre'],
  ['desenho_tecnico_url', 'Imagem do artigo'],
  ['observacoes', 'Apontamentos para a passagem'],
]

export function canEditTechnical(profile) {
  return TECHNICAL_EDIT_PROFILES.has(profile)
}

export function normalizeArticle(value = '') {
  return value.trim().toLocaleLowerCase('pt-BR')
}
