-- REQ-003/004/006/008; approved synthetic MVP rules in ADR-012. Local rollout only.
begin;
create table public.funding_initiatives (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('Program','Event')),
 name text not null check(length(trim(name))>0),unique(id,kind)
);
create table public.contributions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid references public.organizations(id),contact_id uuid references public.contacts(id),
 contribution_date date not null check(isfinite(contribution_date)),
 amount numeric not null check(amount>=0 and amount not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and amount=round(amount,2)),
 currency text not null default 'CAD' check(currency='CAD'),
 contribution_type text not null check(contribution_type in ('Cash','In-Kind')),
 sponsorship_level text,funding_status text not null default 'Committed' check(funding_status in ('Prospect','Committed','Invoiced','Cancelled')),
 program_id uuid,program_kind text generated always as ('Program'::text) stored,
 event_id uuid,event_kind text generated always as ('Event'::text) stored,
 foreign key(program_id,program_kind) references public.funding_initiatives(id,kind),
 foreign key(event_id,event_kind) references public.funding_initiatives(id,kind),
 agreement_start date check(isfinite(agreement_start)),agreement_end date check(isfinite(agreement_end)),
 renewal_date date check(isfinite(renewal_date)),notes text,
 check(agreement_start is null or agreement_end is null or agreement_end>=agreement_start),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.cash_receipts (
 id uuid primary key default gen_random_uuid(),contribution_id uuid not null references public.contributions(id),
 received_on date not null check(isfinite(received_on)),
 amount numeric not null check(amount>0 and amount not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and amount=round(amount,2)),
 reference text,is_void boolean not null default false,void_reason text,
 check(not is_void or length(trim(coalesce(void_reason,'')))>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.giving_document_links (
 id uuid primary key default gen_random_uuid(),contribution_id uuid not null references public.contributions(id),
 label text not null check(length(trim(label))>0),
 url text not null check(url ~* '^https?://[^[:space:]@/]+([/?#][^[:space:]]*)?$')
);
create index contributions_organization_date_idx on public.contributions(organization_id,contribution_date desc);
create index contributions_contact_idx on public.contributions(contact_id);
create index contributions_program_idx on public.contributions(program_id);
create index contributions_event_idx on public.contributions(event_id);
create index cash_receipts_contribution_date_idx on public.cash_receipts(contribution_id,received_on);
create index cash_receipts_active_date_idx on public.cash_receipts(received_on) where not is_void;
create index giving_document_links_contribution_idx on public.giving_document_links(contribution_id);
create trigger contributions_touch before update on public.contributions for each row execute function public.touch_updated_at();
create trigger cash_receipts_touch before update on public.cash_receipts for each row execute function public.touch_updated_at();
-- Explicit grants, default-deny anonymous. Roles follow ADR-012, not CRM write permissions.
alter table public.funding_initiatives enable row level security;
alter table public.contributions enable row level security;
alter table public.cash_receipts enable row level security;
alter table public.giving_document_links enable row level security;
revoke all on public.funding_initiatives,public.contributions,public.cash_receipts,public.giving_document_links from public,anon,authenticated;
grant select,insert,update on public.funding_initiatives,public.contributions,public.cash_receipts,public.giving_document_links to authenticated;
create policy "financial readers initiatives" on public.funding_initiatives for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers initiatives insert" on public.funding_initiatives for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers initiatives update" on public.funding_initiatives for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));
create policy "financial readers contributions" on public.contributions for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers contributions insert" on public.contributions for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers contributions update" on public.contributions for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));
create policy "financial readers receipts" on public.cash_receipts for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers receipts insert" on public.cash_receipts for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers receipts update" on public.cash_receipts for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));
create policy "financial readers references" on public.giving_document_links for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers references insert" on public.giving_document_links for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers references update" on public.giving_document_links for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));

-- Parent locks serialize type changes against receipt writes; no definer/RLS bypass.
create function private.validate_cash_receipt() returns trigger language plpgsql security invoker set search_path='' as $$
declare kind text;
begin
 if tg_op='UPDATE' and (new.id is distinct from old.id or new.contribution_id is distinct from old.contribution_id) then
  raise exception 'Receipt identity and contribution cannot be changed.' using errcode='23514';
 end if;
 select contribution_type into kind from public.contributions where id=new.contribution_id for update;
 if kind is distinct from 'Cash' then raise exception 'Cash receipts require a Cash contribution.' using errcode='23514'; end if;
 if new.received_on>public.activity_today() then raise exception 'Future amounts are pledges, not received cash.' using errcode='23514'; end if;
 return new;
