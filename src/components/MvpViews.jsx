import { useEffect, useMemo, useState } from 'react'
import { AREAS, SEVERITIES, normalizeArticle } from '../config/mvp'

export function DashboardView({ pieces, pendencias, events, criticalityVotes = [], collectionOptions = [], selectedCollection, onCollectionChange, onNavigate, onNewArticle, canEdit }) {
  const collection = selectedCollection || 'todas'
  const collections = [...new Set([...collectionOptions, ...pieces.map(piece => piece.colecao)].filter(Boolean))]
  const filteredPieces = collection === 'todas' ? pieces : pieces.filter(piece => piece.colecao === collection)
  const byId = Object.fromEntries(filteredPieces.map(piece => [piece.id, piece]))
  const filteredPendencias = pendencias.filter(item => byId[item.peca_id])
  const filteredVotes = criticalityVotes.filter(vote => collection === 'todas' || vote.colecao === collection)
  const abertas = filteredPendencias.filter(item => item.status === 'aberta')
  const resolvidas = filteredPendencias.filter(item => item.status === 'resolvida')
  const criticas = filteredPieces.filter(piece => ['Alta', 'Crítica'].includes(piece.complexidade)).length
  const comMostruario = filteredPieces.filter(piece => piece.participa_mostruario === true).length
  const materialRank = rankCounts(abertas, item => byId[item.peca_id]?.mp_base || 'Não informada')
  const categoryProblemRank = rankCounts(abertas, item => byId[item.peca_id]?.categoria || 'Não informada')
  const areaRank = rankCounts(abertas, item => item.area_responsavel || 'Não informada')
  const problemRank = rankCounts(abertas, item => item.tipo_problema || 'Não classificado')
  const categoryComposition = rankCounts(filteredPieces, piece => piece.categoria || 'Não informada', 50)
  const sectorVotes = averageBy(filteredVotes, vote => vote.setor || 'Não informado')
  const collectionVotes = averageBy(filteredVotes, vote => vote.colecao || 'Não informada')
  const overallVote = filteredVotes.length ? filteredVotes.reduce((sum, vote) => sum + Number(vote.nota), 0) / filteredVotes.length : 0
  const recentPendings = [...filteredPendencias].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
  const kpis = [
    ['Artigos ativos', filteredPieces.length, collection === 'todas' ? 'Todas as coleções' : collection, 'artigos'],
    ['Pendências abertas', abertas.length, `${resolvidas.length} resolvida(s)`, 'radar'],
    ['Criticidade alta', criticas, 'Artigos que pedem atenção', 'radar'],
    ['Com mostruário', comMostruario, `${filteredPieces.filter(piece => piece.participa_mostruario === false).length} sem mostruário`, 'mostruario'],
  ]
  return <Page title="Visão Geral da Coleção" kicker="Dashboard operacional" description="Visão consolidada dos artigos, riscos e principais concentrações de pendências.">
    <section className="dashboard-collection-filter"><label>Coleção em análise<select value={collection} onChange={event => onCollectionChange(event.target.value)}><option value="todas">Todas as coleções</option>{collections.map(item => <option key={item}>{item}</option>)}</select></label><span>Os indicadores abaixo consideram {collection === 'todas' ? 'todas as coleções' : collection}.</span></section>
    <div className="dashboard-kpis">{kpis.map(([title, value, caption, target]) => <button key={title} className="kpi-card" onClick={() => onNavigate(target)}><span>{title}</span><strong>{String(value).padStart(2, '0')}</strong><small>{caption}</small><i>Ver detalhes →</i></button>)}</div>
    <section className="quick-actions"><h2>Ações rápidas</h2><div><button className="primary" disabled={!canEdit} onClick={onNewArticle}><b>＋</b><span>Novo artigo</span></button><button onClick={() => onNavigate('telao')}><b>▣</b><span>Abrir Passagem</span></button><button onClick={() => onNavigate('radar')}><b>◎</b><span>Ver Radar</span></button><button onClick={() => onNavigate('historico')}><b>◷</b><span>Histórico</span></button></div></section>
    <div className="insight-grid">
      <RankCard title="Malhas com mais problemas" subtitle="Pendências abertas por matéria-prima base" items={materialRank} empty="Nenhuma pendência vinculada a uma malha." />
      <RankCard title="Problemas mais citados" subtitle="Pendências abertas por tipo confirmado" items={problemRank} empty="Nenhum problema classificado." />
      <RankCard title="Categorias mais impactadas" subtitle="Pendências abertas por categoria" items={categoryProblemRank} empty="Nenhuma categoria possui pendência aberta." />
      <RankCard title="Áreas responsáveis" subtitle="Distribuição das pendências abertas" items={areaRank} empty="Nenhuma área possui pendência aberta." />
    </div>
    <section className="dashboard-section vote-dashboard"><header><div><small>PERCEPÇÃO DOS SETORES</small><h2>Criticidade percebida na passagem</h2><p>Notas anônimas de 1 a 5 registradas pelos participantes.</p></div><strong>{overallVote ? overallVote.toFixed(1) : '—'}<small> média geral</small></strong></header><div className="vote-dashboard-grid"><VoteAverage title="Média por setor" items={sectorVotes} /><VoteAverage title="Média por coleção" items={collectionVotes} /></div>{!filteredVotes.length && <p className="dashboard-empty">As avaliações feitas durante a apresentação aparecerão aqui.</p>}</section>
    <section className="dashboard-section"><header><div><small>COMPOSIÇÃO</small><h2>Artigos por categoria</h2></div><button onClick={() => onNavigate('artigos')}>Ver todos os artigos →</button></header><div className="category-summary">{categoryComposition.map(item => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span><small>{filteredPieces.length ? Math.round((item.value / filteredPieces.length) * 100) : 0}% da coleção</small></article>)}</div>{!categoryComposition.length && <p className="dashboard-empty">Nenhuma categoria cadastrada.</p>}</section>
    <section className="dashboard-section"><header><div><small>ACOMPANHAMENTO</small><h2>Apontamentos recentes</h2></div><button onClick={() => onNavigate('radar')}>Abrir Radar →</button></header><div className="dashboard-activity">{recentPendings.map(item => <article key={item.id}><span className={`activity-status ${item.status}`} /> <div><strong>{byId[item.peca_id]?.artigo} · {item.area_responsavel}</strong><p>{item.descricao}</p><small>{new Date(item.created_at).toLocaleString('pt-BR')} · {item.status === 'aberta' ? 'Pendente' : 'Resolvida'}</small></div></article>)}</div>{!recentPendings.length && <p className="dashboard-empty">Nenhum apontamento registrado.</p>}</section>
  </Page>
}

