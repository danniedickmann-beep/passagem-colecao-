import { STATUS_LABELS } from '../config/flow'

export function Layout({ user, view, setView, pieces, children, onNew }) {
  const counts = Object.fromEntries(Object.keys(STATUS_LABELS).map(s => [s, pieces.filter(p => p.fluxo_atual === s).length]))
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark small">◊</span><strong>Passagem de Coleção</strong><small>HERING</small></div><div className="top-actions"><span className="ai-chip">● MVP ativo</span><span className="user-chip">{user}</span></div></header>
    <aside className="sidebar">
      <span className="section-label">Geral</span>
      <Nav active={view === 'flows'} onClick={() => setView('flows')} icon="◎" label="Central de fluxos" />
      <Nav active={view === 'all'} onClick={() => setView('all')} icon="◈" label="Todas as peças" count={pieces.length} />
      <span className="section-label">Status</span>
      {Object.entries(STATUS_LABELS).slice(0, 6).map(([id, label]) => <Nav key={id} active={view === id} onClick={() => setView(id)} icon="·" label={label} count={counts[id]} />)}
      <div className="sidebar-bottom"><span>{pieces.length}</span><small>peças na coleção</small></div>
    </aside>
    <main className="main"><div className="main-actions"><button className="primary" onClick={onNew}>+ Nova peça</button></div>{children}</main>
  </div>
}

function Nav({ active, onClick, icon, label, count }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span>{icon}</span><span>{label}</span>{count !== undefined && <em>{count}</em>}</button> }