end $$;
create function private.validate_contribution_edit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id is distinct from old.id then raise exception 'Contribution identity cannot change.' using errcode='23514'; end if;
 if new.contribution_type<>'Cash' and exists(select 1 from public.cash_receipts where contribution_id=old.id) then
  raise exception 'A contribution with cash receipt history must remain Cash.' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function private.validate_cash_receipt(),private.validate_contribution_edit() from public,anon,authenticated;
create trigger cash_receipts_validate before insert or update on public.cash_receipts for each row execute function private.validate_cash_receipt();
create trigger contributions_validate before update on public.contributions for each row execute function private.validate_contribution_edit();
create view public.giving_receipts with(security_invoker=true) as
select id,contribution_id,received_on,amount::text as amount,reference,is_void,void_reason from public.cash_receipts;
create view public.contribution_details with(security_invoker=true) as
select c.id,c.organization_id,c.contact_id,c.contribution_date,c.amount::text as amount,c.currency,c.contribution_type,
 c.sponsorship_level,c.funding_status,c.program_id,c.event_id,c.agreement_start,c.agreement_end,c.renewal_date,c.notes,
 o.name as organization_name,concat_ws(' ',ct.first_name,ct.last_name) as contact_name,p.name as program_name,e.name as event_name,
 coalesce(r.received,0)::text as cash_received,
 (case when c.contribution_type='Cash' and c.funding_status in ('Committed','Invoiced') then c.amount else 0 end)::text as pledged,
 (case when c.contribution_type='Cash' and c.funding_status in ('Committed','Invoiced') then greatest(c.amount-coalesce(r.received,0),0) else 0 end)::text as outstanding,
 case when coalesce(r.received,0)=0 then 'Unreceived' when r.received<c.amount then 'Partially Received' else 'Received' end as payment_status
from public.contributions c
left join public.organizations o on o.id=c.organization_id
left join public.contacts ct on ct.id=c.contact_id
left join public.funding_initiatives p on p.id=c.program_id
left join public.funding_initiatives e on e.id=c.event_id
left join lateral(select sum(amount) as received from public.cash_receipts where contribution_id=c.id and not is_void and received_on<=public.activity_today()) r on true;
revoke all on public.giving_receipts,public.contribution_details from public,anon,authenticated;
grant select on public.giving_receipts,public.contribution_details to authenticated;

create function public.giving_summary(p_year integer,p_organization_id uuid default null,p_contact_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare today date:=public.activity_today(); cutoff date;start_date date;prior_end date;current_cash numeric;prior_cash numeric;lifetime numeric;pledged numeric;outstanding numeric;in_kind numeric;
begin
 if p_year is null or p_year<2 or p_year>9999 then raise exception 'Invalid calendar year.' using errcode='22023'; end if;
 start_date:=make_date(p_year,1,1);cutoff:=least(today,make_date(p_year,12,31));
 prior_end:=(cutoff-interval '1 year')::date;
 with eligible as(select id from public.contributions where (p_organization_id is null or organization_id=p_organization_id) and (p_contact_id is null or contact_id=p_contact_id))
 select coalesce(sum(r.amount) filter(where r.received_on between start_date and cutoff),0),
 coalesce(sum(r.amount) filter(where r.received_on between (start_date-interval '1 year')::date and prior_end),0),
 coalesce(sum(r.amount),0) into current_cash,prior_cash,lifetime
 from public.cash_receipts r join eligible c on c.id=r.contribution_id where not r.is_void and r.received_on<=today;
 select coalesce(sum(d.pledged::numeric),0),coalesce(sum(d.outstanding::numeric),0),
 coalesce(sum(amount::numeric) filter(where contribution_type='In-Kind' and funding_status<>'Cancelled'),0)
 into pledged,outstanding,in_kind from public.contribution_details d where (p_organization_id is null or organization_id=p_organization_id) and (p_contact_id is null or contact_id=p_contact_id);
 return jsonb_build_object('year',p_year,'as_of',today,'period_end',cutoff,'prior_period_end',prior_end,'currency','CAD',
 'annual_cash',current_cash::text,'prior_cash',prior_cash::text,'lifetime_cash',lifetime::text,
 'pledged',pledged::text,'outstanding',outstanding::text,'in_kind_declared',in_kind::text,
 'yoy_delta',(current_cash-prior_cash)::text,'yoy_percent',case when prior_cash=0 or cutoff<start_date then null else round((current_cash-prior_cash)*100/prior_cash,2)::text end,
 'comparison_basis',case when cutoff<start_date then 'Period not started' when extract(year from today)=p_year then 'Comparable YTD' else 'Full calendar year' end);
end $$;
revoke all on function public.giving_summary(integer,uuid,uuid) from public,anon;
grant execute on function public.giving_summary(integer,uuid,uuid) to authenticated;
commit;
