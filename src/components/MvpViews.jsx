import { useEffect, useMemo, useState } from 'react'
import { AREAS, SEVERITIES, normalizeArticle } from '../config/mvp'

export function DashboardView({ pieces, pendencias, events, onNavigate, onNewArticle, canEdit }) {
  const byId = Object.fromEntries(pieces.map(piece => [piece.id, piece]))
  const abertas = pendencias.filter(item => item.status === 'aberta' && byId[item.peca_id])
  const resolvidas = pendencias.filter(item => item.status === 'resolvida' && byId[item.peca_id])
  const criticas = pieces.filter(piece => ['Alta', 'Crítica'].includes(piece.complexidade)).length
  const comMostruario = pieces.filter(piece => piece.participa_mostruario === true).length
  const materialRank = rankCounts(abertas, item => byId[item.peca_id]?.mp_base || 'Não informada')
  const categoryProblemRank = rankCounts(abertas, item => byId[item.peca_id]?.categoria || 'Não informada')
  const areaRank = rankCounts(abertas, item => item.area_responsavel || 'Não informada')
  const problemRank = rankCounts(abertas, item => item.tipo_problema || 'Não classificado')
  const categoryComposition = rankCounts(pieces, piece => piece.categoria || 'Não informada', 50)
  const recentPendings = [...pendencias].filter(item => byId[item.peca_id]).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
  const kpis = [
    ['Artigos ativos', pieces.length, 'Base atual da coleção', 'artigos'],
    ['Pendências abertas', abertas.length, `${resolvidas.length} resolvida(s)`, 'radar'],
    ['Criticidade alta', criticas, 'Artigos que pedem atenção', 'radar'],
    ['Com mostruário', comMostruario, `${pieces.filter(piece => piece.participa_mostruario === false).length} sem mostruário`, 'mostruario'],
  ]
  return <Page title="Impactos da coleção" kicker="Dashboard operacional" description="Visão consolidada dos artigos, riscos e principais concentrações de pendências.">
    <div className="dashboard-kpis">{kpis.map(([title, value, caption, target]) => <button key={title} className="kpi-card" onClick={() => onNavigate(target)}><span>{title}</span><strong>{String(value).padStart(2, '0')}</strong><small>{caption}</small><i>Ver detalhes →</i></button>)}</div>
    <section className="quick-actions"><h2>Ações rápidas</h2><div><button className="primary" disabled={!canEdit} onClick={onNewArticle}><b>＋</b><span>Novo artigo</span></button><button onClick={() => onNavigate('telao')}><b>▣</b><span>Abrir Passagem</span></button><button onClick={() => onNavigate('radar')}><b>◎</b><span>Ver Radar</span></button><button onClick={() => onNavigate('historico')}><b>◷</b><span>Histórico</span></button></div></section>
    <div className="insight-grid">
      <RankCard title="Malhas com mais problemas" subtitle="Pendências abertas por matéria-prima base" items={materialRank} empty="Nenhuma pendência vinculada a uma malha." />
      <RankCard title="Problemas mais citados" subtitle="Pendências abertas por tipo confirmado" items={problemRank} empty="Nenhum problema classificado." />
      <RankCard title="Categorias mais impactadas" subtitle="Pendências abertas por categoria" items={categoryProblemRank} empty="Nenhuma categoria possui pendência aberta." />
      <RankCard title="Áreas responsáveis" subtitle="Distribuição das pendências abertas" items={areaRank} empty="Nenhuma área possui pendência aberta." />
    </div>
    <section className="dashboard-section"><header><div><small>COMPOSIÇÃO</small><h2>Artigos por categoria</h2></div><button onClick={() => onNavigate('artigos')}>Ver todos os artigos →</button></header><div className="category-summary">{categoryComposition.map(item => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span><small>{pieces.length ? Math.round((item.value / pieces.length) * 100) : 0}% da coleção</small></article>)}</div>{!categoryComposition.length && <p className="dashboard-empty">Nenhuma categoria cadastrada.</p>}</section>
    <section className="dashboard-section"><header><div><small>ACOMPANHAMENTO</small><h2>Apontamentos recentes</h2></div><button onClick={() => onNavigate('radar')}>Abrir Radar →</button></header><div className="dashboard-activity">{recentPendings.map(item => <article key={item.id}><span className={`activity-status ${item.status}`} /> <div><strong>{byId[item.peca_id]?.artigo} · {item.area_responsavel}</strong><p>{item.descricao}</p><small>{new Date(item.created_at).toLocaleString('pt-BR')} · {item.status === 'aberta' ? 'Pendente' : 'Resolvida'}</small></div></article>)}</div>{!recentPendings.length && <p className="dashboard-empty">Nenhum apontamento registrado.</p>}</section>
  </Page>
}

