import { useState } from 'react'
import { PROFILES } from '../config/mvp'
import { NexusMark } from './NexusMark'

export function Login({ onEnter }) {
  const previous = readPreviousUser()
  const [nome, setNome] = useState(previous.nome || '')
  const [perfil, setPerfil] = useState(previous.perfil || '')

  function submit(event) {
    event.preventDefault()
    const user = { nome: nome.trim(), perfil }
    if (!user.nome || !user.perfil) return
    localStorage.setItem('passagem-user-v3', JSON.stringify(user))
    onEnter(user)
  }

  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="login-brand"><NexusMark /><div><strong>Nexus</strong><small>Passagem de Coleção Digital</small></div></div>
    <span className="login-kicker">Ambiente operacional</span>
    <h1>Acessar a Passagem de Coleção</h1>
    <p>Identifique-se para que decisões e alterações fiquem registradas.</p>
    <label>Nome completo<input value={nome} onChange={event => setNome(event.target.value)} placeholder="Seu nome completo" autoFocus /></label>
    <label>Perfil<select value={perfil} onChange={event => setPerfil(event.target.value)}><option value="">Selecione seu perfil</option>{PROFILES.map(item => <option key={item}>{item}</option>)}</select></label>
    <button type="submit" disabled={!nome.trim() || !perfil}>Acessar a coleção</button>
  </form></div>
}

function readPreviousUser() {
  try { return JSON.parse(localStorage.getItem('passagem-user-v3') || '{}') }
  catch { return {} }
}
