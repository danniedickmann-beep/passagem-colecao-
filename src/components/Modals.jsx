import { useEffect, useMemo, useState } from 'react'
import { CRITICALITIES } from '../config/mvp'
const EMPTY = { artigo: '', colecao: '', linha: '', categoria: '', mp_base: '', tipo_peca: 'Nova', complexidade: 'Baixa', lacre: '', participa_mostruario: '', pontos_atencao: [], desenho_tecnico_url: '', anexos: [], observacoes: '' }
const ATTACHMENT_ACCEPT = 'image/*,video/*'
const SEAL_OPTIONS = ['Amarelo', 'Branco', 'Verde']

export function ArticleFormModal({ open, piece, defaultCollection = '', collectionOptions = [], lineOptions = [], categoryOptions = [], materialOptions = [], attentionOptions = [], onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY)
  const [attempted, setAttempted] = useState(false)
  const [customCollection, setCustomCollection] = useState(false)
  const [customLine, setCustomLine] = useState(false)
  const [customCategory, setCustomCategory] = useState(false)
  const [customMaterial, setCustomMaterial] = useState(false)
  const [technicalFile, setTechnicalFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [fileError, setFileError] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [draggingAttachments, setDraggingAttachments] = useState(false)
  const [detailFormOpen, setDetailFormOpen] = useState(false)
  const [detailDraftFile, setDetailDraftFile] = useState(null)
  const [detailDraftDescription, setDetailDraftDescription] = useState('')
  const [detailError, setDetailError] = useState('')
  const [newAttention, setNewAttention] = useState('')
  useEffect(() => { if (open) { setForm(piece ? { ...EMPTY, ...piece, anexos: piece.anexos || [] } : { ...EMPTY, colecao: defaultCollection }); setAttempted(false); setCustomCollection(false); setCustomLine(false); setCustomCategory(false); setCustomMaterial(false); setTechnicalFile(null); setFilePreview(''); setFileError(''); setAttachmentFiles([]); setDraggingAttachments(false); setDetailFormOpen(false); setDetailDraftFile(null); setDetailDraftDescription(''); setDetailError(''); setNewAttention('') } }, [open, piece, defaultCollection])
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])
  const requiredTextFields = ['artigo', 'colecao', 'linha', 'categoria', 'mp_base', 'tipo_peca', 'complexidade', 'lacre']
  const missing = useMemo(() => requiredTextFields.filter(key => !String(form[key] || '').trim()).concat(form.participa_mostruario === '' || form.participa_mostruario == null ? ['participa_mostruario'] : []), [form])
  const knownCollection = collectionOptions.includes(form.colecao)
  const knownLine = lineOptions.includes(form.linha)
  const knownCategory = categoryOptions.includes(form.categoria)
  const knownMaterial = materialOptions.includes(form.mp_base)
  if (!open) return null
  const field = key => ({ value: form[key] || '', onChange: event => setForm(current => ({ ...current, [key]: event.target.value })) })
  function chooseFile(event) {
    const file = event.target.files?.[0]
    setFileError('')
    if (!file) { setTechnicalFile(null); setFilePreview(''); return }
    if (!file.type.startsWith('image/')) { setFileError('Selecione um arquivo de imagem.'); event.target.value = ''; return }
    if (file.size > 10 * 1024 * 1024) { setFileError('A imagem deve ter no máximo 10 MB.'); event.target.value = ''; return }
    setTechnicalFile(file); setFilePreview(URL.createObjectURL(file))
  }
  function removeDrawing() { setTechnicalFile(null); setFilePreview(''); setFileError(''); setForm(current => ({ ...current, desenho_tecnico_url: null })) }
  function chooseDetailFile(files) {
    const file = Array.from(files || [])[0]
    setDetailError('')
    if (!file) { setDetailDraftFile(null); return }
    if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) { setDetailError('Selecione uma foto ou um vídeo.'); return }
    if (file.size > 50 * 1024 * 1024) { setDetailError('O arquivo do detalhe deve ter no máximo 50 MB.'); return }
    setDetailDraftFile(file)
  }
  function registerDetail() {
    const description = detailDraftDescription.trim()
    if (!detailDraftFile || !description) { setDetailError('Selecione uma foto ou vídeo e descreva o detalhe.'); return }
    setAttachmentFiles(current => [...current, { file: detailDraftFile, descricao: description }])
    setDetailDraftFile(null); setDetailDraftDescription(''); setDetailError(''); setDetailFormOpen(false)
  }
  function toggleAttention(tag) { setForm(current => ({ ...current, pontos_atencao: (current.pontos_atencao || []).includes(tag) ? current.pontos_atencao.filter(item => item !== tag) : [...(current.pontos_atencao || []), tag] })) }
  function addAttention() { const tag = newAttention.trim(); if (!tag) return; setForm(current => ({ ...current, pontos_atencao: [...new Set([...(current.pontos_atencao || []), tag])] })); setNewAttention('') }
  function submit(event) { event.preventDefault(); setAttempted(true); if (missing.length || fileError) return; onSave(form, technicalFile, attachmentFiles) }
  return <Modal title={piece ? `Editar ${piece.artigo}` : 'Cadastrar artigo'} kicker="Preparação da Passagem" onClose={onClose} closeOnBackdrop={false}><form className="piece-form" onSubmit={submit} noValidate>
    {attempted && missing.length > 0 && <div className="form-error wide">Preencha os campos obrigatórios destacados.</div>}
    <label className={`wide ${attempted && missing.includes('artigo') ? 'invalid' : ''}`}>Código do artigo *<input {...field('artigo')} autoFocus disabled={Boolean(piece)} required aria-invalid={attempted && missing.includes('artigo')} /></label>
    <label className={attempted && missing.includes('colecao') ? 'invalid' : ''}>Coleção *<select required aria-invalid={attempted && missing.includes('colecao')} value={customCollection ? '__new__' : knownCollection ? form.colecao : ''} onChange={event => { const isNew = event.target.value === '__new__'; setCustomCollection(isNew); setForm(current => ({ ...current, colecao: isNew ? '' : event.target.value })) }}><option value="" disabled>Selecione uma coleção</option>{collectionOptions.map(collection => <option key={collection} value={collection}>{collection}</option>)}<option value="__new__">+ Cadastrar nova coleção</option></select></label>
    {customCollection && <label className={attempted && missing.includes('colecao') ? 'invalid' : ''}>Nome da nova coleção *<input required aria-invalid={attempted && missing.includes('colecao')} value={form.colecao || ''} onChange={event => setForm(current => ({ ...current, colecao: event.target.value.toUpperCase() }))} placeholder="Ex.: INVERNO 28" autoFocus /></label>}
    <label className={attempted && missing.includes('linha') ? 'invalid' : ''}>Linha *<select required aria-invalid={attempted && missing.includes('linha')} value={customLine ? '__new__' : knownLine ? form.linha : ''} onChange={event => { const isNew = event.target.value === '__new__'; setCustomLine(isNew); setForm(current => ({ ...current, linha: isNew ? '' : event.target.value })) }}><option value="">Selecione uma linha</option>{lineOptions.map(line => <option key={line} value={line}>{line}</option>)}<option value="__new__">+ Cadastrar nova linha</option></select></label>
    {customLine && <label className={attempted && missing.includes('linha') ? 'invalid' : ''}>Nome da nova linha *<input required aria-invalid={attempted && missing.includes('linha')} value={form.linha || ''} onChange={event => setForm(current => ({ ...current, linha: event.target.value }))} placeholder="Digite o nome da linha" autoFocus /></label>}
    <label className={attempted && missing.includes('categoria') ? 'invalid' : ''}>Categoria *<select required aria-invalid={attempted && missing.includes('categoria')} value={customCategory ? '__new__' : knownCategory ? form.categoria : ''} onChange={event => { const isNew = event.target.value === '__new__'; setCustomCategory(isNew); setForm(current => ({ ...current, categoria: isNew ? '' : event.target.value })) }}><option value="">Selecione uma categoria</option>{categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}<option value="__new__">+ Cadastrar nova categoria</option></select></label>
    {customCategory && <label className={attempted && missing.includes('categoria') ? 'invalid' : ''}>Nome da nova categoria *<input required aria-invalid={attempted && missing.includes('categoria')} value={form.categoria || ''} onChange={event => setForm(current => ({ ...current, categoria: event.target.value }))} placeholder="Digite o nome da categoria" autoFocus /></label>}
    <label className={attempted && missing.includes('mp_base') ? 'invalid' : ''}>Matéria-prima base *<select required aria-invalid={attempted && missing.includes('mp_base')} value={customMaterial ? '__new__' : knownMaterial ? form.mp_base : ''} onChange={event => { const isNew = event.target.value === '__new__'; setCustomMaterial(isNew); setForm(current => ({ ...current, mp_base: isNew ? '' : event.target.value })) }}><option value="">Selecione uma matéria-prima</option>{materialOptions.map(material => <option key={material} value={material}>{material}</option>)}<option value="__new__">+ Cadastrar nova matéria-prima</option></select></label>
    {customMaterial && <label className={attempted && missing.includes('mp_base') ? 'invalid' : ''}>Nome da nova matéria-prima *<input required aria-invalid={attempted && missing.includes('mp_base')} value={form.mp_base || ''} onChange={event => setForm(current => ({ ...current, mp_base: event.target.value }))} placeholder="Digite o nome da matéria-prima" autoFocus /></label>}
    <label className={attempted && missing.includes('tipo_peca') ? 'invalid' : ''}>Classificação *<select {...field('tipo_peca')} required aria-invalid={attempted && missing.includes('tipo_peca')}><option>Nova</option><option>Repeat</option></select></label>
    <label className={attempted && missing.includes('complexidade') ? 'invalid' : ''}>Criticidade *<select {...field('complexidade')} required aria-invalid={attempted && missing.includes('complexidade')}>{CRITICALITIES.map(criticality => <option key={criticality}>{criticality}</option>)}</select></label>
    <label className={attempted && missing.includes('lacre') ? 'invalid' : ''}>Lacre *<select {...field('lacre')} required aria-invalid={attempted && missing.includes('lacre')}><option value="">Selecione o lacre</option>{form.lacre && !SEAL_OPTIONS.includes(form.lacre) && <option value={form.lacre}>{form.lacre} (valor atual)</option>}{SEAL_OPTIONS.map(seal => <option key={seal} value={seal}>{seal}</option>)}</select></label>
    <label className={attempted && missing.includes('participa_mostruario') ? 'invalid' : ''}>Mostruário *<select required aria-invalid={attempted && missing.includes('participa_mostruario')} value={form.participa_mostruario === true ? 'true' : form.participa_mostruario === false ? 'false' : ''} onChange={event => setForm(current => ({ ...current, participa_mostruario: event.target.value === '' ? '' : event.target.value === 'true' }))}><option value="">Selecione uma opção</option><option value="true">Mostruário</option><option value="false">Sem mostruário</option></select></label>
    <fieldset className="wide attention-field"><legend>Pontos de atenção previstos <small>(selecione quantos precisar)</small></legend><div>{[...new Set([...attentionOptions, ...(form.pontos_atencao || [])])].map(tag => <label key={tag} className={(form.pontos_atencao || []).includes(tag) ? 'selected' : ''}><input type="checkbox" checked={(form.pontos_atencao || []).includes(tag)} onChange={() => toggleAttention(tag)} />{tag}</label>)}</div><section className="new-tag"><input value={newAttention} onChange={event => setNewAttention(event.target.value)} placeholder="Cadastrar novo ponto de atenção" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addAttention() } }} /><button type="button" onClick={addAttention} disabled={!newAttention.trim()}>+ Adicionar</button></section></fieldset>
    <label className="wide upload-field">Imagem do artigo<input type="file" accept="image/*" onChange={chooseFile} /><span>Escolher imagem do computador ou celular · máximo 10 MB</span>{fileError && <em>{fileError}</em>}</label>
    {(filePreview || form.desenho_tecnico_url) && <div className="wide upload-preview"><img src={filePreview || form.desenho_tecnico_url} alt="Pré-visualização do desenho técnico" /><div><strong>{technicalFile?.name || 'Imagem atual'}</strong><small>{technicalFile ? `${(technicalFile.size / 1024 / 1024).toFixed(2)} MB · substituirá a imagem atual ao salvar.` : 'Será mantida até que outra imagem seja selecionada.'}</small></div><button type="button" className="danger-ghost" onClick={removeDrawing} disabled={saving}>Remover imagem</button></div>}
    <label className="wide">Apontamentos para a passagem<textarea {...field('observacoes')} placeholder="Registre as observações gerais que devem acompanhar o artigo durante a passagem" /></label>
    <section className="wide article-details-register"><header><div><h3>Detalhes adicionais <small>(opcional)</small></h3><p>Cadastre cada foto ou vídeo junto com a explicação correspondente.</p></div>{!detailFormOpen && <button type="button" className="primary" onClick={() => setDetailFormOpen(true)}>+ Cadastrar detalhe</button>}</header>
      {detailFormOpen && <div className="detail-entry-form"><label className={`detail-media-upload ${draggingAttachments ? 'dragging' : ''}`} onDragEnter={event => { event.preventDefault(); setDraggingAttachments(true) }} onDragOver={event => event.preventDefault()} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDraggingAttachments(false) }} onDrop={event => { event.preventDefault(); setDraggingAttachments(false); chooseDetailFile(event.dataTransfer.files) }}>Foto ou vídeo do detalhe *<input type="file" accept={ATTACHMENT_ACCEPT} onChange={event => { chooseDetailFile(event.target.files); event.target.value = '' }} /><span>{detailDraftFile ? detailDraftFile.name : 'Arraste uma foto ou vídeo para cá ou clique para escolher'}</span><small>Máximo 50 MB</small></label><label>Descrição do detalhe *<textarea value={detailDraftDescription} onChange={event => { setDetailDraftDescription(event.target.value); setDetailError('') }} placeholder="Descreva o detalhe da peça que deve ser observado" /></label>{detailError && <div className="form-error">{detailError}</div>}<div className="detail-entry-actions"><button type="button" className="secondary" onClick={() => { setDetailFormOpen(false); setDetailDraftFile(null); setDetailDraftDescription(''); setDetailError('') }}>Cancelar</button><button type="button" className="primary" onClick={registerDetail}>Adicionar detalhe</button></div></div>}
    </section>
    {(form.anexos?.length > 0 || attachmentFiles.length > 0) && <div className="wide attachment-list">{form.anexos.map((attachment, index) => <article key={`${attachment.url}-${index}`}><span>{attachmentIcon(attachment.tipo)}</span><div><strong>{attachment.nome || `Detalhe ${index + 1}`}</strong><small>Arquivo já salvo</small><textarea value={attachment.descricao || ''} onChange={event => setForm(current => ({ ...current, anexos: current.anexos.map((item, itemIndex) => itemIndex === index ? { ...item, descricao: event.target.value } : item) }))} placeholder="Descreva o detalhe mostrado neste arquivo" /></div><button type="button" onClick={() => setForm(current => ({ ...current, anexos: current.anexos.filter((_, itemIndex) => itemIndex !== index) }))}>Remover</button></article>)}{attachmentFiles.map((attachment, index) => <article key={`${attachment.file.name}-${attachment.file.lastModified}`}><span>{attachmentIcon(attachment.file.type)}</span><div><strong>{attachment.file.name}</strong><small>{(attachment.file.size / 1024 / 1024).toFixed(2)} MB · será enviado ao salvar</small><textarea value={attachment.descricao} onChange={event => setAttachmentFiles(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, descricao: event.target.value } : item))} placeholder="Descreva o detalhe mostrado neste arquivo" /></div><button type="button" onClick={() => setAttachmentFiles(current => current.filter((_, itemIndex) => itemIndex !== index))}>Remover</button></article>)}</div>}
    <div className="modal-actions wide"><button type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar artigo'}</button></div>
  </form></Modal>
}

