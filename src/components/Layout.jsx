import { MODULES } from '../config/mvp'
import { NexusMark } from './NexusMark'

const NAV_ICONS = { dashboard: '▦', artigos: '◆', telao: '▣', mostruario: '▤', radar: '◎', historico: '◷' }

export function Layout({ user, view, setView, pieces, pendencias, children }) {
  const abertas = pendencias.filter(item => item.status === 'aberta').length
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><NexusMark compact /><span className="brand-copy"><strong>Nexus</strong><small>Passagem de Coleção Digital</small></span></div><div className="top-actions"><span className="ai-chip"><i /> MVP operacional</span><span className="user-chip"><strong>{user.nome}</strong><small>{user.perfil}</small></span></div></header>
    <aside className="sidebar">
      <span className="section-label">Coleção</span>
      {MODULES.map(module => <Nav key={module.id} icon={NAV_ICONS[module.id]} active={view === module.id} onClick={() => setView(module.id)} label={module.label} count={module.id === 'artigos' ? pieces.length : module.id === 'radar' ? abertas : undefined} />)}
      <div className="sidebar-bottom"><span>{pieces.length}</span><small>artigos na coleção</small></div>
    </aside>
    <main className="main">{children}</main>
  </div>
}

function Nav({ icon, active, onClick, label, count }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>{count !== undefined && <em>{count}</em>}</button>
}