function averageBy(votes, getLabel) {
  const groups = votes.reduce((result, vote) => { const label = getLabel(vote); result[label] ||= []; result[label].push(Number(vote.nota)); return result }, {})
  return Object.entries(groups).map(([label, values]) => ({ label, value: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length })).sort((a, b) => b.value - a.value)
}

function VoteAverage({ title, items }) {
  return <div className="vote-average"><h3>{title}</h3>{items.map(item => <div key={item.label}><header><strong>{item.label}</strong><span>{item.value.toFixed(1)} <small>({item.count})</small></span></header><i><em style={{ width: `${(item.value / 5) * 100}%` }} /></i></div>)}</div>
}

function rankCounts(items, getLabel, limit = 5) {
  const counts = items.reduce((result, item) => { const label = getLabel(item); result[label] = (result[label] || 0) + 1; return result }, {})
  return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'pt-BR')).slice(0, limit)
}

function RankCard({ title, subtitle, items, empty }) {
  const max = Math.max(...items.map(item => item.value), 1)
  return <section className="rank-card"><header><h2>{title}</h2><p>{subtitle}</p></header>{items.length ? <div className="rank-list">{items.map((item, index) => <div key={item.label}><span>{String(index + 1).padStart(2, '0')}</span><section><header><strong>{item.label}</strong><b>{item.value}</b></header><i><em style={{ width: `${(item.value / max) * 100}%` }} /></i></section></div>)}</div> : <p className="dashboard-empty">{empty}</p>}</section>
}

export function ArticlesView({ pieces, archivedPieces, collectionOptions = [], selectedCollection, onCollectionChange, query, setQuery, onOpen, onNew, onRestore, canEdit }) {
  const [showArchived, setShowArchived] = useState(false)
  const collection = selectedCollection || 'todas'
  const source = showArchived ? archivedPieces : pieces
  const collections = [...new Set([...collectionOptions, ...pieces.map(piece => piece.colecao), ...archivedPieces.map(piece => piece.colecao)].filter(Boolean))]
  const activeCount = pieces.filter(piece => collection === 'todas' || piece.colecao === collection).length
  const archivedCount = archivedPieces.filter(piece => collection === 'todas' || piece.colecao === collection).length
  const filtered = source.filter(piece => (collection === 'todas' || piece.colecao === collection) && normalizeArticle([piece.artigo, piece.colecao, piece.linha, piece.categoria, piece.mp_base].filter(Boolean).join(' ')).includes(normalizeArticle(query)))
  return <Page title="Artigos da coleção" kicker="Preparação da Passagem" description="Busque um artigo existente ou cadastre um novo.">
    <div className="toolbar articles-toolbar"><label>Coleção<select value={collection} onChange={event => onCollectionChange(event.target.value)}><option value="todas">Todas as coleções</option>{collections.map(item => <option key={item}>{item}</option>)}</select></label><label className="article-search">Pesquisar artigos<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Artigo, linha, categoria ou matéria-prima" /></label><button className="primary" onClick={onNew} disabled={!canEdit} title={canEdit ? '' : 'Seu perfil possui acesso somente para consulta'}>+ Cadastrar artigo</button></div>
    {!canEdit && <div className="info-note">Seu perfil está em modo somente leitura para os dados da passagem.</div>}
    <div className="archive-tabs" role="tablist" aria-label="Situação dos artigos"><button className={!showArchived ? 'active' : ''} onClick={() => setShowArchived(false)}>Ativos <span>{activeCount}</span></button><button className={showArchived ? 'active' : ''} onClick={() => setShowArchived(true)}>Arquivados <span>{archivedCount}</span></button></div>
    <div className={`article-table ${showArchived ? 'archived-table' : 'active-table'}`}><div className="table-head"><span>Artigo</span><span>Coleção</span><span>{showArchived ? 'Arquivado por' : 'Criticidade'}</span>{showArchived && <span>Data</span>}<span /></div>{filtered.map(piece => showArchived ? <div className="table-row archived-row" key={piece.id}><ArticleIdentity piece={piece} /><span>{piece.colecao || '—'}</span><span>{piece.arquivado_por || '—'}</span><span>{piece.data_arquivamento ? new Date(piece.data_arquivamento).toLocaleDateString('pt-BR') : '—'}</span>{canEdit ? <button onClick={() => onRestore(piece)}>Restaurar</button> : <span>Somente leitura</span>}<p>{piece.motivo_arquivamento || 'Motivo não informado'}</p></div> : <button className="table-row" key={piece.id} onClick={() => onOpen(piece)}><ArticleIdentity piece={piece} /><span>{piece.colecao || '—'}</span><span className={`criticality criticality-${(piece.complexidade || 'Baixa').toLowerCase()}`}>{piece.complexidade || 'Baixa'}</span><span>Abrir →</span></button>)}</div>
    {!filtered.length && <Empty title={showArchived ? 'Nenhum artigo arquivado' : 'Nenhum artigo encontrado'} text={showArchived ? 'Os artigos arquivados aparecerão aqui e poderão ser restaurados.' : query ? 'Revise a busca ou cadastre um novo artigo.' : 'Cadastre o primeiro artigo da coleção.'} />}
  </Page>
}