function rankCounts(items, getLabel, limit = 5) {
  const counts = items.reduce((result, item) => { const label = getLabel(item); result[label] = (result[label] || 0) + 1; return result }, {})
  return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'pt-BR')).slice(0, limit)
}

function RankCard({ title, subtitle, items, empty }) {
  const max = Math.max(...items.map(item => item.value), 1)
  return <section className="rank-card"><header><h2>{title}</h2><p>{subtitle}</p></header>{items.length ? <div className="rank-list">{items.map((item, index) => <div key={item.label}><span>{String(index + 1).padStart(2, '0')}</span><section><header><strong>{item.label}</strong><b>{item.value}</b></header><i><em style={{ width: `${(item.value / max) * 100}%` }} /></i></section></div>)}</div> : <p className="dashboard-empty">{empty}</p>}</section>
}

export function ArticlesView({ pieces, archivedPieces, query, setQuery, onOpen, onNew, onRestore, canEdit }) {
  const [showArchived, setShowArchived] = useState(false)
  const source = showArchived ? archivedPieces : pieces
  const filtered = source.filter(piece => normalizeArticle([piece.artigo, piece.colecao, piece.linha, piece.categoria].filter(Boolean).join(' ')).includes(normalizeArticle(query)))
  return <Page title="Artigos da coleção" kicker="Preparação da Passagem" description="Busque um artigo existente ou cadastre um novo.">
    <div className="toolbar"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por artigo, coleção, linha ou categoria" /><button className="primary" onClick={onNew} disabled={!canEdit} title={canEdit ? '' : 'Seu perfil possui acesso somente para consulta'}>+ Cadastrar artigo</button></div>
    {!canEdit && <div className="info-note">Seu perfil está em modo somente leitura para os dados da passagem.</div>}
    <div className="archive-tabs" role="tablist" aria-label="Situação dos artigos"><button className={!showArchived ? 'active' : ''} onClick={() => setShowArchived(false)}>Ativos <span>{pieces.length}</span></button><button className={showArchived ? 'active' : ''} onClick={() => setShowArchived(true)}>Arquivados <span>{archivedPieces.length}</span></button></div>
    <div className="article-table"><div className="table-head"><span>Artigo</span><span>Coleção</span><span>{showArchived ? 'Arquivado por' : 'Criticidade'}</span><span>{showArchived ? 'Data' : 'Lacre'}</span><span /></div>{filtered.map(piece => showArchived ? <div className="table-row archived-row" key={piece.id}><ArticleIdentity piece={piece} /><span>{piece.colecao || '—'}</span><span>{piece.arquivado_por || '—'}</span><span>{piece.data_arquivamento ? new Date(piece.data_arquivamento).toLocaleDateString('pt-BR') : '—'}</span>{canEdit ? <button onClick={() => onRestore(piece)}>Restaurar</button> : <span>Somente leitura</span>}<p>{piece.motivo_arquivamento || 'Motivo não informado'}</p></div> : <button className="table-row" key={piece.id} onClick={() => onOpen(piece)}><ArticleIdentity piece={piece} /><span>{piece.colecao || '—'}</span><span className={`criticality criticality-${(piece.complexidade || 'Baixa').toLowerCase()}`}>{piece.complexidade || 'Baixa'}</span><span className={`seal seal-${(piece.lacre || 'sem').toLowerCase()}`}>{piece.lacre || 'Sem lacre'}</span><span>Abrir →</span></button>)}</div>
    {!filtered.length && <Empty title={showArchived ? 'Nenhum artigo arquivado' : 'Nenhum artigo encontrado'} text={showArchived ? 'Os artigos arquivados aparecerão aqui e poderão ser restaurados.' : query ? 'Revise a busca ou cadastre um novo artigo.' : 'Cadastre o primeiro artigo da coleção.'} />}
  </Page>
}

