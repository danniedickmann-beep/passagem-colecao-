import { useCallback, useEffect, useMemo, useState } from 'react'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { ArticleDetailModal, ArticleFormModal, ArticleStatusModal } from './components/Modals'
import { ArticlesView, DashboardView, HistoryView, MostruarioView, RadarView, TelaoView } from './components/MvpViews'
import { canEditTechnical, CRITICALITIES, normalizeArticle } from './config/mvp'
import { PROBLEM_TYPES } from './config/mvp'
import { repository } from './services/repository'

const EDITABLE_FIELDS = ['colecao', 'linha', 'categoria', 'mp_base', 'tipo_peca', 'complexidade', 'lacre', 'participa_mostruario', 'pontos_atencao', 'desenho_tecnico_url', 'observacoes']
const DEFAULT_LINES = ['Adulto Feminino', 'Adulto Masculino', 'Cápsula', 'Íntima', 'Kids Menina', 'Kids Menino', 'Teen']
const DEFAULT_CATEGORIES = ['Blusas e Camisetas', 'Calças', 'Camisas e Polo', 'Jaquetas e Casacos', 'Regatas', 'Saias', 'Shorts e Bermudas', 'Vestidos', 'Pijamas', 'Conjuntos Longos', 'Conjuntos Curtos', 'Camisola + Cardigan', 'Camisola', 'Ceroula', 'Samba-canção']

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('dashboard')
  const [pieces, setPieces] = useState([])
  const [archivedPieces, setArchivedPieces] = useState([])
  const [events, setEvents] = useState([])
  const [pendencias, setPendencias] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [detailPiece, setDetailPiece] = useState(null)
  const [formPiece, setFormPiece] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [statusPiece, setStatusPiece] = useState(null)
  const [statusMode, setStatusMode] = useState('archive')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const [pieceData, archivedData, eventData, pendingData] = await Promise.all([repository.listPieces(), repository.listArchivedPieces(), repository.listAllEvents(), repository.listPendencias()])
    setPieces(pieceData); setArchivedPieces(archivedData); setEvents(eventData); setPendencias(pendingData)
    setSelectedId(current => current || pieceData[0]?.id || '')
  }, [])

  useEffect(() => { if (!user) return; refresh().catch(error => setNotice(readError(error))) }, [user, refresh])
  useEffect(() => {
    if (!user) return undefined
    return repository.subscribePendencias(() => repository.listPendencias().then(setPendencias).catch(error => setNotice(readError(error))))
  }, [user])
  const canEdit = useMemo(() => canEditTechnical(user?.perfil), [user])
  const collectionOptions = useMemo(() => [...new Set(['INVERNO 27', 'VERÃO 27', 'ALTO VERÃO 28', ...pieces.map(piece => piece.colecao), ...archivedPieces.map(piece => piece.colecao)].filter(Boolean))], [pieces, archivedPieces])
  const criticalityOptions = useMemo(() => [...new Set([...CRITICALITIES, ...pieces.map(piece => piece.complexidade), ...archivedPieces.map(piece => piece.complexidade)].filter(Boolean))], [pieces, archivedPieces])
  const lineOptions = useMemo(() => [...new Set([...DEFAULT_LINES, ...pieces.map(piece => piece.linha), ...archivedPieces.map(piece => piece.linha)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [pieces, archivedPieces])
  const categoryOptions = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...pieces.map(piece => piece.categoria), ...archivedPieces.map(piece => piece.categoria)].filter(Boolean))], [pieces, archivedPieces])
  const materialOptions = useMemo(() => [...new Set([...pieces.map(piece => piece.mp_base), ...archivedPieces.map(piece => piece.mp_base)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [pieces, archivedPieces])
  const problemTypeOptions = useMemo(() => [...new Set([...PROBLEM_TYPES, ...pieces.flatMap(piece => piece.pontos_atencao || []), ...archivedPieces.flatMap(piece => piece.pontos_atencao || []), ...pendencias.map(item => item.tipo_problema)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [pieces, archivedPieces, pendencias])

  async function saveArticle(form, technicalFile) {
    if (saving) return
    setSaving(true)
    try {
      if (!formPiece) {
        const duplicate = pieces.find(piece => normalizeArticle(piece.artigo) === normalizeArticle(form.artigo))
        if (duplicate) { setFormOpen(false); setDetailPiece(duplicate); throw new Error('Este artigo já está cadastrado. A ficha existente foi aberta.') }
      }
      const drawingUrl = technicalFile ? await repository.uploadTechnicalDrawing(technicalFile) : form.desenho_tecnico_url
      const preparedForm = { ...form, desenho_tecnico_url: drawingUrl || null }
      if (!formPiece) {
        const created = await repository.createPiece(preparedForm, user.nome)
        await repository.addEvent(created.id, 'artigo_cadastrado', `Artigo ${created.artigo} cadastrado`, user.nome, { perfil: user.perfil })
        setNotice('Artigo cadastrado com sucesso.')
      } else {
        const updates = Object.fromEntries(EDITABLE_FIELDS.map(key => [key, preparedForm[key] ?? null]))
        const changes = Object.fromEntries(EDITABLE_FIELDS.filter(key => String(formPiece[key] ?? '') !== String(preparedForm[key] ?? '')).map(key => [key, { antes: formPiece[key] ?? null, depois: preparedForm[key] ?? null }]))
        if (!Object.keys(changes).length) { setNotice('Nenhuma alteração para salvar.'); setFormOpen(false); return }
        const updated = await repository.updatePiece(formPiece.id, { ...updates, updated_by: user.nome })
        await repository.addEvent(updated.id, 'ficha_tecnica_atualizada', `Dados da passagem do artigo ${updated.artigo} atualizados`, user.nome, { perfil: user.perfil, alteracoes: changes })
        let cleanupWarning = false
        if (formPiece.desenho_tecnico_url && formPiece.desenho_tecnico_url !== preparedForm.desenho_tecnico_url) {
          try { await repository.deleteTechnicalDrawing(formPiece.desenho_tecnico_url) } catch { cleanupWarning = true }
        }
        setNotice(cleanupWarning ? 'Alterações salvas. A imagem antiga não pôde ser apagada; solicite a limpeza administrativa.' : 'Alterações salvas e registradas no histórico.')
      }
      setFormOpen(false); setFormPiece(undefined); await refresh()
    } catch (error) { setNotice(readError(error)) } finally { setSaving(false) }
  }

  async function createPending(piece, description, area, problemType, severity, stage = 'apresentacao') {
    if (saving) return
    setSaving(true)
    try {
      await repository.createPendencia({ peca_id: piece.id, descricao: description, area_responsavel: area, tipo_problema: problemType, gravidade: severity, etapa_origem: stage, created_by: user.nome })
      await repository.updatePiece(piece.id, { saude_operacional: 'atencao', updated_by: user.nome })
      await repository.addEvent(piece.id, 'pendencia_criada', `Pendência de ${problemType} criada para ${area}: ${description}`, user.nome, { perfil: user.perfil, area, tipo_problema: problemType, gravidade: severity, etapa_origem: stage })
      await refresh(); setNotice('Apontamento enviado para o Radar Operacional.')
    } catch (error) { setNotice(readError(error)) } finally { setSaving(false) }
  }

  async function saveMostruario(piece, form) {
    if (saving) return
    setSaving(true)
    try {
      const { tipo_problema, gravidade, ...pieceUpdates } = form
      await repository.updatePiece(piece.id, { ...pieceUpdates, fluxo_atual: form.ciclo_mostruario_encerrado ? 'pos' : 'mostruario', updated_by: user.nome })
      await repository.addEvent(piece.id, 'feedback_mostruario', form.ciclo_mostruario_encerrado ? 'Feedback salvo e ciclo do mostruário encerrado' : 'Feedback do mostruário atualizado', user.nome, { perfil: user.perfil, ocorrencia: form.ocorrencia_mostruario, fotos: form.fotos_mostruario })
      if (form.ocorrencia_mostruario.trim()) await repository.createPendencia({ peca_id: piece.id, descricao: form.ocorrencia_mostruario.trim(), area_responsavel: 'Qualidade', tipo_problema, gravidade, etapa_origem: 'mostruario', created_by: user.nome })
      await refresh(); setNotice('Feedback do mostruário salvo.')
    } catch (error) { setNotice(readError(error)) } finally { setSaving(false) }
  }

  async function resolvePending(item) {
    if (saving) return
    setSaving(true)
    try {
      await repository.resolvePendencia(item.id, user.nome)
      await repository.addEvent(item.peca_id, 'pendencia_resolvida', `Pendência resolvida: ${item.descricao}`, user.nome, { perfil: user.perfil, pendencia_id: item.id })
      const stillOpen = pendencias.some(other => other.peca_id === item.peca_id && other.id !== item.id && other.status === 'aberta')
      if (!stillOpen) await repository.updatePiece(item.peca_id, { saude_operacional: 'saudavel', updated_by: user.nome })
      await refresh(); setNotice('Pendência marcada como resolvida.')
    } catch (error) { setNotice(readError(error)) } finally { setSaving(false) }
  }

  async function changeArticleStatus(piece, reason) {
    if (saving) return
    setSaving(true)
    const archive = statusMode === 'archive'
    try {
      const timestamp = new Date().toISOString()
      await repository.updatePiece(piece.id, archive
        ? { ativa: false, motivo_arquivamento: reason, data_arquivamento: timestamp, arquivado_por: user.nome, updated_by: user.nome }
        : { ativa: true, motivo_arquivamento: null, data_arquivamento: null, arquivado_por: null, updated_by: user.nome })
      await repository.addEvent(piece.id, archive ? 'artigo_arquivado' : 'artigo_restaurado', archive ? `Artigo ${piece.artigo} arquivado: ${reason}` : `Artigo ${piece.artigo} restaurado`, user.nome, { perfil: user.perfil, motivo: archive ? reason : piece.motivo_arquivamento })
      setDetailPiece(null); setStatusPiece(null); await refresh()
      setNotice(archive ? 'Artigo arquivado com segurança.' : 'Artigo restaurado com sucesso.')
    } catch (error) { setNotice(readError(error)) } finally { setSaving(false) }
  }

  function openStatus(piece, mode) {
    setDetailPiece(null); setStatusPiece(piece); setStatusMode(mode)
  }

  if (!user) return <Login onEnter={setUser} />
  return <Layout user={user} view={view} setView={setView} pieces={pieces} pendencias={pendencias}>
    {view === 'dashboard' && <DashboardView pieces={pieces} pendencias={pendencias} events={events} onNavigate={setView} onNewArticle={() => { setFormPiece(undefined); setFormOpen(true) }} canEdit={canEdit} />}
    {view === 'artigos' && <ArticlesView pieces={pieces} archivedPieces={archivedPieces} query={query} setQuery={setQuery} canEdit={canEdit} onNew={() => { setFormPiece(undefined); setFormOpen(true) }} onOpen={setDetailPiece} onRestore={piece => openStatus(piece, 'restore')} />}
    {view === 'telao' && <TelaoView pieces={pieces} pendencias={pendencias} collectionOptions={collectionOptions} criticalityOptions={criticalityOptions} problemTypeOptions={problemTypeOptions} selectedId={selectedId} setSelectedId={setSelectedId} onCreatePending={createPending} saving={saving} />}
    {view === 'mostruario' && <MostruarioView pieces={pieces} problemTypeOptions={problemTypeOptions} selectedId={selectedId} setSelectedId={setSelectedId} onSave={saveMostruario} saving={saving} />}
    {view === 'radar' && <RadarView pieces={pieces} pendencias={pendencias} onResolve={resolvePending} saving={saving} />}
    {view === 'historico' && <HistoryView pieces={pieces} events={events} />}
    <ArticleDetailModal piece={detailPiece} canEdit={canEdit} onClose={() => setDetailPiece(null)} onArchive={piece => openStatus(piece, 'archive')} onEdit={piece => { setDetailPiece(null); setFormPiece(piece); setFormOpen(true) }} />
    <ArticleFormModal open={formOpen} piece={formPiece} collectionOptions={collectionOptions} lineOptions={lineOptions} categoryOptions={categoryOptions} materialOptions={materialOptions} attentionOptions={problemTypeOptions.filter(type => type !== 'Outro')} onClose={() => { if (!saving) { setFormOpen(false); setFormPiece(undefined) } }} onSave={saveArticle} saving={saving} />
    <ArticleStatusModal piece={statusPiece} mode={statusMode} onClose={() => { if (!saving) setStatusPiece(null) }} onConfirm={changeArticleStatus} saving={saving} />
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}</button>}
    {!repository.configured && <div className="env-note">Modo local · configure o Supabase no arquivo <code>.env</code></div>}
  </Layout>
}

function readError(error) {
  if (error?.code === '23505') return 'Este artigo já está cadastrado.'
  return error?.message || 'Não foi possível concluir a operação. Tente novamente.'
}
