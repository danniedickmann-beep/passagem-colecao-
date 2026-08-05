import { useState } from 'react'

export function Login({ onEnter }) {
  const [name, setName] = useState(localStorage.getItem('passagem-user') || '')
  function submit(event) { event.preventDefault(); const value = name.trim(); if (!value) return; localStorage.setItem('passagem-user', value); onEnter(value) }
  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="brand-mark">◊</div><h1>Passagem de Coleção</h1>
    <p>Como você quer se identificar nos registros desta coleção?</p>
    <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome e área — Ex: Ana, Engenharia" autoFocus />
    <button type="submit" disabled={!name.trim()}>Entrar na coleção</button>
  </form></div>
}
