-- Ejecuta todo este archivo en Supabase > SQL Editor.
-- Tablas privadas: no se concede acceso directo desde el navegador.
create extension if not exists pgcrypto;

create table if not exists public.private_agreement_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  owner_token_hash text not null,
  invite_token_hash text not null,
  guest_token_hash text,
  owner_name text not null,
  guest_name text,
  owner_signature text,
  guest_signature text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.private_agreement_rooms enable row level security;
revoke all on public.private_agreement_rooms from anon, authenticated;

create or replace function public.create_private_room(
  p_room_code text, p_owner_token text, p_invite_token text, p_owner_name text
) returns json
language plpgsql security definer set search_path=public, extensions
as $$
begin
  if length(p_room_code) < 6 or length(p_owner_token) < 20 or length(p_invite_token) < 20 or length(trim(p_owner_name)) = 0 then
    raise exception 'Datos de creación inválidos';
  end if;
  insert into public.private_agreement_rooms(room_code,owner_token_hash,invite_token_hash,owner_name)
  values (upper(p_room_code), encode(digest(p_owner_token,'sha256'),'hex'),
          encode(digest(p_invite_token,'sha256'),'hex'), left(trim(p_owner_name),100));
  return json_build_object('ok',true);
end $$;

create or replace function public.join_private_room(
  p_room_code text, p_invite_token text, p_guest_token text, p_guest_name text
) returns json
language plpgsql security definer set search_path=public, extensions
as $$
declare r public.private_agreement_rooms%rowtype;
begin
  select * into r from public.private_agreement_rooms where room_code=upper(p_room_code) for update;
  if not found or r.invite_token_hash <> encode(digest(p_invite_token,'sha256'),'hex') then
    raise exception 'Código o invitación incorrectos';
  end if;
  if r.guest_token_hash is not null then
    raise exception 'La invitación ya fue utilizada';
  end if;
  if length(trim(p_guest_name))=0 or length(p_guest_token)<20 then
    raise exception 'Datos de participante 2 inválidos';
  end if;
  update public.private_agreement_rooms
  set guest_token_hash=encode(digest(p_guest_token,'sha256'),'hex'),
      guest_name=left(trim(p_guest_name),100)
  where id=r.id;
  return json_build_object('ok',true);
end $$;

create or replace function public.get_private_room(
  p_room_code text, p_participant_token text
) returns json
language plpgsql security definer set search_path=public, extensions
as $$
declare r public.private_agreement_rooms%rowtype; h text;
begin
  h=encode(digest(p_participant_token,'sha256'),'hex');
  select * into r from public.private_agreement_rooms
  where room_code=upper(p_room_code)
    and (owner_token_hash=h or guest_token_hash=h);
  if not found then raise exception 'No tienes acceso a esta sala'; end if;
  return json_build_object(
    'owner_name',r.owner_name,'guest_name',r.guest_name,
    'owner_signature',r.owner_signature,'guest_signature',r.guest_signature,
    'completed_at',r.completed_at
  );
end $$;

create or replace function public.submit_private_signature(
  p_room_code text, p_participant_token text, p_full_name text, p_signature_data text
) returns json
language plpgsql security definer set search_path=public, extensions
as $$
declare r public.private_agreement_rooms%rowtype; h text;
begin
  h=encode(digest(p_participant_token,'sha256'),'hex');
  select * into r from public.private_agreement_rooms
  where room_code=upper(p_room_code) for update;
  if not found then raise exception 'Sala no encontrada'; end if;
  if r.completed_at is not null then raise exception 'El acuerdo ya está finalizado'; end if;
  if length(trim(p_full_name))=0 or length(p_signature_data)<100 or length(p_signature_data)>1500000 then
    raise exception 'Nombre o firma inválidos';
  end if;
  if r.owner_token_hash=h then
    if r.owner_signature is not null or r.guest_signature is not null then raise exception 'Tu turno ya terminó'; end if;
    update public.private_agreement_rooms
    set owner_name=left(trim(p_full_name),100), owner_signature=p_signature_data
    where id=r.id;
  elsif r.guest_token_hash=h then
    if r.owner_signature is null then raise exception 'Todavía no es tu turno'; end if;
    if r.guest_signature is not null then raise exception 'Tu firma ya está registrada'; end if;
    update public.private_agreement_rooms
    set guest_name=left(trim(p_full_name),100), guest_signature=p_signature_data,
        completed_at=now()
    where id=r.id;
  else
    raise exception 'Token de participante inválido';
  end if;
  return json_build_object('ok',true);
end $$;

revoke all on function public.create_private_room(text,text,text,text) from public;
revoke all on function public.join_private_room(text,text,text,text) from public;
revoke all on function public.get_private_room(text,text) from public;
revoke all on function public.submit_private_signature(text,text,text,text) from public;
grant execute on function public.create_private_room(text,text,text,text) to anon, authenticated;
grant execute on function public.join_private_room(text,text,text,text) to anon, authenticated;
grant execute on function public.get_private_room(text,text) to anon, authenticated;
grant execute on function public.submit_private_signature(text,text,text,text) to anon, authenticated;
