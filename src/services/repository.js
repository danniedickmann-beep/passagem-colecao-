import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(url && key)
const supabase = configured ? createClient(url, key) : null
const STORAGE_KEY = 'passagem-colecao-react-v2'

function localRead() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { pieces: [], events: [] } } catch { return { pieces: [], events: [] } } }
function localWrite(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
function assertLocalPiece(db, id) {
  const index = db.pieces.findIndex(piece => piece.id === id)
  if (index < 0) throw new Error('Peça não encontrada.')
  return index
}

export const repository = {
  configured,
  async listPieces() {
    if (!supabase) return localRead().pieces
    const { data, error } = await supabase.from('pecas').select('*').eq('ativa', true).order('created_at', { ascending: false })
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
}