export function ArticleDetailModal({ piece, canEdit, onClose, onEdit, onArchive }) {
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  useEffect(() => setSelectedAttachment(null), [piece?.id])
  if (!piece) return null
  return <><Modal title={piece.artigo} kicker="Dados da Passagem" onClose={onClose}><div className="detail-sheet">
    {piece.desenho_tecnico_url && <img className="detail-image" src={piece.desenho_tecnico_url} alt={`Desenho técnico do artigo ${piece.artigo}`} />}
    <dl><Data label="Coleção" value={piece.colecao} /><Data label="Linha" value={piece.linha} /><Data label="Categoria" value={piece.categoria} /><Data label="Matéria-prima" value={piece.mp_base} /><Data label="Classificação" value={piece.tipo_peca} /><Data label="Criticidade" value={piece.complexidade} /><Data label="Lacre" value={piece.lacre} /><Data label="Mostruário" value={piece.participa_mostruario === true ? 'Mostruário' : piece.participa_mostruario === false ? 'Sem mostruário' : 'Não informado'} /><Data label="Status" value={piece.fluxo_atual} /></dl>
    <section><h3>Pontos de atenção previstos</h3>{piece.pontos_atencao?.length ? <div className="attention-tags">{piece.pontos_atencao.map(tag => <span key={tag}>{tag}</span>)}</div> : <p>Nenhum ponto de atenção marcado.</p>}</section>
    <section><h3>Apontamentos para a passagem</h3><p>{piece.observacoes || 'Nenhum apontamento registrado.'}</p></section>
    <section><h3>Detalhes adicionais</h3>{piece.anexos?.length ? <div className="detail-attachments">{piece.anexos.map((attachment, index) => <article key={`${attachment.url}-${index}`}>{attachment.tipo?.startsWith('image/') ? <button type="button" onClick={() => setSelectedAttachment(attachment)}><img src={attachment.url} alt={attachment.nome || `Detalhe ${index + 1}`} /></button> : attachment.tipo?.startsWith('video/') ? <button type="button" className="detail-video-preview" onClick={() => setSelectedAttachment(attachment)}><video src={attachment.url} preload="metadata" /></button> : <span>{attachmentIcon(attachment.tipo)}</span>}<div><strong>{attachment.nome || `Detalhe ${index + 1}`}</strong><small>{attachment.descricao || 'Sem descrição adicional.'}</small></div>{attachment.tipo?.startsWith('image/') || attachment.tipo?.startsWith('video/') ? <button type="button" className="detail-open" onClick={() => setSelectedAttachment(attachment)}>Abrir detalhe</button> : <a href={attachment.url} target="_blank" rel="noreferrer">Abrir arquivo</a>}</article>)}</div> : <p>Nenhum detalhe adicional registrado.</p>}</section>
    <div className="modal-actions"><button onClick={onClose}>Finalizar consulta</button>{canEdit ? <><button className="danger-ghost" onClick={() => onArchive(piece)}>Arquivar artigo</button><button className="primary" onClick={() => onEdit(piece)}>Editar dados da passagem</button></> : <span className="readonly-note">Seu perfil possui acesso somente para consulta.</span>}</div>
  </div></Modal>{selectedAttachment && <AttachmentViewer attachment={selectedAttachment} onClose={() => setSelectedAttachment(null)} />}</>
}

