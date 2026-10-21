-- Public sign-up: record when a user accepted the Terms of Service / Privacy Policy.
alter table public.profiles add column terms_accepted_at timestamptz;

-- Sign-up passes the name and a consent flag as user metadata; the timestamp is set server-side
-- (never trusted from the client). Existing privileges on the function are preserved by `create or replace`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, terms_accepted_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80),
    new.email,
    case when new.raw_user_meta_data ->> 'terms_accepted' = 'true' then now() end
  );
  return new;
end;
$$;