export function TelaoView({ pieces, pendencias = [], criticalityVotes = [], collectionOptions = [], selectedCollection, onCollectionChange, criticalityOptions = [], problemTypeOptions, selectedId, setSelectedId, onCreatePending, onVote, saving }) {
  const [presentationMode, setPresentationMode] = useState(false)
  const [selectedCriticality, setSelectedCriticality] = useState('Todas')
  const [descricao, setDescricao] = useState('')
  const [area, setArea] = useState(AREAS[0])
  const [voteSector, setVoteSector] = useState('')
  const [voteScore, setVoteScore] = useState(0)
  const [problemType, setProblemType] = useState('')
  const [severity, setSeverity] = useState('')
  const [customProblem, setCustomProblem] = useState(false)
  const collections = useMemo(() => [...new Set([...collectionOptions, ...pieces.map(item => item.colecao)].filter(Boolean))], [collectionOptions, pieces])
  useEffect(() => { if (!selectedCollection || !collections.includes(selectedCollection)) onCollectionChange(collections[0] || '') }, [collections, selectedCollection, onCollectionChange])
  const collectionPieces = useMemo(() => pieces.filter(item => item.colecao === selectedCollection), [pieces, selectedCollection])
  const criticalities = useMemo(() => [...new Set([...criticalityOptions, ...pieces.map(item => item.complexidade || 'Baixa')].filter(Boolean))], [criticalityOptions, pieces])
  useEffect(() => { if (selectedCriticality !== 'Todas' && !criticalities.includes(selectedCriticality)) setSelectedCriticality('Todas') }, [criticalities, selectedCriticality])
  const presentationPieces = useMemo(() => collectionPieces.filter(item => selectedCriticality === 'Todas' || (item.complexidade || 'Baixa') === selectedCriticality), [collectionPieces, selectedCriticality])
  const piece = presentationPieces.find(item => item.id === selectedId) || presentationPieces[0]
  const pieceIndex = Math.max(0, presentationPieces.findIndex(item => item.id === piece?.id))
  const livePendings = useMemo(() => pendencias.filter(item => item.peca_id === piece?.id && item.status === 'aberta').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [pendencias, piece?.id])
  const pieceVotes = useMemo(() => criticalityVotes.filter(vote => vote.peca_id === piece?.id), [criticalityVotes, piece?.id])
  const voteAverage = pieceVotes.length ? pieceVotes.reduce((sum, vote) => sum + Number(vote.nota), 0) / pieceVotes.length : 0
  useEffect(() => { setVoteSector(''); setVoteScore(0) }, [piece?.id])
  useEffect(() => { if (piece?.id && piece.id !== selectedId) setSelectedId(piece.id) }, [piece?.id, selectedId, setSelectedId])
  useEffect(() => {
    if (!presentationMode) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') setPresentationMode(false) }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('presentation-open')
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.classList.remove('presentation-open') }
  }, [presentationMode])
  const selectRelative = direction => { if (!presentationPieces.length) return; const nextIndex = (pieceIndex + direction + presentationPieces.length) % presentationPieces.length; setSelectedId(presentationPieces[nextIndex].id) }
  return <Page title="Passagem de Coleção" kicker="Apresentação da coleção" description="Selecione a coleção e a criticidade para conduzir a apresentação dos artigos correspondentes.">
    <div className="passage-filters"><label>Coleção<select value={selectedCollection} onChange={event => { onCollectionChange(event.target.value); setSelectedCriticality('Todas') }}>{collections.map(collection => <option key={collection}>{collection}</option>)}</select></label><label>Criticidade<select value={selectedCriticality} onChange={event => setSelectedCriticality(event.target.value)}><option>Todas</option>{criticalities.map(item => <option key={item}>{item}</option>)}</select></label><span><strong>{presentationPieces.length}</strong> artigo(s) nesta seleção</span></div>
    {!piece ? <Empty title="Nenhum artigo nesta seleção" text="Escolha outra criticidade para continuar a passagem desta coleção." /> : <>
    <div className="presentation-toolbar"><PieceSelector pieces={presentationPieces} value={piece.id} onChange={setSelectedId} /><button className="primary" onClick={() => setPresentationMode(true)}>⛶ Modo apresentação</button></div>
    <div className="article-hero"><div><span>Artigo em apresentação</span><h2>{piece.artigo}</h2><p>{piece.linha || 'Linha não informada'} · {piece.colecao || 'Coleção não informada'}</p></div><div className="hero-badges"><span className={`criticality criticality-${(piece.complexidade || 'Baixa').toLowerCase()}`}>{piece.complexidade || 'Baixa'}</span><span className={`seal seal-${(piece.lacre || 'sem').toLowerCase()}`}>{piece.lacre || 'Sem lacre'}</span><span>{piece.participa_mostruario ? 'Mostruário' : 'Sem mostruário'}</span></div></div>
    <div className="presentation"><div className="presentation-image">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt={`Imagem do artigo ${piece.artigo} para a passagem`} /> : <span>Sem imagem cadastrada</span>}</div><div className="presentation-data"><small>ARTIGO</small><h2>{piece.artigo}</h2><dl><Data label="Coleção" value={piece.colecao} /><Data label="Linha" value={piece.linha} /><Data label="Complexidade" value={piece.complexidade} /><Data label="Lacre" value={piece.lacre} /><Data label="Matéria-prima" value={piece.mp_base} /><Data label="Categoria" value={piece.categoria} /><Data label="Mostruário" value={piece.participa_mostruario === true ? 'Mostruário' : piece.participa_mostruario === false ? 'Sem mostruário' : 'Não informado'} /></dl><section className="analyst-notes"><small>APONTAMENTO DA ANALISTA</small><p>{piece.observacoes || 'Nenhum apontamento registrado no cadastro.'}</p>{piece.pontos_atencao?.length > 0 && <div className="attention-tags">{piece.pontos_atencao.map(tag => <span key={tag}>{tag}</span>)}</div>}</section></div></div>
    {presentationMode && <div className="presentation-stage" role="dialog" aria-modal="true" aria-label={`Apresentação do artigo ${piece.artigo}`}><header><div><small>NEXUS · MODO APRESENTAÇÃO</small><h2>Artigo {piece.artigo}</h2><p>{piece.linha || 'Linha não informada'} · {piece.colecao || 'Coleção não informada'}</p><div className="presentation-stage-facts"><span><b>Categoria</b>{piece.categoria || '—'}</span><span><b>Matéria-prima</b>{piece.mp_base || '—'}</span><span><b>Classificação</b>{piece.tipo_peca || '—'}</span><span><b>Criticidade</b>{piece.complexidade || '—'}</span><span><b>Lacre</b>{piece.lacre || 'Sem lacre'}</span><span><b>Fluxo</b>{piece.participa_mostruario ? 'Mostruário' : 'Sem mostruário'}</span></div></div><button onClick={() => setPresentationMode(false)} aria-label="Fechar modo apresentação">Fechar ×</button></header><main><aside className="presentation-stage-notes"><small>OBSERVAÇÕES</small><p>{piece.observacoes || 'Nenhuma observação registrada no cadastro.'}</p></aside><section className="presentation-stage-media">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt={`Foto ou desenho técnico completo do artigo ${piece.artigo}`} /> : <div className="presentation-stage-empty">Sem foto ou desenho técnico cadastrado</div>}</section><aside className="presentation-stage-live"><header><div><small>RADAR EM TEMPO REAL</small><b>Apontamentos abertos</b></div><span>{livePendings.length}</span></header>{livePendings.length ? <div>{livePendings.map(item => <article key={item.id}><strong>{item.tipo_problema || 'Apontamento'}</strong><p>{item.descricao}</p><small>{item.area_responsavel} · {item.gravidade || 'Sem gravidade'} · {item.created_by || 'Usuário não informado'}</small></article>)}</div> : <p className="presentation-stage-no-pending">Nenhum apontamento aberto para este artigo.</p>}</aside></main><footer><button onClick={() => selectRelative(-1)}>← Anterior</button><strong>{String(pieceIndex + 1).padStart(2, '0')} <small>de {String(presentationPieces.length).padStart(2, '0')}</small></strong><button onClick={() => selectRelative(1)}>Próximo →</button></footer></div>}
    <div className="work-grid passage-work-grid"><section className="work-card pending-form"><h3>Novo apontamento</h3><label>Tipo do problema *<select value={customProblem ? '__new__' : problemType} onChange={event => { const isNew = event.target.value === '__new__'; setCustomProblem(isNew); setProblemType(isNew ? '' : event.target.value) }}><option value="">Selecione</option>{problemTypeOptions.map(item => <option key={item}>{item}</option>)}<option value="__new__">+ Cadastrar novo tipo</option></select></label>{customProblem && <label>Novo tipo do problema *<input value={problemType} onChange={event => setProblemType(event.target.value)} placeholder="Digite o novo tipo" /></label>}<label>Gravidade *<select value={severity} onChange={event => setSeverity(event.target.value)}><option value="">Selecione</option>{SEVERITIES.map(item => <option key={item}>{item}</option>)}</select></label><label>Área responsável *<select value={area} onChange={event => setArea(event.target.value)}>{AREAS.map(item => <option key={item}>{item}</option>)}</select></label><textarea value={descricao} onChange={event => setDescricao(event.target.value)} placeholder="Descreva a pendência ou ação necessária" /><button disabled={saving || !descricao.trim() || !problemType.trim() || !severity} onClick={async () => { const saved = await onCreatePending(piece, descricao.trim(), area, problemType.trim(), severity, 'apresentacao'); if (saved) { setDescricao(''); setProblemType(''); setSeverity(''); setCustomProblem(false) } }}>Registrar no Radar</button></section><section className="work-card criticality-vote"><header><div><small>AVALIAÇÃO DOS PARTICIPANTES</small><h3>Qual é a dificuldade real desta peça?</h3></div><strong>{voteAverage ? voteAverage.toFixed(1) : '—'}<small>{pieceVotes.length} voto(s)</small></strong></header><label>Seu setor *<select value={voteSector} onChange={event => setVoteSector(event.target.value)}><option value="">Selecione o setor</option>{AREAS.map(item => <option key={item}>{item}</option>)}</select></label><fieldset><legend>Nota de criticidade *</legend><div>{[1, 2, 3, 4, 5].map(score => <button type="button" key={score} className={voteScore === score ? 'active' : ''} onClick={() => setVoteScore(score)} aria-pressed={voteScore === score}><strong>{score}</strong><small>{['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'][score - 1]}</small></button>)}</div></fieldset><button className="primary" disabled={saving || !voteSector || !voteScore} onClick={async () => { const saved = await onVote(piece, voteSector, voteScore); if (saved) setVoteScore(0) }}>Registrar avaliação</button><p>Não é necessário informar o nome. O voto fica associado somente ao setor e pode ser atualizado neste dispositivo.</p></section></div>
    </>}
  </Page>
}