export function ArticleStatusModal({ piece, mode, onClose, onConfirm, saving }) {
  const [reason, setReason] = useState('')
  useEffect(() => setReason(''), [piece, mode])
  if (!piece) return null
  const archive = mode === 'archive'
  return <Modal title={`${archive ? 'Arquivar' : 'Restaurar'} ${piece.artigo}`} kicker="Controle do artigo" onClose={onClose}>
    <div className="status-confirmation">
      <p>{archive ? 'O artigo deixará de aparecer nos módulos operacionais, mas seus dados e histórico serão preservados.' : 'O artigo voltará a aparecer nos módulos operacionais com todo o histórico preservado.'}</p>
      {archive ? <label>Motivo do arquivamento *<textarea value={reason} onChange={event => setReason(event.target.value)} autoFocus placeholder="Informe por que este artigo está sendo arquivado" /></label> : piece.motivo_arquivamento && <div className="archive-reason"><small>Motivo do arquivamento</small><p>{piece.motivo_arquivamento}</p></div>}
      <div className="modal-actions"><button onClick={onClose} disabled={saving}>Cancelar</button><button className={archive ? 'danger' : 'primary'} disabled={saving || (archive && !reason.trim())} onClick={() => onConfirm(piece, reason.trim())}>{saving ? 'Salvando…' : archive ? 'Confirmar arquivamento' : 'Restaurar artigo'}</button></div>
    </div>
  </Modal>
}