export function TelaoView({ pieces, pendencias = [], collectionOptions = [], criticalityOptions = [], problemTypeOptions, selectedId, setSelectedId, onCreatePending, saving }) {
  const [presentationMode, setPresentationMode] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState('')
  const [selectedCriticality, setSelectedCriticality] = useState('Todas')
  const [descricao, setDescricao] = useState('')
  const [area, setArea] = useState(AREAS[0])
  const [problemType, setProblemType] = useState('')
  const [severity, setSeverity] = useState('')
  const [customProblem, setCustomProblem] = useState(false)
  const collections = useMemo(() => [...new Set([...collectionOptions, ...pieces.map(item => item.colecao)].filter(Boolean))], [collectionOptions, pieces])
  useEffect(() => { if (!selectedCollection || !collections.includes(selectedCollection)) setSelectedCollection(collections[0] || '') }, [collections, selectedCollection])
  const collectionPieces = useMemo(() => pieces.filter(item => item.colecao === selectedCollection), [pieces, selectedCollection])
  const criticalities = useMemo(() => [...new Set([...criticalityOptions, ...pieces.map(item => item.complexidade || 'Baixa')].filter(Boolean))], [criticalityOptions, pieces])
  useEffect(() => { if (selectedCriticality !== 'Todas' && !criticalities.includes(selectedCriticality)) setSelectedCriticality('Todas') }, [criticalities, selectedCriticality])
  const presentationPieces = useMemo(() => collectionPieces.filter(item => selectedCriticality === 'Todas' || (item.complexidade || 'Baixa') === selectedCriticality), [collectionPieces, selectedCriticality])
  const piece = presentationPieces.find(item => item.id === selectedId) || presentationPieces[0]
  const pieceIndex = Math.max(0, presentationPieces.findIndex(item => item.id === piece?.id))
  const livePendings = useMemo(() => pendencias.filter(item => item.peca_id === piece?.id && item.status === 'aberta').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [pendencias, piece?.id])
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
    <div className="passage-filters"><label>Coleção<select value={selectedCollection} onChange={event => { setSelectedCollection(event.target.value); setSelectedCriticality('Todas') }}>{collections.map(collection => <option key={collection}>{collection}</option>)}</select></label><label>Criticidade<select value={selectedCriticality} onChange={event => setSelectedCriticality(event.target.value)}><option>Todas</option>{criticalities.map(item => <option key={item}>{item}</option>)}</select></label><span><strong>{presentationPieces.length}</strong> artigo(s) nesta seleção</span></div>
    {!piece ? <Empty title="Nenhum artigo nesta seleção" text="Escolha outra criticidade para continuar a passagem desta coleção." /> : <>
    <div className="presentation-toolbar"><PieceSelector pieces={presentationPieces} value={piece.id} onChange={setSelectedId} /><button className="primary" onClick={() => setPresentationMode(true)}>⛶ Modo apresentação</button></div>
    <div className="article-hero"><div><span>Artigo em apresentação</span><h2>{piece.artigo}</h2><p>{piece.linha || 'Linha não informada'} · {piece.colecao || 'Coleção não informada'}</p></div><div className="hero-badges"><span className={`criticality criticality-${(piece.complexidade || 'Baixa').toLowerCase()}`}>{piece.complexidade || 'Baixa'}</span><span className={`seal seal-${(piece.lacre || 'sem').toLowerCase()}`}>{piece.lacre || 'Sem lacre'}</span><span>{piece.participa_mostruario ? 'Mostruário' : 'Sem mostruário'}</span></div></div>
    <div className="presentation"><div className="presentation-image">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt={`Imagem do artigo ${piece.artigo} para a passagem`} /> : <span>Sem imagem cadastrada</span>}</div><div className="presentation-data"><small>ARTIGO</small><h2>{piece.artigo}</h2><dl><Data label="Coleção" value={piece.colecao} /><Data label="Linha" value={piece.linha} /><Data label="Complexidade" value={piece.complexidade} /><Data label="Lacre" value={piece.lacre} /><Data label="Matéria-prima" value={piece.mp_base} /><Data label="Categoria" value={piece.categoria} /><Data label="Mostruário" value={piece.participa_mostruario === true ? 'Mostruário' : piece.participa_mostruario === false ? 'Sem mostruário' : 'Não informado'} /></dl><section className="analyst-notes"><small>APONTAMENTO DA ANALISTA</small><p>{piece.observacoes || 'Nenhum apontamento registrado no cadastro.'}</p>{piece.pontos_atencao?.length > 0 && <div className="attention-tags">{piece.pontos_atencao.map(tag => <span key={tag}>{tag}</span>)}</div>}</section></div></div>
    {presentationMode && <div className="presentation-stage" role="dialog" aria-modal="true" aria-label={`Apresentação do artigo ${piece.artigo}`}><header><div><small>NEXUS · MODO APRESENTAÇÃO</small><h2>Artigo {piece.artigo}</h2><p>{piece.linha || 'Linha não informada'} · {piece.colecao || 'Coleção não informada'}</p><div className="presentation-stage-facts"><span><b>Categoria</b>{piece.categoria || '—'}</span><span><b>Matéria-prima</b>{piece.mp_base || '—'}</span><span><b>Classificação</b>{piece.tipo_peca || '—'}</span><span><b>Criticidade</b>{piece.complexidade || '—'}</span><span><b>Lacre</b>{piece.lacre || 'Sem lacre'}</span><span><b>Fluxo</b>{piece.participa_mostruario ? 'Mostruário' : 'Sem mostruário'}</span></div></div><button onClick={() => setPresentationMode(false)} aria-label="Fechar modo apresentação">Fechar ×</button></header><main><aside className="presentation-stage-notes"><small>OBSERVAÇÕES</small><p>{piece.observacoes || 'Nenhuma observação registrada no cadastro.'}</p></aside><section className="presentation-stage-media">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt={`Foto ou desenho técnico completo do artigo ${piece.artigo}`} /> : <div className="presentation-stage-empty">Sem foto ou desenho técnico cadastrado</div>}</section><aside className="presentation-stage-live"><header><div><small>RADAR EM TEMPO REAL</small><b>Apontamentos abertos</b></div><span>{livePendings.length}</span></header>{livePendings.length ? <div>{livePendings.map(item => <article key={item.id}><strong>{item.tipo_problema || 'Apontamento'}</strong><p>{item.descricao}</p><small>{item.area_responsavel} · {item.gravidade || 'Sem gravidade'} · {item.created_by || 'Usuário não informado'}</small></article>)}</div> : <p className="presentation-stage-no-pending">Nenhum apontamento aberto para este artigo.</p>}</aside></main><footer><button onClick={() => selectRelative(-1)}>← Anterior</button><strong>{String(pieceIndex + 1).padStart(2, '0')} <small>de {String(presentationPieces.length).padStart(2, '0')}</small></strong><button onClick={() => selectRelative(1)}>Próximo →</button></footer></div>}
    <div className="work-grid passage-work-grid"><section className="work-card pending-form"><h3>Novo apontamento</h3><label>Tipo do problema *<select value={customProblem ? '__new__' : problemType} onChange={event => { const isNew = event.target.value === '__new__'; setCustomProblem(isNew); setProblemType(isNew ? '' : event.target.value) }}><option value="">Selecione</option>{problemTypeOptions.map(item => <option key={item}>{item}</option>)}<option value="__new__">+ Cadastrar novo tipo</option></select></label>{customProblem && <label>Novo tipo do problema *<input value={problemType} onChange={event => setProblemType(event.target.value)} placeholder="Digite o novo tipo" /></label>}<label>Gravidade *<select value={severity} onChange={event => setSeverity(event.target.value)}><option value="">Selecione</option>{SEVERITIES.map(item => <option key={item}>{item}</option>)}</select></label><label>Área responsável *<select value={area} onChange={event => setArea(event.target.value)}>{AREAS.map(item => <option key={item}>{item}</option>)}</select></label><textarea value={descricao} onChange={event => setDescricao(event.target.value)} placeholder="Descreva a pendência ou ação necessária" /><button disabled={saving || !descricao.trim() || !problemType.trim() || !severity} onClick={async () => { await onCreatePending(piece, descricao.trim(), area, problemType.trim(), severity, 'apresentacao'); setDescricao(''); setProblemType(''); setSeverity(''); setCustomProblem(false) }}>Registrar no Radar</button></section></div>
    </>}
  </Page>
}

