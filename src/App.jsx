import { useEffect, useMemo, useState } from 'react'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { Pipeline } from './components/Pipeline'
import { PieceGrid } from './components/PieceGrid'
import { FlowCentral } from './components/FlowCentral'
import { DecisionModal, NewPieceModal, PieceDrawer } from './components/Modals'
import { STATUS_LABELS } from './config/flow'
import { repository } from './services/repository'

export default function App() {
  const [user, setUser] = useState('')
  const [pieces, setPieces] = useState([])
  const [view, setView] = useState('flows')
  const [selectedId, setSelectedId] = useState(null)
  const [activePiece, setActivePiece] = useState(null)
  const [decisionPiece, setDecisionPiece] = useState(null)
  const [events, setEvents] = useState([])
  const [newOpen, setNewOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!user) return; repository.listPieces().then(data => { setPieces(data); setSelectedId(data[0]?.id || null) }).catch(e => setNotice(e.message)) }, [user])
  useEffect(() => { if (!activePiece) return; repository.listEvents(activePiece.id).then(setEvents).catch(() => setEvents([])) }, [activePiece])
  const visible = useMemo(() => view === 'all' || view === 'flows' ? pieces : pieces.filter(p => p.fluxo_atual === view), [pieces, view])

  async function createPiece(form) { if (saving) return; setSaving(true); try { const piece = await repository.createPiece(form, user); await repository.addEvent(piece.id, 'peca_cadastrada', `Peça ${piece.artigo} cadastrada`, user); setPieces(p => [piece, ...p]); setSelectedId(piece.id); setNewOpen(false); setNotice('Peça cadastrada com sucesso') } catch (e) { setNotice(e.message || 'Não foi possível cadastrar a peça.') } finally { setSaving(false) } }
  async function savePassage(piece, text) { if (saving) return; setSaving(true); try { const updated = await repository.updatePiece(piece.id, { passagem_colecao: text }); await repository.addEvent(piece.id, 'passagem_atualizada', 'Passagem de coleção atualizada', user); replacePiece(updated); setActivePiece(updated); setEvents(await repository.listEvents(piece.id)); setNotice('Passagem salva') } catch (e) { setNotice(e.message || 'Não foi possível salvar a passagem.') } finally { setSaving(false) } }
  async function confirmDecision(piece, cfg, option, reason) { if (saving || !option) return; setSaving(true); try { const updates = { fluxo_atual: option.destination }; if (option.isReturn) Object.assign(updates, { reaberta: true, motivo_reabertura: reason, data_reabertura: new Date().toISOString(), total_reaberturas: (piece.total_reaberturas || 0) + 1, saude_operacional: 'atencao' }); const updated = await repository.updatePiece(piece.id, updates); await repository.addEvent(piece.id, option.isReturn ? 'fluxo_retornado' : option.closingType ? 'fluxo_encerrado' : 'decisao_registrada', `${cfg.question} ${option.label}${reason ? ` — ${reason}` : ''}`, user, { fluxo: piece.fluxo_atual, resposta: option.label, destino: option.destination, motivo: reason }); replacePiece(updated); setActivePiece(updated); setDecisionPiece(null); setEvents(await repository.listEvents(piece.id)); setNotice(`Peça encaminhada para ${STATUS_LABELS[option.destination] || option.destination}`) } catch (e) { setNotice(e.message || 'Não foi possível registrar a decisão.') } finally { setSaving(false) } }
  function replacePiece(updated) { setPieces(list => list.map(p => p.id === updated.id ? updated : p)) }
  function openFlow(piece) { setActivePiece(piece) }

  if (!user) return <Login onEnter={setUser} />
  return <Layout user={user} view={view} setView={setView} pieces={pieces} onNew={() => setNewOpen(true)}>
    {view === 'flows' ? <FlowCentral pieces={pieces} selectedId={selectedId} onSelect={setSelectedId} onOpen={openFlow} /> : <><Pipeline pieces={pieces} view={view} setView={setView} /><section className="collection"><div className="collection-head"><div><small>VISÃO RESUMIDA</small><h1>{view === 'all' ? 'Todas as peças' : STATUS_LABELS[view]}</h1></div><span>{visible.length} peça{visible.length === 1 ? '' : 's'}</span></div><PieceGrid pieces={visible} onOpen={setActivePiece} /></section></>}
    <NewPieceModal open={newOpen} onClose={() => setNewOpen(false)} onSave={createPiece} saving={saving} />
    <PieceDrawer piece={activePiece} events={events} onClose={() => setActivePiece(null)} onSavePassage={savePassage} onDecision={setDecisionPiece} saving={saving} />
    <DecisionModal piece={decisionPiece} onClose={() => setDecisionPiece(null)} onConfirm={confirmDecision} saving={saving} />
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}</button>}
    {!repository.configured && <div className="env-note">Modo local · configure o Supabase no arquivo <code>.env</code></div>}
  </Layout>
}