function Data({ label, value }) { return <div><dt>{label}</dt><dd>{value || '—'}</dd></div> }
function attachmentIcon(type = '') { return type.startsWith('image/') ? '▧' : type.startsWith('video/') ? '▶' : type === 'application/pdf' ? 'PDF' : 'TXT' }
function AttachmentViewer({ attachment, onClose }) { const isVideo = attachment.tipo?.startsWith('video/'); return <div className="image-viewer attachment-viewer" role="dialog" aria-modal="true" aria-label="Detalhe ampliado do artigo" onClick={onClose}><button className="attachment-viewer-close" onClick={onClose} aria-label="Fechar detalhe">Fechar ×</button><article onClick={event => event.stopPropagation()}>{isVideo ? <video src={attachment.url} controls autoPlay={false} /> : <img src={attachment.url} alt={attachment.nome || 'Detalhe do artigo'} />}<section><small>DETALHE DO ARTIGO</small><h2>{attachment.nome || 'Detalhe adicional'}</h2><p>{attachment.descricao || 'Sem descrição adicional.'}</p></section></article></div> }
function Modal({ title, kicker, onClose, closeOnBackdrop = true, children }) { return <><div className="scrim modal-scrim" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden="true" /><section className="modal"><header><div><small>{kicker}</small><h2>{title}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="modal-body">{children}</div></section></> }
