create table if not exists workflow_evidence (
  tenant_id text not null,
  run_id text not null,
  payload jsonb not null,
  emitted_at timestamptz not null,
  primary key (tenant_id, run_id)
);

create table if not exists audit_events (
  id bigserial primary key,
  tenant_id text not null,
  actor_id text not null,
  action text not null,
  target text not null,
  occurred_at timestamptz not null,
  metadata jsonb not null
);

create index if not exists workflow_evidence_tenant_emitted_at on workflow_evidence (tenant_id, emitted_at desc);
create index if not exists audit_events_tenant_occurred_at on audit_events (tenant_id, occurred_at desc);
