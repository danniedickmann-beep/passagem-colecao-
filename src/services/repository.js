import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(url && key)
const supabase = configured ? createClient(url, key) : null
const STORAGE_KEY = 'passagem-colecao-react-v2'

function localRead() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    return { pieces: data.pieces || [], events: data.events || [], pendencias: data.pendencias || [] }
  } catch {
    return { pieces: [], events: [], pendencias: [] }
  }
}
function localWrite(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
function assertLocalPiece(db, id) {
  const index = db.pieces.findIndex(piece => piece.id === id)
  if (index < 0) throw new Error('Peça não encontrada.')
  return index
}

export const repository = {
  configured,
  subscribePendencias(onChange) {
    if (!supabase) {
      const handleStorage = event => { if (event.key === STORAGE_KEY) onChange() }
      window.addEventListener('storage', handleStorage)
      return () => window.removeEventListener('storage', handleStorage)
    }
    const channel = supabase.channel('pendencias-em-tempo-real').on('postgres_changes', { event: '*', schema: 'public', table: 'pendencias' }, onChange).subscribe()
    return () => { supabase.removeChannel(channel) }
  },
  async uploadTechnicalDrawing(file) {
    if (!file) return null
    if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem válido.')
    if (file.size > 10 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 10 MB.')
    if (!supabase) return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Não foi possível ler a imagem.')); reader.readAsDataURL(file) })
    const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`
    const { error } = await supabase.storage.from('desenhos-tecnicos').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('desenhos-tecnicos').getPublicUrl(path)
    return data.publicUrl
  },
  async deleteTechnicalDrawing(publicUrl) {
    if (!publicUrl || !supabase || publicUrl.startsWith('data:')) return
    const marker = '/storage/v1/object/public/desenhos-tecnicos/'
    const markerIndex = publicUrl.indexOf(marker)
    if (markerIndex < 0) return
    const path = decodeURIComponent(publicUrl.slice(markerIndex + marker.length))
    if (!path) return
    const { error } = await supabase.storage.from('desenhos-tecnicos').remove([path])
    if (error) throw error
  },
  async listPieces() {
    if (!supabase) return localRead().pieces.filter(piece => piece.ativa !== false)
    const { data, error } = await supabase.from('pecas').select('*').eq('ativa', true).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async listArchivedPieces() {
    if (!supabase) return localRead().pieces.filter(piece => piece.ativa === false).sort((a, b) => new Date(b.data_arquivamento || b.updated_at) - new Date(a.data_arquivamento || a.updated_at))
    const { data, error } = await supabase.from('pecas').select('*').eq('ativa', false).order('data_arquivamento', { ascending: false, nullsFirst: false })
    if (error) throw error
    return data || []
  },
  async createPiece(piece, user) {
    const payload = { ...piece, id: crypto.randomUUID(), fluxo_atual: 'cadastro', created_by: user, created_at: new Date().toISOString(), ativa: true }
    if (!supabase) { const db = localRead(); db.pieces.unshift(payload); localWrite(db); return payload }
    delete payload.id
    const { data, error } = await supabase.from('pecas').insert([payload]).select().single()
    if (error) throw error
    return data
  },
  async updatePiece(id, updates) {
    const patch = { ...updates, updated_at: new Date().toISOString() }
    if (!supabase) { const db = localRead(); const index = assertLocalPiece(db, id); db.pieces[index] = { ...db.pieces[index], ...patch }; localWrite(db); return db.pieces[index] }
    const { data, error } = await supabase.from('pecas').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async addEvent(pieceId, type, description, user, extras = {}) {
    const event = { id: crypto.randomUUID(), peca_id: pieceId, tipo_evento: type, descricao: description, usuario: user, dados_extras: extras, created_at: new Date().toISOString() }
    if (!supabase) { const db = localRead(); db.events.unshift(event); localWrite(db); return event }
    const { data, error } = await supabase.from('historico_peca').insert([event]).select().single()
    if (error) throw error
    return data
  },
  async listEvents(pieceId) {
    if (!supabase) return localRead().events.filter(e => e.peca_id === pieceId)
    const { data, error } = await supabase.from('historico_peca').select('*').eq('peca_id', pieceId).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async listAllEvents() {
    if (!supabase) return localRead().events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const { data, error } = await supabase.from('historico_peca').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) throw error
    return data || []
  },
  async listPendencias() {
    if (!supabase) return localRead().pendencias || []
    const { data, error } = await supabase.from('pendencias').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async createPendencia(payload) {
    const item = { id: crypto.randomUUID(), status: 'aberta', created_at: new Date().toISOString(), ...payload }
    if (!supabase) { const db = localRead(); db.pendencias ||= []; db.pendencias.unshift(item); localWrite(db); return item }
    const { id, ...insert } = item
    const { data, error } = await supabase.from('pendencias').insert([insert]).select().single()
    if (error) throw error
    return data
  },
  async resolvePendencia(id, user) {
    const patch = { status: 'resolvida', resolved_by: user, resolved_at: new Date().toISOString() }
    if (!supabase) { const db = localRead(); db.pendencias ||= []; const index = db.pendencias.findIndex(item => item.id === id); if (index < 0) throw new Error('Pendência não encontrada.'); db.pendencias[index] = { ...db.pendencias[index], ...patch }; localWrite(db); return db.pendencias[index] }
    const { data, error } = await supabase.from('pendencias').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}