export function MostruarioView({ pieces, problemTypeOptions, selectedId, setSelectedId, onSave, saving }) {
  const piece = pieces.find(item => item.id === selectedId) || pieces[0]
  const [form, setForm] = useState({ feedback_tecnico: '', ocorrencia_mostruario: '', fotos_mostruario: '', tipo_problema: '', gravidade: '', ciclo_mostruario_encerrado: false })
  const [customProblem, setCustomProblem] = useState(false)
  useEffect(() => { setForm({ feedback_tecnico: piece?.feedback_tecnico || '', ocorrencia_mostruario: piece?.ocorrencia_mostruario || '', fotos_mostruario: (piece?.fotos_mostruario || []).join('\n'), tipo_problema: '', gravidade: '', ciclo_mostruario_encerrado: Boolean(piece?.ciclo_mostruario_encerrado) }); setCustomProblem(false) }, [piece])
  if (!piece) return <Page title="Pós-passagem / Mostruário" kicker="Acompanhamento"><Empty title="Nenhum artigo cadastrado" text="Cadastre um artigo antes de registrar o mostruário." /></Page>
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  return <Page title="Pós-passagem / Mostruário" kicker="Acompanhamento" description="Consolide feedback, fotos e ocorrências vinculados ao artigo.">
    <PieceSelector pieces={pieces} value={piece.id} onChange={setSelectedId} />
    <div className="work-card form-stack"><label>Feedback técnico<textarea value={form.feedback_tecnico} onChange={event => update('feedback_tecnico', event.target.value)} placeholder="Avaliação técnica do mostruário" /></label><label>Fotos do mostruário <small>(uma URL por linha)</small><textarea value={form.fotos_mostruario} onChange={event => update('fotos_mostruario', event.target.value)} placeholder="https://..." /></label><label>Ocorrência ou ajuste<textarea value={form.ocorrencia_mostruario} onChange={event => update('ocorrencia_mostruario', event.target.value)} placeholder="Deixe vazio quando não houver ocorrência" /></label>{form.ocorrencia_mostruario.trim() && <div className="classification-grid"><label>Tipo do problema *<select value={customProblem ? '__new__' : form.tipo_problema} onChange={event => { const isNew = event.target.value === '__new__'; setCustomProblem(isNew); update('tipo_problema', isNew ? '' : event.target.value) }}><option value="">Selecione</option>{problemTypeOptions.map(item => <option key={item}>{item}</option>)}<option value="__new__">+ Cadastrar novo tipo</option></select></label>{customProblem && <label>Novo tipo do problema *<input value={form.tipo_problema} onChange={event => update('tipo_problema', event.target.value)} placeholder="Digite o novo tipo" /></label>}<label>Gravidade *<select value={form.gravidade} onChange={event => update('gravidade', event.target.value)}><option value="">Selecione</option>{SEVERITIES.map(item => <option key={item}>{item}</option>)}</select></label></div>}<label className="check-line"><input type="checkbox" checked={form.ciclo_mostruario_encerrado} onChange={event => update('ciclo_mostruario_encerrado', event.target.checked)} /> Encerrar ciclo do artigo no mostruário</label><button className="primary" disabled={saving || !form.feedback_tecnico.trim() || (form.ocorrencia_mostruario.trim() && (!form.tipo_problema.trim() || !form.gravidade))} onClick={() => onSave(piece, { ...form, tipo_problema: form.tipo_problema.trim(), fotos_mostruario: form.fotos_mostruario.split('\n').map(item => item.trim()).filter(Boolean) })}>Salvar feedback</button></div>
  </Page>
}

