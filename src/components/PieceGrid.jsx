import { STATUS_LABELS, STATUS_ORDER } from '../config/flow'

export function PieceGrid({ pieces, onOpen }) {
  if (!pieces.length) return <div className="empty"><span>—</span><h2>Nenhuma peça nesta visualização</h2><p>Cadastre uma peça ou escolha outro filtro.</p></div>
  return <div className="piece-grid">{pieces.map(piece => <button className="piece-card" key={piece.id} onClick={() => onOpen(piece)}>
    <div className="piece-image">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt="" /> : <span>sem referência</span>}</div>
    <div className="piece-content"><div className="piece-head"><div><h3>{piece.artigo}</h3><small>{[piece.colecao, piece.categoria].filter(Boolean).join(' · ') || 'Sem coleção'}</small></div><span className={`status status-${piece.fluxo_atual}`}>{STATUS_LABELS[piece.fluxo_atual]}</span></div>
    <div className="tags"><span>{piece.tipo_peca || 'Nova'}</span><span>{piece.complexidade || 'Baixa'} atenção</span><span>{piece.lacre || 'Sem lacre'}</span></div>
    <div className="progress"><i style={{ width: `${Math.max(8, (STATUS_ORDER.indexOf(piece.fluxo_atual) + 1) / STATUS_ORDER.length * 100)}%` }} /></div>
    {piece.passagem_colecao && <p>{piece.passagem_colecao}</p>}</div>
  </button>)}</div>
}
