import { useCallback, useEffect, useMemo, useState } from 'react'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { ArticleDetailModal, ArticleFormModal, ArticleStatusModal } from './components/Modals'
import { ArticlesView, DashboardView, HistoryView, MostruarioView, RadarView, TelaoView } from './components/MvpViews'
import { canEditTechnical, CRITICALITIES, normalizeArticle } from './config/mvp'
import { PROBLEM_TYPES } from './config/mvp'
import { repository } from './services/repository'

const EDITABLE_FIELDS = ['colecao', 'linha', 'categoria', 'mp_base', 'tipo_peca', 'complexidade', 'lacre', 'participa_mostruario', 'pontos_atencao', 'desenho_tecnico_url', 'anexos', 'observacoes']
const DEFAULT_LINES = ['Adulto Feminino', 'Adulto Masculino', 'Cápsula', 'Íntima', 'Kids Menina', 'Kids Menino', 'Teen']
const DEFAULT_CATEGORIES = ['Blusas e Camisetas', 'Calças', 'Camisas e Polo', 'Jaquetas e Casacos', 'Regatas', 'Saias', 'Shorts e Bermudas', 'Vestidos', 'Pijamas', 'Conjuntos Longos', 'Conjuntos Curtos', 'Camisola + Cardigan', 'Camisola', 'Ceroula', 'Samba-canção']

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('dashboard')
  const [pieces, setPieces] = useState([])
  const [archivedPieces, setArchivedPieces] = useState([])
  const [events, setEvents] = useState([])
  const [pendencias, setPendencias] = useState([])
  const [criticalityVotes, setCriticalityVotes] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [detailPiece, setDetailPiece] = useState(null)
  const [formPiece, setFormPiece] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [statusPiece, setStatusPiece] = useState(null)
  const [statusMode, setStatusMode] = useState('archive')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [activeCollection, setActiveCollection] = useState(() => localStorage.getItem('nexus-selected-collection') || localStorage.getItem('nexus-dashboard-collection') || '')

  const refresh = useCallback(async () => {
    const [pieceData, archivedData, eventData, pendingData, voteData] = await Promise.all([repository.listPieces(), repository.listArchivedPieces(), repository.listAllEvents(), repository.listPendencias(), repository.listVotes()])
    setPieces(pieceData); setArchivedPieces(archivedData); setEvents(eventData); setPendencias(pendingData); setCriticalityVotes(voteData)
    setSelectedId(current => current || pieceData[0]?.id || '')
  }, [])

  useEffect(() => { if (!user) return; refresh().catch(error => setNotice(readError(error))) }, [user, refresh])
  useEffect(() => {
    if (!user) return undefined
    return repository.subscribePendencias(() => repository.listPendencias().then(setPendencias).catch(error => setNotice(readError(error))))
  }, [user])
  useEffect(() => {
    if (!user) return undefined
    return repository.subscribeVotes(() => repository.listVotes().then(setCriticalityVotes).catch(error => setNotice(readError(error))))
  }, [user])
  const canEdit = useMemo(() => canEditTechnical(user?.perfil), [user])
  const collectionOptions = useMemo(() => [...new Set(['INVERNO 27', 'VERÃO 27', 'ALTO VERÃO 28', ...pieces.map(piece => piece.colecao), ...archivedPieces.map(piece => piece.colecao)].filter(Boolean))], [pieces, archivedPieces])
  const criticalityOptions = useMemo(() => [...new Set([...CRITICALITIES, ...pieces.map(piece => piece.complexidade), ...archivedPieces.map(piece => piece.complexidade)].filter(Boolean))], [pieces, archivedPieces])
  const lineOptions = useMemo(() => [...new Set([...DEFAULT_LINES, ...pieces.map(piece => piece.linha), ...archivedPieces.map(piece => piece.linha)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [pieces, archivedPieces])
  const categoryOptions = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...pieces.map(piece => piece.categoria), ...archivedPieces.map(piece => piece.categoria)].filter(Boolean))], [pieces, archivedPieces])
  const materialOptions = useMemo(() => [...new Set([...pieces.map(piece => piece.mp_base), ...archivedPieces.map(piece => piece.mp_base)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [pieces, archivedPieces])
  const problemTypeOptions = useMemo(() => [...new Set([...PROBLEM_TYPES, ...pieces.flatMap(piece => piece.pontos_atencao || []), ...archivedPieces.flatMap(piece => piece.pontos_atencao || []), ...pendencias.map(item => item.tipo_problema)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [pieces, archivedPieces, pendencias])
  useEffect(() => {
    if (!collectionOptions.length || activeCollection === 'todas' || collectionOptions.includes(activeCollection)) return
    const latestCollection = collectionOptions[collectionOptions.length - 1]
    setActiveCollection(latestCollection)
    localStorage.setItem('nexus-selected-collection', latestCollection)
  }, [activeCollection, collectionOptions])
  function chooseActiveCollection(value) { setActiveCollection(value); localStorage.setItem('nexus-selected-collection', value) }
  const operationalCollection = activeCollection === 'todas' ? collectionOptions[collectionOptions.length - 1] || '' : activeCollection

  async function saveArticle(form, technicalFile, attachmentFiles = []) {
    if (saving) return
    setSaving(true)
    try {
      if (!formPiece) {
        const duplicate = pieces.find(piece => normalizeArticle(piece.artigo) === normalizeArticle(form.artigo))
        if (duplicate) { setFormOpen(false); setDetailPiece(duplicate); throw new Error('Este artigo já está cadastrado. A ficha existente foi aberta.') }
      }
      const drawingUrl = technicalFile ? await repository.uploadTechnicalDrawing(technicalFile) : form.desenho_tecnico_url
      const uploadedAttachments = await repository.uploadArticleAttachments(attachmentFiles)
      const preparedForm = { ...form, desenho_tecnico_url: drawingUrl || null, anexos: [...(form.anexos || []), ...uploadedAttachments] }
      if (!formPiece) {
        const created = await repository.createPiece(preparedForm, user.nome)
        await repository.addEvent(created.id, 'artigo_cadastrado', `Artigo ${created.artigo} cadastrado`, user.nome, { perfil: user.perfil })
        setNotice('Artigo cadastrado com sucesso.')
      } else {
        const updates = Object.fromEntries(EDITABLE_FIELDS.map(key => [key, preparedForm[key] ?? null]))
        const changes = Object.fromEntries(EDITABLE_FIELDS.filter(key => JSON.stringify(formPiece[key] ?? null) !== JSON.stringify(preparedForm[key] ?? null)).map(key => [key, { antes: formPiece[key] ?? null, depois: preparedForm[key] ?? null }]))
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

  async function saveCriticalityVote(piece, sector, score) {
    if (saving) return false
    setSaving(true)
    try {
      const storageKey = 'nexus-voter-token'
      let voterToken = localStorage.getItem(storageKey)
      if (!voterToken) { voterToken = crypto.randomUUID(); localStorage.setItem(storageKey, voterToken) }
      await repository.saveCriticalityVote({ peca_id: piece.id, colecao: piece.colecao || 'Não informada', setor: sector, nota: Number(score), voter_token: voterToken })
      await repository.addEvent(piece.id, 'voto_criticidade', `Criticidade avaliada pelo setor ${sector}: nota ${score}`, `Setor: ${sector}`, { setor: sector, nota: Number(score) })
      setCriticalityVotes(await repository.listVotes())
      setNotice('Avaliação de criticidade registrada. Você pode atualizar sua nota quando precisar.')
      return true
    } catch (error) { setNotice(readError(error)); return false } finally { setSaving(false) }
  }

  async function saveMostruario(piece, form, photoFiles = []) {
    if (saving) return false
    setSaving(true)
    try {
      const uploadedPhotos = await repository.uploadSamplePhotos(photoFiles)
      const preparedForm = { ...form, feedback_tecnico: form.feedback_tecnico.trim() || piece.feedback_tecnico || '', ocorrencia_mostruario: form.ocorrencia_mostruario.trim() || piece.ocorrencia_mostruario || '', fotos_mostruario: [...new Set([...(form.fotos_mostruario || []), ...uploadedPhotos])] }
      const { tipo_problema, gravidade, setor, ...pieceUpdates } = preparedForm
      await repository.updatePiece(piece.id, { ...pieceUpdates, fluxo_atual: form.ciclo_mostruario_encerrado ? 'pos' : 'mostruario', updated_by: user.nome })
      await repository.addEvent(piece.id, 'registro_mostruario', form.ciclo_mostruario_encerrado ? 'Apontamento salvo e ciclo do mostruário encerrado' : 'Novo apontamento do mostruário', user.nome, { perfil: user.perfil, setor, registro: form.feedback_tecnico, ocorrencia: form.ocorrencia_mostruario, foto: uploadedPhotos[0] || null, fotos: uploadedPhotos })
      const hasNewOccurrence = Boolean(form.ocorrencia_mostruario.trim())
      if (hasNewOccurrence) await repository.createPendencia({ peca_id: piece.id, descricao: form.ocorrencia_mostruario.trim(), area_responsavel: setor, tipo_problema, gravidade, etapa_origem: 'mostruario', fotos: uploadedPhotos, created_by: user.nome })
      await refresh(); setNotice('Feedback do mostruário salvo.')
      return true
    } catch (error) { setNotice(readError(error)); return false } finally { setSaving(false) }
  }

  async function resolvePending(item, resolution, photoFiles = []) {
    if (saving) return false
    setSaving(true)
    try {
      const resolutionPhotos = await repository.uploadSamplePhotos(photoFiles)
      await repository.resolvePendencia(item.id, user.nome, resolution, resolutionPhotos)
      await repository.addEvent(item.peca_id, 'pendencia_resolvida', `Pendência resolvida: ${item.descricao}`, user.nome, { perfil: user.perfil, pendencia_id: item.id, resolucao: resolution, fotos: resolutionPhotos })
      const stillOpen = pendencias.some(other => other.peca_id === item.peca_id && other.id !== item.id && other.status === 'aberta')
      if (!stillOpen) await repository.updatePiece(item.peca_id, { saude_operacional: 'saudavel', updated_by: user.nome })
      await refresh(); setNotice('Pendência marcada como resolvida.')
      return true
    } catch (error) { setNotice(readError(error)); return false } finally { setSaving(false) }
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
    {view === 'dashboard' && <DashboardView pieces={pieces} pendencias={pendencias} events={events} criticalityVotes={criticalityVotes} collectionOptions={collectionOptions} selectedCollection={activeCollection} onCollectionChange={chooseActiveCollection} onNavigate={setView} onNewArticle={() => { setFormPiece(undefined); setFormOpen(true) }} canEdit={canEdit} />}
    {view === 'artigos' && <ArticlesView pieces={pieces} archivedPieces={archivedPieces} collectionOptions={collectionOptions} selectedCollection={activeCollection} onCollectionChange={chooseActiveCollection} query={query} setQuery={setQuery} canEdit={canEdit} onNew={() => { setFormPiece(undefined); setFormOpen(true) }} onOpen={setDetailPiece} onRestore={piece => openStatus(piece, 'restore')} />}
    {view === 'telao' && <TelaoView pieces={pieces} pendencias={pendencias} criticalityVotes={criticalityVotes} collectionOptions={collectionOptions} selectedCollection={operationalCollection} onCollectionChange={chooseActiveCollection} criticalityOptions={criticalityOptions} problemTypeOptions={problemTypeOptions} selectedId={selectedId} setSelectedId={setSelectedId} onCreatePending={createPending} onVote={saveCriticalityVote} saving={saving} />}
    {view === 'mostruario' && <MostruarioView pieces={pieces} events={events} collectionOptions={collectionOptions} selectedCollection={operationalCollection} onCollectionChange={chooseActiveCollection} problemTypeOptions={problemTypeOptions} selectedId={selectedId} setSelectedId={setSelectedId} onSave={saveMostruario} saving={saving} />}
    {view === 'radar' && <RadarView pieces={pieces} pendencias={pendencias} events={events} collectionOptions={collectionOptions} selectedCollection={activeCollection} onCollectionChange={chooseActiveCollection} criticalityOptions={criticalityOptions} onResolve={resolvePending} saving={saving} />}
    {view === 'historico' && <HistoryView pieces={pieces} events={events} collectionOptions={collectionOptions} selectedCollection={activeCollection} onCollectionChange={chooseActiveCollection} />}
    <ArticleDetailModal piece={detailPiece} canEdit={canEdit} onClose={() => setDetailPiece(null)} onArchive={piece => openStatus(piece, 'archive')} onEdit={piece => { setDetailPiece(null); setFormPiece(piece); setFormOpen(true) }} />
    <ArticleFormModal open={formOpen} piece={formPiece} defaultCollection={operationalCollection} collectionOptions={collectionOptions} lineOptions={lineOptions} categoryOptions={categoryOptions} materialOptions={materialOptions} attentionOptions={problemTypeOptions.filter(type => type !== 'Outro')} onClose={() => { if (!saving) { setFormOpen(false); setFormPiece(undefined) } }} onSave={saveArticle} saving={saving} />
    <ArticleStatusModal piece={statusPiece} mode={statusMode} onClose={() => { if (!saving) setStatusPiece(null) }} onConfirm={changeArticleStatus} saving={saving} />
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}</button>}
    {!repository.configured && <div className="env-note">Modo local · configure o Supabase no arquivo <code>.env</code></div>}
  </Layout>
}

function readError(error) {
  if (error?.code === '23505') return 'Este artigo já está cadastrado.'
  return error?.message || 'Não foi possível concluir a operação. Tente novamente.'
}