export function RadarView({ pieces, pendencias, onResolve, saving }) {
  const [status, setStatus] = useState('aberta')
  const filtered = pendencias.filter(item => status === 'todas' || item.status === status)
  const byId = Object.fromEntries(pieces.map(piece => [piece.id, piece]))
  return <Page title="Radar Operacional" kicker="Riscos e pendências" description="Acompanhe ações necessárias e atualize o que já foi resolvido.">
    <div className="toolbar"><select value={status} onChange={event => setStatus(event.target.value)}><option value="aberta">Pendências abertas</option><option value="resolvida">Pendências resolvidas</option><option value="todas">Todas</option></select><span>{filtered.length} registro(s)</span></div>
    <div className="pending-list">{filtered.map(item => { const piece = byId[item.peca_id]; return <article key={item.id} className={`pending-card ${item.status}`}><div><small>{piece?.artigo || 'Artigo removido'} · {item.area_responsavel}</small><div className="pending-tags"><span>{item.tipo_problema || 'Não classificado'}</span><span className={`severity-${(item.gravidade || 'nao-informada').toLowerCase().replace('é', 'e')}`}>{item.gravidade || 'Gravidade não informada'}</span><span>{item.etapa_origem || 'Etapa não informada'}</span></div><h3>{item.descricao}</h3><p>{item.created_by} · {new Date(item.created_at).toLocaleString('pt-BR')}</p></div>{item.status === 'aberta' ? <button disabled={saving} onClick={() => onResolve(item)}>Marcar como resolvida</button> : <span>Resolvida por {item.resolved_by || '—'}</span>}</article> })}</div>
    {!filtered.length && <Empty title="Nenhuma pendência nesta visualização" text="Novos apontamentos registrados no Telão aparecerão aqui." />}
  </Page>
}

