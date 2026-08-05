-- Estrutura mínima usada pela aplicação React.
-- Execute no SQL Editor do projeto Supabase antes do primeiro deploy.

create table if not exists public.pecas (
  id uuid primary key default gen_random_uuid(),
  artigo text not null,
  colecao text,
  linha text,
  categoria text,
  mp_base text,
  tipo_peca text default 'Nova',
  fluxo_atual text not null default 'cadastro'
    check (fluxo_atual in ('cadastro', 'analise', 'passagem', 'mostruario', 'pos', 'ajustes', 'encerrado')),
  passagem_colecao text,
  complexidade text default 'Baixa',
  lacre text default 'Sem lacre',
  desenho_tecnico_url text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ativa boolean not null default true,
  saude_operacional text default 'saudavel',
  reaberta boolean default false,
  motivo_reabertura text,
  data_reabertura timestamptz,
  total_reaberturas integer not null default 0
);

create table if not exists public.historico_peca (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas(id) on delete cascade,
  tipo_evento text not null,
  descricao text,
  usuario text,
  dados_extras jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Migração para projetos onde a tabela pecas já existia antes desta versão.
alter table public.pecas add column if not exists saude_operacional text default 'saudavel';
alter table public.pecas add column if not exists reaberta boolean default false;
alter table public.pecas add column if not exists motivo_reabertura text;
alter table public.pecas add column if not exists data_reabertura timestamptz;
alter table public.pecas add column if not exists total_reaberturas integer not null default 0;

create index if not exists pecas_ativa_created_at_idx
  on public.pecas (ativa, created_at desc);
create index if not exists historico_peca_peca_created_at_idx
  on public.historico_peca (peca_id, created_at desc);

alter table public.pecas enable row level security;
alter table public.historico_peca enable row level security;

-- ATENÇÃO: estas políticas mantêm o comportamento do MVP sem autenticação real.
-- Elas são adequadas apenas para ambiente controlado/interno.
drop policy if exists "mvp_pecas_leitura" on public.pecas;
drop policy if exists "mvp_pecas_insercao" on public.pecas;
drop policy if exists "mvp_pecas_atualizacao" on public.pecas;
drop policy if exists "mvp_historico_leitura" on public.historico_peca;
drop policy if exists "mvp_historico_insercao" on public.historico_peca;

create policy "mvp_pecas_leitura" on public.pecas for select to anon using (true);
create policy "mvp_pecas_insercao" on public.pecas for insert to anon with check (true);
create policy "mvp_pecas_atualizacao" on public.pecas for update to anon using (true) with check (true);
create policy "mvp_historico_leitura" on public.historico_peca for select to anon using (true);
create policy "mvp_historico_insercao" on public.historico_peca for insert to anon with check (true);
