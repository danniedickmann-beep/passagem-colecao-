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
  participa_mostruario boolean,
  desenho_tecnico_url text,
  observacoes text,
  pontos_atencao text[] not null default '{}'::text[],
  updated_by text,
  feedback_tecnico text,
  ocorrencia_mostruario text,
  fotos_mostruario text[] not null default '{}'::text[],
  apresentacao_concluida boolean not null default false,
  ciclo_mostruario_encerrado boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ativa boolean not null default true,
  motivo_arquivamento text,
  data_arquivamento timestamptz,
  arquivado_por text,
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
alter table public.pecas add column if not exists observacoes text;
alter table public.pecas add column if not exists updated_by text;
alter table public.pecas add column if not exists feedback_tecnico text;
alter table public.pecas add column if not exists ocorrencia_mostruario text;
alter table public.pecas add column if not exists fotos_mostruario text[] not null default '{}'::text[];
alter table public.pecas add column if not exists apresentacao_concluida boolean not null default false;
alter table public.pecas add column if not exists ciclo_mostruario_encerrado boolean not null default false;
alter table public.pecas add column if not exists participa_mostruario boolean;
alter table public.pecas add column if not exists pontos_atencao text[] not null default '{}'::text[];
alter table public.pecas add column if not exists motivo_arquivamento text;
alter table public.pecas add column if not exists data_arquivamento timestamptz;
alter table public.pecas add column if not exists arquivado_por text;

create table if not exists public.pendencias (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas(id) on delete cascade,
  descricao text not null,
  area_responsavel text not null,
  tipo_problema text,
  gravidade text,
  etapa_origem text,
  status text not null default 'aberta' check (status in ('aberta', 'resolvida')),
  created_by text,
  created_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz
);

alter table public.pendencias add column if not exists tipo_problema text;
alter table public.pendencias add column if not exists gravidade text;
alter table public.pendencias add column if not exists etapa_origem text;

-- Armazenamento público dos desenhos técnicos enviados pela aplicação.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('desenhos-tecnicos', 'desenhos-tecnicos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create index if not exists pecas_ativa_created_at_idx
  on public.pecas (ativa, created_at desc);
create index if not exists historico_peca_peca_created_at_idx
  on public.historico_peca (peca_id, created_at desc);
create index if not exists pendencias_status_created_at_idx
  on public.pendencias (status, created_at desc);
create unique index if not exists pecas_artigo_ativo_unique_idx
  on public.pecas (lower(trim(artigo))) where ativa = true;

alter table public.pecas enable row level security;
alter table public.historico_peca enable row level security;
alter table public.pendencias enable row level security;

-- ATENÇÃO: estas políticas mantêm o comportamento do MVP sem autenticação real.
-- Elas são adequadas apenas para ambiente controlado/interno.
-- O bloco cria somente as políticas ausentes e preserva configurações existentes.
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pecas' and policyname = 'mvp_pecas_leitura') then
    create policy "mvp_pecas_leitura" on public.pecas for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pecas' and policyname = 'mvp_pecas_insercao') then
    create policy "mvp_pecas_insercao" on public.pecas for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pecas' and policyname = 'mvp_pecas_atualizacao') then
    create policy "mvp_pecas_atualizacao" on public.pecas for update to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'historico_peca' and policyname = 'mvp_historico_leitura') then
    create policy "mvp_historico_leitura" on public.historico_peca for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'historico_peca' and policyname = 'mvp_historico_insercao') then
    create policy "mvp_historico_insercao" on public.historico_peca for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pendencias' and policyname = 'mvp_pendencias_leitura') then
    create policy "mvp_pendencias_leitura" on public.pendencias for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pendencias' and policyname = 'mvp_pendencias_insercao') then
    create policy "mvp_pendencias_insercao" on public.pendencias for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pendencias' and policyname = 'mvp_pendencias_atualizacao') then
    create policy "mvp_pendencias_atualizacao" on public.pendencias for update to anon using (true) with check (true);
  end if;
end
$policies$;

do $storage_policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'mvp_desenhos_leitura') then
    create policy "mvp_desenhos_leitura" on storage.objects for select to anon using (bucket_id = 'desenhos-tecnicos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'mvp_desenhos_upload') then
    create policy "mvp_desenhos_upload" on storage.objects for insert to anon with check (bucket_id = 'desenhos-tecnicos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'mvp_desenhos_exclusao') then
    create policy "mvp_desenhos_exclusao" on storage.objects for delete to anon using (bucket_id = 'desenhos-tecnicos');
  end if;
end
$storage_policies$;
