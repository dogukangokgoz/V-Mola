create table if not exists users (
  id bigserial primary key,
  email text unique not null,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('admin','employee')),
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists departments (
  id bigserial primary key,
  name text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists break_types (
  id bigserial primary key,
  name text not null,
  description text
);

create table if not exists breaks (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  break_type_id bigint references break_types(id),
  start_time timestamptz not null,
  end_time timestamptz,
  duration_minutes int,
  notes text,
  date date not null default (now()::date),
  created_at timestamptz not null default now()
);

create table if not exists system_settings (
  id int primary key default 1,
  daily_max_minutes int not null default 60,
  morning_break_minutes int not null default 30,
  afternoon_break_minutes int not null default 30,
  min_break_interval int not null default 30,
  auto_end_forgotten_breaks boolean not null default true,
  working_start time not null default '09:00',
  working_end time not null default '18:00'
);

insert into system_settings (id) values (1) on conflict (id) do nothing;

insert into break_types (name, description) values
('Kahve Molası', 'Kısa kahve molası'),
('Öğle Yemeği', 'Öğle yemeği molası'),
('Kişisel Mola', 'Kişisel işler için mola')
on conflict do nothing;