export function MostruarioView({ pieces, events = [], collectionOptions = [], selectedCollection, onCollectionChange, problemTypeOptions, selectedId, setSelectedId, onSave, saving }) {
  const [articleQuery, setArticleQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ feedback_tecnico: '', ocorrencia_mostruario: '', fotos_mostruario: [], setor: '', tipo_problema: '', gravidade: '', ciclo_mostruario_encerrado: false })
  const [customProblem, setCustomProblem] = useState(false)
  const [photoFiles, setPhotoFiles] = useState([])
  const [selectedImage, setSelectedImage] = useState('')
  const collections = useMemo(() => [...new Set([...collectionOptions, ...pieces.map(item => item.colecao)].filter(Boolean))], [collectionOptions, pieces])
  useEffect(() => { if (!selectedCollection || !collections.includes(selectedCollection)) onCollectionChange(collections[0] || '') }, [collections, selectedCollection, onCollectionChange])
  const collectionPieces = useMemo(() => pieces.filter(item => item.colecao === selectedCollection && item.participa_mostruario === true), [pieces, selectedCollection])
  const filteredPieces = useMemo(() => { const normalized = normalizeArticle(articleQuery); if (!normalized) return collectionPieces; return collectionPieces.filter(item => normalizeArticle([item.artigo, item.linha, item.categoria, item.mp_base].filter(Boolean).join(' ')).includes(normalized)) }, [collectionPieces, articleQuery])
  const piece = filteredPieces.find(item => item.id === selectedId) || filteredPieces[0]
  const sampleEntries = useMemo(() => events.filter(event => event.peca_id === piece?.id && ['registro_mostruario', 'feedback_mostruario'].includes(event.tipo_evento)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [events, piece?.id])
  useEffect(() => { if (piece?.id && piece.id !== selectedId) setSelectedId(piece.id) }, [piece?.id, selectedId, setSelectedId])
  useEffect(() => { setFormOpen(false); setForm({ feedback_tecnico: '', ocorrencia_mostruario: '', fotos_mostruario: piece?.fotos_mostruario || [], setor: '', tipo_problema: '', gravidade: '', ciclo_mostruario_encerrado: Boolean(piece?.ciclo_mostruario_encerrado) }); setCustomProblem(false); setPhotoFiles([]) }, [piece])
  const photoPreviews = useMemo(() => photoFiles.map(file => ({ file, url: URL.createObjectURL(file) })), [photoFiles])
  useEffect(() => () => photoPreviews.forEach(item => URL.revokeObjectURL(item.url)), [photoPreviews])
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  return <Page title="Acompanhamento de Mostruário" kicker="Produção do mostruário" description="Registre observações, dúvidas, fotos e problemas durante a produção dos mostruários.">
    <section className="sample-search"><label>Coleção<select value={selectedCollection} onChange={event => { onCollectionChange(event.target.value); setArticleQuery('') }}>{collections.map(collection => <option key={collection}>{collection}</option>)}</select></label><label>Pesquisar artigo<input type="search" value={articleQuery} onChange={event => setArticleQuery(event.target.value)} placeholder="Código, linha, categoria ou matéria-prima" /></label><span><strong>{filteredPieces.length}</strong> artigo(s) encontrado(s)</span></section>
    {piece ? <><PieceSelector pieces={filteredPieces} value={piece.id} onChange={setSelectedId} />
    <div className="work-card sample-records">
      <header className="sample-article-header"><div><small>ARTIGO SELECIONADO</small><h2>{piece.artigo}</h2><p>{piece.linha || 'Linha não informada'} · {piece.colecao}</p></div><span>{piece.categoria || 'Sem categoria'}</span></header>
      <div className="sample-records-toolbar"><div><h3>Apontamentos do mostruário</h3><p>Cada foto permanece vinculada à observação registrada com ela.</p></div><button className="primary" onClick={() => setFormOpen(true)}>+ Cadastrar apontamento</button></div>
      {sampleEntries.length ? <div className="sample-entry-list">{sampleEntries.map(entry => { const extras = entry.dados_extras || {}; const photos = extras.foto ? [extras.foto] : (extras.fotos || []); return <article key={entry.id}>{photos.length > 0 && <div className="sample-entry-photos">{photos.map((photo, index) => <button type="button" key={photo} onClick={() => setSelectedImage(photo)}><img src={photo} alt={`Foto ${index + 1} do apontamento de ${extras.setor || 'mostruário'}`} /></button>)}</div>}<section><header><strong>{extras.setor || 'Setor não informado'}</strong><time>{new Date(entry.created_at).toLocaleString('pt-BR')}</time></header><p>{extras.ocorrencia || extras.registro || entry.descricao}</p><small>Registrado por {entry.usuario || 'usuário não informado'}</small></section></article> })}</div> : <Empty title="Nenhum apontamento registrado" text="Use “Cadastrar apontamento” para incluir a primeira foto com seu registro." />}
    </div>
    {formOpen && <div className="work-card form-stack sample-entry-form">
      <header><div><small>NOVO REGISTRO</small><h3>Cadastrar apontamento</h3></div><button type="button" className="secondary" onClick={() => setFormOpen(false)}>Cancelar</button></header>
      <label>Setor responsável pelo registro *<select value={form.setor} onChange={event => update('setor', event.target.value)}><option value="">Selecione o setor</option>{AREAS.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="sample-photo-upload">Foto do apontamento *<input type="file" accept="image/*" onChange={event => setPhotoFiles(Array.from(event.target.files || []).slice(0, 1))} /><span>Escolha uma foto do computador ou celular · máximo 10 MB</span></label>
      {photoPreviews.length > 0 && <div className="sample-photo-grid">{photoPreviews.map(({ file, url }) => <article key={`${file.name}-${file.lastModified}`}><img src={url} alt={`Nova foto ${file.name}`} /><button type="button" onClick={() => setPhotoFiles([])}>Remover</button></article>)}</div>}
      <label>Apontamento de ajuste, ocorrência ou problema *<textarea value={form.ocorrencia_mostruario} onChange={event => update('ocorrencia_mostruario', event.target.value)} placeholder="Descreva o que aconteceu e qual ação pode ser necessária" /></label>
      <div className="classification-grid"><label>Tipo do problema *<select value={customProblem ? '__new__' : form.tipo_problema} onChange={event => { const isNew = event.target.value === '__new__'; setCustomProblem(isNew); update('tipo_problema', isNew ? '' : event.target.value) }}><option value="">Selecione</option>{problemTypeOptions.map(item => <option key={item}>{item}</option>)}<option value="__new__">+ Cadastrar novo tipo</option></select></label>{customProblem && <label>Novo tipo do problema *<input value={form.tipo_problema} onChange={event => update('tipo_problema', event.target.value)} placeholder="Digite o novo tipo" /></label>}<label>Gravidade *<select value={form.gravidade} onChange={event => update('gravidade', event.target.value)}><option value="">Selecione</option>{SEVERITIES.map(item => <option key={item}>{item}</option>)}</select></label></div>
      <label className="check-line"><input type="checkbox" checked={form.ciclo_mostruario_encerrado} onChange={event => update('ciclo_mostruario_encerrado', event.target.checked)} /> Encerrar ciclo do artigo no mostruário</label>
      <button className="primary" disabled={saving || !form.setor || !form.ocorrencia_mostruario.trim() || !form.tipo_problema.trim() || !form.gravidade || photoFiles.length !== 1} onClick={async () => { const saved = await onSave(piece, { ...form, tipo_problema: form.tipo_problema.trim() }, photoFiles); if (saved) { setPhotoFiles([]); setFormOpen(false); setForm(current => ({ ...current, feedback_tecnico: '', ocorrencia_mostruario: '', setor: '', tipo_problema: '', gravidade: '' })) } }}>Salvar apontamento</button>
    </div>}{selectedImage && <ImageViewer src={selectedImage} onClose={() => setSelectedImage('')} />}</> : <Empty title="Nenhum artigo encontrado nesta coleção" text={articleQuery ? 'Revise a pesquisa ou escolha outra coleção.' : 'Cadastre artigos nesta coleção antes de iniciar o mostruário.'} />}
  </Page>
}

export function RadarView({ pieces, pendencias, events = [], collectionOptions = [], selectedCollection, onCollectionChange, criticalityOptions = [], onResolve, saving }) {
  const [status, setStatus] = useState('aberta')
  const collection = selectedCollection || 'todas'
  const [criticality, setCriticality] = useState('todas')
  const [resolvingItem, setResolvingItem] = useState(null)
  const [resolution, setResolution] = useState('')
  const [resolutionFiles, setResolutionFiles] = useState([])
  const [selectedImage, setSelectedImage] = useState('')
  const resolutionPreviews = useMemo(() => resolutionFiles.map(file => ({ file, url: URL.createObjectURL(file) })), [resolutionFiles])
  useEffect(() => () => resolutionPreviews.forEach(item => URL.revokeObjectURL(item.url)), [resolutionPreviews])
  const radarPendencias = useMemo(() => pendencias.map(item => {
    if (item.fotos?.length) return item
    const sourceEvent = events.find(event => {
      const extras = event.dados_extras || {}
      return event.peca_id === item.peca_id && ['registro_mostruario', 'feedback_mostruario'].includes(event.tipo_evento) && extras.ocorrencia?.trim() === item.descricao?.trim()
    })
    const extras = sourceEvent?.dados_extras || {}
    const recoveredPhotos = extras.fotos?.length ? extras.fotos : (extras.foto ? [extras.foto] : [])
    return recoveredPhotos.length ? { ...item, fotos: recoveredPhotos } : item
  }), [pendencias, events])
  const byId = Object.fromEntries(pieces.map(piece => [piece.id, piece]))
  const collections = [...new Set([...collectionOptions, ...pieces.map(piece => piece.colecao)].filter(Boolean))]
  const criticalities = [...new Set([...criticalityOptions, ...pieces.map(piece => piece.complexidade || 'Baixa')].filter(Boolean))]
  const filtered = radarPendencias.filter(item => { const piece = byId[item.peca_id]; return (status === 'todas' || item.status === status) && (collection === 'todas' || piece?.colecao === collection) && (criticality === 'todas' || (piece?.complexidade || 'Baixa') === criticality) })
  const groups = Object.values(filtered.reduce((result, item) => { const piece = byId[item.peca_id]; const key = item.peca_id; result[key] ||= { piece, items: [] }; result[key].items.push(item); return result }, {})).sort((a, b) => criticalityWeight(b.piece?.complexidade) - criticalityWeight(a.piece?.complexidade) || b.items.length - a.items.length)
  return <Page title="Radar Operacional" kicker="Riscos e pendências" description="Acompanhe ações necessárias e atualize o que já foi resolvido.">
    <section className="radar-filters"><label>Coleção<select value={collection} onChange={event => onCollectionChange(event.target.value)}><option value="todas">Todas as coleções</option>{collections.map(item => <option key={item}>{item}</option>)}</select></label><label>Criticidade do artigo<select value={criticality} onChange={event => setCriticality(event.target.value)}><option value="todas">Todas as criticidades</option>{criticalities.map(item => <option key={item}>{item}</option>)}</select></label><label>Situação<select value={status} onChange={event => setStatus(event.target.value)}><option value="aberta">Pendências abertas</option><option value="resolvida">Pendências resolvidas</option><option value="todas">Todas</option></select></label><span><strong>{groups.length}</strong> artigo(s)<small>{filtered.length} pendência(s)</small></span></section>
    <div className="radar-article-list">{groups.map(({ piece, items }) => <article className="radar-article-card" key={piece?.id || items[0].peca_id}><header><ArticleIdentity piece={piece || { artigo: 'Artigo removido' }} /><div><span className={`criticality criticality-${(piece?.complexidade || 'Baixa').toLowerCase()}`}>{piece?.complexidade || 'Não informada'}</span><b>{items.length} pendência(s)</b></div></header><section>{items.sort((a, b) => severityWeight(b.gravidade) - severityWeight(a.gravidade) || new Date(a.created_at) - new Date(b.created_at)).map(item => <div className={`radar-pending-row ${item.status}`} key={item.id}><div><div className="pending-tags"><span>{item.tipo_problema || 'Não classificado'}</span><span className={`severity-${(item.gravidade || 'nao-informada').toLowerCase().replace('é', 'e')}`}>{item.gravidade || 'Gravidade não informada'}</span><span>{item.area_responsavel || 'Setor não informado'}</span></div><h3>{item.descricao}</h3>{item.fotos?.length > 0 && <div className="radar-photo-strip">{item.fotos.map((photo, index) => <button type="button" key={photo} onClick={() => setSelectedImage(photo)}><img src={photo} alt={`Foto ${index + 1} da pendência`} /></button>)}</div>}<p>{new Date(item.created_at).toLocaleString('pt-BR')} · {item.etapa_origem || 'Etapa não informada'}</p>{item.status === 'resolvida' && item.resolucao_descricao && <div className="resolution-summary"><b>Solução registrada</b><p>{item.resolucao_descricao}</p>{item.fotos_resolucao?.length > 0 && <div className="radar-photo-strip">{item.fotos_resolucao.map((photo, index) => <button type="button" key={photo} onClick={() => setSelectedImage(photo)}><img src={photo} alt={`Foto ${index + 1} da solução`} /></button>)}</div>}</div>}</div>{item.status === 'aberta' ? <button disabled={saving} onClick={() => { setResolvingItem(item); setResolution(''); setResolutionFiles([]) }}>Registrar solução</button> : <span>Resolvida por {item.resolved_by || '—'}</span>}</div>)}</section></article>)}</div>
    {!filtered.length && <Empty title="Nenhuma pendência nesta visualização" text="Revise os filtros ou aguarde novos apontamentos da Passagem e do Mostruário." />}
    {resolvingItem && <div className="modal-backdrop"><section className="modal resolution-modal" role="dialog" aria-modal="true" aria-label="Registrar solução da pendência"><header><div><small>CONCLUSÃO DA PENDÊNCIA</small><h2>Registrar solução</h2></div><button onClick={() => setResolvingItem(null)} aria-label="Fechar">×</button></header><div className="modal-body form-stack"><div className="resolution-origin"><b>Problema registrado</b><p>{resolvingItem.descricao}</p></div><label>O que foi feito para resolver? *<textarea value={resolution} onChange={event => setResolution(event.target.value)} placeholder="Descreva a correção executada e o resultado obtido" /></label><label className="sample-photo-upload">Fotos da solução (opcional)<input type="file" accept="image/*" multiple onChange={event => setResolutionFiles(Array.from(event.target.files || []))} /><span>Se houver, envie fotos que ajudem a comprovar o resultado</span></label>{resolutionPreviews.length > 0 && <div className="sample-photo-grid">{resolutionPreviews.map(({ file, url }) => <article key={`${file.name}-${file.lastModified}`}><img src={url} alt={`Foto da solução ${file.name}`} /><button type="button" onClick={() => setResolutionFiles(current => current.filter(item => item !== file))}>Remover</button></article>)}</div>}</div><footer className="modal-actions"><button onClick={() => setResolvingItem(null)}>Cancelar</button><button className="primary" disabled={saving || !resolution.trim()} onClick={async () => { const saved = await onResolve(resolvingItem, resolution.trim(), resolutionFiles); if (saved) { setResolvingItem(null); setResolution(''); setResolutionFiles([]) } }}>Confirmar como resolvida</button></footer></section></div>}
    {selectedImage && <ImageViewer src={selectedImage} onClose={() => setSelectedImage('')} />}
  </Page>
}

function criticalityWeight(value) { return ({ Crítica: 4, Alta: 3, Moderada: 2, Média: 2, Baixa: 1 }[value] || 0) }
function severityWeight(value) { return ({ Alta: 3, Média: 2, Baixa: 1 }[value] || 0) }

export function HistoryView({ pieces, events, collectionOptions = [], selectedCollection = 'todas', onCollectionChange }) {
  const [pieceId, setPieceId] = useState('todas')
  const byId = Object.fromEntries(pieces.map(piece => [piece.id, piece]))
  const collection = selectedCollection || 'todas'
  const collectionPieces = collection === 'todas' ? pieces : pieces.filter(piece => piece.colecao === collection)
  const collectionPieceIds = new Set(collectionPieces.map(piece => piece.id))
  const collectionEvents = collection === 'todas' ? events : events.filter(event => collectionPieceIds.has(event.peca_id))
  const filtered = pieceId === 'todas' ? collectionEvents : collectionEvents.filter(event => event.peca_id === pieceId)
  useEffect(() => { if (pieceId !== 'todas' && !collectionPieceIds.has(pieceId)) setPieceId('todas') }, [collection, pieceId])
  return <Page title="Histórico da Coleção" kicker="Rastreabilidade" description="Consulte alterações, decisões, feedbacks e responsáveis.">
    <div className="toolbar"><label>Coleção<select value={collection} onChange={event => onCollectionChange?.(event.target.value)}><option value="todas">Todas as coleções</option>{collectionOptions.map(item => <option key={item}>{item}</option>)}</select></label><label>Artigo<select value={pieceId} onChange={event => setPieceId(event.target.value)}><option value="todas">Todos os artigos</option>{collectionPieces.map(piece => <option value={piece.id} key={piece.id}>{piece.artigo}</option>)}</select></label><span>{filtered.length} evento(s)</span></div>
    <div className="history-list">{filtered.map(event => <article key={event.id}><i /><div><small>{byId[event.peca_id]?.artigo || 'Artigo'} · {event.tipo_evento.replaceAll('_', ' ')}</small><h3>{event.descricao}</h3><p>{event.usuario} · {new Date(event.created_at).toLocaleString('pt-BR')}</p></div></article>)}</div>
    {!filtered.length && <Empty title="Nenhum evento registrado" text="As ações realizadas nos módulos serão exibidas aqui." />}
  </Page>
}

function Page({ title, kicker, description, children }) { return <section className="page"><header className="page-header"><div><small>{kicker}</small><h1>{title}</h1>{description && <p>{description}</p>}</div></header>{children}</section> }
function Empty({ title, text }) { return <div className="empty"><span>—</span><h2>{title}</h2><p>{text}</p></div> }
function PieceSelector({ pieces, value, onChange }) { return <label className="piece-selector">Artigo<select value={value} onChange={event => onChange(event.target.value)}>{pieces.map(piece => <option key={piece.id} value={piece.id}>{piece.artigo} · {piece.colecao || 'Sem coleção'}</option>)}</select></label> }
function Data({ label, value }) { return <div><dt>{label}</dt><dd>{value || '—'}</dd></div> }
function ImageViewer({ src, onClose }) { return <div className="image-viewer" role="dialog" aria-modal="true" aria-label="Visualização ampliada da foto" onClick={onClose}><button onClick={onClose} aria-label="Fechar foto">Fechar ×</button><img src={src} alt="Visualização ampliada" onClick={event => event.stopPropagation()} /></div> }
function ArticleIdentity({ piece }) { return <span className="article-identity">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt="" /> : <i aria-hidden="true">◇</i>}<span><strong>{piece.artigo}</strong><small>{piece.linha || piece.categoria || 'Sem classificação'}</small></span></span> }
