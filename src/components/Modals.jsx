import { useEffect, useState } from 'react'
import { FLOW_DECISIONS, FLOW_DEFS, STATUS_LABELS } from '../config/flow'

export function NewPieceModal({ open, onClose, onSave, saving }) {
  const [form, setForm] = useState({ artigo: '', colecao: '', linha: '', categoria: '', mp_base: '', tipo_peca: 'Nova', complexidade: 'Baixa', lacre: 'Sem lacre', passagem_colecao: '' })
  useEffect(() => { if (open) setForm(f => ({ ...f, artigo: '' })) }, [open])
  if (!open) return null
  const field = key => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })
  function submit(e) { e.preventDefault(); if (form.artigo.trim()) onSave({ ...form, artigo: form.artigo.trim() }) }
  return <Modal title="Nova peça" kicker="Cadastro inicial" onClose={onClose}><form className="piece-form" onSubmit={submit}>
    <label className="wide">Artigo *<input {...field('artigo')} autoFocus required /></label>
    <label>Coleção<input {...field('colecao')} /></label><label>Linha<input {...field('linha')} /></label>
    <label>Categoria / bloco<input {...field('categoria')} /></label><label>Matéria-prima base<input {...field('mp_base')} /></label>
    <label>Classificação<select {...field('tipo_peca')}><option>Nova</option><option>Repeat</option></select></label>
    <label>Complexidade<select {...field('complexidade')}><option>Baixa</option><option>Moderada</option><option>Alta</option></select></label>
    <label className="wide">Informações para passagem<textarea {...field('passagem_colecao')} /></label>
    <div className="modal-actions wide"><button type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary" type="submit" disabled={saving}>{saving ? 'Cadastrando…' : 'Cadastrar peça'}</button></div>
  </form></Modal>
}

export function PieceDrawer({ piece, events, onClose, onSavePassage, onDecision, saving }) {
  const [passage, setPassage] = useState(piece?.passagem_colecao || '')
  useEffect(() => setPassage(piece?.passagem_colecao || ''), [piece])
  if (!piece) return null
  const cfg = FLOW_DECISIONS[piece.fluxo_atual]
  return <><div className="scrim" onClick={onClose} /><aside className="drawer">
    <header><div><small>{piece.colecao || 'Passagem de coleção'}</small><h2>{piece.artigo}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header>
    <div className="drawer-status"><span>{STATUS_LABELS[piece.fluxo_atual]}</span><span>{piece.complexidade || 'Baixa'} atenção</span><span>{piece.lacre || 'Sem lacre'}</span></div>
    {cfg && <section className="next-action"><div><small>DECISÃO NECESSÁRIA</small><strong>{cfg.question}</strong></div><button onClick={() => onDecision(piece)}>Registrar decisão</button></section>}
    <div className="drawer-body"><section><div className="section-title">Dados técnicos</div><dl><div><dt>Coleção</dt><dd>{piece.colecao || '—'}</dd></div><div><dt>Categoria</dt><dd>{piece.categoria || '—'}</dd></div><div><dt>MP base</dt><dd>{piece.mp_base || '—'}</dd></div><div><dt>Tipo</dt><dd>{piece.tipo_peca || 'Nova'}</dd></div></dl></section>
      <section><div className="section-title">Registro da passagem</div><textarea className="passage-area" value={passage} onChange={e => setPassage(e.target.value)} /><button className="primary align-right" disabled={saving} onClick={() => onSavePassage(piece, passage)}>{saving ? 'Salvando…' : 'Salvar passagem'}</button></section>
      <section><div className="section-title">Histórico orientado a eventos</div><div className="timeline">{events.length ? events.map(event => <div key={event.id}><i /><p><strong>{event.descricao}</strong><small>{event.usuario} · {new Date(event.created_at).toLocaleString('pt-BR')}</small></p></div>) : <p className="muted">Nenhum evento registrado.</p>}</div></section>
    </div>
  </aside></>
}

export function DecisionModal({ piece, onClose, onConfirm, saving }) {
  const cfg = piece && FLOW_DECISIONS[piece.fluxo_atual]
  const [option, setOption] = useState('')
  const [reason, setReason] = useState('')
  useEffect(() => { setOption(cfg?.options[0]?.id || ''); setReason('') }, [piece, cfg])
  if (!piece || !cfg) return null
  const selected = cfg.options.find(o => o.id === option)
  return <Modal title={cfg.question} kicker={FLOW_DEFS.find(f => f.id === piece.fluxo_atual)?.name} onClose={onClose}><div className="decision-list">{cfg.options.map(item => <label key={item.id}><input type="radio" name="decision" value={item.id} checked={option === item.id} disabled={saving} onChange={() => setOption(item.id)} /><span><strong>{item.label}</strong><small>Destino: {STATUS_LABELS[item.destination] || item.destination}</small></span></label>)}</div><label className="reason">Motivo, ressalva ou contexto<textarea value={reason} disabled={saving} onChange={e => setReason(e.target.value)} placeholder={selected?.isReturn ? 'Obrigatório para retornos' : 'Recomendado para esta decisão'} /></label><div className="modal-actions"><button onClick={onClose} disabled={saving}>Cancelar</button><button className="primary" disabled={saving || (selected?.isReturn && !reason.trim())} onClick={() => onConfirm(piece, cfg, selected, reason.trim())}>{saving ? 'Confirmando…' : 'Confirmar decisão'}</button></div></Modal>
}

function Modal({ title, kicker, onClose, children }) { return <><div className="scrim modal-scrim" onClick={onClose} /><section className="modal"><header><div><small>{kicker}</small><h2>{title}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="modal-body">{children}</div></section></> }