export function HistoryView({ pieces, events }) {
  const [pieceId, setPieceId] = useState('todas')
  const byId = Object.fromEntries(pieces.map(piece => [piece.id, piece]))
  const filtered = pieceId === 'todas' ? events : events.filter(event => event.peca_id === pieceId)
  return <Page title="Histórico da Coleção" kicker="Rastreabilidade" description="Consulte alterações, decisões, feedbacks e responsáveis.">
    <div className="toolbar"><select value={pieceId} onChange={event => setPieceId(event.target.value)}><option value="todas">Todos os artigos</option>{pieces.map(piece => <option value={piece.id} key={piece.id}>{piece.artigo}</option>)}</select><span>{filtered.length} evento(s)</span></div>
    <div className="history-list">{filtered.map(event => <article key={event.id}><i /><div><small>{byId[event.peca_id]?.artigo || 'Artigo'} · {event.tipo_evento.replaceAll('_', ' ')}</small><h3>{event.descricao}</h3><p>{event.usuario} · {new Date(event.created_at).toLocaleString('pt-BR')}</p></div></article>)}</div>
    {!filtered.length && <Empty title="Nenhum evento registrado" text="As ações realizadas nos módulos serão exibidas aqui." />}
  </Page>
}

function Page({ title, kicker, description, children }) { return <section className="page"><header className="page-header"><div><small>{kicker}</small><h1>{title}</h1>{description && <p>{description}</p>}</div></header>{children}</section> }
function Empty({ title, text }) { return <div className="empty"><span>—</span><h2>{title}</h2><p>{text}</p></div> }
function PieceSelector({ pieces, value, onChange }) { return <label className="piece-selector">Artigo<select value={value} onChange={event => onChange(event.target.value)}>{pieces.map(piece => <option key={piece.id} value={piece.id}>{piece.artigo} · {piece.colecao || 'Sem coleção'}</option>)}</select></label> }
function Data({ label, value }) { return <div><dt>{label}</dt><dd>{value || '—'}</dd></div> }
function ArticleIdentity({ piece }) { return <span className="article-identity">{piece.desenho_tecnico_url ? <img src={piece.desenho_tecnico_url} alt="" /> : <i aria-hidden="true">◇</i>}<span><strong>{piece.artigo}</strong><small>{piece.linha || piece.categoria || 'Sem classificação'}</small></span></span> }
