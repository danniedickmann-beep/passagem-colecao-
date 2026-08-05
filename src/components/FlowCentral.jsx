import { FLOW_DEFS, STATUS_LABELS, getFlowState } from '../config/flow'

const stateLabel = { current: 'Em andamento', done: 'Concluído', locked: 'Disponível depois', blocked: 'Bloqueado' }
export function FlowCentral({ pieces, selectedId, onSelect, onOpen }) {
  const piece = pieces.find(p => p.id === selectedId) || pieces[0]
  if (!piece) return <section className="flow-central"><Header /><div className="empty"><h2>Cadastre a primeira peça</h2><p>A central organiza todos os fluxos relacionados à peça.</p></div></section>
  return <section className="flow-central"><Header><label>Peça / coleção<select value={piece.id} onChange={e => onSelect(e.target.value)}>{pieces.map(p => <option key={p.id} value={p.id}>{p.artigo} · {p.colecao || 'Sem coleção'}</option>)}</select></label></Header>
    <div className="piece-context"><div><h2>{piece.artigo}</h2><small>{[piece.colecao, piece.linha, piece.categoria].filter(Boolean).join(' · ')}</small></div><span>{STATUS_LABELS[piece.fluxo_atual]}</span></div>
    <div className="flow-grid">{FLOW_DEFS.map((flow, index) => { const state = getFlowState(piece, flow.id); return <article className={`flow-card ${state}`} key={flow.id}><div className="flow-card-top"><small>{String(index + 1).padStart(2, '0')}</small><span>{stateLabel[state]}</span></div><h3>{flow.name}</h3><p>{flow.description}</p><button disabled={state === 'locked' || state === 'blocked'} onClick={() => onOpen(piece, flow.id)}>{state === 'current' ? 'Continuar fluxo' : state === 'done' ? 'Revisar registros' : state === 'blocked' ? 'Fluxo bloqueado' : 'Aguardando etapa anterior'}</button></article> })}</div>
    <div className="info-note">O pipeline é uma visão resumida. Decisões e retornos são registrados dentro de cada fluxo.</div>
  </section>
}

function Header({ children }) { return <div className="flow-header"><div><small>PONTO OPERACIONAL DE CONVERGÊNCIA</small><h1>Central de fluxos</h1><p>Continue o momento correto sem perder contexto, decisões ou retornos.</p></div>{children}</div> }
