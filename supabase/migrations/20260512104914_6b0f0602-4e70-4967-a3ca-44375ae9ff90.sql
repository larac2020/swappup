
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default false,
  reminder_emails boolean not null default true,
  marketing_emails boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "users can view their own notification prefs"
on public.notification_preferences for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert their own notification prefs"
on public.notification_preferences for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update their own notification prefs"
on public.notification_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.touch_notification_preferences_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_notification_prefs on public.notification_preferences;
create trigger trg_touch_notification_prefs
before update on public.notification_preferences
for each row execute function public.touch_notification_preferences_updated_at();
