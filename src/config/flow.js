export const STATUS_ORDER = ['cadastro', 'analise', 'passagem', 'mostruario', 'pos', 'ajustes', 'encerrado']

export const STATUS_LABELS = {
  cadastro: 'Cadastro', analise: 'Em análise', passagem: 'Passagem técnica',
  mostruario: 'Mostruário', pos: 'Pós-mostruário', ajustes: 'Ajustes', encerrado: 'Encerrado',
}

export const FLOW_DEFS = [
  { id: 'cadastro', name: 'Preparação e cadastro', description: 'Dados técnicos, vínculo Repeat, desenho e informações para os demais momentos.' },
  { id: 'analise', name: 'Análise técnica', description: 'Avaliação da peça, riscos, cuidados e condições para seguir ou retornar.' },
  { id: 'passagem', name: 'Passagem e apresentação', description: 'Apresentação, comentários, ressalvas e decisão de encaminhamento.' },
  { id: 'mostruario', name: 'Acompanhamento do mostruário', description: 'Ocorrências, responsáveis, pendências, fotos e avaliação do resultado.' },
  { id: 'pos', name: 'Pós-mostruário', description: 'Consolidação das avaliações, aprendizados, ajustes e memória técnica.' },
  { id: 'ajustes', name: 'Ajustes', description: 'Correções solicitadas, registro da execução e decisão sobre o retorno ao fluxo.' },
]

export const FLOW_DECISIONS = {
  cadastro: { question: 'As informações estão válidas para iniciar a análise técnica?', options: [
    { id: 'iniciar_analise', label: 'Iniciar análise técnica', destination: 'analise' },
    { id: 'corrigir_cadastro', label: 'Manter em correção', destination: 'cadastro', isReturn: true },
  ]},
  analise: { question: 'Qual é o resultado da análise técnica?', options: [
    { id: 'seguir_passagem', label: 'Aprovar para passagem', destination: 'passagem' },
    { id: 'retornar_cadastro', label: 'Retornar para correção', destination: 'cadastro', isReturn: true },
  ]},
  passagem: { question: 'Qual é o encaminhamento da apresentação?', options: [
    { id: 'seguir_mostruario', label: 'Enviar para mostruário', destination: 'mostruario' },
    { id: 'retornar_analise', label: 'Retornar para análise', destination: 'analise', isReturn: true },
    { id: 'concluir_apresentacao', label: 'Concluir apresentação', destination: 'passagem', closingType: 'apresentacao' },
  ]},
  mostruario: { question: 'Qual é o resultado do acompanhamento?', options: [
    { id: 'seguir_pos', label: 'Enviar ao pós-mostruário', destination: 'pos' },
    { id: 'abrir_ajustes', label: 'Encaminhar para ajustes', destination: 'ajustes' },
    { id: 'retornar_passagem', label: 'Retornar para passagem', destination: 'passagem', isReturn: true },
  ]},
  pos: { question: 'Como concluir a consolidação pós-mostruário?', options: [
    { id: 'concluir_fluxo', label: 'Concluir ramificação', destination: 'encerrado', closingType: 'ramificacao' },
    { id: 'solicitar_ajustes', label: 'Solicitar ajustes', destination: 'ajustes' },
    { id: 'retornar_mostruario', label: 'Retornar ao acompanhamento', destination: 'mostruario', isReturn: true },
  ]},
  ajustes: { question: 'Qual é o encaminhamento após os ajustes?', options: [
    { id: 'retornar_mostruario', label: 'Retornar ao acompanhamento', destination: 'mostruario' },
    { id: 'retornar_pos', label: 'Retornar ao pós-mostruário', destination: 'pos' },
    { id: 'concluir_ajustes', label: 'Concluir peça', destination: 'encerrado', closingType: 'peca' },
  ]},
}

export function getFlowState(piece, flowId) {
  const current = STATUS_ORDER.indexOf(piece.fluxo_atual)
  const index = STATUS_ORDER.indexOf(flowId)
  if (piece.saude_operacional === 'bloqueada' && flowId === piece.fluxo_atual) return 'blocked'
  if (piece.fluxo_atual === 'encerrado' || index < current) return 'done'
  if (flowId === piece.fluxo_atual) return 'current'
  return 'locked'
}
